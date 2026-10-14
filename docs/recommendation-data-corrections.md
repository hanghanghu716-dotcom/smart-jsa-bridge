# Recommendation data correction register - 2026-10-14

The public DB audit recovered at **11:23:23 UTC**. `recommendation-audit-restored-20261014.json` records complete sequential reads of six content/mapping tables and three master tables under public-anon/RLS visibility. Earlier 503/522 attempts remain separate evidence. This is not a consistent backup or proof of privileged visibility. No production data or constraints have changed.

| Finding | Latest evidence | Prepared action and remaining dependency |
| --- | --- | --- |
| Missing hazard master IDs | 345 es-ES + 345 ru-RU translations | Preserve translation IDs; resolve canonical correspondence from originals and bilingual review, never numeric offsets |
| Public master visibility mismatch | 1,254 control and 2,948 additional-control translations reference absent public masters | Management read must distinguish hidden rows from actual orphans; do not delete based on public absence |
| Duplicate current-to-advanced mappings | 2,580 identical-score pairs, 2,580 extra rows, zero conflicting-score pairs | Inspect full rows, metadata, primary keys and inbound dependencies after a restorable backup; never select the maximum score |
| Invalid control Locale | One translation has an unsupported Locale | Review original text, source history, master relation and possible target-Locale collisions before correction |
| Missing mappings | it-IT, en-CA, ja-JP, pt-BR, ar-SA; English Canadian provinces share en-CA | Author applicable units, review them, generate separate mappings with a compatible model, then evaluate |
| High-score contextual mismatches | Six observed Russian pairs retained for review | Withhold these exact pairs in frontend policy; preserve DB scores; independently establish original work context |
| Shared language without regional approval | en-SG, Canadian provinces, fr-CA-QC and other scoped sources | Keep language and jurisdiction independent; foreign guidance does not certify local applicability |

## Prepared content and application

Three case-derived units retain exact live source fingerprints and now include task/hazard/target scope, required/excluded conditions and display labels. Eighteen regional drafts have localized condition labels. All 21 units remain drafts with technical, regional and translation review pending. An initial maintenance unit per Locale is not complete country coverage; pressure-equipment opening and welding remain gaps.

Korean section 92 and relevant sections of Saudi EXPRO's project isolation guide were checked against official full sources. The Saudi guide is project guidance, not national legal certification. The Brazilian consolidated PDF was subsequently read at 12.11.3 and its exceptions, and the draft scope was updated. Russian official original/amendment publication identifiers were found, but full-text requests timed out; domestic applicability remains unverified. Victoria guidance does not cover all Australia; Great Britain guidance does not certify Northern Ireland.

The case-selection, condition, evidence and confirmation flow is connected to the application. Its production release remains empty until actual content reviews and mapping provenance exist. Test recommendations are isolated fixtures.

Three official incident contexts (fall, electrical arc, nitrogen asphyxiation) provide six proposed related/unrelated candidates in `evaluation-incidents.en-US.json`. Labels remain null pending independent review. Canonical document grouping is separate from relevance approval. Historical investigations are not current legal certification.

## Read-only correction preflight

1. Run `scripts/sql/audit-recommendation-schema.sql` on the intended project using the authorized management reader. Inspect column types, outgoing/incoming constraints, master/translation RLS and visibility.
2. After confirming schema compatibility, run `scripts/sql/review-recommendation-corrections.sql`. Its repeatable-read, read-only transaction captures missing references, the unsupported-Locale row and complete duplicate rows, then rolls back. Keep returned evidence privately. This is not a backup.
3. Create and restore-test a consistent backup of affected tables and dependencies. Privately record project, timestamp, schema version, counts, backup location, digest and rehearsal result. No such backup is claimed here.
4. Build a reviewed change manifest with original row identity/hash, reason, exact proposed fields, source evidence, reviewer, expected affected-row count and rollback action. Preserve IDs and original scores. Do not use ctid, arbitrary row order, numeric offsets or score maxima.
5. Apply schema-verified changes to staging, compare counts/references, then run content, Locale and user-flow checks. Prepare an immutable candidate release and previous-version rollback pointer before production activation.

## Offline generation and evaluation

Both Python generators require explicit contextual pairs, Locale, reviews, model and pinned revision. They output new staging JSON, not production SQL. Additional controls retain the task and original hazard. Korean-only embeddings are rejected for Russian inputs. No real corpus has been rescored and no model winner is claimed.

`recommendation-comparison.js` compares explicit outputs on frozen queries, including empty/error responses. Labels bind full query context and sample content by hashes. Source groups cannot overlap development/tuning/held-out partitions. Unreviewed labels and unmeasured costs/timings remain unknown. The report includes reviewed top-three relevance, high-score errors, omissions, latency and cost, not safety probabilities. See the rollout document for its input contract.

## Operational dependencies

No Supabase management tool or DB-management credential is exposed in this session. Public schema discovery previously returned 401 and Vercel environment metadata returned 403; the row audit no longer retries public schema discovery. This does not mean the user's account lost its connection. Authorization is already given. Management access, independently recorded reviews, actual corpus evaluation, staging and restore rehearsal remain dependencies. No production write, merge or deployment occurred.

Detailed row evidence and a non-executable Locale correction proposal are retained in the local working copy. Automatic approval review blocked remote publication of that detailed payload. Only aggregate counts and code are included in this follow-up. Public audit logs/artifacts now use an allowlisted summary without row IDs, source text, project identifiers or source fingerprints.
