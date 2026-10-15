# Recommendation data correction register - 2026-10-14

## Follow-up status - 2026-10-15

Management access is restored. Privileged reads confirmed that the 1,254 current-control and 2,948 additional-control translations genuinely lack their referenced masters. The 690 null hazard links remain. Duplicate master-ID groups were also confirmed: 28 current-control groups (13 with conflicting content) and 108 additional-control groups (six with conflicting content). The audit now reports these aggregate key conflicts; identities and source text remain private.

A consistent private snapshot of eight recommendation tables contains 105,452 rows. An actual-data copy rehearsal excluded 2,580 later duplicate mappings and corrected one Locale only in a copy. Both affected tables were then reconstructed in separate copies; full-row counts and digests matched the snapshot, and retained score bits were unchanged. This is an in-database restore rehearsal, not an off-site backup or a separate staging-project test.

Production corrections remain unapplied. Combined correction requests failed with an expired request state; a separate one-row metadata correction was declined by the management tool. Final reads still show 49,172 live mapping rows, 2,580 duplicate pairs and one invalid Locale. No further row-write retry is scheduled. Source-reviewed master resolution, production application and broader rollout remain open.

Automatic approval review rejected uploading detailed repair SQL and internal operational metadata to the public repository. Those materials remain private. This follow-up publishes only aggregate status, audit code and synthetic unit tests. It does not publish detailed evidence or claim that repair SQL ran in public CI.

The public DB audit recovered at **11:23:23 UTC**. `recommendation-audit-restored-20261014.json` records complete sequential reads of six content/mapping tables and three master tables under public-anon/RLS visibility. Earlier 503/522 attempts remain separate evidence. This is not a consistent backup or proof of privileged visibility. No production data or constraints have changed.

| Finding | Latest evidence | Prepared action and remaining dependency |
| --- | --- | --- |
| Missing hazard master IDs | 345 es-ES + 345 ru-RU translations | Preserve translation IDs; resolve canonical correspondence from originals and bilingual review, never numeric offsets |
| Confirmed missing master references | 1,254 control and 2,948 additional-control translations | Privileged reads confirmed genuine absence; resolve originals without deleting translations or inventing master IDs |
| Duplicate current-to-advanced mappings | 2,580 identical-score pairs, 2,580 extra rows, zero conflicting-score pairs | Inspect full rows, metadata, primary keys and inbound dependencies after a restorable backup; never select the maximum score |
| Invalid control Locale | One translation has an unsupported Locale | Review original text, source history, master relation and possible target-Locale collisions before correction |
| Missing mappings | it-IT, en-CA, ja-JP, pt-BR, ar-SA; English Canadian provinces share en-CA | Author applicable units, review them, generate separate mappings with a compatible model, then evaluate |
| High-score contextual mismatches | Six observed Russian pairs retained for review | Withhold these exact pairs in frontend policy; preserve DB scores; independently establish original work context |
| Shared language without regional approval | en-SG, Canadian provinces, fr-CA-QC and other scoped sources | Keep language and jurisdiction independent; foreign guidance does not certify local applicability |

## Prepared content and application

Three case-derived units retain exact live source fingerprints and now include task/hazard/target scope, required/excluded conditions and display labels. All regional drafts have localized condition labels. The bank now has 57 draft units: 54 regional guidance units (three bounded task types across 18 Locales) and three case-derived pilots. All require technical, regional and translation review. Pressure work is restricted to compressed-air filter maintenance; welding is restricted to regular indoor uncoated mild-steel work. This is not complete country or task coverage.

Korean section 92 and relevant sections of Saudi EXPRO's project isolation guide were checked against official full sources. The Saudi guide is project guidance, not national legal certification. The Brazilian consolidated PDF was subsequently read at 12.11.3 and its exceptions, and the draft scope was updated. Russian official original/amendment publication identifiers were found, but full-text requests timed out; domestic applicability remains unverified. Victoria guidance does not cover all Australia; Great Britain guidance does not certify Northern Ireland.

The case-selection, condition, evidence and confirmation flow is connected to the application. Its production release remains empty until actual content reviews and mapping provenance exist. Test recommendations are isolated fixtures.

Three official incident contexts (fall, electrical arc, nitrogen asphyxiation) provide six proposed related/unrelated candidates in `evaluation-incidents.en-US.json`. Labels remain null pending independent review. Canonical document grouping is separate from relevance approval. Historical investigations are not current legal certification.

## Read-only correction preflight

1. Run `scripts/sql/audit-recommendation-schema.sql` on the intended project using the authorized management reader. Inspect column types, outgoing/incoming constraints, master/translation RLS and visibility.
2. After confirming schema compatibility, run `scripts/sql/review-recommendation-corrections.sql`. Its repeatable-read, read-only transaction captures missing references, the unsupported-Locale row and complete duplicate rows, then rolls back. Keep returned evidence privately. This is not a backup.
3. The private consistent snapshot and two-table copy restoration are complete. Detailed evidence remains private. Off-site backup and separate staging verification remain open; the copy rehearsal does not certify semantic recommendation quality.
4. Build a reviewed change manifest with original row identity/hash, reason, exact proposed fields, source evidence, reviewer, expected affected-row count and rollback action. Preserve IDs and original scores. Do not use ctid, arbitrary row order, numeric offsets or score maxima.
5. Apply schema-verified changes to staging, compare counts/references, then run content, Locale and user-flow checks. Prepare an immutable candidate release and previous-version rollback pointer before production activation.

