import datetime
import sys
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


if __name__ == "__main__":
    unittest.main()
