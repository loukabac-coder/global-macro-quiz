"""
Collecte automatique des capitalisations boursières dans public/data/market-caps.json.
Lancée par GitHub Actions (voir .github/workflows/donnees-du-jour.yml).
Source : Yahoo Finance via la bibliothèque yfinance (donnée de marché gratuite, non officielle).
Sécurité : si trop de valeurs manquent, l'ancien fichier est conservé (on n'écrase jamais avec des données cassées).
"""
import json, sys, datetime, math, os
import urllib.request
import xml.etree.ElementTree as ET
from functools import lru_cache
import yfinance as yf

# (symbole Yahoo, nom affiché, pays, région)
COMPANIES = [
    # États-Unis
    ("NVDA","Nvidia","États-Unis","Amérique"),("AAPL","Apple","États-Unis","Amérique"),
    ("MSFT","Microsoft","États-Unis","Amérique"),("GOOGL","Alphabet (Google)","États-Unis","Amérique"),
    ("AMZN","Amazon","États-Unis","Amérique"),("META","Meta","États-Unis","Amérique"),
    ("AVGO","Broadcom","États-Unis","Amérique"),("TSLA","Tesla","États-Unis","Amérique"),
    ("BRK-B","Berkshire Hathaway","États-Unis","Amérique"),("LLY","Eli Lilly","États-Unis","Amérique"),
    ("JPM","JPMorgan Chase","États-Unis","Amérique"),("WMT","Walmart","États-Unis","Amérique"),
    ("V","Visa","États-Unis","Amérique"),("ORCL","Oracle","États-Unis","Amérique"),
    ("XOM","ExxonMobil","États-Unis","Amérique"),("MA","Mastercard","États-Unis","Amérique"),
    ("NFLX","Netflix","États-Unis","Amérique"),("COST","Costco","États-Unis","Amérique"),
    ("JNJ","Johnson & Johnson","États-Unis","Amérique"),("PLTR","Palantir","États-Unis","Amérique"),
    ("BAC","Bank of America","États-Unis","Amérique"),("AMD","AMD","États-Unis","Amérique"),
    ("GS","Goldman Sachs","États-Unis","Amérique"),("MS","Morgan Stanley","États-Unis","Amérique"),
    # Asie / Moyen-Orient
    ("TSM","TSMC","Taïwan","Asie"),("2222.SR","Saudi Aramco","Arabie saoudite","Moyen-Orient"),
    ("005930.KS","Samsung Electronics","Corée du Sud","Asie"),("0700.HK","Tencent","Chine","Asie"),
    ("BABA","Alibaba","Chine","Asie"),("600519.SS","Kweichow Moutai","Chine","Asie"),
    ("7203.T","Toyota","Japon","Asie"),("8306.T","Mitsubishi UFJ","Japon","Asie"),
    ("RELIANCE.NS","Reliance Industries","Inde","Asie"),("HDFCBANK.NS","HDFC Bank","Inde","Asie"),
    ("1398.HK","ICBC","Chine","Asie"),
    # Europe (zone euro, Royaume-Uni, Suisse, Nordiques)
    ("ASML","ASML","Pays-Bas","Europe"),("SAP.DE","SAP","Allemagne","Europe"),
    ("NESN.SW","Nestlé","Suisse","Europe"),("NOVO-B.CO","Novo Nordisk","Danemark","Europe"),
    ("ROG.SW","Roche","Suisse","Europe"),("NOVN.SW","Novartis","Suisse","Europe"),
    ("MC.PA","LVMH","France","Europe"),("OR.PA","L'Oréal","France","Europe"),
    ("RMS.PA","Hermès","France","Europe"),("TTE.PA","TotalEnergies","France","Europe"),
    ("SAN.PA","Sanofi","France","Europe"),("AIR.PA","Airbus","France","Europe"),
    ("SU.PA","Schneider Electric","France","Europe"),("BNP.PA","BNP Paribas","France","Europe"),
    ("AI.PA","Air Liquide","France","Europe"),("SAF.PA","Safran","France","Europe"),
    ("AZN.L","AstraZeneca","Royaume-Uni","Europe"),("SHEL.L","Shell","Royaume-Uni","Europe"),
    ("HSBA.L","HSBC","Royaume-Uni","Europe"),("ULVR.L","Unilever","Royaume-Uni","Europe"),
    ("BP.L","BP","Royaume-Uni","Europe"),("SIE.DE","Siemens","Allemagne","Europe"),
    ("ALV.DE","Allianz","Allemagne","Europe"),("DTE.DE","Deutsche Telekom","Allemagne","Europe"),
    ("SAN.MC","Banco Santander","Espagne","Europe"),("ITX.MC","Inditex","Espagne","Europe"),
    ("IBE.MC","Iberdrola","Espagne","Europe"),("UCG.MI","UniCredit","Italie","Europe"),
    ("ISP.MI","Intesa Sanpaolo","Italie","Europe"),("ENEL.MI","Enel","Italie","Europe"),
    ("UBSG.SW","UBS","Suisse","Europe"),("ABBN.SW","ABB","Suisse","Europe"),
    ("CFR.SW","Richemont","Suisse","Europe"),
]

