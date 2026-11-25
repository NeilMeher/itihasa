"""Run or verify the prereview Arundhatī mean-transit search."""

import argparse
import gzip
import hashlib
import io
import json
from dataclasses import dataclass, replace
from math import cos, radians, sin
from pathlib import Path

import erfa
import numpy as np

from check_arundhati import DAYS_PER_JULIAN_YEAR, FIXTURE, J2000, MAS_TO_RAD, Star, load_fixture


HERE = Path(__file__).resolve().parent
INPUT = HERE / "fixtures/arundhati-historical.json"
DEFAULT_OUTPUT = HERE / "runs/arundhati-prereview-v1"


@dataclass(frozen=True)
class Scenario:
    id: str
    epoch: float
    alcor: Star
    mizar: Star
    velocities: tuple[float, float] = (0.0, 0.0)
    pole_shift_arcsec: float = 0.0


def scenarios(inputs: dict) -> list[Scenario]:
    modern = load_fixture()
    epoch = modern["catalogue"]["epoch_julian_year"]
    alcor, mizar = (Star(**modern["stars"][star]["astrometry"]) for star in ("alcor", "mizar"))
    original = inputs["original_hipparcos"]
    nominal = Scenario("hip2-zero-rv", epoch, alcor, mizar)
    return [
        nominal,
        Scenario("hip-original", original["epoch_julian_year"], Star(**original["alcor"]), Star(**original["mizar"])),
        replace(nominal, id="perspective-stress", velocities=(-20.0, 20.0)),
        replace(nominal, id="perspective-stress-opposite", velocities=(20.0, -20.0)),
        replace(nominal, id="pole-tilt-plus", pole_shift_arcsec=5.0),
        replace(nominal, id="pole-tilt-minus", pole_shift_arcsec=-5.0),
    ]


def evaluate(epochs, scenario: Scenario, pole_limit: float, *, modern_control: bool = False):
    time_offset = (np.asarray(epochs) - 2000.0) * DAYS_PER_JULIAN_YEAR
    precession = erfa.pmat06(J2000, time_offset) if modern_control else erfa.ltpb(epochs)
    start1, start2 = erfa.epj2jd(scenario.epoch)
    directions = []
    for star, velocity in zip((scenario.alcor, scenario.mizar), scenario.velocities):
        latitude = radians(star.dec_deg)
        ra, dec, *_ = erfa.pmsafe(
            radians(star.ra_deg), latitude, star.pm_ra_cosdec_mas_per_year * MAS_TO_RAD / cos(latitude),
            star.pm_dec_mas_per_year * MAS_TO_RAD, star.parallax_mas / 1000, velocity,
            start1, start2, J2000, time_offset,
        )
        position = np.einsum("...ij,...j->...i", precession, erfa.s2c(ra, dec))
        if scenario.pole_shift_arcsec:
            angle = radians(scenario.pole_shift_arcsec / 3600)
            x, y, z = np.moveaxis(position, -1, 0)
            position = np.stack((x * cos(angle) + z * sin(angle), y, -x * sin(angle) + z * cos(angle)), axis=-1)
        directions.append(erfa.c2s(position))
    difference = directions[0][0] - directions[1][0]
    delta = np.arctan2(np.sin(difference), np.cos(difference))
    invalid = (
        (np.abs(directions[0][1]) >= np.pi / 2 - pole_limit)
        | (np.abs(directions[1][1]) >= np.pi / 2 - pole_limit)
        | (np.abs(delta) >= np.pi / 2)
    )
    return np.where(invalid, np.nan, np.degrees(delta) * 3600)


def refine_brackets(epochs, values, scenario, pole_limit, resolution):
    brackets = []
    finite = np.isfinite(values[:-1]) & np.isfinite(values[1:])
    for index in np.flatnonzero(finite & (np.signbit(values[:-1]) != np.signbit(values[1:]))):
        low, high = float(epochs[index]), float(epochs[index + 1])
        left_negative = values[index] < 0
        while high - low > resolution:
            mid = (low + high) / 2
            model = float(evaluate(mid, scenario, pole_limit))
            if not np.isfinite(model):
                break
            if (model < 0) == left_negative:
                low = mid
            else:
                high = mid
        brackets.append({"start": round(low, 8), "end": round(high, 8), "resolved_numeric": high - low <= resolution})
    return brackets


def intervals(epochs, labels):
    first = 0
    for index in range(1, len(epochs) + 1):
        if index == len(epochs) or labels[index] != labels[first]:
            yield {"label": str(labels[first]), "first_sample": float(epochs[first]), "last_sample": float(epochs[index - 1])}
            first = index


def digest(data):
    return hashlib.sha256(data).hexdigest()


def text_digest(path):
    return digest(path.read_text(encoding="utf-8").encode("utf-8"))


def proleptic_julian_midnight(year, month, day):
    """Date-only JD for the proleptic Julian calendar, with astronomical years."""
    jan_or_feb = (14 - month) // 12
    march_year = year + 4800 - jan_or_feb
    march_month = month + 12 * jan_or_feb - 3
    return day + (153 * march_month + 2) // 5 + 365 * march_year + march_year // 4 - 32083.5


