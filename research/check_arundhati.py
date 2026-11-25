"""Compare one pair of modern mean upper transits with a pinned ERFA reference."""

import argparse
import json
from dataclasses import dataclass
from math import atan2, cos, degrees, pi, radians, sin, tau
from pathlib import Path

import erfa


FIXTURE = Path(__file__).with_name("fixtures") / "arundhati-modern.json"
J2000 = 2451545.0
DAYS_PER_JULIAN_YEAR = 365.25
SECONDS_PER_DAY = 86400.0
MAS_TO_RAD = radians(1 / 3_600_000)
STARS = ("alcor", "mizar")


@dataclass(frozen=True)
class Star:
    ra_deg: float
    dec_deg: float
    pm_ra_cosdec_mas_per_year: float
    pm_dec_mas_per_year: float
    parallax_mas: float


@dataclass(frozen=True)
class Case:
    date_ut1: str
    midnight_jd_ut1: float
    tt_minus_ut1_seconds: float
    east_longitude_deg: float
    transit_bracket_ut1_seconds: list[float]

    @property
    def tt_fraction(self) -> float:
        return self.tt_minus_ut1_seconds / SECONDS_PER_DAY


def signed_angle(angle: float) -> float:
    """Return a signed angular difference across the right ascension wrap."""
    return atan2(sin(angle), cos(angle))


def load_fixture() -> dict:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def candidate_transit(star: Star, catalogue_epoch: float, case: Case) -> tuple[float, float]:
    # Advance the unit vector in the ICRS tangent plane. The catalogue RA
    # proper motion already includes cos(dec), so it multiplies a unit vector.
    ra, dec = radians(star.ra_deg), radians(star.dec_deg)
    unit = (cos(dec) * cos(ra), cos(dec) * sin(ra), sin(dec))
    east = (-sin(ra), cos(ra), 0.0)
    north = (-sin(dec) * cos(ra), -sin(dec) * sin(ra), cos(dec))
    years = (case.midnight_jd_ut1 - J2000 + case.tt_fraction) / DAYS_PER_JULIAN_YEAR
    elapsed_years = 2000.0 + years - catalogue_epoch
    direction = tuple(
        coordinate + elapsed_years * MAS_TO_RAD * (
            star.pm_ra_cosdec_mas_per_year * east_axis + star.pm_dec_mas_per_year * north_axis
        )
        for coordinate, east_axis, north_axis in zip(unit, east, north)
    )

    # Vondrák–Capitaine–Wallace long-term precession with frame bias.
    x, y, _ = erfa.ltpb(2000.0 + years) @ direction
    mean_ra = atan2(y, x) % tau

    # USNO Circular 179 approximation for GMST at midnight (hours).
    days_ut1 = case.midnight_jd_ut1 - J2000
    tt_centuries = years / 100
    gmst_hours = (
        6.697375 + 0.065707485828 * days_ut1
        + 0.0854103 * tt_centuries + 0.0000258 * tt_centuries**2
    )
    local_sidereal = radians(15 * gmst_hours + case.east_longitude_deg)
    sidereal_turn = (mean_ra - local_sidereal) % tau
    transit_seconds = sidereal_turn / tau * SECONDS_PER_DAY / 1.0027379
    return mean_ra, transit_seconds


def reference_transit(star: Star, catalogue_epoch: float, case: Case) -> tuple[float, float]:
    """Use SOFA-derived IAU 2006 precession/GMST and ERFA space motion."""
    start1, start2 = erfa.epj2jd(catalogue_epoch)
    catalogue_ra, catalogue_dec = radians(star.ra_deg), radians(star.dec_deg)
    ra, dec, *_ = erfa.pmsafe(
        catalogue_ra, catalogue_dec,
        star.pm_ra_cosdec_mas_per_year * MAS_TO_RAD / cos(catalogue_dec),
        star.pm_dec_mas_per_year * MAS_TO_RAD,
        star.parallax_mas / 1000, 0.0,
        start1, start2, case.midnight_jd_ut1, case.tt_fraction,
    )
    mean_vector = erfa.pmat06(case.midnight_jd_ut1, case.tt_fraction) @ erfa.s2c(ra, dec)
    mean_ra = float(erfa.c2s(mean_vector)[0]) % tau

    def hour_angle(seconds: float) -> float:
        fraction = seconds / SECONDS_PER_DAY
        gmst = erfa.gmst06(
            case.midnight_jd_ut1, fraction,
            case.midnight_jd_ut1, fraction + case.tt_fraction,
        )
        return signed_angle(gmst + radians(case.east_longitude_deg) - mean_ra)

    low, high = case.transit_bracket_ut1_seconds
    if (high - low) >= 0.5 * SECONDS_PER_DAY or not (
        -pi / 2 < hour_angle(low) < 0 < hour_angle(high) < pi / 2
    ):
        raise ValueError("Reference bracket does not isolate an upper transit")
    while high - low > 0.000001:
        middle = (low + high) / 2
        if hour_angle(middle) < 0:
            low = middle
        else:
            high = middle
    return mean_ra, (low + high) / 2


def measure(fixture: dict, *, reference: bool = False) -> dict:
    case = Case(**fixture["case"])
    catalogue_epoch = fixture["catalogue"]["epoch_julian_year"]
    transit = reference_transit if reference else candidate_transit
    measurements = {}
    for name in STARS:
        star = Star(**fixture["stars"][name]["astrometry"])
        mean_ra, seconds = transit(star, catalogue_epoch, case)
        if not case.transit_bracket_ut1_seconds[0] < seconds < case.transit_bracket_ut1_seconds[1]:
            raise ValueError(f"{name} transit fell outside the benchmark bracket")
        measurements[name] = {"mean_ra_deg": degrees(mean_ra), "transit_ut1_seconds": seconds}

    difference = measurements["alcor"]["transit_ut1_seconds"] - measurements["mizar"]["transit_ut1_seconds"]
    first = "alcor" if difference < 0 else "mizar" if difference > 0 else "tie"
    return {
        "stars": measurements,
        "first": first,
        "alcor_minus_mizar_ut1_seconds": difference,
    }


def check_against_reference(fixture: dict, observed: dict) -> None:
    expected = fixture["reference"]["expected"]
    tolerances = fixture["tolerances"]
    if observed["first"] != expected["first"]:
        raise ValueError("Modern upper transit order disagrees with the reference")
    for name in STARS:
        got, want = observed["stars"][name], expected["stars"][name]
        ra_error = abs(degrees(signed_angle(radians(got["mean_ra_deg"] - want["mean_ra_deg"])))) * 3600
        if ra_error > tolerances["mean_ra_arcseconds"]:
            raise ValueError(f"{name} mean RA differs by {ra_error:.6f} arcseconds")
        time_error = abs(got["transit_ut1_seconds"] - want["transit_ut1_seconds"])
        if time_error > tolerances["transit_ut1_seconds"]:
            raise ValueError(f"{name} transit differs by {time_error:.6f} UT1 seconds")
    difference_key = "alcor_minus_mizar_ut1_seconds"
    difference_error = abs(observed[difference_key] - expected[difference_key])
    if difference_error > tolerances["separation_ut1_seconds"]:
        raise ValueError(f"Transit separation differs by {difference_error:.6f} UT1 seconds")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", action="store_true", help="Recompute the IAU 2006 reference values")
    args = parser.parse_args()
    fixture = load_fixture()
    result = measure(fixture, reference=args.reference)
    print(json.dumps(result, indent=2))
    if not args.reference:
        check_against_reference(fixture, result)
        print("PASS: modern mean upper transits match the pinned reference within tolerance.")


if __name__ == "__main__":
    main()
