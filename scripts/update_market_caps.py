"""
Robot quotidien : récupère les capitalisations boursières et écrit public/data/market-caps.json.
Lancé chaque jour par GitHub Actions (voir .github/workflows/market-caps.yml).
Source : Yahoo Finance via la bibliothèque yfinance (donnée de marché gratuite, non officielle).
Sécurité : si trop de valeurs manquent, l'ancien fichier est conservé (on n'écrase jamais avec des données cassées).
"""
import json, sys, datetime, os
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

def usd_rate(cur, cache):
    """Taux de conversion devise -> USD."""
    if cur == "USD": return 1.0
    if cur in cache: return cache[cur]
    rate = None
    try:
        rate = float(yf.Ticker(f"{cur}USD=X").fast_info["last_price"])
        if not (rate > 0): rate = None
    except Exception as e:
        print("FX KO", cur, e)
    cache[cur] = rate
    return rate

def main():
    out_path = os.path.join(os.path.dirname(__file__), "..", "public", "data", "market-caps.json")
    items, fx, failed = [], {}, []
    for sym, name, country, region in COMPANIES:
        try:
            fi = yf.Ticker(sym).fast_info
            cap = fi["market_cap"]
            cur = str(fi["currency"])
            if cap is None or cap <= 0: raise ValueError("capitalisation absente")
            # Pence britanniques : 100 pence = 1 livre
            if cur == "GBp": cap, cur = cap / 100.0, "GBP"
            if cur == "ZAc": cap, cur = cap / 100.0, "ZAR"
            r = usd_rate(cur, fx)
            if r is None: raise ValueError(f"taux {cur} indisponible")
            items.append({"ticker": sym, "name": name, "country": country, "region": region,
                          "market_cap_usd": round(cap * r)})
        except Exception as e:
            failed.append(sym); print("KO", sym, e)

    ok_ratio = len(items) / len(COMPANIES)
    print(f"{len(items)}/{len(COMPANIES)} valeurs récupérées")
    # Garde-fous : assez de valeurs, et les grandes valeurs de référence présentes
    names = {i["ticker"] for i in items}
    if ok_ratio < 0.8 or not {"AAPL", "MSFT", "NVDA"} <= names:
        print("Données insuffisantes : fichier existant conservé."); sys.exit(1)

    items.sort(key=lambda i: i["market_cap_usd"], reverse=True)
    data = {
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "source": "Yahoo Finance (via yfinance), conversion en USD au taux du jour",
        "failed": failed,
        "items": items,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()
