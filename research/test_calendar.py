import json
import unittest
from datetime import datetime, timedelta
from fractions import Fraction
from pathlib import Path

from calendar_engine import InputError, at, birth_sky, calendar, sector, signs


class CalendarTests(unittest.TestCase):
    def test_reference_cases(self):
        path = Path(__file__).with_name("fixtures") / "calendar-benchmarks.json"
        fixture = json.loads(path.read_text(encoding="utf-8"))
        for case in fixture["cases"]:
            with self.subTest(case=case["date"]):
                got = calendar({"city": "delhi", "date": case["date"]})
                for key in ("sunrise", "sunset"):
                    if key in case:
                        delta = datetime.fromisoformat(got[key]) - datetime.fromisoformat(case[key])
                        self.assertLessEqual(abs(delta.total_seconds()), fixture["sunrise_tolerance_seconds"])
                self.assertEqual(got["month"], case["month"])
                limbs = {limb["label"]: limb for limb in got["limbs"]}
                for name, (expected, boundary) in case["limbs"].items():
                    self.assertEqual(limbs[name]["value"], expected)
                    delta = datetime.fromisoformat(limbs[name]["until"]) - datetime.fromisoformat(boundary)
                    self.assertLessEqual(abs(delta.total_seconds()), fixture["boundary_tolerance_seconds"])

    def test_tithi_changes_across_returned_boundary(self):
        got = calendar({"city": "delhi", "date": "2025-01-01"})
        boundary = datetime.fromisoformat(got["limbs"][1]["until"])
        before = signs(at(boundary - timedelta(seconds=2)))[2]
        after = signs(at(boundary + timedelta(seconds=2)))[2]
        self.assertEqual((sector(before, 30), sector(after, 30)), (1, 2))

    def test_tithi_in_effect_just_before_a_sunrise_near_boundary(self):
        got = calendar({"city": "delhi", "date": "2025-01-19"})
        sunrise = datetime.fromisoformat(got["sunrise"])
        boundary = datetime.fromisoformat(got["limbs"][1]["until"])
        self.assertLess(0, (boundary - sunrise).total_seconds())
        self.assertLess((boundary - sunrise).total_seconds(), 20 * 60)
        self.assertEqual(sector(signs(at(sunrise))[2], 30), 19)
        self.assertEqual(sector(signs(at(boundary + timedelta(seconds=2)))[2], 30), 20)

    def test_waning_month_conventions(self):
        got = calendar({"city": "delhi", "date": "2025-08-16"})
        self.assertEqual(got["month"], {"amanta": "Śrāvaṇa", "purnimanta": "Bhādrapada"})

    def test_birth_instant_and_civil_day(self):
        request = {"city": "delhi", "date": "2025-01-01"}
        instant = birth_sky({**request, "time": "08:00"})
        self.assertEqual((instant["rashi"], instant["nakshatra"], instant["lagna"]),
                         ("Makara", "Uttara Āṣāḍhā", "Dhanu"))
        day = birth_sky(request)
        self.assertEqual(day["kind"], "civil-day")
        self.assertNotIn("lagna", day)
        self.assertEqual([span["value"] for span in day["nakshatra"]],
                         ["Pūrva Āṣāḍhā", "Uttara Āṣāḍhā", "Śravaṇa"])
        for previous, following in zip(day["nakshatra"], day["nakshatra"][1:]):
            self.assertEqual(previous["end"], following["start"])
        self.assertIn("2025-01-02T00:00:00", day["nakshatra"][-1]["end"])

    def test_missing_invalid_and_unsupported_inputs(self):
        for request in ({}, {"city": "unknown", "date": "2025-01-01"},
                        {"city": "pune", "date": "2023-01-01"},
                        {"city": "pune", "date": "2025-02-30"},
                        {"city": "pune", "date": "2025-01-01", "time": "25:00"},
                        {"city": "pune", "date": "2025-01-01", "time": "08:00Z"}):
            with self.subTest(request=request), self.assertRaises(InputError):
                birth_sky(request)

    def test_mean_sun_matches_burgess_worked_proportion(self):
        path = Path(__file__).resolve().parent.parent / "content/conventions.json"
        constants = json.loads(path.read_text(encoding="utf-8"))["lessons"]["mean-sun"]
        computed = Fraction(constants["revolutions"] * 360 * 3600, constants["civil_days"])
        printed = 59 * 60 + 8 + Fraction(10, 60)
        self.assertLess(abs(computed - printed), Fraction(1, 120))
