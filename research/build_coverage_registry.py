"""Count explicit coverage tiers from the checked-in inputs used by the site."""

import argparse
import json
from collections import Counter
from pathlib import Path

CONTENT = Path(__file__).resolve().parents[1] / "content"
OUTPUT = CONTENT / "coverage-registry.json"


def read(stem, default=None):
    path = CONTENT / f"{stem}.json"
    return json.loads(path.read_bytes()) if default is None or path.exists() else default


def epic(work, books, links):
    annotations = read(f"{work}-annotations", [])
    exact = {(entry["book"], entry["chapter"]) for entry in annotations}
    if len(exact) != len(annotations):
        raise ValueError(f"Duplicate chapter annotation in {work}")
    index = {(i, chapter) for i, starts in enumerate(books, 1) for chapter in range(1, len(starts) + 1)}
    if (links | exact) - index:
        raise ValueError(f"Reading points outside the {work} index")
    tiers = [
        {
            "book": i,
            "indexed": len(starts),
            "sceneLinkedOnly": sum((i, chapter) in links - exact for chapter in range(1, len(starts) + 1)),
            "annotated": sum((i, chapter) in exact for chapter in range(1, len(starts) + 1)),
        }
        for i, starts in enumerate(books, 1)
    ]
    for row in tiers:
        row["indexOnly"] = row["indexed"] - row["sceneLinkedOnly"] - row["annotated"]
    return {
        "books": tiers,
        **{field: sum(row[field] for row in tiers) for field in ("indexed", "indexOnly", "sceneLinkedOnly", "annotated")},
    }


def build():
    ma = read("mahabharata-reading")
    atlas = read("mahabharata-atlas")
    books_by_scene = {entry["id"]: entry["book"] for entry in atlas["episodes"]} | {"frame": 1}
    links = {(books_by_scene[id_], chapter) for id_, entry in ma["scenes"].items() for chapter in entry["chapters"]}
    ram_index = read("ramayana-chapters", {"books": []})
    ram_atlas = read("ramayana-atlas", {"episodes": []})
    series = read("swarajya")
    legacy = read("library")
    return {
        "version": 1,
        "works": {
            "mahabharata": {
                **epic("mahabharata", [entry["chapterStarts"] for entry in read("mahabharata-chapters")["parvas"]], links),
                "scenes": len(ma["scenes"]), "battleDays": len(ma["warDays"]),
                "evidence": dict(sorted(Counter(entry["group"] for entry in read("mahabharata-evidence")).items())),
            },
            "ramayana": {
                **epic("ramayana", [entry["chapterStarts"] for entry in ram_index["books"]],
                       {(entry["book"], entry["chapter"]) for entry in ram_atlas["episodes"]}),
                "scenes": len(ram_atlas["episodes"]),
            },
        },
        "legacy": dict(sorted(Counter(entry["collection"] for entry in legacy["episodes"]).items())),
        "maratha": {"events": len(series["events"]), "places": len(series["places"]),
                    "terrainSamples": len(series["transect"]["points"]),
                    "periods": len(read("maratha-history", {"periods": []})["periods"])},
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    fresh = build()
    if args.check:
        if fresh != json.loads(OUTPUT.read_bytes()):
            raise SystemExit("The coverage registry is out of date")
    else:
        OUTPUT.write_text(json.dumps(fresh, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    for name, work in fresh["works"].items():
        print(f"{name}: {work['indexed']} indexed, {work['indexOnly']} index only, "
              f"{work['sceneLinkedOnly']} scene linked only, {work['annotated']} chapter annotations")
