"""Classements par année et définition commune, à partir des publications EIA, USGS et FAOSTAT."""

import csv
import datetime as dt
from email.utils import format_datetime, parsedate_to_datetime
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
from concurrent.futures import ThreadPoolExecutor
from tempfile import SpooledTemporaryFile
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from zipfile import ZipFile

from scripts.update_macro import UA

OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "production.json"
EIA = "https://www.eia.gov/opendata/bulk/INTL.zip"
FAO = "https://bulks-faostat.fao.org/production/"
OPEC = "https://publications.opec.org/ASSETS/assetdb/"
COUNTRY_NAMES = {
    "United States": "États-Unis", "Saudi Arabia": "Arabie saoudite", "Russia": "Russie",
    "China": "Chine", "China, mainland": "Chine continentale", "Australia": "Australie",
    "Congo (Kinshasa)": "République démocratique du Congo", "Peru": "Pérou",
    "Brazil": "Brésil", "India": "Inde", "Germany": "Allemagne", "Mexico": "Mexique",
    "Egypt": "Égypte", "Türkiye": "Turquie", "United Kingdom": "Royaume-Uni", "Iran (Islamic Republic of)": "Iran", "IR Iran": "Iran",
    "Viet Nam": "Vietnam", "United Arab Emirates": "Émirats arabes unis", "Indonesia": "Indonésie",
}


def top_rows(values):
    return [{"name": COUNTRY_NAMES.get(name, name), "value": value}
            for name, value in sorted(values.items(), key=lambda pair: (-pair[1], pair[0]))[:12]]


def rank(years, source, url, as_of, published=None, min_members=5):
    # Rejette les premières années à couverture parcellaire avant de calculer le rang.
    comparable = {year: values for year, values in years.items()
                  if as_of.year - 4 <= year < as_of.year and len(values) >= min_members}
    if not comparable:
        return None
    year = max(year for year in comparable if len(comparable[year]) >= 0.8 * max(map(len, comparable.values())))
    result = {"year": year, "source": source, "url": url, "rows": top_rows(comparable[year])}
    if published:
        result["published_at"] = published
    if year - 1 in comparable:
        previous = comparable[year - 1]
        if len(set(previous) & set(comparable[year])) >= 0.8 * max(len(previous), len(comparable[year])):
            result["previous"] = {"year": year - 1, "leader": top_rows(previous)[0]["name"]}
    return result


def eia_tables(file, as_of):
    pattern = re.compile(r"^INTL\.57-1-([A-Z]{3})-TBPD\.A$")
    years = {}
    with ZipFile(file) as zipped, zipped.open("INTL.txt") as stream:
        for line in stream:
            item = json.loads(line)
            match = pattern.fullmatch(item.get("series_id", ""))
            if not match:
                continue
            if match[1] in {"WLD", "OEC", "EUU"}:
                continue
            _, prefix, name = item.get("name", "").partition("production, ")
            if not prefix or not name.endswith(", Annual"):
                continue
            name = name.removesuffix(", Annual")
            for year, value in item["data"]:
                if str(year).isdigit() and isinstance(value, (float, int)) and math.isfinite(value) and value > 0:
                    years.setdefault(int(year), {})[name] = value
    table = rank(years, "EIA · International Energy Statistics", "https://www.eia.gov/international/data/world", as_of, min_members=20)
    return {"oil_production": table} if table else {}


def fao_tables(file, as_of, activity):
    elements = {"production": "Production", "exports": "Export quantity"}
    commodities = {"15": ("wheat", "Wheat"), "661": ("cocoa", "Cocoa beans")}
    tables = {f"{key}_{activity}": {} for key, _ in commodities.values()}
    with ZipFile(file) as archive:
        csv_name = next(name for name in archive.namelist() if "(Normalized).csv" in name)
        with io.TextIOWrapper(archive.open(csv_name), encoding="utf-8-sig", errors="replace") as raw:
            for line in csv.DictReader(raw):
                commodity = commodities.get(line["Item Code"])
                if commodity is None or line["Item"].lower() != commodity[1].lower():
                    continue
                if line["Element"].lower() != elements[activity].lower() or line["Unit"] not in {"t", "tonnes"}:
                    continue
                if not line["Area Code"].isdigit() or int(line["Area Code"]) >= 500 or line["Area"] == "China" or not line["Value"]:
                    continue
                year, value = int(line["Year"]), float(line["Value"])
                if as_of.year - 4 <= year < as_of.year and math.isfinite(value) and value > 0:
                    tables[f"{commodity[0]}_{activity}"].setdefault(year, {})[line["Area"]] = value
    domain = "QCL" if activity == "production" else "TCL"
    return {key: table for key, years in tables.items()
            if (table := rank(years, f"FAOSTAT · {domain}", f"https://www.fao.org/faostat/fr/#data/{domain}", as_of, min_members=12))}


