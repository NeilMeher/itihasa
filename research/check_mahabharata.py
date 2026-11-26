"""Check atlas references and optionally match passage locators to the source files."""

import argparse
import json
import re
from pathlib import Path

from build_mahabharata_index import SOURCE, extract


CONTENT = Path(__file__).resolve().parents[1] / "content"
COUNTS = [225, 72, 299, 67, 197, 117, 173, 69, 64, 18, 27, 353, 154, 96, 47, 9, 3, 5]


def read(name):
    return json.loads((CONTENT / f"mahabharata-{name}.json").read_text(encoding="utf-8"))


def check(source_dir):
    atlas, reading, index, evidence, details, sky, rivers = (
        read(name) for name in ("atlas", "reading", "chapters", "evidence", "evidence-details", "sky", "rivers")
    )
    if source_dir and extract(source_dir) != index:
        raise ValueError("Chapter index drifted from the upstream source files")
    assert [len(book["chapterStarts"]) for book in index["parvas"]] == COUNTS
    assert [book["number"] for book in atlas["books"]] == list(range(1, 19))

    sources = {}
    anchors = set()
    for number, book in enumerate(index["parvas"], 1):
        filename = f"MBh{number:02}.txt"
        assert re.fullmatch("[a-f0-9]{64}", book["sha256"]), filename
        assert book["parva"] == number and book["url"] == SOURCE + filename
        for chapter, line in enumerate(book["chapterStarts"], 1):
            assert line.startswith(f"{number:02}{chapter:03}"), line
        if source_dir:
            sources[number] = set(re.findall(
                r"^\d{8}[a-zA-Z](?=\s)", (source_dir / filename).read_text(encoding="utf-8-sig"), re.MULTILINE,
            ))

    def passage(line):
        assert re.fullmatch(r"\d{8}[a-zA-Z]", line), line
        book, chapter = int(line[:2]), int(line[2:5])
        assert 1 <= book <= 18 and 1 <= chapter <= COUNTS[book - 1], line
        if source_dir:
            assert line in sources[book], f"Unknown text line {line}"
        anchors.add(line)
        return book, chapter

    scene_books = {"frame": 1, **{scene["id"]: scene["book"] for scene in atlas["episodes"]}}
    people = reading["people"]
    clues = {clue["id"] for clue in evidence}
    places = {place["id"] for place in atlas["places"]}
    assert clues == details.keys() and len(clues) == len(evidence)
    assert scene_books.keys() == reading["scenes"].keys() and len(scene_books) == len(atlas["episodes"]) + 1
    assert all(scene["place"] in places | {""} and scene["clue"] in clues | {""} for scene in atlas["episodes"])

    selected = {number: set() for number in range(1, 19)}
    for scene, annotation in reading["scenes"].items():
        number, chapter = passage(annotation["line"])
        assert number == scene_books[scene] and chapter in annotation["chapters"], scene
        assert all(1 <= part <= COUNTS[number - 1] for part in annotation["chapters"]), scene
        assert all(person in people for person in annotation["people"]), scene
        assert annotation.get("nestedUnder", scene) in scene_books
        selected[number].update(annotation["chapters"])
    for person in people.values():
        assert all(scene in scene_books for scene, _ in person["links"]), person["name"]
    annotations = read("annotations")
    positions = set()
    for note in annotations:
        key = (note["book"], note["chapter"])
        assert key not in positions and note["scene"] in scene_books.keys() | {""}, key
        assert all(note[field].strip() for field in ("title", "voice", "summary", "aftermath")), key
        assert note["anchors"] and all(passage(line) == key for line in note["anchors"]), key
        positions.add(key)

    wagers = [line for line, _, _ in reading["wagers"]]
    assert wagers == sorted(wagers) and wagers[-2:] == ["02058027a", "02058031a"]
    for entry in reading["wagers"] + reading["court"]:
        assert passage(entry[0])[0] == 2, entry
    passage("01002026a")
    for line in ("06045063c", "07135031a", "10008001a", "08021035a"):
        passage(line)
    assert [entry["day"] for entry in reading["warDays"]] == list(range(1, 19))
    previous = ""
    for entry in reading["warDays"]:
        assert entry["event"] and passage(entry["line"])[0] >= 6, entry
        assert entry["boundary"] and passage(entry["marker"])[0] in range(6, 10), entry
        assert previous < entry["marker"], entry
        previous = entry["marker"]
        assert entry.get("scene", "frame") in scene_books, entry
    assert sum(clue["younger"] is not None for clue in evidence) == 3
    for clue in evidence:
        detail = details[clue["id"]]
        for url in [clue["primary"], *(link[1] for link in detail.get("links", []))]:
            if "#:~:text=" in url:
                passage(url.split("#:~:text=")[-1])
        if track := detail.get("track"):
            assert clue["younger"] is None and track["unit"] in ("bce", "ago")
            assert 0 <= track["younger"] < track["older"] <= (3500 if track["unit"] == "bce" else 16000)
    assert len(sky["objects"]) == 19 and len(set(sky["hips"].values())) == 12
    assert set(sky["objects"][7:]) == sky["hips"].keys()
    for site in sky["sites"]:
        days = sky["samples"][site["id"]]
        assert len(days) == len(sky["days"])
        for frames in days:
            assert len(frames) == 49
            assert all(len(frame) == len(sky["objects"]) for frame in frames)
            assert all(-90 <= alt <= 90 and 0 <= az <= 360 for frame in frames for alt, az in frame)
    assert all(len(day) == 49 and all(0 <= phase < 360 for phase in day) for day in sky["moonPhase"])
    assert re.fullmatch("[a-f0-9]{64}", rivers["sha256"])
    assert len(rivers["rivers"]) == 3 and len(rivers["bounds"]) == 4

    print("Parva chapters:", ", ".join(f"{number} {len(selected[number])}/{count}" for number, count in enumerate(COUNTS, 1)))
    print(f"{sum(COUNTS)} chapters, {sum(map(len, selected.values()))} linked to {len(scene_books)} scene readings")
    print(f"{len(positions)} dedicated chapter annotations across {len({book for book, _ in positions})} parvas")
    print(f"18 war days with edition boundary markers, {len(people)} people, {len(places)} places and {len(clues)} evidence records")
    print(f"{len(anchors)} distinct passage anchors {'found in the upstream sources' if source_dir else 'validated structurally'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path)
    check(parser.parse_args().source_dir)
