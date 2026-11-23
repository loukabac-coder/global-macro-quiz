"""Dernières annonces des banques centrales, distinctes des dates d’effet."""

import calendar
import datetime as dt
from html import unescape
from io import BytesIO
import re
from urllib.parse import urljoin
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

from scripts.update_macro import UA, http_get

ECB = "https://www.ecb.europa.eu/press/press_conference/html/index.en.html"
FED = "https://www.federalreserve.gov/feeds/press_monetary.xml"
BOE = "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate"
BOJ = "https://www.boj.or.jp/en/mopo/mpmdeci/mpr_{year}/index.htm"
SNB = "https://www.snb.ch/en/the-snb/mandates-goals/monetary-policy/decisions"

NAMES = {
    "ecb": "Banque centrale européenne", "fed": "Réserve fédérale",
    "boe": "Banque d’Angleterre", "boj": "Banque du Japon", "snb": "Banque nationale suisse",
}
MOVEMENTS = {
    "unchanged": r"maintain\w*|leav\w*|remain\w*|keep\w*|maintenu",
    "up": r"increas\w*|rais\w*",
    "down": r"decreas\w*|reduc\w*|lower\w*|cut",
}


def links(html, base, pattern):
    return sorted({urljoin(base, unescape(href)) for href in re.findall(r'''href=["']([^"']+)["']''', html, re.I)
                   if re.fullmatch(pattern, href)})


def plain(html):
    clean = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", html, flags=re.I | re.S)
    return " ".join(unescape(re.sub(r"<[^>]*>", " ", clean)).split())


def movement(text, rule):
    match = re.search(rule, text, re.I)
    if match:
        word = match["move"].lower()
        for result, forms in MOVEMENTS.items():
            if re.fullmatch(forms, word):
                return result
    raise ValueError("mouvement du taux non identifié dans le communiqué")


def latest_ecb():
    pages = links(http_get(ECB), ECB, r"/press/pr/date/\d{4}/html/ecb\.mp\d{6}~[\d\w]+\.en\.html")
    url = pages[-1]
    date = dt.datetime.strptime(re.search(r"ecb\.mp(\d{6})", url)[1], "%y%m%d").date()
    text = plain(http_get(url))
    rule = (r"decided to (?P<move>keep|maintain|increase|raise|lower|reduce|cut)\b[^.]{0,130}?"
            r"(?:key ECB interest rates|deposit facility rate|three key interest rates)")
    return date, url, movement(text, rule)


def latest_fed():
    items = ET.fromstring(http_get(FED)).findall(".//item")
    statements = [item.findtext("link") or "" for item in items
                  if "fomc statement" in (item.findtext("title") or "").lower()]
    url = max(link for link in statements if re.fullmatch(
        r"https://www\.federalreserve\.gov/newsevents/pressreleases/monetary\d{8}[a-z]\.htm", link))
    date = dt.datetime.strptime(re.search(r"monetary(\d{8})", url)[1], "%Y%m%d").date()
    rule = r"decided to (?P<move>maintain|increase|raise|lower|reduce|cut) the target range"
    return date, url, movement(plain(http_get(url)), rule)


def latest_boe():
    pages = links(http_get(BOE), BOE, r"/monetary-policy-summary-and-minutes/\d{4}/[a-z]+-\d{4}")
    months = {name.lower(): i for i, name in enumerate(calendar.month_name) if i}
    url = max(pages, key=lambda link: (int(link[-4:]), months[link.split("/")[-1].rsplit("-", 1)[0]]))
    text = plain(http_get(url))
    when = re.search(r"meeting ending on (\d{1,2}) ([A-Za-z]+) (\d{4})", text, re.I)
    if not when:
        raise ValueError("date de décision non identifiée")
    date = dt.date(int(when[3]), months[when[2].lower()], int(when[1]))
    rule = r"voted(?: by [^.]{1,60}?)? to (?P<move>maintain|increase|raise|lower|reduce|cut|keep) Bank Rate"
    return date, url, movement(text[when.end():], rule)


def latest_snb():
    pages = links(http_get(SNB), SNB, r"/en/publications/communication/press-releases(?:-restricted)?/pre_\d{8}")
    url = max(pages, key=lambda link: link[-8:])
    date = dt.datetime.strptime(url[-8:], "%Y%m%d").date()
    rule = r"(?:Swiss National Bank|SNB) (?:is )?(?P<move>leav\w*|keep\w*|rais\w*|lower\w*|increas\w*|reduc\w*) (?:the )?SNB policy rate"
    return date, url, movement(plain(http_get(url)), rule)


def japanese_target(text):
    match = re.search(r"uncollateralized overnight call rate to (?:remain at|be at|move at) around\s*([\d.]+)\s*percent",
                      " ".join(text.split()), re.I)
    if not match:
        raise ValueError("taux cible non identifié dans le communiqué de la Banque du Japon")
    return float(match[1])


def latest_boj(today):
    from pypdf import PdfReader

    def target(url):
        with urlopen(Request(url, headers=UA), timeout=20) as response:
            pdf = PdfReader(BytesIO(response.read()))
        return japanese_target(pdf.pages[0].extract_text(extraction_mode="layout"))

    def statements(year):
        index = BOJ.format(year=year)
        return links(http_get(index), index, r"(?:/en/mopo/mpmdeci/mpr_\d{4}/)?k\d{6}a\.pdf")

    try:
        pages = statements(today.year)
    except OSError:
        if today.month != 1:
            raise
        pages = []
    if len(pages) < 2:
        pages = statements(today.year - 1) + pages
    previous, latest = pages[-2:]
    date = dt.datetime.strptime(latest[-11:-5], "%y%m%d").date()
    old, new = target(previous), target(latest)
    return date, latest, "up" if new > old else "down" if new < old else "unchanged"


def decision(key, now):
    collectors = {"ecb": latest_ecb, "fed": latest_fed, "boe": latest_boe, "snb": latest_snb,
                  "boj": lambda: latest_boj(now.date())}
    day, url, move = collectors[key]()
    if not 0 <= (now.date() - day).days <= 130:
        raise ValueError("la publication trouvée n’est pas une décision récente")
    return {"id": key, "date": day.isoformat(), "retrieved_at": now.isoformat(timespec="seconds"),
            "source": NAMES[key], "url": url, "movement": move}
