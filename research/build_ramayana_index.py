"""Extract all Baroda Critical Edition sarga locators from the public e-text."""

import argparse
import hashlib
import json
import re
from pathlib import Path

CONTENT = Path(__file__).resolve().parents[1] / "content"
OUTPUT = CONTENT / "ramayana-chapters.json"
SOURCE = "https://indology.info/bombay/ramayana/text/UR/"
LINE = re.compile(r"^([1-7])(\d{3})(\d{3}[A-Za-z])(?=\s)", re.MULTILINE)


def extract(folder):
    books = []
    for number in range(1, 8):
        name = f"Ram{number:02}.txt"
        raw = (folder / name).read_bytes()
        starts = {}
        for match in LINE.finditer(raw.decode("utf-8-sig")):
            if int(match[1]) == number:
                starts.setdefault(int(match[2]), "".join(match.groups()))
        if not starts or list(starts) != list(range(1, len(starts) + 1)):
            raise ValueError(f"Sarga numbering is not contiguous in {name}")
        books.append({"book": number, "url": SOURCE + name, "sha256": hashlib.sha256(raw).hexdigest(),
                      "chapterStarts": list(starts.values())})
    return {"edition": "Baroda Critical Edition, Unicode Roman constituted main text",
            "source": "https://indology.info/bombay/ramayana/welcome.html", "books": books}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    registry = extract(args.folder)
    if args.check:
        if registry != json.loads(OUTPUT.read_bytes()):
            raise SystemExit("Ramayana chapter index drifted from the source files")
    else:
        OUTPUT.write_text(json.dumps(registry, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    counts = [len(book["chapterStarts"]) for book in registry["books"]]
    print(f"{sum(counts)} verified sarga starts: {counts}")
