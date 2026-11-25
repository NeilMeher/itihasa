import unittest
from math import degrees, radians

import erfa

from check_arundhati import STARS, check_against_reference, load_fixture, measure, signed_angle
from run_arundhati_history import proleptic_julian_midnight


class ModernArundhatiTests(unittest.TestCase):
    def test_modern_transits_agree_with_reference(self) -> None:
        fixture = load_fixture()
        observed = measure(fixture)
        check_against_reference(fixture, observed)
        self.assertEqual(observed["first"], "mizar")
        self.assertGreater(observed["alcor_minus_mizar_ut1_seconds"], 0)

    def test_pinned_reference_is_reproducible(self) -> None:
        fixture = load_fixture()
        reference = fixture["reference"]
        self.assertEqual(erfa.__version__, reference["pyerfa"])
        self.assertEqual(erfa.version.erfa_version, reference["erfa"])
        self.assertEqual(erfa.version.sofa_version, reference["sofa"])
        observed = measure(fixture, reference=True)
        expected = reference["expected"]
        self.assertEqual(observed["first"], expected["first"])
        for name in STARS:
            got, want = observed["stars"][name], expected["stars"][name]
            self.assertAlmostEqual(got["mean_ra_deg"], want["mean_ra_deg"], places=9)
            self.assertAlmostEqual(got["transit_ut1_seconds"], want["transit_ut1_seconds"], delta=2e-6)

    def test_right_ascension_difference_wraps_across_zero(self) -> None:
        self.assertAlmostEqual(degrees(signed_angle(radians(359.9 - 0.1))), -0.2)
        self.assertAlmostEqual(degrees(signed_angle(radians(0.1 - 359.9))), 0.2)

    def test_normalized_julian_date_label(self) -> None:
        self.assertEqual(proleptic_julian_midnight(2000, 1, 1), sum(erfa.cal2jd(2000, 1, 14)))
        self.assertEqual(proleptic_julian_midnight(0, 3, 1) - proleptic_julian_midnight(0, 2, 28), 2)
