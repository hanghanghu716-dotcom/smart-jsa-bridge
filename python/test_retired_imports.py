"""Old operator commands must stop without network, partial files or overwrites."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import advanced_batch_translate
import json_to_sql


class RetiredImportTests(unittest.TestCase):
    def test_old_function_calls_stop_before_io(self):
        with patch("builtins.open", side_effect=AssertionError("Unexpected file access")):
            with self.assertRaisesRegex(RuntimeError, "Retired"):
                advanced_batch_translate.batch_translate_advanced_json(
                    "missing.json", "output.json", 2000, "measure_translations"
                )
            with self.assertRaisesRegex(RuntimeError, "Retired"):
                json_to_sql.json_to_sql("missing.json", "output.sql")

    def test_import_needs_no_sdk_or_credentials(self):
        # -S excludes third-party SDKs; an unset key must not block module import.
        env = {key: value for key, value in os.environ.items() if key != "GEMINI_API_KEY"}
        result = subprocess.run(
            [sys.executable, "-S", "-c", "import advanced_batch_translate, json_to_sql"],
            cwd=Path(__file__).parent, env=env, capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_legacy_commands_fail_without_creating_or_changing_files(self):
        for script in ("advanced_batch_translate.py", "json_to_sql.py"):
            with self.subTest(script=script), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                for name in (
                    "Advanced_Measures_Translations_rows.json", "esrudata.json",
                    "Advanced_Measures_Translations_output.json", "insert_all_data.sql",
                ):
                    (root / name).write_bytes(b"original operator file\n")
                before = {p.name: p.read_bytes() for p in root.iterdir()}
                result = subprocess.run(
                    [sys.executable, "-S", str(Path(__file__).with_name(script))],
                    cwd=root, capture_output=True, text=True, check=False,
                )
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertIn("legacy-import-retirement", result.stderr)
                self.assertEqual({p.name: p.read_bytes() for p in root.iterdir()}, before)


if __name__ == "__main__":
    unittest.main()
