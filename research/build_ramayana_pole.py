"""Sample Vega's angular distance from the mean pole under one declared model."""

import argparse
import json
from math import atan2, cos, degrees, hypot, radians
from pathlib import Path

import erfa

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT.parent / "content/ramayana-pole.json"
EPOCHS = (-14000, -13000, -12500, -12208, -12000, -11000, -10000, -9000, -8000, 0, 2000, 2025)


def offset(rotation, direction):
    x, y, z = rotation @ direction
    return degrees(atan2(hypot(x, y), z))


def build():
    catalogue = json.loads((ROOT / "fixtures/mahabharata-modern-stars.json").read_bytes())
    _, hip, ra, dec, parallax, pm_ra, pm_dec = next(row for row in catalogue["rows"] if row[0] == "Vega")
    ra, dec = radians(ra), radians(dec)
    origin = erfa.epj2jd(catalogue["epoch_julian_year"])
    pm_ra, pm_dec = radians(pm_ra / 3_600_000) / cos(dec), radians(pm_dec / 3_600_000)
    samples = []
    for epoch in EPOCHS:
        jd = erfa.epj2jd(epoch)
        new_ra, new_dec, *_ = erfa.pmsafe(ra, dec, pm_ra, pm_dec, parallax / 1000, 0, *origin, *jd)
        direction = erfa.s2c(new_ra, new_dec)
        samples.append({"epoch": epoch, "offsetDegrees": round(offset(erfa.ltpb(epoch), direction), 6)})
    reference = offset(erfa.pmat06(*jd), direction)
    tolerance = 0.001
    assert abs(reference - samples[-1]["offsetDegrees"]) <= tolerance, "modern pole comparison failed"
    return {
        "catalogue": catalogue["url"], "hip": hip, "catalogueFrame": catalogue["frame"],
        "catalogueEpoch": catalogue["epoch_julian_year"], "radialVelocityKmPerSecond": 0,
        "model": "ERFA 2.0.1 ltpb and pmsafe, PyERFA 2.0.1.5",
        "modelSource": "https://doi.org/10.1051/0004-6361/201117274",
        "frame": "Mean north equatorial pole of date, derived from ICRS directions",
        "scale": "Julian epochs in TT using astronomical year numbering",
        "review": "prereview",
        "modernReference": {"model": "ERFA pmat06 (IAU 2006)", "epoch": EPOCHS[-1],
                            "expectedDegrees": round(reference, 6), "toleranceDegrees": tolerance},
        "samples": samples,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    data = build()
    if args.check:
        if data != json.loads(OUTPUT.read_bytes()):
            raise SystemExit("The pole dataset differs from its locked calculation")
    else:
        OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print("Verified 12 Vega pole samples; modern IAU 2006 comparison within 0.001 degree")
