"""Build a bounded, modern teaching sky for the Mahabharata atlas.

Solar-system positions are topocentric from Astronomy Engine. Two named stars
use the existing Hipparcos fixture and the same ERFA conventions as the modern
transit check. The data are for teaching sky geometry, separate from epic dates.
"""

import argparse
import json
from datetime import UTC, datetime, timedelta
from math import atan2, cos, degrees, hypot, radians, tau
from pathlib import Path

import astronomy as astro
import erfa

ROOT = Path(__file__).resolve().parent.parent
FIXTURE = ROOT / "research/fixtures/arundhati-modern.json"
OUTPUT = ROOT / "content/mahabharata-sky.json"
DAYS = [(2025, 1, 1), (2025, 1, 7), (2025, 1, 13), (2025, 1, 20)]
SITES = [
    ("kurukshetra", "Kurukshetra district", 29.97, 76.79),
    ("indraprastha", "Delhi", 28.61, 77.24),
    ("dvaraka", "Dwarka", 22.24, 68.97),
]
BODIES = [
    astro.Body.Sun, astro.Body.Moon, astro.Body.Mercury, astro.Body.Venus,
    astro.Body.Mars, astro.Body.Jupiter, astro.Body.Saturn,
]
CODES = ("Alcor", "Mizar A")
STAR_CATALOGUE = "https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=I%2F311%2Fhip2"
ENGINE = "https://github.com/cosinekitty/astronomy"


def at_site(moment, site, stars, catalogue_epoch):
    _, _, lat, lon = site
    observer = astro.Observer(lat, lon, 0)
    time = astro.Time.Make(moment.year, moment.month, moment.day, moment.hour, moment.minute, 0)
    objects = []
    for body in BODIES:
        direction = astro.Equator(body, time, observer, True, True)
        horizon = astro.Horizon(time, observer, direction.ra, direction.dec, astro.Refraction.Airless)
        objects.append([round(horizon.altitude, 2), round(horizon.azimuth, 2)])

    matrix = erfa.pnm06a(2451545.0, time.tt)
    for star in stars:
        ra = radians(star["ra_deg"])
        dec = radians(star["dec_deg"])
        pm_ra = radians(star["pm_ra_cosdec_mas_per_year"] / 3_600_000) / cos(dec)
        pm_dec = radians(star["pm_dec_mas_per_year"] / 3_600_000)
        ra_now, dec_now, *_ = erfa.pmsafe(
            ra, dec, pm_ra, pm_dec, star["parallax_mas"] / 1000, 0,
            *erfa.epj2jd(catalogue_epoch), 2451545.0, time.tt,
        )
        ra_date, dec_date = erfa.c2s(matrix @ erfa.s2c(ra_now, dec_now))
        horizon = astro.Horizon(time, observer, (ra_date % tau) * 24 / tau,
                                degrees(dec_date), astro.Refraction.Airless)
        objects.append([round(horizon.altitude, 2), round(horizon.azimuth, 2)])
    return objects


def moon_phase(moment):
    time = astro.Time.Make(moment.year, moment.month, moment.day, moment.hour, moment.minute, 0)
    return round(astro.MoonPhase(time), 5)


def pole_at(epoch):
    # The third row is the mean north pole of date expressed in the ICRS basis.
    x, y, z = erfa.ltpb(epoch)[2]
    return {
        "epoch": epoch,
        "offset": round(degrees(atan2(hypot(x, y), z)), 3),
        "direction": round(degrees(atan2(y, x)) % 360, 3),
    }


def build():
    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    catalogue_epoch = fixture["catalogue"]["epoch_julian_year"]
    stars = [fixture["stars"][key]["astrometry"] for key in ("alcor", "mizar")]
    samples = {}
    for site in SITES:
        nights = []
        for day in DAYS:
            start = datetime(*day, tzinfo=UTC) - timedelta(hours=5, minutes=30)
            nights.append([at_site(start + timedelta(minutes=30 * step), site, stars, catalogue_epoch) for step in range(49)])
        samples[site[0]] = nights
    return {
        "status": "modern reference",
        "timeZone": "IST (UTC+05:30)",
        "method": "Airless apparent horizon, topocentric solar-system positions. The two stars use Hipparcos astrometry propagated with ERFA and rotated into the true equator and equinox of date. Samples every 30 minutes.",
        "source": ENGINE,
        "catalogue": STAR_CATALOGUE,
        "days": ["-".join(f"{value:02d}" for value in day) for day in DAYS],
        "moonPhase": [
            [moon_phase(datetime(*day, tzinfo=UTC) + timedelta(minutes=30 * step - 330)) for step in range(49)]
            for day in DAYS
        ],
        "poles": [pole_at(epoch) for epoch in (-10000, -5000, 0, 2000)],
        "sites": [{"id": ident, "name": name, "lat": lat, "lon": lon} for ident, name, lat, lon in SITES],
        "objects": [body.name for body in BODIES] + list(CODES),
        "samples": samples,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    fixture = build()
    if args.check:
        if fixture != json.loads(OUTPUT.read_text(encoding="utf-8")):
            raise SystemExit("Observer sky dataset differs from the locked calculation")
    else:
        OUTPUT.write_text(json.dumps(fixture, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    print("Verified 588 observer frames, 196 lunar phase samples and 4 precession epochs")
