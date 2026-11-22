"""
Robot quotidien : met à jour public/data/macro.json (taux directeurs, inflation, change, pétrole, or).
Sources publiques et gratuites :
  - BCE (data-api.ecb.europa.eu)  : taux de dépôt, EUR/USD (taux de référence), inflation IPCH
  - FRED (fred.stlouisfed.org, fichiers CSV publics, sans clé) : Fed funds (borne haute), IPC américain,
    chômage américain, Treasury 10 ans, Brent et WTI (données EIA)
  - Yahoo Finance (yfinance) : or (contrat à terme, séance de cotation observée)
Règle : un indicateur qui ne peut pas être mis à jour garde sa valeur précédente et SA DATE ANCIENNE.
Le site désactive tout seul les questions dont la donnée dépasse max_age_days.
"""
import csv, io, json, math, os, sys, datetime, urllib.request
from dataclasses import dataclass

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data", "macro.json")
UA = {"User-Agent": "Mozilla/5.0 (global-macro-quiz robot)"}

@dataclass(frozen=True)
class Observation:
    date: str
    value: float
    source: str
    status: str | None = None


def http_get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8")


# ---------- BCE ----------
def ecb_last(path):
    """Dernière observation d'une série BCE."""
    txt = http_get(f"https://data-api.ecb.europa.eu/service/data/{path}?lastNObservations=1&format=csvdata")
    rows = list(csv.DictReader(io.StringIO(txt)))
    if not rows:
        raise ValueError("série BCE vide")
    row = rows[-1]
    return Observation(norm_date(row["TIME_PERIOD"]), float(row["OBS_VALUE"]), f"BCE ({path})", row.get("OBS_STATUS"))


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
    rows = fred_rows("CPIAUCNS")
    table = dict(rows)
    for d, v in reversed(rows):
        base = table.get(f"{int(d[:4]) - 1}{d[4:]}")
        if base:
            return Observation(d, round((v / base - 1) * 100, 1), "BLS via FRED (CPIAUCNS, non désaisonnalisé)")
    raise ValueError("IPC il y a 12 mois introuvable")


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
                       f"Eurostat (prc_hicp_manr, {geo})", d.get("status", {}).get(str(best)))


def eurostat_v2(geo="EA", dataset="prc_hicp_minr"):
    """Nouvelle base IPCH d'Eurostat (ECOICOP v2, depuis 2026). On lit toutes les catégories et on garde l'indice d'ensemble."""
    url = (f"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{dataset}"
           f"?format=JSON&lang=EN&unit=RCH_A&geo={geo}&sinceTimePeriod=2026-01")
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
            best = (codes["time"], float(val), d.get("status", {}).get(key))
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


# clé : (libellé, unité, fréquence, max_age_days, fonction de récupération)
INDICATORS = {
    "ecb_deposit_rate": ("Taux de la facilité de dépôt de la BCE", "%", "daily", 120,
        lambda: first_ok(lambda: ecb_last("FM/D.U2.EUR.4F.KR.DFR.LEV"), lambda: ecb_last("FM/B.U2.EUR.4F.KR.DFR.LEV"))),
    "fed_target_upper": ("Fed funds : borne haute de la fourchette cible", "%", "daily", 120,
        lambda: fred_last("DFEDTARU", "Réserve fédérale")),
    "us_cpi_yoy": ("Inflation IPC-U américaine sur 12 mois, non désaisonnalisée", "%", "monthly", 100, fred_cpi_yoy),
    "ez_hicp_yoy": ("Inflation IPCH de la zone euro sur 12 mois", "%", "monthly", 100,
        lambda: freshest(eurostat_v2, lambda: eurostat_v2("EA21"),
                         lambda: ecb_last("HICP/M.U2.N.000000.4.ANR"), lambda: ecb_last("HICP/M.U2.N.TOTAL.4.ANR"),
                         eurostat_json, lambda: ecb_last("ICP/M.U2.N.000000.4.ANR"))),
    "us_unrate": ("Taux de chômage américain", "%", "monthly", 100, lambda: fred_last("UNRATE", "BLS")),
    "us_10y": ("Rendement du Treasury américain à 10 ans", "%", "daily", 7,
        lambda: fred_last("DGS10", "Réserve fédérale")),
    "eurusd": ("EUR/USD (taux de référence BCE)", "", "daily", 7,
        lambda: ecb_last("EXR/D.USD.EUR.SP00.A")),
    "brent": ("Brent, prix au comptant", "$/baril", "daily", 7,
        lambda: fred_last("DCOILBRENTEU", "EIA")),
    "wti": ("WTI, prix au comptant", "$/baril", "daily", 7,
        lambda: fred_last("DCOILWTICO", "EIA")),
    "gold": ("Or (once troy, contrat à terme)", "$/once", "daily", 7, lambda: yahoo_last("GC=F")),
}


def main():
    try:
        with open(OUT, encoding="utf-8") as f:
            data = json.load(f)
        old = data.get("indicators", {}) or {}
    except Exception:  # noqa: BLE001
        old = {}

    now = datetime.datetime.now(datetime.timezone.utc)
    collected_at = now.isoformat(timespec="seconds")
    failed = []
    indicators = dict(old)
    for key, (label, unit, frequency, max_age, fn) in INDICATORS.items():
        try:
            quote = fn()
            if not math.isfinite(quote.value) or abs(quote.value) > 1e7 or datetime.date.fromisoformat(quote.date) > now.date():
                raise ValueError("observation invalide")
            if old.get(key, {}).get("ref_date", "") > quote.date and old[key].get("retrieved_at"):
                raise ValueError("observation antérieure à celle conservée")
            indicators[key] = {"label": label, "value": quote.value, "unit": unit, "ref_date": quote.date,
                               "source": quote.source, "max_age_days": max_age, "frequency": frequency,
                               "retrieved_at": collected_at, "status": quote.status}
            print("OK ", key, quote.value, quote.date)
        except Exception as e:  # noqa: BLE001
            failed.append(key)
            print("KO ", key, e)

    if len(failed) == len(INDICATORS):
        print("Aucune donnée récupérée : fichier existant conservé.")
        sys.exit(1)

    out = {"updated_at": collected_at, "failed": failed, "indicators": indicators}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{len(INDICATORS) - len(failed)}/{len(INDICATORS)} indicateurs récupérés")
    if failed:
        print("::warning::Séries sans nouvelle récupération : " + ", ".join(failed))


if __name__ == "__main__":
    main()
