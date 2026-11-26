"""Assemble the reader graph from editorial assertions and edition-backed atlas links."""

import argparse
import json
import re
from pathlib import Path

CONTENT = Path(__file__).resolve().parents[1] / "content"
OUTPUT = CONTENT / "project-graph.json"
CATALOG = CONTENT / "explorer-catalog.json"
EDGES = CONTENT / "explorer-edges.json"


def read(name, fallback=None):
    path = CONTENT / f"{name}.json"
    return json.loads(path.read_bytes()) if path.exists() or fallback is None else fallback


def build():
    sources = read("source-register") | read("maratha-sources", {})
    library = read("library")
    for source_id in ("bhagavata", "vaidya"):
        source = library["sources"][source_id]
        sources[source_id] = {
            "work": source["title"], "edition": source["edition"], "creator": source["attribution"],
            "url": source["url"], "locator": "Selected passages in the Kṛṣṇa reading path",
            "basis": "primary-text", "use": "Links to editions with editorial paraphrase",
            "review": "edition-and-locators-checked",
        }
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
    for day in reading["warDays"]:
        if day.get("scene"):
            continue
        id_ = f'ma-day-{day["day"]}'
        line = day["marker"]
        book, chapter, verse = (int(part) for part in (line[:2], line[2:5], line[5:8]))
        url = f'{atlas["books"][book - 1]["url"]}#:~:text={line}'
        add(id_, "episode", "mahabharata", f'War day {day["day"]}', day["event"], f'/mahabharata/?day={day["day"]}')
        edge(id_, "ma-place-kurukshetra", "takes place in", f"BORI {book}.{chapter}.{verse}", day["boundary"], locator_url=url)
    for earlier, later in zip(reading["warDays"], reading["warDays"][1:]):
        left = f'ma-episode-{earlier["scene"]}' if earlier.get("scene") else f'ma-day-{earlier["day"]}'
        right = f'ma-episode-{later["scene"]}' if later.get("scene") else f'ma-day-{later["day"]}'
        line = later["marker"]
        book, chapter, verse = (int(part) for part in (line[:2], line[2:5], line[5:8]))
        edge(left, right, "precedes", f"BORI {book}.{chapter}.{verse}", later["boundary"],
             locator_url=f'{atlas["books"][book - 1]["url"]}#:~:text={line}')
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
    edge("ma-person-draupadi", "ma-episode-exile-start", "appears in", "BORI 3.28.1–5",
         "From the forest, Draupadī recalls the family’s departure and challenges Yudhiṣṭhira’s restraint.",
         locator_url="https://indology.info/bombay/mahabharata/text/UR/MBh03.txt#:~:text=03028001a")
    if any(note["book"] == 7 and note["chapter"] == 17 for note in read("mahabharata-annotations")):
        edge("ma-day-12", "ma-chapter-7-17", "has an annotated opening", "BORI 7.17.1–7",
             "The oath-bound force’s deployment opens the separate fight against Arjuna.",
             locator_url="https://indology.info/bombay/mahabharata/text/UR/MBh07.txt#:~:text=07017001a")

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
        edge("ra-episode-ring", "ra-episode-sita-deadline", "leads to", "Baroda 5.35.7–8",
             "Once the token has established trust, Sītā explains the deadline to Hanumān.", "baroda",
             f'{ram_index["books"][4]["url"]}#:~:text=5035007a')

    maratha = read("maratha-history", {})
    if maratha:
        dated = {item["id"]: item for item in maratha["events"]}
        for period in maratha["periods"]:
            first = next(item for item in dated.values() if item["period"] == period["id"])
            id_ = f'maratha-period-{period["id"]}'
            add(id_, "period", "maratha", period["title"], period["summary"], f'/swarajya/history/?event={first["id"]}')
            edge("work-maratha", id_, "includes", f'{period["start"]}–{period["end"]} CE',
                 "A period groups several documented political changes.", first["source"])
        for place in maratha["places"]:
            id_ = place["id"]
            if id_ != "raigad":
                add(f"maratha-place-{id_}", "place", "maratha", place["name"], f'{place["precision"]}. {place["summary"]}',
                    f"/swarajya/history/?place={id_}")
            edge(f"maratha-place-{id_}", f'source-{place["source"]}', "is documented by", "Geographic reference and source of identification",
                 place["summary"], place["source"])
        for id_, event in dated.items():
            if id_ != "capital":
                add(f"maratha-event-{id_}", "episode", "maratha", event["title"], event["summary"], f"/swarajya/history/?event={id_}")
                edge(f"maratha-event-{id_}", f'maratha-place-{event["place"]}', "is placed at", event["date"],
                     event["summary"], event["source"])
            edge(f"maratha-event-{id_}", f'maratha-period-{event["period"]}', "is placed in", event["date"],
                 event["consequence"], event["source"])
            edge(f"maratha-event-{id_}", f'source-{event["source"]}', "is documented by", event["date"],
                 event["summary"], event["source"])
        actors = [
            ("shivaji", "Shivaji Maharaj", "Founded Swarajya and made Raigad his capital.", "capital", "is crowned at"),
            ("sambhaji", "Sambhaji", "Succeeded Shivaji while Mughal pressure intensified.", "sambhaji", "rules during"),
            ("rajaram", "Rajaram", "Took leadership to a fortified base in the south.", "rajaram", "moves court during"),
            ("tarabai", "Tarabai", "Led resistance and acted for her son after Rajaram’s death.", "tarabai", "leads"),
            ("shahu", "Shahu", "Claimed the throne on release and built a court at Satara.", "shahu", "claims authority in"),
            ("bhau", "Sadāśivrāo Bhāu", "Commanded the Maratha expedition that reached Panipat.", "kunjpura", "leads"),
        ]
        for id_, name, summary, event, relation in actors:
            entry = dated[event]
            add(f"maratha-person-{id_}", "person", "maratha", name, summary, f"/swarajya/history/?event={event}")
            edge(f"maratha-person-{id_}", f"maratha-event-{event}", relation, entry["date"], summary, entry["source"])
        edge("maratha-place-raigad", "maratha-place-rajgad", "shares a heritage listing with", "World Heritage property 1739",
             "The inscribed components give two hill-fort comparisons. Their inclusion alone supplies no itinerary.", "unesco-forts")
        edge("maratha-place-vasai", "source-maratha-port-ledger", "has a fiscal record", "1739, Appendix C-2",
             "The account documents a port under administration after the change of possession.", "maratha-port-ledger")

    add("purana-person-krishna", "person", "purana", "Kṛṣṇa across three texts",
        "Follow the Yamunā, Mathurā and Dvārakā readings and compare their sources.", "/krishna/", ["Krishna", "कृष्ण"])
    for episode in library["episodes"]:
        if episode["collection"] not in ("bhagavata", "harivamsa"):
            continue
        id_ = f'purana-episode-{episode["id"]}'
        passage = episode["passages"][0]
        source = passage["source"]
        add(id_, "episode", "purana", episode["title"], episode["summary"], episode["path"], episode["aliases"])
        edge("purana-person-krishna", id_, "appears in", passage["locator"], passage["reading"], source, passage.get("url", ""))
        edge(id_, f"source-{source}", "is told in", passage["locator"], passage["reading"], source, passage.get("url", ""))
    edge("purana-episode-harivamsa-kamsa", "purana-episode-krishna-mathura", "retells", "Vaidya 76.40–43",
         "The Harivaṃśa moves directly from Kaṃsa’s death to Kṛṣṇa greeting his parents.", "vaidya",
         sources["vaidya"]["url"] + "#:~:text=HV_76.40")
    edge("purana-episode-krishna-dvaraka", "ma-episode-dvaraka", "shares a setting with", "Bhāgavata 10.50.49 and BORI 16.8.40",
         "The Bhāgavata tells of founding the refuge. The Mausala Parva tells of Arjuna leading the people out before the sea covers the city.",
         "bhagavata", "https://vedabase.io/en/library/sb/10/50/49/")
    add("tradition-janmashtami", "tradition", "purana", "Janmāṣṭamī", "Compare the observance rule and two lunar month labels.",
        "/festivals/janmashtami/", ["Janmashtami", "जन्माष्टमी"])
    edge("purana-episode-krishna-birth", "tradition-janmashtami", "is remembered at", "Bhāgavata 10.3.8 and contemporary calendar practice",
         "The birth story is read alongside a lesson applying a modern midnight observance rule.", "bhagavata",
         "https://vedabase.io/en/library/sb/10/3/7-8/")
    edge("tradition-janmashtami", "tool-panchang", "is explored in", "Delhi, 16 August 2025",
         "Compare the tithi, time of day and both month conventions for the modern example.", "panchang-method")
    for id_, title, href, why, guide, source in (
        ("tool-birth-sky", "Compare the birth sky", "/birth-sky/", "The birth tool uses the Moon’s sidereal longitude for its nakshatra.", "concept-nakshatra", "panchang-method"),
        ("tool-rama-navami", "Rāma Navamī", "/festivals/rama-navami/", "The lesson compares the literary birth and the modern ninth tithi observance.", "story-rama-birth", "southern-ramayana"),
        ("tool-observer", "Explore the observer sky", "/mahabharata/?scene=omens&view=sky", "The observer view shows the meridian and modern sky positions at selected sites and dates.", "concept-meridian", "usno-sidereal"),
        ("tool-mean-sun", "Calculate the mean Sun", "/workshop/", "The arithmetic lesson computes a mean longitude from elapsed days in Burgess’s edition.", "tool-panchang", "burgess-mean-sun"),
    ):
        add(id_, "concept", "sky", title, why, href)
        edge(id_, guide, "explains a related calculation", "Modern educational lesson", why, source)

    for clue in read("mahabharata-evidence"):
        if clue["id"] == "stars":
            continue
        id_ = f'research-{clue["id"]}'
        related = {"eclipse": "jayadratha", "season": "bhishma-dies", "dwarka": "dvaraka"}.get(clue["id"], "omens")
        href = f'/mahabharata/?scene={related}&view=evidence&clue={clue["id"]}'
        add(id_, "claim", "sources", clue["title"], clue["claim"], href, [clue["group"]])
        source_id = f'evidence-{clue["id"]}'
        creator = "Nilesh Nilkanth Oak"
        if clue["id"] == "eclipse":
            creator = "Kisari Mohan Ganguli"
        elif clue["id"] == "population":
            creator = "Vagheesh M. Narasimhan and colleagues"
        elif clue["id"] == "hastinapura":
            creator = "B. B. Lal"
        sources[source_id] = {
            "creator": creator, "work": clue["title"], "edition": "Public reference in the evidence catalogue",
            "locator": clue["locator"], "url": clue["url"], "basis": clue["status"],
            "use": "Linked reference and editorial paraphrase", "review": "Editorial evidence record",
        }
        add(f"source-{source_id}", "source", "sources", clue["locator"], f"{creator} · {clue['status']}", clue["url"])
        edge(id_, f"source-{source_id}", "cites", clue["status"], clue["limit"], source_id)
        if clue["id"] in ("eclipse", "season", "dwarka", "planets"):
            edge(f"ma-episode-{related}", id_, "opens the investigation", clue["locator"],
                 "The story opens the evidence record and its assumptions.", source_id)

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


