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
from scripts.policy_decisions import NAMES, decision, links

ROOT = Path(__file__).resolve().parent.parent / "public" / "data" / "actualite.json"
COUNCIL = "https://www.consilium.europa.eu"
ELECTIONS_CANADA = "https://www.elections.ca/content.aspx?dir=pas&document=ge&lang=f&section=ele"
MONTHS_FR = "janvier février mars avril mai juin juillet août septembre octobre novembre décembre".split()
try:
    PARIS = ZoneInfo("Europe/Paris")
except ZoneInfoNotFoundError:
    # Python embarqué sous Windows peut n’avoir que le fuseau du système.
    PARIS = None


def plain(value):
    return " ".join(unescape(re.sub(r"<[^>]*>", " ", value or "")).split())


TOPICS = (
    (r"sanction|mesures restrictives|restrictive measures", "Sanctions et mesures restrictives"),
    (r"élections?|elections?|official results|résultats officiels", "Élections et institutions"),
    (r"méthane|methane|approvisionnement énergétique|energy supply|quotas d.émission", "Énergie et approvisionnement"),
    (r"droits de douane|tariff|commerce|trade|safeguard investigation|information technology agreement|gibraltar|apec|royaume-uni.*sommet|summit.*kingdom", "Commerce et coopération internationale"),
    (r"titrisation|securiti[sz]ation|marchés des capitaux|capital markets|produits financiers|financial product", "Réglementation financière"),
    (r"budget|finances publiques|climate finance|financement climatique", "Budget et financement public"),
)


