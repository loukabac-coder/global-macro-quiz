"""
Collecte des dernières observations macroéconomiques et de marché.
Sources publiques et gratuites :
  - BCE (data-api.ecb.europa.eu)  : taux de dépôt, EUR/USD (taux de référence), inflation IPCH
  - FRED (fred.stlouisfed.org, fichiers CSV publics, sans clé) : Fed funds (borne haute), IPC américain,
    chômage américain, Treasury 10 ans, Brent et WTI (données EIA)
  - Yahoo Finance (yfinance) : or (contrat à terme, séance de cotation observée)
Règle : un indicateur qui ne peut pas être mis à jour garde sa valeur précédente et SA DATE ANCIENNE.
Le site réserve les questions aux observations recontrôlées récemment.
"""
import csv, io, json, math, os, sys, datetime, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from functools import lru_cache

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data", "macro.json")
UA = {"User-Agent": "Mozilla/5.0 (global-macro-quiz robot)"}

@dataclass(frozen=True)
class Observation:
    date: str
    value: float
    source: str
    status: str | None = None
    published_at: str | None = None


def http_get(url):
    req = urllib.request.Request(url, headers=UA)
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=18) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if attempt or e.code not in (429, 500, 502, 503, 504):
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt:
                raise
        time.sleep(1)


# ---------- BCE ----------
def ecb_last(path):
    """Dernière observation d'une série BCE."""
    txt = http_get(f"https://data-api.ecb.europa.eu/service/data/{path}?lastNObservations=1&format=csvdata")
    rows = list(csv.DictReader(io.StringIO(txt)))
    if not rows:
        raise ValueError("série BCE vide")
    row = rows[-1]
    return Observation(norm_date(row["TIME_PERIOD"]), float(row["OBS_VALUE"]), f"BCE ({path})", row.get("OBS_STATUS"))


@lru_cache(maxsize=1)
def ecb_daily_exchange():
    root = ET.fromstring(http_get("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"))
    fixing = root.find(".//{*}Cube[@time]")
    if fixing is None:
        raise ValueError("fixing BCE introuvable")
    return fixing.attrib["time"], {row.attrib["currency"]: float(row.attrib["rate"]) for row in fixing}


def ecb_exchange(currency):
    try:
        return ecb_last(f"EXR/D.{currency}.EUR.SP00.A")
    except Exception:
        date, rates = ecb_daily_exchange()
        return Observation(date, rates[currency], f"BCE (fixing EUR/{currency})")


def norm_date(s):
    s = s.strip()
    if len(s) == 7:  # Premier jour comme identifiant de mois, pas comme date de publication.
        return s + "-01"
    return s[:10]


# ---------- FRED ----------
def fred_rows(series):
    txt = http_get(f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series}")
    rd = csv.reader(io.StringIO(txt))
    next(rd)
    out = []
    for r in rd:
        if len(r) < 2 or r[1].strip() in (".", ""):
            continue
        out.append((r[0].strip(), float(r[1])))
    if not out:
        raise ValueError(f"série FRED {series} vide")
    return out


def fred_last(series, provider):
    date, value = fred_rows(series)[-1]
    return Observation(date, value, f"{provider} via FRED ({series})")


def fred_cpi_yoy():
    """Inflation sur 12 mois : dernier mois dont le mois d'il y a un an existe (certains mois manquent, ex. oct. 2025)."""
    return cpi_yoy(fred_rows("CPIAUCNS"), "BLS via FRED (CPIAUCNS, non désaisonnalisé)")


def cpi_yoy(rows, source):
    table = dict(rows)
    for d, v in sorted(rows, reverse=True):
        base = table.get(f"{int(d[:4]) - 1}{d[4:]}")
        if base:
            return Observation(d, round((v / base - 1) * 100, 1), source)
    raise ValueError("IPC il y a 12 mois introuvable")


def bls_rows(series):
    data = json.loads(http_get(f"https://api.bls.gov/publicAPI/v2/timeseries/data/{series}"))
    if data.get("status") != "REQUEST_SUCCEEDED":
        raise ValueError("API BLS indisponible")
    observations = data["Results"]["series"][0]["data"]
    return sorted(
        (f"{row['year']}-{row['period'][1:]}-01", float(row["value"]))
        for row in observations if row["period"] in {f"M{month:02}" for month in range(1, 13)}
        and row["value"] not in ("-", "")
    )


def bls_cpi_yoy():
    return cpi_yoy(bls_rows("CUUR0000SA0"), "BLS (CUUR0000SA0, non désaisonnalisé)")


def bls_unemployment():
    date, value = bls_rows("LNS14000000")[-1]
    return Observation(date, value, "BLS (LNS14000000, désaisonnalisé)")


