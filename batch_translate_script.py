"""Retired current-control translation-to-SQL command.

Keep the former module and function importable so old operator invocations fail
before SDK initialization, input reads, model-assigned IDs or partial exports.
"""

RETIRED_MESSAGE = (
    "Retired: automatic translation cannot assign database IDs or certify regional "
    "compliance. No API request or output was created. Author versioned drafts in "
    "data/recommendation-knowledge with verified source identities, then obtain "
    "technical, regional and translation reviews. See "
    "docs/recommendation-rollout.md#legacy-import-retirement."
)


def batch_translate_json(input_filepath, output_filepath):
    """Reject the historical API before opening inputs or creating outputs."""
    raise RuntimeError(RETIRED_MESSAGE)


if __name__ == "__main__":
    import sys

    print(RETIRED_MESSAGE, file=sys.stderr)
    sys.exit(2)