def latest_close(ticker):
    close = ticker.history(period="5d", interval="1d", auto_adjust=False, timeout=10)["Close"].dropna()
    if close.empty:
        raise ValueError("séance introuvable")
    price = float(close.iloc[-1])
    if not math.isfinite(price) or price <= 0:
        raise ValueError("prix indisponible")
    return price, close.index[-1].date().isoformat()


@lru_cache(maxsize=1)
def ecb_reference_rates():
    url = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
    with urllib.request.urlopen(url, timeout=15) as response:
        root = ET.fromstring(response.read())
    session = root.find(".//{*}Cube[@time]")
    if session is None:
        raise ValueError("référence de change BCE absente")
    rates = {child.attrib["currency"]: float(child.attrib["rate"]) for child in session}
    return session.attrib["time"], {"EUR": 1.0, **rates}


def recent(date, as_of):
    return 0 <= (as_of - datetime.date.fromisoformat(date)).days <= 7


def usd_rate(cur, cache, as_of):
    """Taux devise -> USD, date et fournisseur du taux utilisé."""
    if cur == "USD":
        return 1.0, None, None
    if cur not in cache:
        try:
            rate, day = latest_close(yf.Ticker(f"{cur}USD=X"))
            if not recent(day, as_of):
                raise ValueError("taux Yahoo Finance expiré")
            cache[cur] = rate, day, "Yahoo Finance"
        except Exception:  # noqa: BLE001
            try:
                day, rates = ecb_reference_rates()
                rate = rates["USD"] / rates[cur]
                if not recent(day, as_of) or not math.isfinite(rate) or rate <= 0:
                    raise ValueError("taux BCE expiré ou invalide")
                cache[cur] = rate, day, "BCE"
            except Exception:  # noqa: BLE001
                cache[cur] = None
    return cache[cur]


def publish(data, path):
    with open(path + ".tmp", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(path + ".tmp", path)


def main():
    out_path = os.path.join(os.path.dirname(__file__), "..", "public", "data", "market-caps.json")
    items, fx, failed = [], {}, []
    collected = datetime.datetime.now(datetime.timezone.utc)
    for sym, name, country, region in COMPANIES:
        try:
            ticker = yf.Ticker(sym)
            fi = ticker.fast_info
            cap = float(fi["market_cap"])
            cur = str(fi["currency"])
            if not math.isfinite(cap) or cap <= 0:
                raise ValueError("capitalisation absente")
            # Pence britanniques : 100 pence = 1 livre
            if cur == "GBp": cap, cur = cap / 100.0, "GBP"
            if cur == "ZAc": cap, cur = cap / 100.0, "ZAR"
            conversion = usd_rate(cur, fx, collected.date())
            if conversion is None:
                raise ValueError(f"conversion {cur} vers USD indisponible")
            r, fx_date, fx_source = conversion
            _, price_date = latest_close(ticker)
            if not recent(price_date, collected.date()):
                raise ValueError("séance absente ou ancienne")
            items.append({"ticker": sym, "name": name, "country": country, "region": region,
                          "market_cap_usd": round(cap * r), "price_date": price_date,
                          "fx_date": fx_date, "fx_source": fx_source, "currency": cur})
        except Exception as e:
            failed.append(sym); print("KO", sym, e)

    ok_ratio = len(items) / len(COMPANIES)
    print(f"{len(items)}/{len(COMPANIES)} valeurs récupérées")
    # Garde-fous : assez de valeurs, et les grandes valeurs de référence présentes
    names = {i["ticker"] for i in items}
    checked_at = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    if ok_ratio < 0.8 or not {"AAPL", "MSFT", "NVDA"} <= names:
        try:
            with open(out_path, encoding="utf-8") as f:
                previous = json.load(f)
        except (OSError, ValueError):
            previous = {"updated_at": None, "source": "Yahoo Finance", "items": []}
        publish({**previous, "checked_at": checked_at, "refresh_failed": True, "failed": failed}, out_path)
        print("::warning::Capitalisations insuffisantes, instantané précédent conservé.")
        sys.exit(1)

    items.sort(key=lambda i: i["market_cap_usd"], reverse=True)
    data = {
        "updated_at": checked_at,
        "checked_at": checked_at,
        "refresh_failed": False,
        "source": "Estimations Yahoo Finance, taux de conversion Yahoo Finance ou BCE",
        "failed": failed,
        "items": items,
    }
    publish(data, out_path)
    if failed:
        print("::warning::Valeurs non récupérées : " + ", ".join(failed))

if __name__ == "__main__":
    main()