def explorer_catalog(graph):
    """Keep the reading index small. The Mind Map loads full edge evidence on demand."""
    nodes = graph["nodes"]
    by_id = {node["id"]: node for node in nodes}
    neighbors = {id_: set() for id_ in by_id}
    appearances = {}
    for edge in graph["edges"]:
        left, right = edge["from"], edge["to"]
        neighbors[left].add(right)
        neighbors[right].add(left)
        if by_id[left]["kind"] == "person" and by_id[right]["kind"] == "episode":
            appearances.setdefault(left, set()).add(right)
    return {
        "nodes": nodes,
        "sources": graph["sources"],
        "neighbors": {id_: sorted(ids) for id_, ids in neighbors.items() if ids},
        "appearances": {id_: sorted(ids) for id_, ids in appearances.items()},
        "relations": sorted({edge["relation"] for edge in graph["edges"]}),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    graph = build()
    outputs = ((OUTPUT, graph), (CATALOG, explorer_catalog(graph)), (EDGES, graph["edges"]))
    for path, payload in outputs:
        if args.check:
            if not path.is_file() or payload != json.loads(path.read_bytes()):
                raise SystemExit(f"{path.name} is out of date")
        else:
            path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    print(f'{len(graph["nodes"])} graph nodes, {len(graph["edges"])} sourced directed edges')
