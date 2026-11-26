"""Extract chapter start locators from the BORI constituted e-text."""

import argparse
import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "content/mahabharata-chapters.json"
SOURCE = "https://indology.info/bombay/mahabharata/text/UR/"
LINE = re.compile(r"^(\d{2})(\d{3})(\d{3}[A-Za-z])\s", re.MULTILINE)


def extract(folder):
    parvas = []
    for number in range(1, 19):
        filename = f"MBh{number:02}.txt"
        raw = (folder / filename).read_bytes()
        text = raw.decode("utf-8-sig")
        starts = {}
        for match in LINE.finditer(text):
            if int(match[1]) == number:
                starts.setdefault(int(match[2]), "".join(match.groups()))
        if not starts or list(starts) != list(range(1, max(starts) + 1)):
            raise ValueError(f"Incomplete or unordered chapter starts in {filename}")
        parvas.append({
            "parva": number, "url": SOURCE + filename,
            "sha256": hashlib.sha256(raw).hexdigest(),
            "chapterStarts": list(starts.values()),
        })
    return {
        "edition": "BORI Critical Edition, Tokunaga–Smith Unicode Roman constituted main text",
        "source": "https://indology.info/bombay/mahabharata/statement.html",
        "rights": "Index locators only. Text remains at the source.",
        "parvas": parvas,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path, help="Folder containing MBh01.txt through MBh18.txt")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    index = extract(args.folder)
    if args.check:
        if index != json.loads(OUTPUT.read_text(encoding="utf-8")):
            raise SystemExit("Chapter index differs from the source files")
    else:
        OUTPUT.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    print([len(parva["chapterStarts"]) for parva in index["parvas"]])
    print(f"Verified {sum(len(parva['chapterStarts']) for parva in index['parvas'])} chapter starts in 18 parvas")


if __name__ == "__main__":
    main()
