"""Retired unchecked JSON-to-SQL exporter; never silently overwrite duplicates."""

RETIRED_MESSAGE = (
    "Retired: unchecked translation JSON cannot become production SQL. No input "
    "was opened or output changed. Resolve duplicate identities from source "
    "evidence and review exact content before a separate database preflight and "
    "migration. See docs/recommendation-rollout.md#legacy-import-retirement."
)


def json_to_sql(input_file, output_file):
    """Reject old imports instead of applying last-write-wins deduplication."""
    raise RuntimeError(RETIRED_MESSAGE)


if __name__ == "__main__":
    import sys

    print(RETIRED_MESSAGE, file=sys.stderr)
    sys.exit(2)
