import datetime as dt
import unittest
from urllib.error import HTTPError
from unittest.mock import patch

from scripts import policy_decisions, update_macro, update_production


class StudyPublicationsTests(unittest.TestCase):
    def test_period_end_does_not_remove_latest_available_inflation(self):
        today = dt.date(2026, 11, 23)
        self.assertEqual(update_macro.observation_age("2026-09-01", today, "monthly"), 54)
        self.assertEqual(update_macro.observation_age("2026-09-01", today, "daily"), 83)
        self.assertEqual(update_macro.observation_age("2026-12-01", today, "monthly"), -1)

    def test_annual_table_prefers_coverage_and_keeps_comparable_previous_leader(self):
        prior = {"A": 11, "B": 9, "C": 8, "D": 7, "E": 6}
        new = {"A": 11, "B": 12, "C": 8, "D": 7, "E": 6}
        table = update_production.rank({2023: prior, 2024: new, 2025: {"A": 50}}, "Source",
                                       "https://example.org", dt.date(2026, 1, 1))
        self.assertEqual(table["year"], 2024)
        self.assertEqual(table["rows"][0], {"name": "B", "value": 12})
        self.assertEqual(table["previous"], {"year": 2023, "leader": "A"})

    def test_opec_table_excludes_aggregates_and_uses_right_year(self):
        title = update_production.OIL_TITLES["oil_reserves"]
        pdf_text = f"""{title}      (mb)
              2021     2022     2023     2024     2025      Change25/24
        Middle East     30     30     30     36     36     0
        Canada1         15     15     15     2,000  1,700  –300
        France         10     10     10     400    2,100  1,700
        World        1,001  1,001  1,001  1,001  1,001  0
        Footnote     1        1        1        1    1     1
        """
        values = update_production.oil_rows(pdf_text, title, 2026, 1000)
        self.assertEqual(values, {2024: {"Canada": 2, "France": .4},
                                  2025: {"Canada": 1.7, "France": 2.1}})

    def test_unchanged_on_a_holiday_updates_control_preserves_period(self):
        now = dt.datetime(2026, 11, 11, 10, tzinfo=dt.timezone.utc)
        old = {"year": 2025, "rows": [{"name": "A", "value": 9}],
               "retrieved_at": "2026-11-10T10:00:00+00:00"}
        url = "https://example.org/data"
        previous = {"tables": {"a": old}, "providers": {"official": {"url": url, "etag": '"abcd"'}}}
        with (patch.dict(update_production.SOURCES, {"official": (lambda: url, ("a",), None)}, clear=True),
              patch.object(update_production, "urlopen", side_effect=HTTPError(url, 304, "", {}, None)) as fetch):
            result = update_production.refresh(previous, now)
        self.assertEqual(fetch.call_args.args[0].get_header("If-none-match"), '"abcd"')
        self.assertTrue(result["checks"]["a"]["ok"])
        self.assertEqual(result["tables"]["a"]["year"], old["year"])
        self.assertEqual(result["tables"]["a"]["retrieved_at"], now.isoformat())

    def test_revision_is_loaded_and_failed_check_keeps_last_success(self):
        now = dt.datetime(2026, 11, 11, 10, tzinfo=dt.timezone.utc)
        prior = {"year": 2025, "rows": [{"name": "A", "value": 9}],
                 "retrieved_at": "2026-11-10T10:00:00+00:00"}
        previous = {"tables": {"revised": prior, "unavailable": prior}}
        revision = {**prior, "rows": [{"name": "A", "value": 8}]}
        with (patch.dict(update_production.SOURCES, {
            "official": (None, ("revised", "unavailable"), None),
        }, clear=True), patch.object(update_production, "collect_source", return_value=({"revised": revision}, {}))):
            result = update_production.refresh(previous, now)
        self.assertEqual(result["failed"], ["unavailable"])
        self.assertEqual(result["tables"]["unavailable"], prior)
        self.assertEqual(result["tables"]["revised"]["rows"], revision["rows"])
        self.assertEqual(result["tables"]["revised"]["retrieved_at"], now.isoformat())

    def test_policy_movements_and_irregular_pdf_spacing(self):
        self.assertEqual(policy_decisions.japanese_target(
            "will encourage the uncollateralized overnight call rate to remain at around\n 1.25 percent."), 1.25)
        self.assertEqual(policy_decisions.movement(
            "The committee voted by a majority of 6–3 to increase Bank Rate by 0.25 percentage points.",
            r"voted(?: by [^.]{1,60}?)? to (?P<move>increase|maintain) Bank Rate"), "up")
        with self.assertRaises(ValueError):
            policy_decisions.japanese_target("A rise in the inflation projection to 2.1 percent.")


if __name__ == "__main__":
    unittest.main()
