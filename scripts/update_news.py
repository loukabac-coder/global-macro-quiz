"""Contrôle des décisions publiques et des titulaires en poste depuis les sites institutionnels."""
import datetime
from email.utils import parsedate_to_datetime
from html import unescape
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin, urlparse
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
import xml.etree.ElementTree as ET

from scripts.update_macro import first_ok, http_get

ROOT = Path(__file__).resolve().parent.parent / "public" / "data" / "actualite.json"
COUNCIL = "https://www.consilium.europa.eu"
try:
    PARIS = ZoneInfo("Europe/Paris")
except ZoneInfoNotFoundError:
    # Python embarqué sous Windows peut n’avoir que le fuseau du système.
    PARIS = None


def plain(value):
    return " ".join(unescape(re.sub(r"<[^>]*>", " ", value or "")).split())


TOPICS = (
    (r"sanction|mesures restrictives|restrictive measures", "Sanctions et mesures restrictives"),
    (r"méthane|methane|approvisionnement énergétique|energy supply|quotas d.émission", "Énergie et approvisionnement"),
    (r"droits de douane|tariff|commerce|trade|gibraltar|apec|royaume-uni.*sommet|summit.*kingdom", "Commerce et coopération internationale"),
    (r"titrisation|securiti[sz]ation|marchés des capitaux|capital markets|produits financiers|financial product", "Réglementation financière"),
    (r"budget|finances publiques|climate finance|financement climatique", "Budget et financement public"),
)


def parse_feed(xml, now, base, section, source):
    events = {}
    host = urlparse(base).hostname
    for item in ET.fromstring(xml).findall(".//item"):
        title = plain(item.findtext("title"))
        context = plain(item.findtext("description"))
        url = urljoin(base, item.findtext("link") or "")
        parts = urlparse(url)
        match = re.search(rf"{section}/(\d{{4}}/\d{{2}}/\d{{2}})/", parts.path)
        topic = next((label for pattern, label in TOPICS if re.search(pattern, title, re.I)), None)
        if parts.scheme != "https" or parts.hostname not in {host, host.removeprefix("www.")} or not match or not topic or not context:
            continue
        day = datetime.date.fromisoformat(match[1].replace("/", "-"))
        age = (now.astimezone(PARIS).date() - day).days
        if not 0 <= age <= 35:
            continue
        published = item.findtext("pubDate")
        if published:
            try:
                stamp = parsedate_to_datetime(published)
                published = stamp.isoformat() if stamp.tzinfo and stamp <= now else None
            except (TypeError, ValueError, OverflowError):
                published = None
        slug = parts.path.strip("/").split("/")[-1]
        events[slug] = {
            "id": slug, "title": title, "context": context[:850], "topic": topic,
            "date": day.isoformat(), "published_at": published,
            "source": source, "url": url, "retrieved_at": now.isoformat(timespec="seconds"),
        }
    return list(events.values())


def council(now):
    def feed(language):
        xml = http_get(f"{COUNCIL}/{language}/rss/pressreleases.ashx")
        if not ET.fromstring(xml).findall(".//item"):
            raise ValueError("le flux institutionnel ne contient aucun communiqué")
        return parse_feed(xml, now, COUNCIL, r"^/(?:fr|en)/press/press-releases", "Consilium · service de presse")
    return first_ok(lambda: feed("fr"), lambda: feed("en"))


def canada(now):
    base = "https://www.pm.gc.ca"
    xml = http_get(f"{base}/en/news.rss")
    if not ET.fromstring(xml).findall(".//item"):
        raise ValueError("le flux canadien ne contient aucun communiqué")
    return parse_feed(xml, now, base, r"^/(?:fr|en)/(?:news|nouvelles)/[^/]+", "Cabinet du premier ministre du Canada")


