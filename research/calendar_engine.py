"""Modern calendar and birth-sky calculations for the local beta."""

import json
import re
from datetime import UTC, date, datetime, time, timedelta, timezone
from functools import lru_cache
from math import atan2, cos, degrees, radians, sin
from pathlib import Path

import astronomy as astro

ROOT = Path(__file__).resolve().parent.parent
PLACES = json.loads((ROOT / "content/cities.json").read_text(encoding="utf-8"))
CONVENTION = json.loads((ROOT / "content/conventions.json").read_text(encoding="utf-8"))["calendar"]
CITIES = {city["id"]: city for city in PLACES["cities"]}
IST = timezone(timedelta(hours=5, minutes=30), "IST")
J2000_UTC = datetime(2000, 1, 1, 12, tzinfo=UTC)
METHOD = CONVENTION["id"]
RASHIS = ("Meṣa", "Vṛṣabha", "Mithuna", "Karka", "Siṃha", "Kanyā", "Tulā", "Vṛścika", "Dhanu", "Makara", "Kumbha", "Mīna")
NAKSHATRAS = (
    "Aśvinī", "Bharaṇī", "Kṛttikā", "Rohiṇī", "Mṛgaśīrṣa", "Ārdrā", "Punarvasu", "Puṣya", "Āśleṣā",
    "Maghā", "Pūrva Phalgunī", "Uttara Phalgunī", "Hasta", "Citrā", "Svātī", "Viśākhā", "Anurādhā",
    "Jyeṣṭhā", "Mūla", "Pūrva Āṣāḍhā", "Uttara Āṣāḍhā", "Śravaṇa", "Dhaniṣṭhā", "Śatabhiṣaj",
    "Pūrva Bhādrapadā", "Uttara Bhādrapadā", "Revatī",
)
TITHIS = ("Pratipadā", "Dvitīyā", "Tṛtīyā", "Caturthī", "Pañcamī", "Ṣaṣṭhī", "Saptamī", "Aṣṭamī",
          "Navamī", "Daśamī", "Ekādaśī", "Dvādaśī", "Trayodaśī", "Caturdaśī")
YOGAS = ("Viṣkambha", "Prīti", "Āyuṣmān", "Saubhāgya", "Śobhana", "Atigaṇḍa", "Sukarman", "Dhṛti",
         "Śūla", "Gaṇḍa", "Vṛddhi", "Dhruva", "Vyāghāta", "Harṣaṇa", "Vajra", "Siddhi", "Vyatīpāta",
         "Varīyān", "Parigha", "Śiva", "Siddha", "Sādhya", "Śubha", "Śukla", "Brahma", "Indra", "Vaidhṛti")
KARANAS = ("Bava", "Bālava", "Kaulava", "Taitila", "Gara", "Vaṇija", "Viṣṭi")
MONTHS = ("Vaiśākha", "Jyeṣṭha", "Āṣāḍha", "Śrāvaṇa", "Bhādrapada", "Āśvina", "Kārttika",
          "Mārgaśīrṣa", "Pauṣa", "Māgha", "Phālguna", "Caitra")
WINDOW_INDICES = {
    "Rāhu Kāla": (1, 6, 4, 5, 3, 2, 7),
    "Yamaganda": (3, 2, 1, 0, 6, 5, 4),
    "Gulika Kāla": (5, 4, 3, 2, 1, 0, 6),
}


class InputError(ValueError):
    """An explanation that can safely be shown to the reader."""


