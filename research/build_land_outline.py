"""Clip Natural Earth land polygons to the two local Swarajya map windows."""

import argparse
import hashlib
import json
from pathlib import Path


SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_land.geojson"
VIEWS = {"regional": (72.72, 17.55, 74.03, 18.55), "overview": (66, 6, 95, 34)}
OUTPUT = Path(__file__).resolve().parent.parent / "content/swarajya-land.json"


def clip(points, axis, bound, side):
    kept = []
    for left, right in zip(points[-1:] + points[:-1], points):
        left_in = side * (left[axis] - bound) >= 0
        right_in = side * (right[axis] - bound) >= 0
        if left_in != right_in:
            fraction = (bound - left[axis]) / (right[axis] - left[axis])
            kept.append([a + (b - a) * fraction for a, b in zip(left, right)])
        if right_in:
            kept.append(right)
    return kept


def map_view(rings, bounds):
    west, south, east, north = bounds
    outlines = []
    for ring in rings:
        cropped = ring
        for axis, edge, sign in ((0, west, 1), (0, east, -1), (1, south, 1), (1, north, -1)):
            cropped = clip(cropped, axis, edge, sign)
        if len(cropped) < 4:
            continue
        polygon = [(round((x - west) / (east - west) * 100, 2), round((north - y) / (north - south) * 100, 2))
                   for x, y in cropped]
        compact = [point for index, point in enumerate(polygon) if index == 0 or point != polygon[index - 1]]
        area = abs(sum(x * b - y * a for (x, y), (a, b) in zip(compact, compact[1:] + compact[:1]))) / 2
        if len(compact) >= 3 and area >= 0.15:
            outlines.append(", ".join(f"{x:g}% {y:g}%" for x, y in compact))
    return {"bounds": bounds, "outlines": outlines}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Natural Earth v5.1.2 ne_50m_land.geojson")
    args = parser.parse_args()
    raw = args.input.read_bytes()
    rings = []
    for feature in json.loads(raw)["features"]:
        geometry = feature["geometry"]
        polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
        rings.extend(polygon[0] for polygon in polygons)
    data = {
        "version": 1, "source": SOURCE, "source_sha256": hashlib.sha256(raw).hexdigest(),
        "license": "public domain", "views": {key: map_view(rings, bounds) for key, bounds in VIEWS.items()},
    }
    OUTPUT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
