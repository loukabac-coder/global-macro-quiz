import datetime
import json
from pathlib import Path
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from scripts import update_macro


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


if __name__ == "__main__":
    unittest.main()
