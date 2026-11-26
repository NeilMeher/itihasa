"""Assemble the reader graph from editorial assertions and edition-backed atlas links."""

import argparse
import json
import re
from pathlib import Path

CONTENT = Path(__file__).resolve().parents[1] / "content"
OUTPUT = CONTENT / "project-graph.json"


def read(name, fallback=None):
    path = CONTENT / f"{name}.json"
    return json.loads(path.read_bytes()) if path.exists() or fallback is None else fallback


def build():
    sources = read("source-register")
    atlas, reading = read("mahabharata-atlas"), read("mahabharata-reading")
    editorial = read("graph-editorial")
    nodes = list(editorial["nodes"])
    edges = list(editorial["edges"])

    def add(id_, kind, work, title, summary, href, aliases=()):
        nodes.append(dict(id=id_, kind=kind, work=work, title=title, summary=summary, href=href, aliases=list(aliases)))

    def edge(left, right, relation, scope, why, source="bori", locator_url=""):
        edges.append({"from": left, "to": right, "relation": relation, "scope": scope,
                      "why": why, "source": source, **({"url": locator_url} if locator_url else {})})

    for id_, source in sources.items():
        add(f"source-{id_}", "source", "sources", source["work"], f'{source["creator"]} · {source["edition"]}', source["url"])
    add("work-mahabharata", "work", "mahabharata", "Mahābhārata", "A Sanskrit epic told across 18 parvas.", "/mahabharata/", ["महाभारत"])
    add("work-ramayana", "work", "ramayana", "Vālmīki Rāmāyaṇa", "The atlas uses the Baroda Critical Edition as its reference spine.", "/ramayana/", ["रामायण"])
    add("work-maratha", "work", "maratha", "Swarajya and Maratha history", "History through records, sites and dated developments.", "/swarajya/", ["स्वराज्य"])
    edge("work-mahabharata", "source-bori", "is indexed from", "Eighteen parvas", "The chapter locators use the constituted main text.")
    edge("work-ramayana", "source-baroda", "uses edition", "Constituted main text", "The Baroda numbering and the Southern Recension comparison are recorded separately.", "baroda")
    edge("work-ramayana", "story-rama-birth", "contains", "Baroda 1.17.6", "Kauśalyā gives birth to Rāma in the first book.", "baroda")
    edge("work-maratha", "maratha-place-raigad", "includes", "Site study", "The fort connects political history to terrain, water and approaches.", "unesco-forts")

    scene_urls = {}
    scenes = [{"id": "frame", "book": 1, "title": "Who tells the Mahābhārata?", "summary": "A storyteller reports the tale he heard at a royal sacrifice.", "place": ""}, *atlas["episodes"]]
    person_aliases = {
        "draupadi": ["द्रौपदी", "Krishnaa"], "karna": ["कर्ण", "Radheya", "Rādheya"],
        "krishna": ["कृष्ण", "Keshava"], "bhishma": ["भीष्म", "Devavrata"],
        "kunti": ["कुन्ती"], "gandhari": ["गान्धारी"], "vidura": ["विदुर"],
    }
    for id_, person in reading["people"].items():
        add(f"ma-person-{id_}", "person", "mahabharata", person["name"], person["bio"], "", person_aliases.get(id_, []))
    for place in atlas["places"]:
        add(f'ma-place-{place["id"]}', "place", "mahabharata", place["name"],
            f'{place["modern"]}. {place["status"]}.', f'/mahabharata/?place={place["id"]}')
    for scene in scenes:
        id_ = scene["id"]
        detail = reading["scenes"][id_]
        line = detail["line"]
        locator = ".".join(str(int(part)) for part in (line[:2], line[2:5], line[5:8]))
        url = f"{atlas['books'][scene['book'] - 1]['url']}#:~:text={line}"
        scene_urls[id_] = (locator, url)
        add(f"ma-episode-{id_}", "episode", "mahabharata", scene["title"], scene["summary"], f"/mahabharata/?scene={id_}")
        edge(f"ma-episode-{id_}", "work-mahabharata", "appears in", f"BORI {locator}", "The scene reading opens at a passage from the indexed edition.", locator_url=url)
        if scene["place"]:
            edge(f"ma-episode-{id_}", f'ma-place-{scene["place"]}', "takes place in", f"BORI {locator}", "The named narrative setting links to the map’s locator and its stated uncertainty.", locator_url=url)
    for id_, person in reading["people"].items():
        for scene, why in person["links"]:
            locator, url = scene_urls[scene]
            edge(f"ma-person-{id_}", f"ma-episode-{scene}", "appears in", f"BORI {locator}", why, locator_url=url)
    for note in read("mahabharata-annotations"):
        book, chapter, line = note["book"], note["chapter"], note["anchors"][0]
        id_ = f"ma-chapter-{book}-{chapter}"
        link = f"/mahabharata/parva/{book:02}/#chapter-{chapter}"
        anchor_url = f'{atlas["books"][book - 1]["url"]}#:~:text={line}'
        add(id_, "chapter", "mahabharata", f"{book}.{chapter} · {note['title']}", note["summary"], link, note["aliases"])
        if note["scene"]:
            edge(id_, f'ma-episode-{note["scene"]}', "supports", f"BORI {book}.{chapter}", "The chapter adds its own reading and exact passage links to the scene.", locator_url=anchor_url)
        else:
            edge(id_, "work-mahabharata", "is part of", f"BORI {book}.{chapter}", "The chapter reader opens a separately checked passage from the indexed edition.", locator_url=anchor_url)
    edge("ma-person-kunti", "ma-person-karna", "is mother of", "Disclosure at BORI 11.27.11", "Kuntī names Karṇa as her firstborn when she asks the brothers to include him in the water offerings.", locator_url="https://indology.info/bombay/mahabharata/text/UR/MBh11.txt#:~:text=11027011a")
    edge("ma-person-vidura", "ma-chapter-5-33", "advises the king in", "BORI 5.33.14–15", "Vidura opens his advice by asking why the king cannot sleep.", locator_url="https://indology.info/bombay/mahabharata/text/UR/MBh05.txt#:~:text=05033014a")
    edge("ma-episode-dice", "ma-episode-exile-start", "leads to", "BORI 2.66.18–19", "The second game imposes the forest term and the year in concealment.", locator_url="https://indology.info/bombay/mahabharata/text/UR/MBh02.txt#:~:text=02066018a")
    edge("ma-episode-exile-start", "ma-episode-nala", "frames", "BORI 3.49–50", "Bṛhadaśva tells the exiles a story about another king who lost his kingdom at dice.", locator_url="https://indology.info/bombay/mahabharata/text/UR/MBh03.txt#:~:text=03050001a")
    edge("ma-episode-exile-start", "ma-episode-hidden-year", "precedes", "BORI 2.66.18–19 and 4.1", "The thirteenth year tests whether the brothers can remain unrecognized.", locator_url="https://indology.info/bombay/mahabharata/text/UR/MBh04.txt#:~:text=04001020c")
    edge("ma-episode-hidden-year", "ma-episode-peace", "precedes", "Narrative sequence, Virāṭa to Udyoga", "The completed term lets the exiles seek a settlement before the battle.", locator_url="https://indology.info/bombay/mahabharata/text/UR/MBh05.txt#:~:text=05070016a")
    edge("ma-episode-peace", "ma-episode-gita", "precedes", "Udyoga to Bhīṣma", "The court’s refusal precedes the armies assembling at Kurukṣetra.", locator_url="https://indology.info/bombay/mahabharata/text/UR/MBh05.txt#:~:text=05125026a")

    rama = read("ramayana-atlas", {})
    if rama:
        ram_index = read("ramayana-chapters")
        notes = {note["scene"]: note for note in read("ramayana-annotations")}
        for person in rama["people"]:
            add(f'ra-person-{person["id"]}', "person", "ramayana", person["name"], person["summary"],
                f'/ramayana/?person={person["id"]}', [person["devanagari"]])
        for place in rama["places"]:
            add(f'ra-place-{place["id"]}', "place", "ramayana", place["name"], f'{place["status"]}. {place["summary"]}',
                f'/ramayana/?place={place["id"]}')
        for scene in rama["episodes"]:
            id_, book, chapter = scene["id"], scene["book"], scene["chapter"]
            note = notes[id_]
            source_url = f'{ram_index["books"][book - 1]["url"]}#:~:text={note["anchors"][0]}'
            scope = f"Baroda Critical Edition {book}.{chapter}"
            add(f"ra-episode-{id_}", "episode", "ramayana", scene["title"], note["summary"], f"/ramayana/?scene={id_}", note["aliases"])
            add(f"ra-chapter-{book}-{chapter}", "chapter", "ramayana", f"{book}.{chapter} · {scene['title']}",
                note["voice"], f"/ramayana/{book:02}/#sarga-{chapter}", note["aliases"])
            edge(f"ra-chapter-{book}-{chapter}", f"ra-episode-{id_}", "supports", scope, "Read the source-checked sarga annotation and passage in its place in the edition.", "baroda", source_url)
            for person in scene["people"]:
                edge(f"ra-person-{person}", f"ra-episode-{id_}", "appears in", scope, note["summary"], "baroda", source_url)
            if scene["place"]:
                edge(f"ra-episode-{id_}", f'ra-place-{scene["place"]}', "takes place in", scope,
                     "This literary stop links to its geographic reference and uncertainty.", "baroda", source_url)
        add("claim-oak-vega", "claim", "ramayana", "Oak’s identification of Brahmarāśi", "Oak identifies this marker as Abhijit and tests Vega’s distance from the pole.", "/ramayana/research/", ["Vega", "Brahmarashi"])
        edge("ra-chapter-6-4", "claim-oak-vega", "is interpreted by", "Baroda 6.4.43", "The passage names the marker. Oak proposes a specific stellar identification.", "oak-vega")
        edge("claim-oak-vega", "source-itihasa-vega", "is tested by", "Prereview geometric test", "Compare Vega’s mean-pole angular distance at different model epochs and thresholds.", "itihasa-vega")
        edge("ra-place-setu", "source-setu-study", "is measured by", "Modern bathymetry", "ICESat-2 returns give information about modern depth, not an epoch for the construction in the text.", "setu-study")
        edge("ra-episode-rama-birth", "story-rama-birth", "has edition comparison", "Baroda 1.17.6 and Southern 1.18.8–10", "The birth chapter has a separate reading that shows the additional detail in the Southern Recension.", "southern-ramayana")
        edge("ra-person-janaka", "ra-person-sita", "raises", "Baroda 1.65.14", "Janaka recounts finding Sītā while ploughing the ground.", "baroda", f'{ram_index["books"][0]["url"]}#:~:text=1065014a')

    ids = {node["id"] for node in nodes}
    if len(ids) != len(nodes) or any(not re.fullmatch(r"[a-z\d-]+", id_) for id_ in ids):
        raise ValueError("Duplicate or invalid graph node identifier")
    allowed_kinds = {"person", "place", "episode", "chapter", "work", "tradition", "claim", "source", "concept", "period", "institution"}
    if any(node["kind"] not in allowed_kinds or not node["title"] or not node["summary"] for node in nodes):
        raise ValueError("Invalid graph node kind or missing public copy")
    for id_, source in sources.items():
        if any(not source.get(field) for field in ("creator", "edition", "locator", "basis", "use", "review")):
            raise ValueError(f"Missing source metadata for {id_}")
        if not safe_href(source["url"]):
            raise ValueError(f"Invalid source URL for {id_}")
    seen = set()
    for item in edges:
        key = (item["from"], item["to"], item["relation"])
        if key in seen or item["from"] == item["to"] or not set(key[:2]) <= ids:
            raise ValueError(f"Duplicate, cyclic one-node or dangling edge: {key}")
        seen.add(key)
        if item["source"] not in sources or not all(item.get(field) for field in ("scope", "why")):
            raise ValueError(f"Missing evidence for {key}")
        if item.get("url") and not safe_href(item["url"]):
            raise ValueError(f"Invalid relationship URL for {key}")
    if any(node["href"] and not safe_href(node["href"]) for node in nodes):
        raise ValueError("Invalid graph node link")
    return {"nodes": nodes, "edges": edges, "sources": sources}


def safe_href(url):
    return url.startswith("https://") or (url.startswith("/") and not url.startswith("//"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    graph = build()
    if args.check:
        if graph != json.loads(OUTPUT.read_bytes()):
            raise SystemExit("Project graph is out of date")
    else:
        OUTPUT.write_text(json.dumps(graph, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    print(f'{len(graph["nodes"])} graph nodes, {len(graph["edges"])} sourced directed edges')
