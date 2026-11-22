"""
Robot quotidien : met à jour public/data/macro.json (taux directeurs, inflation, change, pétrole, or).
Sources publiques et gratuites :
  - BCE (data-api.ecb.europa.eu)  : taux de dépôt, EUR/USD (taux de référence), inflation IPCH
  - FRED (fred.stlouisfed.org, fichiers CSV publics, sans clé) : Fed funds (borne haute), IPC américain,
    chômage américain, Treasury 10 ans, Brent et WTI (données EIA)
  - Yahoo Finance (yfinance) : or (contrat à terme), et secours pour le pétrole
Règle : un indicateur qui ne peut pas être mis à jour garde sa valeur précédente et SA DATE ANCIENNE.
Le site désactive tout seul les questions dont la donnée dépasse max_age_days.
"""
import csv, io, json, os, sys, datetime, urllib.request

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data", "macro.json")
UA = {"User-Agent": "Mozilla/5.0 (global-macro-quiz robot)"}


def http_get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8")


# ---------- BCE ----------
def ecb_last(path):
    """Dernière observation d'une série BCE : (date, valeur)."""
    txt = http_get(f"https://data-api.ecb.europa.eu/service/data/{path}?lastNObservations=1&format=csvdata")
    rows = list(csv.DictReader(io.StringIO(txt)))
    if not rows:
        raise ValueError("série BCE vide")
    row = rows[-1]
    return norm_date(row["TIME_PERIOD"]), float(row["OBS_VALUE"])


def norm_date(s):
    s = s.strip()
    if len(s) == 7:  # AAAA-MM -> dernier jour connu du mois : on garde le 1er pour rester prudent
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


def fred_last(series):
    return fred_rows(series)[-1]


def fred_cpi_yoy():
    """Inflation sur 12 mois : dernier mois dont le mois d'il y a un an existe (certains mois manquent, ex. oct. 2025)."""
    rows = fred_rows("CPIAUCSL")
    table = dict(rows)
    for d, v in reversed(rows):
        base = table.get(f"{int(d[:4]) - 1}{d[4:]}")
        if base:
            return d, round((v / base - 1) * 100, 2)
    raise ValueError("IPC il y a 12 mois introuvable")


def eurostat_hicp(geo="EA"):
    txt = http_get(f"https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/prc_hicp_manr/M.RCH_A.CP00.{geo}?lastTimePeriod=3&format=SDMX-CSV")
    rows = list(csv.DictReader(io.StringIO(txt)))
    if not rows:
        raise ValueError("Eurostat vide")
    r = sorted(rows, key=lambda x: x["TIME_PERIOD"])[-1]
    return norm_date(r["TIME_PERIOD"]), float(r["OBS_VALUE"])


def eurostat_json(geo="EA"):
    """API JSON d'Eurostat (inflation annuelle IPCH, toutes catégories)."""
    url = ("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr"
           f"?format=JSON&lang=EN&unit=RCH_A&coicop=CP00&geo={geo}&lastTimePeriod=3")
    d = json.loads(http_get(url))
    times = d["dimension"]["time"]["category"]["index"]  # {"2026-09": 0, "2026-10": 1}
    vals = d["value"]  # {"0": 3.8, "1": 4.0}
    pos = {v: k for k, v in times.items()}
    best = max((int(i) for i in vals), key=lambda i: pos[i])
    return norm_date(pos[best]), float(vals[str(best)])


def freshest(*fns):
    """Essaie toutes les sources et garde la donnée à la date la plus récente."""
    best, last = None, None
    for f in fns:
        try:
            r = f()
            print("   source", getattr(f, "__name__", "?"), "->", r)
            if best is None or r[0] > best[0]:
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
    p = float(yf.Ticker(sym).fast_info["last_price"])
    if not p > 0:
        raise ValueError("prix absent")
    return datetime.date.today().isoformat(), round(p, 2)


def first_ok(*fns):
    last = None
    for f in fns:
        try:
            return f()
        except Exception as e:  # noqa: BLE001
            last = e
    raise last


# clé : (libellé, unité, source, max_age_days, fonction de récupération)
INDICATORS = {
    "ecb_deposit_rate": ("Taux de la facilité de dépôt de la BCE", "%", "BCE (Statistical Data Warehouse)", 120,
        lambda: first_ok(lambda: ecb_last("FM/D.U2.EUR.4F.KR.DFR.LEV"), lambda: ecb_last("FM/B.U2.EUR.4F.KR.DFR.LEV"))),
    "fed_target_upper": ("Fed funds : borne haute de la fourchette cible", "%", "Réserve fédérale via FRED (DFEDTARU)", 120,
        lambda: fred_last("DFEDTARU")),
    "us_cpi_yoy": ("Inflation IPC américaine sur 12 mois", "%", "BLS via FRED (CPIAUCSL)", 100, fred_cpi_yoy),
    "ez_hicp_yoy": ("Inflation IPCH de la zone euro sur 12 mois", "%", "Eurostat (IPCH, prc_hicp_manr)", 100,
        lambda: freshest(eurostat_json, lambda: eurostat_json("EA21"), lambda: eurostat_json("EA20"), eurostat_hicp, lambda: eurostat_hicp("EA21"), lambda: ecb_last("ICP/M.U2.N.000000.4.ANR"))),
    "us_unrate": ("Taux de chômage américain", "%", "BLS via FRED (UNRATE)", 100, lambda: fred_last("UNRATE")),
    "us_10y": ("Rendement du Treasury américain à 10 ans", "%", "Réserve fédérale via FRED (DGS10)", 7,
        lambda: fred_last("DGS10")),
    "eurusd": ("EUR/USD (taux de référence BCE)", "", "BCE (taux de référence)", 7,
        lambda: ecb_last("EXR/D.USD.EUR.SP00.A")),
    "brent": ("Brent", "$/baril", "EIA via FRED (DCOILBRENTEU)", 7,
        lambda: first_ok(lambda: fred_last("DCOILBRENTEU"), lambda: yahoo_last("BZ=F"))),
    "wti": ("WTI", "$/baril", "EIA via FRED (DCOILWTICO)", 7,
        lambda: first_ok(lambda: fred_last("DCOILWTICO"), lambda: yahoo_last("CL=F"))),
    "gold": ("Or (once troy, contrat à terme)", "$/once", "Yahoo Finance (GC=F)", 7, lambda: yahoo_last("GC=F")),
}


def main():
    try:
        with open(OUT, encoding="utf-8") as f:
            data = json.load(f)
        old = data.get("indicators", {}) or {}
    except Exception:  # noqa: BLE001
        old = {}

    ok = 0
    indicators = dict(old)
    for key, (label, unit, source, max_age, fn) in INDICATORS.items():
        try:
            ref, val = fn()
            if not (val == val) or abs(val) > 1e7:
                raise ValueError("valeur absurde")
            indicators[key] = {"label": label, "value": val, "unit": unit, "ref_date": ref[:10],
                               "source": source, "max_age_days": max_age}
            ok += 1
            print("OK ", key, val, ref)
        except Exception as e:  # noqa: BLE001
            print("KO ", key, e)

    if ok == 0:
        print("Aucune donnée récupérée : fichier existant conservé.")
        sys.exit(1)

    out = {"updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
           "indicators": indicators}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{ok}/{len(INDICATORS)} indicateurs mis à jour")


if __name__ == "__main__":
    main()
    