# Guidance source capture and review binding

Guidance drafts previously retained source URLs without a fingerprint. Their supporting references were also absent from the capture inventory. The new capture manifest records selected source representations and binds every primary and supporting citation before assigning a unit fingerprint.

## Current evidence

On 2026-10-16, five source representations were collected: OSHA 1910.147 and 1910.252, HSE maintenance and welding guidance, and the Parker OIL-X user guide (17 118 6204, 07/21 Rev -). All cited sections of six US/GB drafts are covered. The other 48 guidance drafts retain null fingerprints. All 54 guidance drafts and the three case drafts remain unpublished and await actual content reviews.

`data/recommendation-knowledge/guidance-source-captures.json` stores URLs, observed editions, scopes, exact covered citation strings, selected extraction ranges and SHA-256 digests. It does not store complete original HTML/PDF bytes. A digest identifies the selected extracted text, not the entire document, legal applicability, or currentness of a live website. Changes outside the selected ranges are not detected. A new retrieval and comparison are needed to check upstream changes.

The extraction procedure removes line/page prefixes and converts retrieval link markers to visible link text, preserving other text and joining lines with LF. The selectors refer to the recorded extraction, not stable publisher line numbers. Future collectors must read the cited sections, record their new selectors and regenerate the manifest; a changed representation conservatively requires review again. Retrieval dates alone do not invalidate identical evidence.

Third-party source text is supplied separately for digest verification. It is not included in the repository or recommendation release. Do not substitute a summary or URL for captured source content. Preserve authorized source evidence privately under the applicable reproduction terms, or re-fetch it when needed.

## Scope findings requiring professional review

- OSHA 1910.147 supports the energy-control concepts within its stated scope. It does not supply a complete filter-opening procedure.
- OSHA 1910.252(c)(1)-(3) contains several ventilation arrangements and conditions. A conservative source-extraction recommendation must not be presented as a universal federal requirement for every welding situation.
- HSE maintenance guidance describes isolation, prevention of reconnection and control of stored energy. Great Britain scope is retained; Northern Ireland applicability has not been established.
- HSE welding guidance distinguishes regular and sporadic work. The current drafts cover regular indoor work; the sporadic-work example must not be generalized to it.
- The Parker manual gives model-specific reverse-flow precautions and depressurisation guidance. It is a manufacturer example, not a universal procedure or local legislation. Valve sequences, waiting times and torque values are not transferred to other equipment.

These are AI-assisted source comparisons, not technical, regional or translation approvals. No reviewer identities or decisions have been generated.

## Commands

Check committed metadata against the exact references in a bank:

```sh
node scripts/recommendation-guidance-sources.js --check data/recommendation-knowledge/regional-drafts.json data/recommendation-knowledge/guidance-source-captures.json
node scripts/recommendation-guidance-sources.js --check data/recommendation-knowledge/pressure-welding-drafts.json data/recommendation-knowledge/guidance-source-captures.json
```

Bind newly captured evidence into a separate output for review:

```sh
node scripts/recommendation-guidance-sources.js --bind bank.json manifest.json private-evidence.json next-bank.json
```

Evidence input has `schemaVersion: 1` and `captures`, each with an `id`, exact `url`, and ordered `fragments` containing `selector` and `text`. Each fragment must match the manifest SHA-256 and UTF-8 length. A missing citation, missing covered section or changed fingerprint clears prior approval and content-review hash. Retired units stay retired. Revisions should be incremented when accepting a changed bound bank.

The check command runs in recommendation CI. It checks consistency with recorded captures, without network retrieval. The bind command verifies the supplied extracted text but cannot attest its origin independently; reviewers must inspect provenance and content. A matching hash is not approval. The existing case-based release CLI still rejects guidance compilation; this change prepares reviewable drafts and does not enable guidance publication or alter the production DB, mappings or scores.

## Attribution

OSHA sources are US federal regulatory text. HSE source material is licensed under the Open Government Licence v3.0: https://www.hse.gov.uk/help/copyright.htm . Contains public sector information published by the Health and Safety Executive and licensed under the Open Government Licence. Parker source metadata identifies the copyrighted manufacturer manual; no manual text is redistributed here.
