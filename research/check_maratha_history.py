"""Check dated changes, place precision and documentary references."""

import json
from pathlib import Path

CONTENT = Path(__file__).resolve().parents[1] / "content"


def read(name):
    return json.loads((CONTENT / f"{name}.json").read_bytes())


def keyed(records):
    lookup = {item["id"]: item for item in records}
    if len(lookup) != len(records):
        raise ValueError("Duplicate historical identifier")
    return lookup


source = read("source-register") | read("maratha-sources")
history = read("maratha-history")
periods, events, places, dossiers = (keyed(history[key]) for key in ("periods", "events", "places", "dossiers"))
for older, later in zip(history["periods"], history["periods"][1:]):
    assert older["start"] <= older["end"] and older["end"] + 1 == later["start"]
assert [entry["year"] for entry in history["events"]] == sorted(entry["year"] for entry in events.values())
assert set(periods) == {item["period"] for item in events.values()}
for item in events.values():
    period = periods[item["period"]]
    assert period["start"] <= item["year"] <= period["end"], item["id"]
    assert item["place"] in places and item["source"] in source and item["precision"], item["id"]
for item in places.values():
    assert item["source"] in source and item["precision"] and item["summary"]
    if item["lat"] is None:
        assert item["lon"] is None, item["id"]
    else:
        assert -90 <= item["lat"] <= 90 and -180 <= item["lon"] <= 180, item["id"]
for item in dossiers.values():
    assert item["source"] in source and item["place"] in places and item["href"].startswith("/swarajya/")
print(f"Verified {len(periods)} periods, {len(events)} dated records, {len(places)} places and {len(dossiers)} investigations")