## Offline generation and evaluation

Both Python generators require explicit contextual pairs, Locale, reviews, model and pinned revision. They output new staging JSON, not production SQL. Additional controls retain the task and original hazard. Korean-only embeddings are rejected for Russian inputs. No real corpus has been rescored and no model winner is claimed.

The legacy hazard-ID reconstruction script no longer chooses a canonical ID by maximum embedding similarity or emits update SQL. It accepts only explicitly reviewed source correspondences, bound to exact translation and master hashes and an unchanged Locale. Duplicate IDs, existing links, stale content, unnamed/undated reviews, source overwrites and SQL outputs are rejected. Unresolved rows remain unresolved. Its versioned JSON output still requires live-data preflight, backup and a separately reviewed migration; it does not approve regional applicability or alter percentages.

`recommendation-comparison.js` compares explicit outputs on frozen queries, including empty/error responses. Labels bind full query context and sample content by hashes. Source groups cannot overlap development/tuning/held-out partitions. Unreviewed labels and unmeasured costs/timings remain unknown. The report includes reviewed top-three relevance, high-score errors, omissions, latency and cost, not safety probabilities. See the rollout document for its input contract.

## Operational dependencies

Supabase management reads and private snapshot/copy creation now work. Public recommendation row corrections remain unapplied after expired or declined management requests. Independently recorded reviews, actual corpus evaluation, off-site backup, authenticated staging and production application remain open. No main merge or site deployment occurred.

Detailed row evidence and a non-executable Locale correction proposal are retained in the local working copy. Automatic approval review blocked remote publication of that detailed payload. Only aggregate counts and code are included in this follow-up. Public audit logs/artifacts now use an allowlisted summary without row IDs, source text, project identifiers or source fingerprints.

## Task coverage follow-up

`node scripts/recommendation-coverage.js --check docs/recommendation-task-coverage.json` verifies that the committed matrix matches every bank. It preserves exact Locale, jurisdiction and task boundaries; distinguishes same-jurisdiction, national, subnational, foreign and unread references; and does not treat a draft or a source match as publication approval. A retired latest revision cannot resurrect an older recommendation. The 54 priority cells have draft content and zero publication-eligible content.

The Italian maintenance unit now uses INAIL production-line energy-control context plus explicitly foreign OSHA verification guidance. The new source metadata remains subject to regional review. HSE’s current distinction between regular and sporadic welding is reflected in the scope; the regular-indoor draft must not be applied to the separate sporadic-work scenario.

Regional source follow-up adds 19 primary-source references across the authored units, including national model guidance and explicitly limited technical guidance. Japan now requires a measured-exposure respiratory protection program for the bounded indoor metal-arc task; the generic conditional-respirator sentence was removed. BC requires an exposure control plan, Québec a fixed welding station, Spain metal-arc welding, and SG/BR/ES pressure drafts an identified machine-integrated filter. Saudi project guidance requires adoption of the project isolation procedure. These source checks do not grant technical, regional or translation approval. The matrix reports missing same-jurisdiction references separately from regional review still required.

BC pressure-work verification explicitly requires each worker’s lockout check. Three unread Ontario/Brazil source leads are retained as leads, not verified local technical evidence.

The 2026-10-15 follow-up adds eight read source references across eight draft revisions, closing seven task/Locale source gaps. Alberta pressure work now requires each worker to test and confirm a safe state. Ontario, Québec, Japan and Italy pressure units require a machine-integrated filter. Ontario welding requires construction work because the IHSA source is a construction manual. Québec maintenance and pressure drafts reflect machine-specific cadenassage, worker participation, residual energy and verification; German pressure work names competent, appointed/instructed personnel and manufacturer information. All changed units remain unapproved drafts with null scores and fingerprints.

Source scope remains explicit: Ontario WSPS/IHSA publications are technical guidance, Japan's source concerns machinery design/protective measures, and the 2020 INAIL presentation is historical technical context. None establishes a complete filter-opening procedure or current legal compliance. Five task/Locale cells still lack a read same-jurisdiction primary reference; all 54 still require regional review:

| Locale | Task | Remaining evidence gap |
| --- | --- | --- |
| en-SG | Welding exposure | Full applicable welding-control source still needed; disease guidance alone does not establish the extraction procedure |
| pt-BR | Welding exposure | Official manual exceeds the retrieval size limit; no full relevant section has been verified |
| ru-RU | Machine maintenance | Original and amendment leads exist; relevant full clauses and current applicability remain unverified |
| ru-RU | Pressure-equipment opening | Applicable domestic pressure-isolation clauses remain unverified |
| ru-RU | Welding exposure | Official welding order and appendix require full-text and amendment review |

Fourteen targeted knowledge, coverage and release tests pass after this source update. The synthetic 99% test checks every required/excluded condition in all 36 pressure/welding drafts, including the new machine/construction restrictions. The generated report still has 54 populated priority cells, 57 active drafts and zero publication-eligible cells.