def annual_pdf_url(stem):
    for year in (dt.date.today().year, dt.date.today().year - 1):
        url = stem.format(year=year)
        try:
            with urlopen(Request(url, headers=UA, method="HEAD"), timeout=15) as response:
                if "pdf" in response.headers.get("Content-Type", "").lower():
                    return url
        except HTTPError as error:
            if error.code != 404:
                raise
    raise ValueError(f"édition introuvable · {stem}")


def mining_number(text, footnote=None):
    value = text.strip().lstrip("e").replace(" ", "")
    if footnote and value.startswith(footnote):
        value = value[len(footnote):]
    if not re.fullmatch(r"(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?", value):
        return None
    result = float(value.replace(",", ""))
    return result if result > 0 else None


def mineral_tables(layout, mineral, url, as_of):
    title = re.search(r"World Mine(?: and Refinery)? Production and Reserves:", layout)
    if not title:
        raise ValueError("tableau de production de l’USGS introuvable")
    body = layout[title.end():]
    header = re.search(r"\b(20\d{2})\s+(20\d{2})e?\b", body)
    if not header:
        raise ValueError("années des colonnes USGS introuvables")
    old_year, year = map(int, header.groups())
    # La note sur les réserves australiennes est collée au nombre dans le PDF.
    footnote = re.search(r"(?m)^\s*(\d{1,2})For Australia, Joint Ore Reserves", layout)
    production, reserves = {old_year: {}, year: {}}, {year: {}}
    columns = 6 if mineral == "copper" else 4
    for line in body[header.end():].splitlines():
        cells = re.split(r"\s{2,}", line.strip())
        name = cells[0]
        if name.startswith("World total"):
            break
        if len(cells) != columns or not re.match(r"^[A-Z]", name) or name.startswith("Other"):
            continue
        for activity_year, text in zip((old_year, year), cells[1:3]):
            if value := mining_number(text):
                production[activity_year][name] = value
        prefix = footnote[1] if name == "Australia" and footnote else None
        if name != "Australia" or prefix:
            if value := mining_number(cells[-1], prefix):
                reserves[year][name] = value
    source = f"USGS · Mineral Commodity Summaries {int(re.search(r'mcs(20\d{2})', url)[1])}"
    return {f"{mineral}_{kind}": table for kind, values in {"production": production, "reserves": reserves}.items()
            if (table := rank(values, source, url, as_of, min_members=8))}


def read_mineral(file, mineral, url, as_of):
    from pypdf import PdfReader
    layout = "\n".join(page.extract_text(extraction_mode="layout") for page in PdfReader(file).pages)
    return mineral_tables(layout, mineral, url, as_of)


OIL_TITLES = {
    "oil_reserves": "World proven crude oil reserves by country",
    "oil_exports": "World crude oil exports by country",
}
OIL_REGIONS = {"Africa", "Europe", "Eurasia", "Latin America", "Middle East", "Other Asia", "Other Eurasia",
               "Other Europe", "OPEC", "OPEC Members", "Others", "World", "Total world"}


def oil_rows(layout, title, edition, divisor):
    body = layout[layout.index(title):]
    year = edition - 1
    header = re.search(r"\b" + r"\s+".join(str(y) for y in range(year - 4, year + 1)) + r"\s+Change", body)
    if not header:
        return {}
    values = {year - 1: {}, year: {}}
    for line in body[header.end():].splitlines():
        cells = re.split(r"\s{2,}", line.strip())
        name = re.sub(r"\d+$", "", cells[0]).strip()
        if name in {"World", "Total world"}:
            break
        if len(cells) != 7 or name in OIL_REGIONS or name.startswith(("OECD", "OPEC", "Total ", "Other ")):
            continue
        for index, period in enumerate((year - 1, year), start=4):
            if value := mining_number(cells[index]):
                values[period][name] = value / divisor
    return values


def read_opec(file, as_of, url):
    from pypdf import PdfReader

    edition = int(re.search(r"asb-(20\d{2})\.pdf", url)[1])
    tables = {}
    for page in PdfReader(file).pages[12:]:
        layout = page.extract_text(extraction_mode="layout")
        for key, title in OIL_TITLES.items():
            if key in tables or title not in layout:
                continue
            unit = "(mb)" if key == "oil_reserves" else "(1,000 b/d)"
            if unit not in layout:
                continue
            values = oil_rows(layout, title, edition, 1000 if key == "oil_reserves" else 1)
            if table := rank(values, f"OPEP · Annual Statistical Bulletin {edition}", url, as_of, min_members=20):
                tables[key] = table
        if len(tables) == len(OIL_TITLES):
            break
    return tables


