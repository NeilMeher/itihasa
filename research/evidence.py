"""Canonical v1 models for the investigation's evidence and teaching fixture."""

from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StringConstraints, model_validator


Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
RecordId = Annotated[str, StringConstraints(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
Sha256 = Annotated[str, StringConstraints(pattern=r"^[0-9a-f]{64}$")]


class Record(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)


class Source(Record):
    id: RecordId
    title: Text
    attribution: Text
    edition: Text
    language: Text
    url: HttpUrl
    display_note: Text


class Passage(Record):
    id: RecordId
    source_id: RecordId
    locator: Text
    source_locator: Text
    devanagari: list[Text] = Field(min_length=2, max_length=2)
    source_transliteration: list[Text] = Field(min_length=2, max_length=2)
    working_translation: Text
    translation_credit: Text
    review_note: Text


class Clue(Record):
    id: RecordId
    passage_id: RecordId
    source_id: RecordId
    source_locator: Text
    interpretation: Text
    measure: Text
    uncertainty: Text


class Offset(Record):
    alcor: int = Field(ge=-100, le=100)
    mizar: int = Field(ge=-100, le=100)


class Frame(Record):
    step: int = Field(ge=0)
    offset: Offset


class IllustrativeSky(Record):
    id: RecordId
    kind: Literal["illustrative"]
    clue_id: RecordId
    description: Text
    units: Literal["schematic units"]
    frames: list[Frame] = Field(min_length=3)

    @model_validator(mode="after")
    def check_frame_sequence(self) -> "IllustrativeSky":
        if [frame.step for frame in self.frames] != list(range(len(self.frames))):
            raise ValueError("Frame steps must be consecutive and begin at zero")
        for star in ("alcor", "mizar"):
            offsets = [getattr(frame.offset, star) for frame in self.frames]
            if offsets[0] <= 0 or offsets[-1] >= 0 or 0 not in offsets:
                raise ValueError(f"{star} must have an explicit meridian frame between east and west")
            if any(next_offset >= offset for offset, next_offset in zip(offsets, offsets[1:])):
                raise ValueError(f"{star} must move west on each step")
        return self


class InputArtifact(Record):
    name: Text
    url: HttpUrl
    sha256: Sha256


class Run(Record):
    id: RecordId
    clue_id: RecordId
    method_version: Text
    git_revision: Annotated[str, StringConstraints(pattern=r"^[0-9a-f]{40}$")]
    inputs: list[InputArtifact] = Field(min_length=1)
    original_date_label: Text
    calendar: Text
    time_scale: Text
    start_jd: float
    end_jd: float
    frame_and_observer: Text
    sampling_and_refinement: Text
    tolerance: Text
    assumptions: list[Text] = Field(min_length=1)

    @model_validator(mode="after")
    def check_window(self) -> "Run":
        if self.end_jd <= self.start_jd:
            raise ValueError("Run end must be later than its start")
        return self


class Unavailable(Record):
    status: Literal["unavailable"]
    reason: Text


class UnderReview(Record):
    status: Literal["under_review"]
    run: Run


class Review(Record):
    reviewer: Text
    reviewed_on: date
    notes: Text


class ReviewedResult(Record):
    status: Literal["reviewed"]
    run: Run
    outcome: Literal["match", "mismatch", "inconclusive"]
    finding: Text
    uncertainty: Text
    output: InputArtifact
    review: Review


class EvidenceBundle(Record):
    schema_version: Literal["1.0.0"]
    sources: list[Source] = Field(min_length=2)
    passage: Passage
    clue: Clue
    sky: IllustrativeSky
    historical: Annotated[
        Unavailable | UnderReview | ReviewedResult, Field(discriminator="status")
    ]

    @model_validator(mode="after")
    def check_references(self) -> "EvidenceBundle":
        source_ids = {source.id for source in self.sources}
        if len(source_ids) != len(self.sources):
            raise ValueError("Source IDs must be unique")
        if {self.passage.source_id, self.clue.source_id} - source_ids:
            raise ValueError("Passage and clue must reference registered sources")
        if self.clue.passage_id != self.passage.id or self.sky.clue_id != self.clue.id:
            raise ValueError("Fixture and clue must link to the investigation's evidence")
        if self.historical.status != "unavailable" and self.historical.run.clue_id != self.clue.id:
            raise ValueError("Research run must reference the investigation's clue")
        return self