def parse_feed(xml, now, base, section, source, date_from_link=True):
    events = {}
    host = urlparse(base).hostname
    for item in ET.fromstring(xml).findall(".//item"):
        title = plain(item.findtext("title"))
        context = plain(item.findtext("description"))
        url = urljoin(base, item.findtext("link") or "")
        parts = urlparse(url)
        match = re.search(rf"{section}/(\d{{4}}/\d{{2}}/\d{{2}})/" if date_from_link else section, parts.path)
        topic = next((label for pattern, label in TOPICS if re.search(pattern, title, re.I)), None)
        if parts.scheme != "https" or parts.hostname not in {host, host.removeprefix("www.")} or not match or not topic or not context:
            continue
        published = None
        pub_date = item.findtext("pubDate")
        if pub_date:
            try:
                stamp = parsedate_to_datetime(pub_date)
                if stamp.tzinfo and stamp <= now:
                    published = stamp
            except (TypeError, ValueError, OverflowError):
                pass
        if not date_from_link and not published:
            continue
        day = datetime.date.fromisoformat(match[1].replace("/", "-")) if date_from_link else published.astimezone(PARIS).date()
        age = (now.astimezone(PARIS).date() - day).days
        if not 0 <= age <= 35:
            continue
        slug = parts.path.strip("/").split("/")[-1]
        events[slug] = {
            "id": slug, "title": title, "context": context[:850], "topic": topic,
            "date": day.isoformat(), "published_at": published.isoformat() if published else None,
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


def world_trade(now):
    base = "https://www.wto.org"
    xml = http_get(f"{base}/library/rss/latest_news_e.xml")
    if not ET.fromstring(xml).findall(".//item"):
        raise ValueError("le flux de l’OMC ne contient aucun communiqué")
    releases = parse_feed(xml, now, base, r"^/english/news_e/news\d+_e/[^/]+\.htm$", "OMC · communiqués", date_from_link=False)
    relevant = r"trade[- ](?:restrict|facilitat)|safeguard|information technology agreement|tariff|dispute|trade policy review|subsid|accession"
    return [row for row in releases if re.search(relevant, row["title"], re.I)]


LEADERS = {
    "fr": ("Présidence de la République française", "Élysée",
           "https://www.elysee.fr/la-presidence/les-presidents-de-la-republique", "fr"),
    "uk": ("Primature du Royaume-Uni", "GOV.UK", "https://www.gov.uk/government/ministers/prime-minister", "uk"),
    "de": ("Chancellerie fédérale allemande", "Gouvernement fédéral allemand",
           "https://www.bundesregierung.de/breg-en/federal-government/federal-cabinet", "de"),
    "ca": ("Primature du Canada", "Gouvernement du Canada", "https://www.pm.gc.ca/en", "ca"),
    "eu": ("Présidence du Conseil européen", "Conseil européen", f"{COUNCIL}/fr/european-council/president/", "eu"),
    "us": ("Présidence des États-Unis", "Maison-Blanche", "https://www.whitehouse.gov/administration/", "us"),
    "jp": ("Primature du Japon", "Bureau du Premier ministre du Japon", "https://japan.kantei.go.jp/index.html", "jp"),
    "au": ("Primature de l’Australie", "Gouvernement australien", "https://www.pm.gov.au/about-prime-minister", "au"),
    "es": ("Présidence du gouvernement espagnol", "La Moncloa", "https://www.lamoncloa.gob.es/presidente/biografia/Paginas/index.aspx", "es"),
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
        match = re.search(r"Current role holder\s*:\s*([^<]+)?\s*<a\b[^>]*>(.*?)</a>", html, re.I | re.S)
        if match:
            name = re.sub(r"^(?:The\s+)?(?:Rt\.?\s+Hon\.?\s+)?|\s+MP$", "", plain(match[2]), flags=re.I)
        else:
            fallback = re.search(r"Current role holder\s*:\s*((?:The\s+)?(?:Rt\.?\s+Hon\.?\s+)?[^:]{3,55}?)(?:\s+MP)?\s+(?:Table of )?Contents",
                                 plain(html), re.I)
            if fallback:
                name = re.sub(r"^(?:The\s+)?(?:Rt\.?\s+Hon\.?\s+)?", "", fallback[1], flags=re.I)
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
        else:
            match = re.search(r"The current President of the European Council is ([^.]{4,75})\.", plain(html), re.I)
            if match:
                name = match[1]
    if code == "us":
        match = re.search(r"\bPresident (.{4,75}?) \d+(?:st|nd|rd|th)(?:\s*&\s*\d+(?:st|nd|rd|th))? President of the United States",
                          plain(html), re.I)
        if match:
            name = match[1]
    if code == "jp":
        match = re.search(r"Profile of the Prime Minister\s+The \d+(?:st|nd|rd|th) Prime Minister\s+(.{4,75}?)\s+Profile", plain(html), re.I)
        if match:
            name = match[1]
    if code == "au":
        headings = [plain(text) for text in re.findall(r"<h[12]\b[^>]*>(.*?)</h[12]>", html, re.I | re.S)]
        for heading in headings:
            match = re.fullmatch(r"The Hon\.? (.{4,75}?) MP", heading, re.I)
            if match:
                name = match[1]
                break
    if code == "es":
        heading = re.search(r"<h1\b[^>]*>(.*?)</h1>", html, re.I | re.S)
        if heading and re.search(r"president[ea] del Gobierno", plain(html), re.I):
            name = plain(heading[1])
    if not 2 <= len(name.split()) <= 6 or any(char.isdigit() for char in name) or len(name) > 90:
        raise ValueError("titulaire non identifié dans la source officielle")
    return name


def leader(key, now):
    office, source, url, code = LEADERS[key]
    if code == "eu":
        alternatives = [url, f"{COUNCIL}/en/european-council/president/role/"]
        selected, name = first_ok(*(lambda page=page: (page, parse_leader(code, http_get(page))) for page in alternatives))
        return {"id": key, "office": office, "name": name, "source": source, "url": selected,
                "date": now.astimezone(PARIS).date().isoformat(), "retrieved_at": now.isoformat(timespec="seconds")}
    html = http_get(url)
    if code == "jp":
        candidates = links(html, url, r"/\d+(?:_[a-z]+)?/meibo/index(?:_e)?\.html")
        url = max(candidates, key=lambda value: int(re.search(r"/(\d+)", value)[1]))
        html = http_get(url)
    name = parse_leader(code, html)
    return {"id": key, "office": office, "name": name, "source": source, "url": url,
            "date": now.astimezone(PARIS).date().isoformat(), "retrieved_at": now.isoformat(timespec="seconds")}


def election_canada(now):
    index = re.sub(r"</?sup\b[^>]*>", "", http_get(ELECTIONS_CANADA), flags=re.I)
    contests = re.findall(r"(\d+)(?:e|re) élection générale,\s*(\d{1,2}) ([a-zéû]+) (\d{4})", plain(index), re.I)
    edition, day, month, year = max(contests, key=lambda entry: int(entry[0]))
    event_day = datetime.date(int(year), MONTHS_FR.index(month.lower()) + 1, int(day))
    home = f"https://www.elections.ca/res/rep/off/ovrGE{edition}/home.html"
    tables = links(http_get(home), home, r"(?:[^/]+/)?table7E\.html")
    url = tables[0]
    html = http_get(url)
    rows = [[plain(cell) for cell in re.findall(r"<t[hd]\b[^>]*>(.*?)</t[hd]>", row, re.I | re.S)]
            for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", html, re.I | re.S)]
    headers = next(row[1:] for row in rows if row and row[0] == "Province or territory")
    seats = next([int(value.replace(",", "")) for value in row[1:]] for row in rows if row and row[0] == "Canada")
    total = seats[-1]
    if len(seats) != len(headers) or total <= 0 or sum(seats[:-1]) != total:
        raise ValueError("résultats électoraux incomplets")
    first = max(range(len(seats) - 1), key=seats.__getitem__)
    return {"id": "ca-general", "country": "Canada", "date": event_day.isoformat(), "winner": headers[first],
            "seats": seats[first], "total": total, "source": "Élections Canada", "url": url,
            "retrieved_at": now.isoformat(timespec="seconds")}


def main():
    try:
        previous = json.loads(ROOT.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        previous = {}
    now = datetime.datetime.now(datetime.timezone.utc)
    checked = now.isoformat(timespec="seconds")
    failed = []
    feeds = {"Communiqués du Conseil de l’Union européenne": council, "Communiqués du Canada": canada, "Communiqués de l’OMC": world_trade}
    with ThreadPoolExecutor(max_workers=12) as workers:
        requests = {label: workers.submit(fetch, now) for label, fetch in feeds.items()}
        sources = {key: workers.submit(leader, key, now) for key in LEADERS}
        monetary = {key: workers.submit(decision, key, now) for key in NAMES}
        canadian_election = workers.submit(election_canada, now)
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
                leader_row = future.result()
                old = leaders.get(key)
                if old and old["name"] != leader_row["name"]:
                    leader_row.update({"previous_name": old["name"], "change_date": leader_row["date"]})
                elif old:
                    leader_row.update({field: old[field] for field in ("previous_name", "change_date") if field in old})
                leaders[key] = leader_row
            except Exception as error:
                failed.append(LEADERS[key][0])
                print("KO", key, error)
        decisions = {item["id"]: item for item in previous.get("decisions", [])}
        for key, future in monetary.items():
            try:
                row = future.result()
                if key in decisions and row["date"] < decisions[key]["date"]:
                    raise ValueError("le communiqué est antérieur au dernier communiqué vérifié")
                decisions[key] = row
            except Exception as error:
                failed.append(NAMES[key])
                print("KO décision", key, error)
        elections = previous.get("elections", [])
        try:
            elections = [canadian_election.result()]
        except Exception as error:
            failed.append("Élections Canada · résultats officiels")
            print("KO résultats électoraux", error)
    kept = sorted(events.values(), key=lambda row: row["date"], reverse=True)[:50]
    succeeded = len(failed) < len(LEADERS) + len(feeds) + len(NAMES) + 1
    result = {
        "updated_at": checked if succeeded else previous.get("updated_at"),
        "checked_at": checked, "failed": failed, "events": kept, "leaders": list(leaders.values()),
        "decisions": list(decisions.values()), "elections": elections,
    }
    temp = ROOT.with_suffix(".tmp")
    temp.write_text(json.dumps(result, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    os.replace(temp, ROOT)
    print(f"{len(kept)} articles et {len(leaders)} dirigeants en cache. {len(failed)} sources en échec.")
    if not succeeded:
        sys.exit(1)


if __name__ == "__main__":
    main()