SOURCES = {
    "eia": (lambda: EIA, ("oil_production",), lambda f, day, url: eia_tables(f, day)),
    "opec": (lambda: annual_pdf_url(OPEC + "asb-{year}.pdf"), tuple(OIL_TITLES), read_opec),
    "fao_production": (lambda: FAO + "Production_Crops_Livestock_E_All_Data_(Normalized).zip",
                       ("wheat_production", "cocoa_production"), lambda f, day, url: fao_tables(f, day, "production")),
    "fao_exports": (lambda: FAO + "Trade_CropsLivestock_E_All_Data_(Normalized).zip",
                    ("wheat_exports", "cocoa_exports"), lambda f, day, url: fao_tables(f, day, "exports")),
    **{mineral: (lambda name=mineral: annual_pdf_url("https://pubs.usgs.gov/periodicals/mcs{year}/mcs{year}-" + name + ".pdf"),
                 (f"{mineral}_production", f"{mineral}_reserves"),
                 lambda f, day, url, name=mineral: read_mineral(f, name, url, day))
       for mineral in ("copper", "gold")},
}


def collect_source(key, previous, now):
    locate, expected, parse = SOURCES[key]
    url = locate()
    cached = previous.get("providers", {}).get(key, {})
    old_tables = {entry: previous["tables"][entry] for entry in expected if entry in previous.get("tables", {})}
    conditional = dict(UA)
    if old_tables and cached.get("url") == url:
        if cached.get("etag"):
            conditional["If-None-Match"] = cached["etag"]
        elif cached.get("file_modified_at"):
            conditional["If-Modified-Since"] = format_datetime(dt.datetime.fromisoformat(cached["file_modified_at"]), usegmt=True)
    for attempt in range(2):
        try:
            with urlopen(Request(url, headers=conditional), timeout=25) as response:
                etag = response.headers.get("ETag")
                if etag and etag == conditional.get("If-None-Match"):
                    return old_tables, cached
                modified = response.headers.get("Last-Modified")
                with SpooledTemporaryFile(max_size=12 * 1024 * 1024) as file:
                    shutil.copyfileobj(response, file)
                    file.seek(0)
                    tables = parse(file, now.date(), url)
                if not tables:
                    raise ValueError("aucun classement admissible dans la publication")
                # Last-Modified date la révision du fichier, sans présumer la date de publication.
                stamp = parsedate_to_datetime(modified).isoformat() if modified else None
                return tables, {"etag": etag, "url": url, "file_modified_at": stamp}
        except HTTPError as error:
            if error.code == 304 and old_tables:
                return old_tables, cached
            if attempt or error.code not in {429, 500, 502, 503, 504}:
                raise
        except (URLError, TimeoutError):
            if attempt:
                raise


def refresh(previous, now):
    stamp = now.isoformat(timespec="seconds")
    tables, providers = dict(previous.get("tables", {})), dict(previous.get("providers", {}))
    checks = {}
    with ThreadPoolExecutor(max_workers=5) as pool:
        tasks = {key: pool.submit(collect_source, key, previous, now) for key in SOURCES}
        for key, task in tasks.items():
            try:
                received, metadata = task.result()
                providers[key] = metadata
            except Exception as error:
                print(f"KO {key} · {error}")
                received = {}
            for entry in SOURCES[key][1]:
                row = received.get(entry)
                ok = bool(row and row["year"] >= now.year - 4 and row["year"] >= tables.get(entry, {}).get("year", 0))
                checks[entry] = {"at": stamp, "ok": ok}
                if ok:
                    tables[entry] = {**row, "retrieved_at": stamp}
                print(f"{'OK' if ok else 'KO'} {entry}")
    failed = [key for key, check in checks.items() if not check["ok"]]
    return {"updated_at": stamp if len(failed) < len(checks) else previous.get("updated_at"),
            "checked_at": stamp, "failed": failed, "checks": checks, "tables": tables, "providers": providers}


def main():
    previous = json.loads(OUT.read_text(encoding="utf-8"))
    result = refresh(previous, dt.datetime.now(dt.timezone.utc))
    temp = OUT.with_suffix(".tmp")
    temp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temp, OUT)
    if result["failed"]:
        print("::warning::Classements non vérifiés · " + ", ".join(result["failed"]))
    if len(result["failed"]) == len(result["checks"]):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