def same_samples(recorded, calculated):
    if recorded == calculated:
        return True
    # Allow tiny cross-platform rounding differences in the last CSV digit.
    old, new = (
        np.genfromtxt(io.BytesIO(payload), delimiter=",", names=True, dtype=None, encoding="utf-8")
        for payload in (recorded, calculated)
    )
    if old.dtype.names != new.dtype.names or old.shape != new.shape:
        return False
    return all(
        np.array_equal(old[column], new[column]) if column in ("julian_epoch_tt", "state")
        else np.allclose(old[column], new[column], atol=1.1e-6, rtol=0, equal_nan=True)
        for column in old.dtype.names
    )


def model() -> tuple[dict, bytes]:
    inputs = json.loads(INPUT.read_text(encoding="utf-8"))
    window = inputs["window"]
    start, stop = window["start_julian_epoch_tt"], window["end_julian_epoch_tt"]
    step, resolution = window["refinement_step_year"], window["boundary_bracket_year"]
    epochs = np.arange(start, stop + step / 2, step)
    coarse_epochs = np.arange(start, stop + window["step_year"] / 2, window["step_year"])
    limits = inputs["limits"]
    pole_limit = radians(limits["near_pole_deg"])
    choices = scenarios(inputs)
    values = np.array([evaluate(epochs, choice, pole_limit) for choice in choices])
    fine = [refine_brackets(epochs, lane, choice, pole_limit, resolution) for lane, choice in zip(values, choices)]
    coarse = [
        refine_brackets(coarse_epochs, evaluate(coarse_epochs, choice, pole_limit), choice, pole_limit, resolution)
        for choice in choices
    ]
    margin = limits["order_margin_arcsec"]
    labels = np.full(len(epochs), "unresolved", dtype="<U12")
    labels[np.all(values < -margin, axis=0)] = "alcor-first"
    labels[np.all(values > margin, axis=0)] = "mizar-first"
    nominal_slope = np.diff(values[0])
    extrema = np.count_nonzero(
        np.isfinite(nominal_slope[:-1]) & np.isfinite(nominal_slope[1:])
        & (np.signbit(nominal_slope[:-1]) != np.signbit(nominal_slope[1:]))
    )
    control_epochs = np.arange(1800.0, 2026.0)
    control = evaluate(control_epochs, choices[0], pole_limit, modern_control=True)
    long_term = evaluate(control_epochs, choices[0], pole_limit)
    summary = {
        "run_id": "arundhati-prereview-v1",
        "status": "under_review",
        "window": window,
        "frame": "ICRS propagated to mean equator/equinox of date, upper transit on same sidereal turn",
        "precession": "Vondrak-Capitaine-Wallace 2011/2012 via ERFA ltpb",
        "proper_motion": "ERFA pmsafe rectilinear propagation; original HIP and stress alternatives",
        "versions": {"pyerfa": erfa.__version__, "erfa": erfa.version.erfa_version, "numpy": np.__version__},
        "limits": limits,
        "sample_count": len(epochs),
        "coarse_sample_count": len(coarse_epochs),
        "labeled_intervals": list(intervals(epochs, labels)),
        "nominal_extrema_screen_count": int(extrema),
        "modern_control": {"years": [1800, 2025], "max_delta_ra_difference_arcsec": round(float(np.max(np.abs(control - long_term))), 9)},
        "author_labels": inputs["author_labels"],
        "normalized_date_label": {
            "calendar": "proleptic Julian", "astronomical_year": -5560, "month": 10, "day": 16,
            "civil_midnight_jd": proleptic_julian_midnight(-5560, 10, 16),
            "time_scale": "unspecified by date-only label; this is a calendar boundary",
        },
        "scenarios": [
            {"id": choice.id, "epoch": choice.epoch, "radial_velocity_km_s": choice.velocities,
             "mean_pole_tilt_arcsec": choice.pole_shift_arcsec, "quarter_year_brackets": quick, "annual_brackets": annual,
             "masked_samples": int(np.sum(~np.isfinite(lane)))}
            for choice, lane, quick, annual in zip(choices, values, fine, coarse)
        ],
        "artifacts": {"input_sha256": text_digest(INPUT), "hip2_sha256": text_digest(FIXTURE),
                      "script_sha256": text_digest(Path(__file__))},
    }
    rows = [",".join(("julian_epoch_tt", "state", *(choice.id + "_delta_ra_arcsec" for choice in choices)))]
    for epoch, label, sample in zip(epochs, labels, values.T):
        rows.append(",".join((f"{epoch:.2f}", label, *(f"{value:.6f}" if np.isfinite(value) else "" for value in sample))))
    return summary, ("\n".join(rows) + "\n").encode("utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true", help="Compare a fresh run with the stored records")
    args = parser.parse_args()
    summary, raw = model()
    artifact = args.output / "samples.csv.gz"
    manifest = args.output / "manifest.json"
    summary["artifacts"]["samples_csv_sha256"] = digest(raw)
    if args.check:
        stored = json.loads(manifest.read_text(encoding="utf-8"))
        recorded = gzip.decompress(artifact.read_bytes())
        if digest(recorded) != stored["artifacts"]["samples_csv_sha256"] or not same_samples(recorded, raw):
            raise SystemExit("Research samples differ")
        summary["artifacts"]["samples_csv_sha256"] = digest(recorded)
        if stored != json.loads(json.dumps(summary)):
            raise SystemExit("Research manifest differs")
    else:
        args.output.mkdir(parents=True, exist_ok=True)
        artifact.write_bytes(gzip.compress(raw, mtime=0))
        manifest.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{summary['status']}: {summary['sample_count']} quarterly samples, {len(summary['scenarios'])} scenarios")


if __name__ == "__main__":
    main()
