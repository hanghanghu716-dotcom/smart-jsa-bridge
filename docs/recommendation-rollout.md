# Recommendation data and locale rollout

Percentages remain text similarity. Ambiguous IDs, cross-language score propagation and stale references are rejected. A percentage is not approval or an accident-prevention probability. Code tests do not establish production semantic accuracy.

## Implemented behavior

- Master and translation IDs are distinct. Legacy lookups follow the document data language; additional controls retain the original hazard/current-control chain. Invalid/conflicting scores are omitted without maximization or rescaling.
- Text/context edits invalidate dependent references, confirmation and ratings while retaining user text. Unique exact same-language rematching is supported; ambiguous matches stay unmatched.
- Case selection goes through steps and required/excluded conditions, Info, Procedure and Analysis. Runtime source-fingerprint checks block changed sources and read errors. Case recommendations never fall back to legacy mappings.
- Selecting a control does not confirm implementation. The per-row confirmation checkbox was removed at the user’s request; additional recommendations follow the selected control without requiring that checkbox, and no automatic implementation attestation is stored. Imported ratings stay blank. Assessment criteria and reassessment history are preserved. In a 5 × 5 matrix, totals above 15 display a warning and block forward navigation and completion; 15 is permitted. Completion rechecks every step, using frequency × severity rather than a stored total. This application rule is separate from the configurable highlight colour.
- Language and jurisdiction are independent. Reused content retains its source language. All 18 Locale outputs preserve confirmation markers, PPE/permits, criteria and direction. Search tags inspect authored terms, not JSON keys.
- Release compilation verifies content/source hashes, technical/regional/translation review, localized applicability labels, score/model/version provenance and compatible control chains. The production bundle currently has no approved candidates; browser recommendations are isolated fixtures.

## Release gates

1. Privileged schema/visibility inspection is complete. Missing masters are confirmed, and duplicate master-ID groups include conflicting content. Aggregate status is recorded in `recommendation-data-corrections.md`; detailed evidence remains private.
2. Check the private operational handover for current backup, restoration, correction and constraint evidence. The public correction register contains dated audit snapshots, not live DB status. Resolve missing and conflicting originals from source evidence and preserve historical IDs, scores and documents. Data restoration alone does not verify the authenticated Supabase application flow.
3. Complete reviews of exact content/source revisions. The 54 regional drafts cover three bounded tasks across all 18 Locales; they are not complete country or task coverage. All 54 now have a read same-jurisdiction technical reference, and all 54 still require regional review. Russian normative reproductions and unread issuer-hosted scans are identified separately; a duration amendment is metadata, not task-control evidence. Narrow machine/construction/workshop source scopes and exposure-programme conditions remain required. Other work/hazard groups need applicable official/equipment sources and authored units. Shared language is not regional approval. See `recommendation-task-coverage.json` for the generated matrix.
4. Generate separate mappings with pinned models. Compare current, corrected-legacy and new-knowledge systems on independently labelled cases, including high-score errors, omissions, edits, latency and cost. Derive activation thresholds from evidence.
5. Verify authenticated persistence, real recommendation retrieval and PDF/export against staging data. Activate validated task/jurisdiction groups with prior code/data versions and an atomic rollback path. Do not overwrite saved documents to roll back.

## Authenticated local integration

`authenticated-analysis.yml` runs a pinned Supabase CLI stack in a disposable CI runner. It uses real GoTrue sessions, PostgREST queries and PostgreSQL RLS, with two synthetic users and public, synthetic recommendation fixtures. The actual Analysis editor reads recommendations, preserves their 72%/80% fixture scores as text similarity, saves to the database, restores after navigation, invalidates edited references and renders the document in all 18 UI Locales. Direct API checks cover anonymous access, another user's reads/writes/deletes/RPC, stale revisions and simultaneous saves.

The test-only client is substituted by the isolated Vite server; it accepts only the loopback fixture URL. No application runtime connection, hosted project, production data or private schema export is used. The draft tables, ownership policies and locking function come from three unmodified public migrations. The recommendation tables and minimal project prerequisite are synthetic contracts derived from existing public client queries, not a reconstruction of production DDL. Thus a successful run establishes this integration boundary, not full production-schema parity, semantic relevance, account onboarding, final project persistence or production PDF/export. Those staging and rollout gates remain open. Results are recorded per run in `authenticated-analysis-results`.

To reproduce with Docker and Supabase CLI 2.121.0: run `node scripts/auth-integration/prepare.js`, start the stack with `--workdir .cache/auth-integration` on a loopback-bound Docker network, write `supabase status --output json` for that workdir to `.cache/auth-integration/status.json`, then run `node scripts/authenticated-analysis.cjs`. Stop that workdir with `--no-backup` afterwards. Never substitute hosted credentials or upload the status file.

## Legacy import retirement

`batch_translate_script.py`, `python/advanced_batch_translate.py` and `python/json_to_sql.py` are retired. The two translation commands asked a model to assign IDs and supply regional compliance content, then wrote SQL; the JSON exporter silently kept the last duplicate translation. Existing CLI commands now exit with status 2, and imported functions raise `RuntimeError` before file or API access. They never generate partial SQL or overwrite operator files. These are offline utilities, not application runtime code.