def treasury_10y():
    now = datetime.datetime.now(datetime.timezone.utc)
    base = ("https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml"
            "?data=daily_treasury_yield_curve&field_tdr_date_value=")
    years = [now.year, now.year - 1] if now.month == 1 else [now.year]
    for year in years:
        root = ET.fromstring(http_get(f"{base}{year}"))
        rows = []
        for row in root.findall(".//{*}properties"):
            date = row.findtext("{*}NEW_DATE")
            rate = row.findtext("{*}BC_10YEAR")
            if date and rate:
                rows.append((norm_date(date), float(rate)))
        if rows:
            date, value = max(rows)
            return Observation(date, value, "Trésor américain (Daily Treasury Par Yield Curve, 10 ans)")
    raise ValueError("aucun rendement Treasury 10 ans")


def eurostat_status(data, key):
    statuses = data.get("status")
    if isinstance(statuses, dict):
        return statuses.get(key)
    if isinstance(statuses, list) and int(key) < len(statuses):
        return statuses[int(key)]
    return statuses if isinstance(statuses, str) else None


def eurostat_json(geo="EA"):
    """API JSON d'Eurostat (inflation annuelle IPCH, toutes catégories)."""
    url = ("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr"
           f"?format=JSON&lang=EN&unit=RCH_A&coicop=CP00&geo={geo}&lastTimePeriod=3")
    d = json.loads(http_get(url))
    times = d["dimension"]["time"]["category"]["index"]  # {"2026-09": 0, "2026-10": 1}
    vals = d["value"]  # {"0": 3.8, "1": 4.0}
    pos = {v: k for k, v in times.items()}
    best = max((int(i) for i in vals), key=lambda i: pos[i])
    return Observation(norm_date(pos[best]), float(vals[str(best)]),
                       f"Eurostat (prc_hicp_manr, {geo})", eurostat_status(d, str(best)))


def eurostat_v2(geo="EA", dataset="prc_hicp_minr"):
    """Nouvelle base IPCH d'Eurostat (ECOICOP v2, depuis 2026). On lit toutes les catégories et on garde l'indice d'ensemble."""
    url = (f"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{dataset}"
           f"?format=JSON&lang=EN&unit=RCH_A&geo={geo}&lastTimePeriod=3")
    d = json.loads(http_get(url))
    ids, sizes = d["id"], d["size"]
    cats = {}
    for dim in ids:
        idx = d["dimension"][dim]["category"]["index"]
        if isinstance(idx, list):
            idx = {c: i for i, c in enumerate(idx)}
        cats[dim] = {i: c for c, i in idx.items()}
    best = None
    for key, val in d["value"].items():
        k = int(key)
        codes = {}
        for dim, size in zip(reversed(ids), reversed(sizes)):
            codes[dim] = cats[dim][k % size]
            k //= size
        total = any(dim.lower().startswith("coicop") and codes[dim] in ("TOTAL", "CP00") for dim in ids)
        if total and (best is None or codes["time"] > best[0]):
            best = (codes["time"], float(val), eurostat_status(d, key))
    if best is None:
        raise ValueError("indice d'ensemble introuvable")
    return Observation(norm_date(best[0]), best[1], f"Eurostat ({dataset}, {geo})", best[2])


def freshest(*fns):
    """Essaie toutes les sources et garde la donnée à la date la plus récente."""
    best, last = None, None
    for f in fns:
        try:
            r = f()
            print("   source", getattr(f, "__name__", "?"), "->", r)
            if best is None or r.date > best.date:
                best = r
        except Exception as e:  # noqa: BLE001
            print("   source en échec :", e)
            last = e
    if best is None:
        raise last
    return best


# ---------- Yahoo ----------
def yahoo_last(sym):
    import yfinance as yf
    table = yf.Ticker(sym).history(period="5d", interval="1d", auto_adjust=False)
    close = table["Close"].dropna()
    if close.empty or not math.isfinite(float(close.iloc[-1])) or close.iloc[-1] <= 0:
        raise ValueError("prix absent")
    return Observation(close.index[-1].date().isoformat(), round(float(close.iloc[-1]), 2), f"Yahoo Finance ({sym}, contrat à terme)")


def first_ok(*fns):
    last = None
    for f in fns:
        try:
            return f()
        except Exception as e:  # noqa: BLE001
            last = e
    raise last


GDP_COUNTRIES = {
    "fra": "France", "usa": "États-Unis", "chn": "Chine", "deu": "Allemagne",
    "jpn": "Japon", "ind": "Inde", "gbr": "Royaume-Uni", "ita": "Italie",
    "bra": "Brésil", "can": "Canada", "kor": "Corée du Sud", "esp": "Espagne",
}


def world_bank_gdp(country):
    series = "NY.GDP.MKTP.CD"
    url = f"https://api.worldbank.org/v2/country/{country.upper()}/indicator/{series}?format=json&per_page=10"
    _, rows = json.loads(http_get(url))
    latest = max((row for row in rows if row["value"] is not None), key=lambda row: row["date"])
    return Observation(f"{latest['date']}-01-01", float(latest["value"]) / 1e9,
                       f"Banque mondiale · PIB en dollars courants ({series})")


