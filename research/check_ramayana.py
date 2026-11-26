"""Validate the Baroda index, source locators and route reference precision."""

import argparse
import json
import re
from pathlib import Path

from build_ramayana_index import CONTENT, LINE, extract


def read(name):
    return json.loads((CONTENT / f"ramayana-{name}.json").read_bytes())


def per_passage(line):
    return int(line[0]), int(line[1:4])


def check(source_dir):
    index, atlas, notes = read("chapters"), read("atlas"), read("annotations")
    books = index["books"]
    assert len(books) == 7
    assert [book["number"] for book in atlas["books"]] == list(range(1, 8))
    if source_dir:
        assert extract(source_dir) == index, "Baroda source files disagree with the index"
        passages = {match[0] for file in source_dir.glob("Ram*.txt") for match in LINE.finditer(file.read_text(encoding="utf-8-sig"))}
    counts = []
    for number, book in enumerate(books, 1):
        assert book["book"] == number and re.fullmatch(r"[a-f0-9]{64}", book["sha256"])
        counts.append(len(book["chapterStarts"]))
        assert all(per_passage(start) == (number, sarga) for sarga, start in enumerate(book["chapterStarts"], 1))
    scene_ids = {scene["id"] for scene in atlas["episodes"]}
    people = {person["id"] for person in atlas["people"]}
    places = {place["id"] for place in atlas["places"]}
    assert len(scene_ids) == len(atlas["episodes"]) and len(people) == len(atlas["people"]) and len(places) == len(atlas["places"])
    assert set(note["scene"] for note in notes) == scene_ids == set(scene["id"] for scene in atlas["episodes"])
    assert len(notes) == len(set((note["book"], note["chapter"]) for note in notes))
    by_scene = {note["scene"]: note for note in notes}
    for scene in atlas["episodes"]:
        note = by_scene[scene["id"]]
        assert (note["book"], note["chapter"]) == (scene["book"], scene["chapter"])
        assert 1 <= scene["chapter"] <= counts[scene["book"] - 1]
        assert scene["place"] in places | {""} and set(scene["people"]) <= people
        assert all(note[field].strip() for field in ("title", "voice", "summary", "aftermath"))
        assert note["anchors"] and all(per_passage(anchor) == (note["book"], note["chapter"]) for anchor in note["anchors"])
        if source_dir:
            assert set(note["anchors"]) <= passages, note["scene"]
    for place in atlas["places"]:
        assert place["source"].startswith("https://") and place["summary"]
        if place["lat"] is None:
            assert place["lon"] is None
        else:
            assert -90 <= place["lat"] <= 90 and -180 <= place["lon"] <= 180, place["id"]
            assert place["status"] in ("Traditional regional reference", "Traditional pilgrimage area", "Traditional association",
                                       "Traditional regional association", "Modern city reference", "Modern study region")
    print(f"{sum(counts)} Baroda sargas in seven books, {len(notes)} chapter annotations, "
          f"{sum(len(note['anchors']) for note in notes)} {'source-matched' if source_dir else 'structural'} passage references")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path)
    check(parser.parse_args().source_dir)
