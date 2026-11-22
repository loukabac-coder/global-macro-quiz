"""
Robot quotidien : récupère les capitalisations boursières et écrit public/data/market-caps.json.
Lancé chaque jour par GitHub Actions (voir .github/workflows/donnees-du-jour.yml).
Source : Yahoo Finance via la bibliothèque yfinance (donnée de marché gratuite, non officielle).
Sécurité : si trop de valeurs manquent, l'ancien fichier est conservé (on n'écrase jamais avec des données cassées).
"""
import json, sys, datetime, math, os
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
    close = ticker.history(period="5d", interval="1d", auto_adjust=False)["Close"].dropna()
    if close.empty:
        raise ValueError("séance introuvable")
    price = float(close.iloc[-1])
    if not math.isfinite(price) or price <= 0:
        raise ValueError("prix indisponible")
    return price, close.index[-1].date().isoformat()


def usd_rate(cur, cache):
    """Taux de conversion devise -> USD et date de la cotation utilisée."""
    if cur == "USD":
        return 1.0, None
    if cur not in cache:
        cache[cur] = latest_close(yf.Ticker(f"{cur}USD=X"))
    return cache[cur]

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
            r, fx_date = usd_rate(cur, fx)
            _, price_date = latest_close(ticker)
            for ref_date in (price_date, fx_date):
                if ref_date and not 0 <= (collected.date() - datetime.date.fromisoformat(ref_date)).days <= 7:
                    raise ValueError("séance absente ou ancienne")
            items.append({"ticker": sym, "name": name, "country": country, "region": region,
                          "market_cap_usd": round(cap * r), "price_date": price_date,
                          "fx_date": fx_date, "currency": cur})
        except Exception as e:
            failed.append(sym); print("KO", sym, e)

    ok_ratio = len(items) / len(COMPANIES)
    print(f"{len(items)}/{len(COMPANIES)} valeurs récupérées")
    # Garde-fous : assez de valeurs, et les grandes valeurs de référence présentes
    names = {i["ticker"] for i in items}
    if ok_ratio < 0.8 or not {"AAPL", "MSFT", "NVDA"} <= names:
        print("::warning::Capitalisations insuffisantes, instantané précédent conservé.")
        sys.exit(1)

    items.sort(key=lambda i: i["market_cap_usd"], reverse=True)
    data = {
        "updated_at": collected.isoformat(timespec="seconds"),
        "source": "Yahoo Finance (via yfinance), conversion au dernier cours de change daté",
        "failed": failed,
        "items": items,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    if failed:
        print("::warning::Valeurs non récupérées : " + ", ".join(failed))

if __name__ == "__main__":
    main()