# clé : (libellé, unité, fréquence, max_age_days, fonction de récupération)
INDICATORS = {
    "ecb_deposit_rate": ("Taux de la facilité de dépôt de la BCE", "%", "daily", 120,
        lambda: first_ok(lambda: ecb_last("FM/D.U2.EUR.4F.KR.DFR.LEV"), lambda: ecb_last("FM/B.U2.EUR.4F.KR.DFR.LEV"))),
    "fed_target_upper": ("Fed funds : borne haute de la fourchette cible", "%", "daily", 120,
        lambda: fred_last("DFEDTARU", "Réserve fédérale")),
    "us_cpi_yoy": ("Inflation IPC-U américaine sur 12 mois, non désaisonnalisée", "%", "monthly", 65,
        lambda: freshest(fred_cpi_yoy, bls_cpi_yoy)),
    "ez_hicp_yoy": ("Inflation IPCH de la zone euro sur 12 mois", "%", "monthly", 65,
        lambda: freshest(eurostat_v2, lambda: eurostat_v2("EA21"),
                         lambda: ecb_last("HICP/M.U2.N.000000.4.ANR"), lambda: ecb_last("HICP/M.U2.N.TOTAL.4.ANR"),
                         eurostat_json, lambda: ecb_last("ICP/M.U2.N.000000.4.ANR"))),
    "us_unrate": ("Taux de chômage américain", "%", "monthly", 65,
        lambda: freshest(lambda: fred_last("UNRATE", "BLS"), bls_unemployment)),
    "us_10y": ("Rendement du Treasury américain à 10 ans", "%", "daily", 7,
        lambda: freshest(treasury_10y, lambda: fred_last("DGS10", "Réserve fédérale"))),
    "eurusd": ("EUR/USD (taux de référence BCE)", "", "daily", 7,
        lambda: ecb_exchange("USD")),
    "brent": ("Brent, prix au comptant", "$/baril", "daily", 7,
        lambda: fred_last("DCOILBRENTEU", "EIA")),
    "wti": ("WTI, prix au comptant", "$/baril", "daily", 7,
        lambda: fred_last("DCOILWTICO", "EIA")),
    "gold": ("Or (once troy, contrat à terme)", "$/once", "daily", 7, lambda: yahoo_last("GC=F")),
    "copper": ("Cuivre (livre, contrat à terme)", "$/livre", "daily", 7, lambda: yahoo_last("HG=F")),
    "copper_imf": ("Cuivre, moyenne mensuelle FMI", "$/tonne", "monthly", 80, lambda: fred_last("PCOPPUSDM", "FMI")),
    "eurjpy": ("EUR/JPY (taux de référence BCE)", "¥/€", "daily", 7, lambda: ecb_exchange("JPY")),
    "eurgbp": ("EUR/GBP (taux de référence BCE)", "£/€", "daily", 7, lambda: ecb_exchange("GBP")),
    **{f"gdp_{key}": (f"PIB nominal · {name}", "Md$", "annual", 1100, lambda code=key: world_bank_gdp(code))
       for key, name in GDP_COUNTRIES.items()},
}


def main():
    data = {}
    try:
        with open(OUT, encoding="utf-8") as f:
            data = json.load(f)
        old = data.get("indicators", {}) or {}
    except Exception:  # noqa: BLE001
        old = {}

    failed = []
    indicators = dict(old)
    specs = {key: spec for key, spec in INDICATORS.items() if "--intraday" not in sys.argv or spec[2] == "daily"}
    with ThreadPoolExecutor(max_workers=6) as workers:
        futures = {key: workers.submit(spec[-1]) for key, spec in specs.items()}
        for key, (label, unit, frequency, max_age, _) in specs.items():
            try:
                quote = futures[key].result()
                now = datetime.datetime.now(datetime.timezone.utc)
                age = (now.date() - datetime.date.fromisoformat(quote.date)).days
                if not math.isfinite(quote.value) or abs(quote.value) > 1e7 or not 0 <= age <= max_age:
                    raise ValueError("observation hors délai ou invalide")
                if old.get(key, {}).get("ref_date", "") > quote.date and old[key].get("retrieved_at"):
                    raise ValueError("observation antérieure à celle conservée")
                indicators[key] = {"label": label, "value": quote.value, "unit": unit, "ref_date": quote.date,
                                   "source": quote.source, "max_age_days": max_age, "frequency": frequency,
                                   "retrieved_at": now.isoformat(timespec="seconds"), "status": quote.status}
                if quote.published_at:
                    indicators[key]["published_at"] = quote.published_at
                print("OK ", key, quote.value, quote.date)
            except Exception as e:  # noqa: BLE001
                failed.append(key)
                print("KO ", key, e)

    checked_at = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    successes = len(specs) - len(failed)
    out = {"updated_at": checked_at if successes else data.get("updated_at"),
           "checked_at": checked_at, "failed": sorted(set(failed) | (set(data.get("failed", [])) - set(specs))), "indicators": indicators}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT + ".tmp", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    os.replace(OUT + ".tmp", OUT)
    print(f"{successes}/{len(specs)} indicateurs récupérés")
    if failed:
        print("::warning::Séries sans nouvelle récupération : " + ", ".join(failed))
    if not successes:
        sys.exit(1)


if __name__ == "__main__":
    main()