def validate_input(payload: dict) -> tuple[dict, date]:
    city_id = payload.get("city")
    if not isinstance(city_id, str) or city_id not in CITIES:
        raise InputError("Choose a supported city.")
    raw = payload.get("date")
    if not isinstance(raw, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        raise InputError("Enter a Gregorian date.")
    try:
        day = date.fromisoformat(raw)
    except ValueError as error:
        raise InputError("Enter a valid Gregorian date.") from error
    if not PLACES["first_date"] <= day.isoformat() <= PLACES["last_date"]:
        raise InputError("The beta supports Gregorian dates from 2024 through 2027.")
    return CITIES[city_id], day


def local_time(value: astro.Time) -> datetime:
    return (J2000_UTC + timedelta(days=value.ut)).astimezone(IST)


def at(value: datetime) -> astro.Time:
    return astro.Time((value - J2000_UTC).total_seconds() / 86400)


def display_time(value: astro.Time) -> str:
    return local_time(value).isoformat(timespec="seconds")


def ayanamsha(value: astro.Time) -> float:
    # Linear mean approximation anchored to the 1956 Lahiri epoch.
    parameters = CONVENTION["ayanamsha"]
    elapsed = (value.tt + 2451545.0 - parameters["jd_tt"]) / 365.25
    return parameters["offset_degrees"] + elapsed * parameters["rate_arcsec_per_julian_year"] / 3600


def signs(value: astro.Time) -> tuple[float, float, float]:
    offset = ayanamsha(value)
    sun = (astro.SunPosition(value).elon - offset) % 360
    moon = (astro.EclipticGeoMoon(value).lon - offset) % 360
    return sun, moon, astro.MoonPhase(value)


def sector(angle: float, count: int) -> int:
    return int((angle % 360) * count / 360)


def tithi_name(index: int) -> str:
    if index == 14:
        return "Pūrṇimā"
    if index == 29:
        return "Amāvāsyā"
    return TITHIS[index % 15]


def karana_name(index: int) -> str:
    if index == 0:
        return "Kiṃstughna"
    if index >= 57:
        return ("Śakuni", "Catuṣpada", "Nāga")[index - 57]
    return KARANAS[(index - 1) % 7]


def next_change(start: astro.Time, calculate, *, days: float) -> astro.Time | None:
    """Bracket a sector change on a half-hour grid, then bisect to a second."""
    baseline = calculate(start)
    low = start.ut
    end = low + days
    while low < end:
        high = min(low + 1 / 48, end)
        if calculate(astro.Time(high)) != baseline:
            while high - low > 1 / 86400:
                middle = (low + high) / 2
                if calculate(astro.Time(middle)) == baseline:
                    low = middle
                else:
                    high = middle
            return astro.Time(high)
        low = high
    return None


def lunar_month(value: astro.Time, waning: bool) -> dict:
    previous = astro.SearchMoonPhase(0, value, -34)
    if previous is None:
        raise RuntimeError("Previous new moon is unavailable")

    def name_for(new_moon: astro.Time) -> tuple[str, astro.Time]:
        following = astro.SearchMoonPhase(0, new_moon.AddDays(1), 33)
        if following is None:
            raise RuntimeError("Following new moon is unavailable")
        first_sign = sector(signs(new_moon)[0], 12)
        next_sign = sector(signs(following)[0], 12)
        prefix = "Adhika " if first_sign == next_sign else ""
        return prefix + MONTHS[first_sign], following

    name, following = name_for(previous)
    return {"amanta": name, "purnimanta": name_for(following)[0] if waning else name}


def calendar(payload: dict) -> dict:
    city, day = validate_input(payload)
    midnight = at(datetime.combine(day, time(), tzinfo=IST))
    observer = astro.Observer(city["latitude"], city["longitude"], 0)
    rise = astro.SearchRiseSet(astro.Body.Sun, observer, astro.Direction.Rise, midnight, 1)
    setting = astro.SearchRiseSet(astro.Body.Sun, observer, astro.Direction.Set, midnight, 1)
    if rise is None or setting is None:
        raise RuntimeError("Rise or set is unavailable for this day")

    @lru_cache(maxsize=256)
    def ecliptic(ut):
        return signs(astro.Time(ut))

    definitions = (
        ("Tithi", lambda e: sector(e[2], 30), tithi_name, "Moon minus Sun, one segment per 12°"),
        ("Nakshatra", lambda e: sector(e[1], 27), NAKSHATRAS.__getitem__, "Sidereal Moon in 27 equal sectors"),
        ("Yoga", lambda e: sector(e[0] + e[1], 27), YOGAS.__getitem__, "Sum of the sidereal Sun and Moon longitudes, in 27 sectors"),
        ("Karaṇa", lambda e: sector(e[2], 60), karana_name, "Half a tithi, one segment per 6°"),
    )
    sunrise_coords = ecliptic(rise.ut)
    limbs = [{"label": "Vāra", "value": day.strftime("%A"), "until": None, "rule": "Weekday at local sunrise"}]
    for label, index, name, rule in definitions:
        boundary = next_change(rise, lambda value: index(ecliptic(value.ut)), days=2)
        limbs.append({"label": label, "value": name(index(sunrise_coords)), "until": display_time(boundary) if boundary else None, "rule": rule})
    daylight = setting.ut - rise.ut
    windows = []
    for name, indices in WINDOW_INDICES.items():
        index = indices[day.weekday()]
        windows.append({"label": name, "start": display_time(rise.AddDays(daylight * index / 8)),
                        "end": display_time(rise.AddDays(daylight * (index + 1) / 8)), "part": f"{index + 1} of 8"})
    windows.append({"label": "Midday muhūrta", "start": display_time(rise.AddDays(daylight * 7 / 15)),
                    "end": display_time(rise.AddDays(daylight * 8 / 15)), "part": "8 of 15"})
    phase = sunrise_coords[2]
    waning = phase >= 180
    return {
        "version": 1, "method": METHOD, "city": city["name"], "date": day.isoformat(),
        "sunrise": display_time(rise), "sunset": display_time(setting),
        "limbs": limbs, "phase_degrees": round(phase, 2),
        "illuminated": round(astro.Illumination(astro.Body.Moon, rise).phase_fraction * 100),
        "paksha": "Kṛṣṇa paksha (waning)" if waning else "Śukla paksha (waxing)",
        "month": lunar_month(rise, waning), "windows": windows,
    }


def ascendant(value: astro.Time, city: dict) -> float:
    """Intersect the true ecliptic with the geometric eastern horizon."""
    theta = radians(15 * astro.SiderealTime(value) + city["longitude"])
    phi = radians(city["latitude"])
    zenith = (cos(phi) * cos(theta), cos(phi) * sin(theta), sin(phi))
    east = (-sin(theta), cos(theta), 0)
    rotation = astro.Rotation_ECT_EQD(value)
    x = astro.RotateVector(rotation, astro.Vector(1, 0, 0, value))
    y = astro.RotateVector(rotation, astro.Vector(0, 1, 0, value))
    x_axis, y_axis = (x.x, x.y, x.z), (y.x, y.y, y.z)
    a = sum(component * axis for component, axis in zip(zenith, x_axis))
    b = sum(component * axis for component, axis in zip(zenith, y_axis))
    longitude = atan2(-a, b)
    vector = (cos(longitude) * x_part + sin(longitude) * y_part for x_part, y_part in zip(x_axis, y_axis))
    if sum(component * axis for component, axis in zip(east, vector)) < 0:
        longitude += radians(180)
    return (degrees(longitude) - ayanamsha(value)) % 360


def civil_day_options(start: astro.Time, count: int, names: tuple[str, ...]) -> list[dict]:
    end = start.ut + 1
    entries = []

    def index(value: astro.Time) -> int:
        return sector(signs(value)[1], count)

    while start.ut < end:
        boundary = next_change(start, index, days=end - start.ut)
        finish = boundary if boundary and boundary.ut < end else astro.Time(end)
        entries.append({"value": names[index(start)], "start": display_time(start), "end": display_time(finish)})
        if finish.ut == end:
            break
        start = finish
    return entries


def birth_sky(payload: dict) -> dict:
    city, day = validate_input(payload)
    supplied = payload.get("time", "")
    result = {"version": 1, "method": METHOD, "city": city["name"], "date": day.isoformat()}
    if supplied == "":
        start = at(datetime.combine(day, time(), tzinfo=IST))
        return {**result, "kind": "civil-day", "rashi": civil_day_options(start, 12, RASHIS),
                "nakshatra": civil_day_options(start, 27, NAKSHATRAS)}
    if not isinstance(supplied, str) or not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", supplied):
        raise InputError("Use a local time from 00:00 to 23:59, or leave it blank.")
    moment = at(datetime.combine(day, time.fromisoformat(supplied), tzinfo=IST))
    _, moon, _ = signs(moment)
    rising = ascendant(moment, city)
    return {**result, "kind": "instant", "time": display_time(moment), "rashi": RASHIS[sector(moon, 12)],
            "nakshatra": NAKSHATRAS[sector(moon, 27)], "lagna": RASHIS[sector(rising, 12)],
            "moon_longitude": round(moon, 2), "lagna_longitude": round(rising, 2)}
