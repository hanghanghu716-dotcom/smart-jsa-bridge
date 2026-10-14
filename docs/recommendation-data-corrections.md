# Recommendation data correction register — 2026-10-14

Evidence: `recommendation-audit-20261014.json` is a sequential, public-anon/RLS-visible read. It is not a transaction-consistent database backup or proof of privileged row visibility. `recommendation-regional-coverage.json` separates language coverage, missing links and regional review. No production rows or constraints have been changed.

The subsequent 10:13 UTC audit attempt could not read any table (HTTP 522); its separate report is `recommendation-audit-unavailable-20261014.json`. Master-row counts, invalid-locale row IDs and identical-versus-conflicting duplicate counts from that attempt remain unknown. The earlier successful counts below are preserved with their original observation time.

| Finding | Observed scope | Prepared action | Release dependency |
| --- | --- | --- | --- |
| Missing hazard master IDs | 345 es-ES + 345 ru-RU | Preserve translation IDs; create reviewed canonical-ID correspondence from original texts | Actual master-table/schema read; bilingual semantic check; no numeric-offset guessing |
| Duplicate current→advanced pairs | 2,580 pairs | Distinguish identical duplicates from conflicting scores; stage reviewed replacements under a new release | Transactional backup; inspect FK/unique constraints; never choose the maximum duplicate score |
| Invalid control locale | One row has locale `4036` | Identify the row and its source history before correcting its language | Actual row evidence and translation verification; do not infer language from this numeric value |
| Missing recommendation links | it-IT, en-CA, ja-JP, pt-BR, ar-SA; Canadian English provinces inherit en-CA | Author/validate task–hazard–control pairs and generate staged mappings | Locale-compatible model, explicit work scope, recorded pair review and held-out evaluation |
| High-score contextual mismatches | Six Russian sample pairs recorded in the audit | Hold the six exact legacy pairs in frontend policy; retain original DB rows and scores for review | Review context before reinstating; this sample does not establish overall error rate |
| Shared language mistaken for local coverage | en-SG, en-CA provinces, fr-CA-QC | Keep document language independent of jurisdiction; use the regional coverage register | Approved regional applicability; no automatic foreign-regulation substitution |

## Concrete artifacts prepared

- Three case-study-derived units are bound to the exact public source-row fingerprints; all remain drafts.
- Eighteen regional drafts each contain task, hazard, cause, consequence, control, verification, conditions, exclusions, keywords and source scope. Initial priority is machine maintenance; Italy's first unit concerns maintenance planning. Pressure-equipment opening and welding exposure remain planned gaps. This is not full country coverage.
- Russia's draft uses foreign technical guidance and has no domestic applicability approval. Its old Ministry page states a 2025 expiry; later amendments remain unverified. Saudi and Korean source retrieval currently relies on official search excerpts and needs full-source review. Australia uses Victoria guidance; Great Britain guidance does not certify Northern Ireland.
- `compileRecommendationRelease` rejects draft/changed sources, missing technical/regional/translation reviews, unreviewed score provenance, duplicate mappings and incompatible control chains. `selectReviewedRecommendations` filters task, hazard, target, jurisdiction, language and site conditions before ranking. These are staged release utilities; they are not yet connected to a production knowledge table or case-selection UI.
- `recommendation-evaluation.js` prevents source-group leakage and reports unreviewed metrics as unknown. Six observed cases are queued in `evaluation-seed.json`; they are not independently approved labels, and no accuracy or calibration improvement is claimed.

## Offline mapping generation

`python/matching.py` and `python/matching2.py` now require explicit input files, locale, reviewed candidates, model and pinned model revision. They produce new JSON staging files and never generate SQL that overwrites production mappings. The first handles hazards→controls; the second requires task and original hazard alongside the current control.

Input rows need their translation ID, locale, jurisdiction, taskType, hazardType, targetType and task_text. Advanced source rows also need hazard_translation_id and hazard_text. Candidate pairs contain sourceId, targetId, conditions, exclusions and a recorded review whose contentHash equals `pair_fingerprint(source, target, pair)`. Conditions are checked against the source work conditions. Existing unannotated exports intentionally fail these checks.

```text
python python/matching.py --sources hazards.json --targets controls.json --candidates reviewed-pairs.json --locale ru-RU --model sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 --model-revision <verified-40-character-SHA> --output candidate-release.json
```

The Korean model is restricted to Korean inputs. The multilingual model is an evaluation candidate, not a selected winner. No model weights were downloaded, no real corpus was rescored, and no measured semantic accuracy claim follows from the fixture tests. Official model references: https://huggingface.co/jhgan/ko-sbert-nli and https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2.

## Execution order after access and review become available

1. Run `scripts/sql/audit-recommendation-schema.sql` using the intended DB's authorized read-only management connection. Inspect actual column types, foreign keys, unique constraints and RLS.
2. Create and verify a restorable, transaction-consistent backup of affected tables. Record immutable backup location and digest privately.
3. Resolve the 690 missing canonical IDs and invalid locale from source evidence. Separate duplicate rows by identical/conflicting score; retain the old release and history.
4. Record technical, regional and translation reviews for the exact content and source revisions. Resolve original source groups for benchmark splits; include fall, electrical, asphyxiation, pressure, machine and unrelated-wording cases.
5. Generate a separate candidate release with model/language/version provenance. Compare current, corrected-legacy and new-knowledge outputs on the same held-out cases. Measure judged coverage, top-3 relevance, high-score error, omissions, edits, latency and cost. Set rollout thresholds from that baseline.
6. Register the approved version in a staging DB, connect the case-selection flow and verify authenticated save/restore and actual PDF/export paths against that data. Preserve user text, historical IDs and document versions.
7. Activate only validated work/jurisdiction groups with an atomic version switch. Roll back by restoring the previous version pointer, without deleting new observations or overwriting saved documents.

## Current access boundary

The application public DB endpoint is readable. Privileged schema inspection returned HTTP 401. No Supabase management tool or local DB-management credential is exposed in this session. Vercel project lookup succeeded, but the same project's environment-variable metadata request returned HTTP 403 for the connected team scope. This does not establish that the user's account has lost its Supabase connection. Permission to do the task is already granted; available management access is the remaining technical dependency.
