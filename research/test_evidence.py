import json
import unittest

from pydantic import ValidationError

from check_evidence import FIXTURE
from evidence import EvidenceBundle


class EvidenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))

    def validate(self) -> EvidenceBundle:
        return EvidenceBundle.model_validate_json(json.dumps(self.fixture))

    def test_demo_crossings_follow_the_seed_sequence(self) -> None:
        bundle = self.validate()
        alcor = [frame.step for frame in bundle.sky.frames if frame.offset.alcor == 0]
        mizar = [frame.step for frame in bundle.sky.frames if frame.offset.mizar == 0]
        self.assertEqual((alcor, mizar), ([2], [3]))
        self.assertEqual(bundle.historical.status, "unavailable")

    def test_broken_source_reference_is_rejected(self) -> None:
        self.fixture["passage"]["source_id"] = "missing-source"
        with self.assertRaisesRegex(ValidationError, "reference registered sources"):
            self.validate()

    def test_fixture_requires_an_explicit_crossing_frame(self) -> None:
        self.fixture["sky"]["frames"][2]["offset"]["alcor"] = 1
        with self.assertRaisesRegex(ValidationError, "explicit meridian frame"):
            self.validate()

    def test_illustration_cannot_pose_as_calculated_data(self) -> None:
        self.fixture["sky"]["kind"] = "calculated"
        with self.assertRaisesRegex(ValidationError, "illustrative"):
            self.validate()

    def test_unavailable_state_cannot_include_a_finding(self) -> None:
        self.fixture["historical"]["finding"] = "An unsupported historical finding"
        with self.assertRaisesRegex(ValidationError, "Extra inputs"):
            self.validate()

    def test_reviewed_result_requires_run_provenance_and_review(self) -> None:
        self.fixture["historical"] = {"status": "reviewed", "outcome": "match"}
        with self.assertRaises(ValidationError) as result:
            self.validate()
        missing = {error["loc"][-1] for error in result.exception.errors()}
        self.assertTrue({"run", "review", "output"} <= missing)
