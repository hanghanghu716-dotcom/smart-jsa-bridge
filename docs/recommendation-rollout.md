# Recommendation data and locale rollout

Percentages remain text similarity. Ambiguous IDs, cross-language score propagation and stale references are rejected. A percentage is not approval or an accident-prevention probability. Code tests do not establish production semantic accuracy.

## Implemented behavior

- Master and translation IDs are distinct. Legacy lookups follow the document data language; additional controls retain the original hazard/current-control chain. Invalid/conflicting scores are omitted without maximization or rescaling.
- Text/context edits invalidate dependent references, confirmation and ratings while retaining user text. Unique exact same-language rematching is supported; ambiguous matches stay unmatched.
- Case selection goes through steps and required/excluded conditions, Info, Procedure and Analysis. Runtime source-fingerprint checks block changed sources and read errors. Case recommendations never fall back to legacy mappings.
- Selecting a control does not confirm implementation. Explicit confirmation precedes additional recommendations. Imported ratings stay blank. Assessment criteria and reassessment history are preserved.
- Language and jurisdiction are independent. Reused content retains its source language. All 18 Locale outputs preserve confirmation markers, PPE/permits, criteria and direction. Search tags inspect authored terms, not JSON keys.
- Release compilation verifies content/source hashes, technical/regional/translation review, localized applicability labels, score/model/version provenance and compatible control chains. The production bundle currently has no approved candidates; browser recommendations are isolated fixtures.

## Release gates

1. Privileged schema/visibility inspection is complete. Missing masters are confirmed, and duplicate master-ID groups include conflicting content. Aggregate status is recorded in `recommendation-data-corrections.md`; detailed evidence remains private.
2. A consistent private snapshot and an actual-data copy restoration of the two proposed correction targets are complete. Off-site backup and separate staging remain open. Production row corrections were declined or failed before execution, so duplicate and invalid-Locale counts remain unchanged. Resolve missing and conflicting originals from source evidence and preserve historical IDs, scores and documents.
3. Complete reviews of exact content/source revisions. The 54 regional drafts cover three bounded tasks across all 18 Locales; they are not complete country or task coverage. Twelve task/Locale cells still lack a read same-jurisdiction primary reference, and all 54 require regional review. Other work/hazard groups need applicable official/equipment sources and authored units. Shared language is not regional approval. See `recommendation-task-coverage.json` for the generated matrix.
4. Generate separate mappings with pinned models. Compare current, corrected-legacy and new-knowledge systems on independently labelled cases, including high-score errors, omissions, edits, latency and cost. Derive activation thresholds from evidence.
5. Verify authenticated persistence, real recommendation retrieval and PDF/export against staging data. Activate validated task/jurisdiction groups with prior code/data versions and an atomic rollback path. Do not overwrite saved documents to roll back.

## Evaluation input contract

`evaluation-incidents.en-US.json` contains three primary-source historical incident contexts and six proposed candidate contrasts reserved by source group for held-out evaluation. All document translations/variants stay together. Labels are pending. The six Russian observations in `evaluation-seed.json` still need original task and canonical-group resolution. Neither file is a measured performance result.

```text
node scripts/recommendation-comparison.js approved-dataset.json measured-runs.json new-report.json
```

Dataset: schemaVersion 1, queries and samples. Each query needs id, Locale, jurisdiction, sourceGroupId, task, partition and complete hazard/current-control context. Each sample needs queryId, matching scope/partition, queryContextHash from evaluationQueryHash(query), groupVerified, candidate text, independently judged Boolean relevant and a review with reviewer/date/contentHash from evaluationReviewHash(sample). Changed query context or sample text requires renewed review.

Runs: an array of systems with id, version, trainingSourceGroups, tuningSourceGroups and one response per held-out query. Each response has queryId, status (ok/error), predictions ([{sampleId, score}]) and measured latencyMs/costUsd (or null). Empty results use ok with []; failures use error with []. Never invent a run. Returned candidates must belong to the same query; add and independently review previously unjudged candidates before comparison.

The report counts empty/error queries as misses for reviewed positive queries. Precision and bins cover reviewed candidates only. Unknown cost is never treated as zero. Group separation cannot establish independence from pretrained corpora. Three US cases do not represent every country or hazard.

## Verified baseline

At remote commit `7907c36379157c64ed28595956b868af6dc2fffe`:

- Clean-install full JS suite: 346 passed, zero failed. Dedicated suite: 41 JS and seven Python tests passed.
- All 18 Locale browser cases passed actual Analysis/DocumentDesigner/Export, guest restore, HTML/text clipboard, downloaded application PDF, and legacy Export with English UI plus target document language.
- All 18 case-selection flows passed required/excluded conditions, Info/Procedure/Analysis, 72% current selection, explicit confirmation, 80% additional selection and changed-source blocking. These scores exist only in fixtures.
- Modified JSX/utilities passed ESLint; frontend build passed with existing bundle-size/PDF-import warnings. Full RSS/content/prerender CI is separate: its earlier RSS 503 failure was re-run after public DB recovery.
- Public audit recovered at 2026-10-14 11:23 UTC; see `recommendation-audit-restored-20261014.json`. Public reads do not verify privileged constraints or authenticated accounts.

The follow-up adds pending incident labels, empty/error comparison handling, localized condition completeness and DB correction preflight. Current-head CI results are tracked in PR #25; earlier results above are not automatically attributed to later code. Content reviews, actual corpus comparison, authenticated staging, backup/restore and production rollout remain open.