LEADERS = {
    "fr": ("Présidence de la République française", "Élysée",
           "https://www.elysee.fr/la-presidence/les-presidents-de-la-republique", "fr"),
    "uk": ("Primature du Royaume-Uni", "GOV.UK", "https://www.gov.uk/government/ministers/prime-minister", "uk"),
    "de": ("Chancellerie fédérale allemande", "Gouvernement fédéral allemand",
           "https://www.bundesregierung.de/breg-en/federal-government/federal-cabinet", "de"),
    "ca": ("Primature du Canada", "Gouvernement du Canada", "https://www.pm.gc.ca/en", "ca"),
    "eu": ("Présidence du Conseil européen", "Conseil européen", f"{COUNCIL}/fr/european-council/president/", "eu"),
}


def parse_leader(code, html):
    name = ""
    if code == "fr":
        for link in re.findall(r"<a\b[^>]*>(.*?)</a>", html, re.I | re.S):
            match = re.fullmatch(r"(.+?)\s+Mandat en cours", plain(link), re.I)
            if match:
                name = match[1]
                break
    if code == "uk":
        match = re.search(r"Current role holder:\s*(.*?)\s+Contents", plain(html), re.I)
        if match:
            name = re.sub(r"^(?:The\s+)?(?:Rt\.?\s+Hon\.?\s+)?|\s+MP$", "", match[1], flags=re.I)
    if code == "de":
        match = re.search(r"current Federal Government consists of Federal Chancellor (.*?) and \d+", plain(html), re.I)
        if match:
            name = match[1]
    if code == "ca":
        title = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
        if title:
            match = re.match(r"(.+?)\s+-\s+Prime Minister of Canada\b", plain(title[1]), re.I)
            if match:
                name = match[1]
    if code == "eu":
        title = re.search(r"<h1\b[^>]*>(.*?)</h1>", html, re.I | re.S)
        if title and re.search(r"Président(?:e)? du Conseil européen", plain(html), re.I):
            name = plain(title[1])
    if not 2 <= len(name.split()) <= 6 or any(char.isdigit() for char in name) or len(name) > 90:
        raise ValueError("titulaire non identifié dans la source officielle")
    return name


def leader(key, now):
    office, source, url, code = LEADERS[key]
    name = parse_leader(code, http_get(url))
    return {"id": key, "office": office, "name": name, "source": source, "url": url,
            "date": now.astimezone(PARIS).date().isoformat(), "retrieved_at": now.isoformat(timespec="seconds")}


def main():
    try:
        previous = json.loads(ROOT.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        previous = {}
    now = datetime.datetime.now(datetime.timezone.utc)
    checked = now.isoformat(timespec="seconds")
    failed = []
    feeds = {"Communiqués du Conseil de l’Union européenne": council, "Communiqués du Canada": canada}
    with ThreadPoolExecutor(max_workers=7) as workers:
        requests = {label: workers.submit(fetch, now) for label, fetch in feeds.items()}
        sources = {key: workers.submit(leader, key, now) for key in LEADERS}
        events = {event["id"]: event for event in previous.get("events", [])}
        for label, request in requests.items():
            try:
                for event in request.result():
                    events[event["id"]] = event
            except Exception as error:
                failed.append(label)
                print("KO", label, error)
        leaders = {item["id"]: item for item in previous.get("leaders", [])}
        for key, future in sources.items():
            try:
                leaders[key] = future.result()
            except Exception as error:
                failed.append(LEADERS[key][0])
                print("KO", key, error)
    kept = sorted(events.values(), key=lambda row: row["date"], reverse=True)[:50]
    succeeded = len(failed) < len(LEADERS) + len(feeds)
    result = {
        "updated_at": checked if succeeded else previous.get("updated_at"),
        "checked_at": checked, "failed": failed, "events": kept, "leaders": list(leaders.values()),
    }
    temp = ROOT.with_suffix(".tmp")
    temp.write_text(json.dumps(result, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    os.replace(temp, ROOT)
    print(f"{len(kept)} articles et {len(leaders)} dirigeants en cache. {len(failed)} sources en échec.")
    if not succeeded:
        sys.exit(1)


if __name__ == "__main__":
    main()
