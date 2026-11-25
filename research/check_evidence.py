"""Validate the seed evidence and check or regenerate its public JSON Schema."""

import argparse
import json
from pathlib import Path

from evidence import EvidenceBundle


ROOT = Path(__file__).resolve().parent.parent
FIXTURE = ROOT / "content" / "arundhati-evidence.json"
SCHEMA = ROOT / "packages" / "contracts" / "evidence.schema.json"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write-schema", action="store_true")
    args = parser.parse_args()

    bundle = EvidenceBundle.model_validate_json(FIXTURE.read_bytes())
    print(f"Validated {bundle.sky.id} with {len(bundle.sky.frames)} illustrative frames")

    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        **EvidenceBundle.model_json_schema(),
    }
    expected = json.dumps(schema, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if args.write_schema:
        SCHEMA.parent.mkdir(parents=True, exist_ok=True)
        SCHEMA.write_text(expected, encoding="utf-8", newline="\n")
    elif not SCHEMA.exists() or SCHEMA.read_text(encoding="utf-8") != expected:
        raise SystemExit("Evidence schema is out of date. Run check_evidence.py --write-schema.")
    print("Evidence JSON Schema matches the Python models")


if __name__ == "__main__":
    main()
