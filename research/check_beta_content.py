"""Check versioned collection, place, and source records for the beta."""

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, model_validator


ROOT = Path(__file__).resolve().parent.parent / "content"


def read(name):
    return (ROOT / name).read_bytes()


def unique(values, label):
    ids = set(values)
    if len(ids) != len(values):
        raise ValueError(f"Duplicate {label}")
    return ids


class Collection(BaseModel):
    id: str
    title: str
    description: str


class Source(BaseModel):
    title: str
    edition: str
    attribution: str
    url: HttpUrl


class Passage(BaseModel):
    id: str
    source: str
    chapter: str
    locator: str
    reading: str
    excerpt: str | None = None
    url: HttpUrl | None = None


class Episode(BaseModel):
    id: str
    collection: str
    path: str = Field(pattern=r"^/(arundhati|stories/[a-z-]+)/$")
    title: str
    question: str
    summary: str
    people: list[str] = Field(min_length=1)
    places: list[str] = Field(min_length=1)
    aliases: list[str]
    passages: list[Passage] = Field(min_length=1)
    related: list[str]


class Library(BaseModel):
    version: Literal[1]
    collections: list[Collection]
    sources: dict[str, Source]
    episodes: list[Episode]
    journey: list[str]

    @model_validator(mode="after")
    def check_references(self):
        collections = unique([c.id for c in self.collections], "collection id")
        episodes = unique([e.id for e in self.episodes], "episode id")
        unique([e.path for e in self.episodes], "episode path")
        if set(self.journey) - episodes or len(set(self.journey)) != len(self.journey):
            raise ValueError("Invalid journey order")
        for episode in self.episodes:
            if episode.collection not in collections or set(episode.related) - episodes:
                raise ValueError(f"Invalid collection or episode link in {episode.id}")
            unique([passage.id for passage in episode.passages], f"{episode.id} passage id")
            if any(passage.source not in self.sources for passage in episode.passages):
                raise ValueError(f"Missing source in {episode.id}")
        return self


class Coordinate(BaseModel):
    id: str
    name: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


def check_other_sources():
    cities = json.loads(read("cities.json"))
    swarajya = json.loads(read("swarajya.json"))
    conventions = json.loads(read("conventions.json"))
    land = json.loads(read("swarajya-land.json"))
    if any(record["version"] != 1 for record in (cities, swarajya, conventions, land)):
        raise ValueError("Unsupported source record version")
    place_ids = unique([Coordinate.model_validate(p).id for p in swarajya["places"]], "map place id")
    unique([Coordinate.model_validate(c).id for c in cities["cities"]], "city id")
    unique([event["id"] for event in swarajya["events"]], "event id")
    locations = {event["place"] for event in swarajya["events"]}
    map_source_ids = {p["source"] for p in swarajya["places"] + swarajya["events"] + [swarajya["transect"]]}
    if locations - place_ids or map_source_ids - swarajya["sources"].keys():
        raise ValueError("A map record refers to an unknown location or source")
    for source in list(swarajya["sources"].values()) + [{"url": c["source"]} for c in cities["cities"]]:
        HttpUrl(source["url"])
    HttpUrl(conventions["calendar"]["ayanamsha"]["source"])
    HttpUrl(conventions["calendar"]["definitions"]["url"])
    HttpUrl(land["source"])
    if any(not view["outlines"] for view in land["views"].values()):
        raise ValueError("A Swarajya map is missing its land outlines")
    for lesson in conventions["lessons"].values():
        if not lesson["locator"] or not lesson["status"]:
            raise ValueError("A lesson is missing its source locator or status")
        HttpUrl(lesson["url"])


def main():
    library = Library.model_validate_json(read("library.json"))
    check_other_sources()
    print(f"Validated {len(library.episodes)} annotated episodes, {len(library.collections)} collections, and map and city sources")


if __name__ == "__main__":
    main()
