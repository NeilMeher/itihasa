"""Extract the modern rivers visible on the atlas's Kuru-region reference map."""

import argparse
import hashlib
import json
from pathlib import Path


OUTPUT = Path(__file__).resolve().parents[1] / "content/mahabharata-rivers.json"
BOUNDS = [75.2, 26.7, 80.2, 30.8]
NAMES = {"Ganges": "Gaṅgā", "Yamuna": "Yamunā", "Chambal": "Chambal", "Sutlej": "Sutlej"}
SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson"


def visible_segments(points):
    west, south, east, north = BOUNDS
    segment = []
    for start, end in zip(points, points[1:]):
        visible = (
            min(start[0], end[0]) <= east and max(start[0], end[0]) >= west
            and min(start[1], end[1]) <= north and max(start[1], end[1]) >= south
        )
        if visible:
            if not segment:
                segment.append(start)
            segment.append(end)
        elif segment:
            yield [[round(lon, 3), round(lat, 3)] for lon, lat in segment]
            segment = []
    if segment:
        yield [[round(lon, 3), round(lat, 3)] for lon, lat in segment]


def build(source):
    raw = source.read_bytes()
    rivers = {name: [] for name in NAMES}
    for feature in json.loads(raw)["features"]:
        name = feature["properties"]["name"]
        if name not in rivers:
            continue
        geometry = feature["geometry"]
        lines = geometry["coordinates"] if geometry["type"] == "MultiLineString" else [geometry["coordinates"]]
        for points in lines:
            rivers[name].extend(visible_segments(points))
    return {
        "source": SOURCE,
        "sha256": hashlib.sha256(raw).hexdigest(),
        "bounds": BOUNDS,
        "rivers": [{"name": NAMES[name], "segments": segments} for name, segments in rivers.items() if segments],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("geojson", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    dataset = build(args.geojson)
    if args.check:
        if dataset != json.loads(OUTPUT.read_text(encoding="utf-8")):
            raise SystemExit("Regional river geometry differs from the source file")
    else:
        OUTPUT.write_text(json.dumps(dataset, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    print(f"Verified {len(dataset['rivers'])} modern river courses")