Use the versioned drafts in `data/recommendation-knowledge` for authored content. Preserve verified source identities; an AI translation cannot establish a canonical ID, legal applicability or review approval. Complete technical, regional and translation reviews of exact revisions before release. `python/reconstruct_hazard_id.py` stages only independently reviewed hazard correspondences, and `python/recommendation_staging.py` scores explicitly reviewed contextual pairs with pinned models. Neither replaces content review or emits production SQL. Any DB import still requires live-data preflight, a restorable backup and a reviewed migration. Percentages keep their text-similarity meaning.

## Evaluation input contract

The 2026-10-15 maintenance wording follow-up checked all 18 machine-maintenance drafts for an explicit response to their stated stored-energy hazard. Thirteen drafts now state mitigation and verification more clearly; five already contained the action. `recommendation-maintenance-review-20261015.json` binds the narrow findings to the exact revisions. This AI-assisted pass grants no publication approval. New references distinguish Japanese design guidance, French restart guidance, Saudi facilities guidance and a Russian operator procedure from equipment instructions or national legal approval. The operator PDF is partial, and its unseen appendices were not checked. All 57 drafts still require the existing publication reviews and independent evaluation.

`evaluation-incidents.en-US.json` contains three primary-source historical incident contexts and six proposed candidate contrasts reserved by source group for held-out evaluation. All document translations/variants stay together. Labels are pending. The six Russian observations in `evaluation-seed.json` still need original task and canonical-group resolution. Neither file is a measured performance result.

```text
node scripts/recommendation-comparison.js approved-dataset.json measured-runs.json new-report.json
```

Dataset: schemaVersion 1, queries and samples. Each query needs id, Locale, jurisdiction, sourceGroupId, task, partition and complete hazard/current-control context. Each sample needs queryId, matching scope/partition, queryContextHash from evaluationQueryHash(query), groupVerified, candidate text, independently judged Boolean relevant and a review with reviewer/date/contentHash from evaluationReviewHash(sample). Changed query context or sample text requires renewed review.

Runs: an array of systems with id, version, trainingSourceGroups, tuningSourceGroups and one response per held-out query. Each response has queryId, status (ok/error), predictions ([{sampleId, score}]) and measured latencyMs/costUsd (or null). Empty results use ok with []; failures use error with []. Never invent a run. Returned candidates must belong to the same query; add and independently review previously unjudged candidates before comparison.

The report counts empty/error queries as misses for reviewed positive queries. Precision and bins cover reviewed candidates only. Unknown cost is never treated as zero. Group separation cannot establish independence from pretrained corpora. Three US cases do not represent every country or hazard.

## Prepare and receive independent relevance reviews

The committed `data/recommendation-knowledge/evaluation-review-packet.en-US.json` is ready to copy for a reviewer. All six decisions remain null. Supply only the packet and its referenced source documents, without original proposed answers or model outputs. The packet retains task, hazard, current-control context when present, jurisdiction and sources, but hides scores, hints and IDs that reveal the proposed answer. It contains the existing three US incidents, not a representative multilingual benchmark.

```text
node scripts/recommendation-review-packet.js export data/recommendation-knowledge/evaluation-incidents.en-US.json new-review-packet.json
node scripts/recommendation-review-packet.js import data/recommendation-knowledge/evaluation-incidents.en-US.json completed-review-packet.json new-reviewed-dataset.json
```

The reviewer must record each Boolean relevance decision, rationale, reviewer/date and explicit source-check and independence declarations. These are attestations, not external verification of the reviewer. Import checks the frozen dataset and unchanged context, requires all candidates exactly once, binds accepted labels with the existing content hashes, and creates a new output without overwriting source files. It does not create model runs, rescore data, approve knowledge-bank content, or write to the DB. Actual independent review and real-system measurements remain required.

## Verified baseline

At remote commit `343e95a846f432d5a06cc775ee706bd4bb23cf4a` (the baseline before the Russian-source/review-packet follow-up):

- Clean-install full JS suite: 362 passed, zero failed. Dedicated suite: 57 JS and 14 Python tests passed.
- All 18 Locale browser cases passed actual Analysis/DocumentDesigner/Export, guest restore, HTML/text clipboard, downloaded application PDF, and legacy Export with English UI plus target document language.
- All 18 case-selection flows passed required/excluded conditions, Info/Procedure/Analysis, 72% current selection, explicit confirmation, 80% additional selection and changed-source blocking. These scores exist only in fixtures.
- The dedicated browser workflow and public-data audit succeeded in run `38663042042`; storage concurrency succeeded in run `38663042049`.
- Full content run `38663042127` passed RSS checks, the production build, 108 localized guide HTML/PDF pairs and public page metadata validation. Earlier RSS/DB failures are not the current result.
- Public audit recovered at 2026-10-14 11:23 UTC; see `recommendation-audit-restored-20261014.json`. Public reads do not verify privileged constraints or authenticated accounts.

The Russian-source follow-up fills the three remaining technical-source gaps using identified normative reproductions and preserves the unread issuer-hosted scan leads. Duration metadata alone cannot satisfy technical coverage. The independent review packet is prepared with no decisions filled. Its 23 targeted local comparison/knowledge/coverage/release tests pass; current-head CI results are tracked in PR #25. Baseline results above are not automatically attributed to later code. Content reviews, actual corpus comparison, authenticated staging and application rollout remain open. Consult the private operational handover for current backup and DB correction status.
