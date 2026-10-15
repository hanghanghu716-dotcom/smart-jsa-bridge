import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from reconstruct_hazard_id import fingerprint, stage_reviewed_links


class HazardLinkStagingTest(unittest.TestCase):
    def setUp(self):
        self.rows = [{"id": 10, "hazard_id": None, "locale": "es-ES", "hazard_name": "Riesgo de prueba"},
                     {"id": 11, "hazard_id": None, "locale": "ru-RU", "hazard_name": "Synthetic source"}]
        self.masters = [{"id": 3, "hazard_name": "Synthetic source hazard", "category": "Test"}]
        self.link = {"translationId": 10, "masterId": 3, "locale": "es-ES",
                     "translationHash": fingerprint(self.rows[0]), "masterHash": fingerprint(self.masters[0]),
                     "review": {"approved": True, "independent": True, "reviewer": "Synthetic test reviewer",
                                "reviewedAt": "2026-01-01T00:00:00Z", "sourceEvidence": "Synthetic fixture correspondence"}}
        self.manifest = {"schemaVersion": 1, "links": [self.link]}

    def test_staging_preserves_inputs_and_does_not_claim_production_approval(self):
        original = copy.deepcopy(self.rows)
        result = stage_reviewed_links(self.rows, self.masters, self.manifest)
        self.assertEqual(self.rows, original)
        self.assertFalse(result["productionReady"])
        self.assertEqual(result["unresolvedCount"], 1)
        self.assertEqual(result["links"][0]["translationId"], 10)
        self.assertIsNone(result["links"][0]["previousMasterId"])
        self.assertEqual(result["links"][0]["proposedMasterId"], 3)
        self.assertNotIn("similarity_score", result["links"][0])

    def test_no_high_similarity_or_missing_review_fallback(self):
        self.manifest["links"][0] = {"translationId": 10, "masterId": 3, "similarityScore": 1.0}
        with self.assertRaises(ValueError):
            stage_reviewed_links(self.rows, self.masters, self.manifest)
        self.assertEqual(stage_reviewed_links(self.rows, self.masters, {"schemaVersion": 1, "links": []})["unresolvedCount"], 2)

    def test_changed_translation_or_canonical_content_invalidates_review(self):
        for target in ("translation", "master"):
            rows, masters = copy.deepcopy(self.rows), copy.deepcopy(self.masters)
            (rows if target == "translation" else masters)[0]["hazard_name"] += " changed"
            with self.assertRaisesRegex(ValueError, "Source content changed"):
                stage_reviewed_links(rows, masters, self.manifest)

    def test_existing_links_ambiguous_ids_and_locale_mismatch_are_rejected(self):
        rows = copy.deepcopy(self.rows)
        rows[0]["hazard_id"] = 8
        with self.assertRaisesRegex(ValueError, "non-null"):
            stage_reviewed_links(rows, self.masters, self.manifest)
        with self.assertRaisesRegex(ValueError, "duplicate IDs"):
            stage_reviewed_links(self.rows, self.masters * 2, self.manifest)
        self.link["locale"] = "ru-RU"
        with self.assertRaisesRegex(ValueError, "Locale"):
            stage_reviewed_links(self.rows, self.masters, self.manifest)

    def test_review_must_be_independent_named_and_dated(self):
        for field, value in (("approved", False), ("independent", False), ("reviewer", ""),
                             ("sourceEvidence", ""), ("reviewedAt", "2026-01-01")):
            manifest = copy.deepcopy(self.manifest)
            manifest["links"][0]["review"][field] = value
            with self.assertRaises(ValueError):
                stage_reviewed_links(self.rows, self.masters, manifest)

    def test_duplicate_and_boolean_ids_are_not_accepted(self):
        with self.assertRaisesRegex(ValueError, "repeated"):
            stage_reviewed_links(self.rows, self.masters, {"schemaVersion": 1, "links": [self.link, self.link]})
        self.rows[0]["id"] = True
        with self.assertRaisesRegex(ValueError, "integer ID"):
            stage_reviewed_links(self.rows, self.masters, self.manifest)

    def test_cli_never_overwrites_sources_or_writes_sql(self):
        script = Path(__file__).with_name("reconstruct_hazard_id.py")
        workspace = Path.cwd().resolve()
        cache = (workspace / '.cache').resolve()
        self.assertTrue(cache.is_relative_to(workspace))
        cache.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=cache, prefix='hazard-link-') as folder:
            self.assertTrue(Path(folder).resolve().is_relative_to(cache))
            root = Path(folder)
            for name, value in (("translations", self.rows), ("masters", self.masters), ("reviews", self.manifest)):
                (root / f"{name}.json").write_text(json.dumps(value), encoding="utf-8")
            args = [sys.executable, str(script)]
            for name in ("translations", "masters", "reviews"):
                args += ["--" + name, str(root / f"{name}.json")]
            for output in (root / "changes.sql", root / "translations.json"):
                self.assertNotEqual(subprocess.run(args + ["--output", str(output)], capture_output=True).returncode, 0)
            output = root / "staging-v1.json"
            self.assertEqual(subprocess.run(args + ["--output", str(output)], capture_output=True).returncode, 0)
            self.assertNotEqual(subprocess.run(args + ["--output", str(output)], capture_output=True).returncode, 0)
            self.assertFalse((root / "changes.sql").exists())


if __name__ == "__main__":
    unittest.main()
