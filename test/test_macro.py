import datetime
import json
from pathlib import Path
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from scripts import update_macro, update_news


class MacroTests(unittest.TestCase):
    def test_cpi_uses_unadjusted_index_and_skips_missing_base_month(self):
        rows = [("2025-09-01", 100), ("2026-09-01", 103.7), ("2026-10-01", 104)]
        with patch.object(update_macro, "fred_rows", return_value=rows) as source:
            quote = update_macro.fred_cpi_yoy()
        source.assert_called_once_with("CPIAUCNS")
        self.assertEqual(quote.date, "2026-09-01")
        self.assertEqual(quote.value, 3.7)

    def test_yahoo_uses_date_from_last_session(self):
        close = SimpleNamespace(
            empty=False, iloc=[3515.40], index=[datetime.datetime(2026, 11, 20)],
        )
        close.dropna = lambda: close
        ticker = SimpleNamespace(history=lambda **kwargs: {"Close": close})
        with patch.dict(sys.modules, {"yfinance": SimpleNamespace(Ticker=lambda code: ticker)}):
            quote = update_macro.yahoo_last("GC=F")
        self.assertEqual(quote.date, "2026-11-20")
        self.assertEqual(quote.value, 3515.40)

    def test_treasury_uses_latest_observation_with_a_ten_year_rate(self):
        xml = """<feed xmlns="http://www.w3.org/2005/Atom" xmlns:m="urn:meta" xmlns:d="urn:data">
          <entry><content><m:properties><d:NEW_DATE>2026-11-20T00:00:00</d:NEW_DATE>
          <d:BC_10YEAR>5.03</d:BC_10YEAR></m:properties></content></entry>
          <entry><content><m:properties><d:NEW_DATE>2026-11-21T00:00:00</d:NEW_DATE>
          <d:BC_10YEAR/></m:properties></content></entry>
          <entry><content><m:properties><d:NEW_DATE>2026-11-19T00:00:00</d:NEW_DATE>
          <d:BC_10YEAR>5.04</d:BC_10YEAR></m:properties></content></entry>
        </feed>"""
        with patch.object(update_macro, "http_get", return_value=xml):
            quote = update_macro.treasury_10y()
        self.assertEqual((quote.date, quote.value), ("2026-11-20", 5.03))

    def test_failed_refresh_keeps_previous_observation_and_timestamp(self):
        def unavailable():
            raise TimeoutError("provider unavailable")

        previous = {
            "updated_at": "2026-11-22T10:00:00Z",
            "indicators": {"eurusd": {"value": 1.099, "ref_date": "2026-11-20", "retrieved_at": "2026-11-22T10:00:00Z"}},
        }
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "macro.json"
            path.write_text(json.dumps(previous), encoding="utf-8")
            with patch.object(update_macro, "OUT", str(path)), patch.object(
                update_macro, "INDICATORS", {"eurusd": ("EUR/USD", "", "daily", 7, unavailable)}
            ), self.assertRaises(SystemExit) as exit_code:
                update_macro.main()
            recorded = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(exit_code.exception.code, 1)
        self.assertEqual(recorded["updated_at"], previous["updated_at"])
        self.assertEqual(recorded["indicators"], previous["indicators"])
        self.assertEqual(recorded["failed"], ["eurusd"])
        self.assertIn("checked_at", recorded)

    def test_currency_fallback_uses_ecb_cross_rate_and_date(self):
        with patch.dict(sys.modules, {"yfinance": SimpleNamespace(Ticker=None)}):
            from scripts import update_market_caps
        rates = ("2026-11-20", {"EUR": 1.0, "USD": 1.10, "GBP": 0.88})
        with patch.object(update_market_caps, "ecb_reference_rates", return_value=rates):
            result = update_market_caps.usd_rate("GBP", {}, datetime.date(2026, 11, 22))
        self.assertEqual(result, (1.25, "2026-11-20", "BCE"))

    def test_world_bank_picks_latest_published_gdp_in_billions(self):
        response = json.dumps([{}, [
            {"date": "2026", "value": None}, {"date": "2024", "value": 1_700_000_000_000},
            {"date": "2025", "value": 2_000_000_000_000},
        ]])
        with patch.object(update_macro, "http_get", return_value=response):
            quote = update_macro.world_bank_gdp("fra")
        self.assertEqual((quote.date, quote.value), ("2025-01-01", 2000))

    def test_exchange_fallback_keeps_the_same_fixing_and_date(self):
        with patch.object(update_macro, "ecb_last", side_effect=TimeoutError), patch.object(
            update_macro, "ecb_daily_exchange", return_value=("2026-11-20", {"JPY": 150})
        ):
            quote = update_macro.ecb_exchange("JPY")
        self.assertEqual((quote.date, quote.value), ("2026-11-20", 150))

    def test_council_feed_uses_official_day_and_preserves_publication(self):
        now = datetime.datetime(2026, 11, 23, 10, tzinfo=datetime.timezone.utc)
        xml = """<rss><channel>
        <item><title>Accord sur le méthane</title><description>Accord provisoire entre les deux institutions.</description>
        <link>https://www.consilium.europa.eu/fr/press/press-releases/2026/11/19/methane</link>
        <pubDate>Thu, 19 Nov 2026 09:05:00 GMT</pubDate></item>
        <item><title>Accord sur le méthane</title><description>Autre source.</description>
        <link>https://example.org/fr/press/press-releases/2026/11/19/a</link></item>
        </channel></rss>"""
        rows = update_news.parse_feed(xml, now, update_news.COUNCIL, r"^/fr/press/press-releases", "Consilium")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["date"], "2026-11-19")
        self.assertEqual(rows[0]["published_at"], "2026-11-19T09:05:00+00:00")
        self.assertEqual(rows[0]["retrieved_at"], "2026-11-23T10:00:00+00:00")

    def test_leader_parsers_read_current_offices_and_reject_missing_markers(self):
        data = {
            "fr": ("<a>Prénom Exemple <span>Mandat en cours</span></a>", "Prénom Exemple"),
            "uk": ("Current role holder: <a>The Rt Hon Given Example MP</a> <h2>Contents</h2>", "Given Example"),
            "de": ("The current Federal Government consists of Federal Chancellor Given Example and 17 Federal Ministers.", "Given Example"),
            "ca": ("<title>Given Example - Prime Minister of Canada | Prime Minister of Canada</title>", "Given Example"),
            "eu": ("<h1>Prénom Exemple</h1> Président du Conseil européen", "Prénom Exemple"),
        }
        for code, (html, name) in data.items():
            self.assertEqual(update_news.parse_leader(code, html), name)
            with self.assertRaises(ValueError):
                update_news.parse_leader(code, "<html>Page indisponible</html>")


if __name__ == "__main__":
    unittest.main()
