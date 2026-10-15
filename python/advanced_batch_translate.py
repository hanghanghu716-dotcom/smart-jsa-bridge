"""Retired translation-to-SQL entry point; kept to fail old invocations clearly."""

RETIRED_MESSAGE = (
    "Retired: automatic translation cannot assign database IDs or certify regional "
    "compliance. No API request or output was created. Author versioned drafts in "
    "data/recommendation-knowledge with verified source identities, then obtain "
    "technical, regional and translation reviews. See "
    "docs/recommendation-rollout.md#legacy-import-retirement."
)


def batch_translate_advanced_json(input_filepath, output_filepath, start_id, target_table):
    """Reject the former API before opening inputs or creating partial outputs."""
    raise RuntimeError(RETIRED_MESSAGE)


if __name__ == "__main__":
    import sys

    print(RETIRED_MESSAGE, file=sys.stderr)
    sys.exit(2)
