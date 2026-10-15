"""Build reviewed hazard-link staging data. Never infer identity from embeddings or emit SQL."""
import argparse
import hashlib
import json
from datetime import datetime
from pathlib import Path


def fingerprint(row):
    payload = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def index_rows(rows, label):
    if not isinstance(rows, list):
        raise ValueError(f"{label}: expected an array")
    result = {}
    for row in rows:
        if not isinstance(row, dict) or type(row.get("id")) is not int or row["id"] <= 0:
            raise ValueError(f"{label}: a positive integer ID is required")
        if row["id"] in result:
            raise ValueError(f"{label}: duplicate IDs require source review")
        result[row["id"]] = row
    return result


def stage_reviewed_links(translations, masters, manifest):
    source = index_rows(translations, "translations")
    canonical = index_rows(masters, "masters")
    if not isinstance(manifest, dict) or manifest.get("schemaVersion") != 1 or not isinstance(manifest.get("links"), list):
        raise ValueError("A schemaVersion 1 reviewed-links manifest is required")
    staged, seen = [], set()
    for link in manifest["links"]:
        if not isinstance(link, dict):
            raise ValueError("Each link must be an object")
        tid, mid = link.get("translationId"), link.get("masterId")
        if type(tid) is not int or type(mid) is not int or tid not in source or mid not in canonical or tid in seen:
            raise ValueError("Missing, repeated or invalid reviewed identity")
        seen.add(tid)
        row, master = source[tid], canonical[mid]
        if row.get("hazard_id") is not None:
            raise ValueError("Existing non-null links cannot be reassigned by this repair")
        locale = row.get("locale")
        if not isinstance(locale, str) or not locale.strip() or link.get("locale") != locale:
            raise ValueError("Exact source Locale is required")
        if not isinstance(row.get("hazard_name"), str) or not row["hazard_name"].strip():
            raise ValueError("Translation text is required")
        if not isinstance(master.get("hazard_name"), str) or not master["hazard_name"].strip():
            raise ValueError("Canonical source text is required")
        if link.get("translationHash") != fingerprint(row) or link.get("masterHash") != fingerprint(master):
            raise ValueError("Source content changed; renew the bilingual/source review")
        review = link.get("review")
        if not isinstance(review, dict) or review.get("approved") is not True or review.get("independent") is not True:
            raise ValueError("Independent source correspondence approval is required")
        for key in ("reviewer", "sourceEvidence"):
            if not isinstance(review.get(key), str) or not review[key].strip():
                raise ValueError("Named reviewer and original source evidence are required")
        try:
            reviewed_at = datetime.fromisoformat(review["reviewedAt"].replace("Z", "+00:00"))
            if reviewed_at.tzinfo is None:
                raise ValueError("Timezone required")
        except (KeyError, TypeError, AttributeError, ValueError) as exc:
            raise ValueError("A dated review with timezone is required") from exc
        staged.append({
            "translationId": tid, "locale": locale, "previousMasterId": None, "proposedMasterId": mid,
            "translationHash": fingerprint(row), "masterHash": fingerprint(master),
            "review": dict(review), "status": "reviewed_correspondence_pending_database_preflight",
        })
    return {
        "schemaVersion": 1, "kind": "hazard_link_staging", "productionReady": False,
        "unresolvedCount": sum(row.get("hazard_id") is None and tid not in seen for tid, row in source.items()),
        "links": staged,
        "notice": "No SQL, DB writes, percentage changes or regional applicability approval. Recheck live source hashes, uniqueness, backup and rollback before a separate migration.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ("translations", "masters", "reviews", "output"):
        parser.add_argument("--" + arg, required=True)
    args = parser.parse_args()
    inputs = [Path(args.translations), Path(args.masters), Path(args.reviews)]
    output = Path(args.output)
    if output.suffix.lower() != ".json" or output.resolve() in [item.resolve() for item in inputs]:
        parser.error("Use a new staging .json path; input files and SQL outputs are forbidden")
    if output.exists():
        parser.error("Output already exists; use a new versioned staging filename")
    values = [json.loads(item.read_text(encoding="utf-8-sig")) for item in inputs]
    result = stage_reviewed_links(*values)
    with output.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, ensure_ascii=False, indent=2, allow_nan=False)
        stream.write("\n")
    print(json.dumps({"stagedLinks": len(result["links"]), "unresolvedCount": result["unresolvedCount"], "productionReady": False}))


if __name__ == "__main__":
    main()
