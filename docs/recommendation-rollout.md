# Recommendation data and locale rollout

This change addresses ambiguous recommendation IDs, stale links after input edits, cross-language score propagation and missing analysis/output translations. Percentages remain visible and are labelled text similarity. It also adds read-only data auditing and a draft case-study data workflow. It does not establish that the legacy recommendations are semantically correct or regionally approved.

## Current behavior

- Hazard and control references distinguish translation IDs from master IDs. A translation ID is never retried as a master ID or vice versa.
- Legacy recommendations follow exact translation references in the document's data language. Advanced suggestions must also be linked through the selected hazard and current control. Work-specific semantic suitability still requires reviewed data and evaluation.
- Editing a hazard or control invalidates dependent references while retaining user text for review. Changing a task or document context hides obsolete dialogs and ignores late recommendation results.
- Document language determines new recommendation text. Work jurisdiction is retained independently. Shared language datasets are disclosed; they are not certified regional datasets.
- Legacy scores are not maximized across languages or arbitrarily rescaled. Invalid or conflicting scores are omitted. Zero scores are formatted explicitly. A recommendation percentage is not an approval or accident-prevention probability.
- Regional datasets are not silently created by translating UI strings. Existing case-study content and its PDFs remain separate from the draft recommendation bank.

## Production rollout gate

**Do not promote this branch solely because unit tests or the frontend build pass.** First audit the production mapping schema and language coverage. Historical exports contain mixed or missing IDs; strict lookup can expose these gaps by returning fewer candidates. Do not reintroduce ambiguous fallback to conceal them.

1. Run `scripts/sql/audit-recommendation-schema.sql` on the intended Supabase project. It uses a read-only transaction and rolls back.
2. Obtain a scoped snapshot of the six tables listed in `AUDIT_TABLES` in `scripts/recommendation-data-audit.js`. Confirm row visibility, capture time and whether concurrent edits affect consistency.
3. Run `node scripts/recommendation-data-audit.js --input snapshot.json --output report.json`. Input shape: `{ "meta": { "capturedAt": "...", "complete": true, "visibility": "..." }, "tables": { "Hazards_Translations": [], "Current_Measures_Translations": [], "Advanced_Measures_Translations": [], "hazard_measure_mappings": [], "current_advanced_measure_mappings": [], "case_studies": [] } }`.
4. Alternatively use `--live --output report.json` with `SUPABASE_URL` and a scoped `SUPABASE_READ_KEY` supplied to the process. The script performs only GET requests to the intended Supabase project and does not print credentials or save raw rows. It follows pagination and fails on errors rather than calling failed reads empty data. REST reads are sequential, not a transactional snapshot.
5. Review dangling IDs, duplicate master/locale pairs, cross-language mappings, actual high-score examples and the 18-Locale coverage matrix. Missing exports remain unknown; zero observed rows do not prove complete production absence when visibility is unverified.
6. Correct confirmed mappings in a separate version after backing up current data. Evaluate current, corrected-legacy and case-derived candidates on the same independently reviewed examples. Include similar wording with unrelated hazards, manual edits, no candidates and regional applicability failures.
7. Release code and compatible data together by validated work/jurisdiction groups, with the old code/data version available for rollback. Preserve saved user text and historical IDs.

## Country data construction

For each supported Locale and work jurisdiction, record supported jobs, required hazards, translated terms, control coverage, local applicability evidence and remaining gaps. Distinguish missing data, missing translation, missing regional requirements, missing links and unreviewed content. Do not count the same article's translations or PDF variants as independent evidence.

For each gap, collect applicable official sources and equipment instructions, author the missing task–hazard–control units, check conditions and exclusions, and obtain a recorded technical/locale review before registration and recommendation testing. A country is not complete merely because shared reference data is shown. Complete the remaining 18-Locale coverage and user-flow checks before claiming global completion.

## Draft case-study bank

`data/recommendation-knowledge/pilot.en-US.json` contains three draft units derived from the public filter, asphalt-milling and aluminum-TIG articles inspected during this task. The source articles disclose AI authorship and no professional approval. These drafts have no invented similarity score and are not imported by the production app.

- `node scripts/recommendation-knowledge.js data/recommendation-knowledge/pilot.en-US.json` checks structural completeness.
- Add `--for-publication` to require reviewed status, a recorded technical reviewer/date, an exact content review hash and a source fingerprint. The pilot is expected to fail this gate until real review is complete.
- `bindKnowledgeSources` binds an exact case/locale export to the existing case content fingerprint. A changed source invalidates prior review. Multiple matching source rows require resolution rather than guessing.
- Store the future bank with explicit canonical/translation IDs, jurisdiction, applicability, source revision, review state and separate evaluated ranking metadata. Final database schema and migrations depend on the production schema audit; no schema migration is applied by this change.
- Case controls are candidates, not evidence that the user's site has implemented them. Keep actual checks, risk ratings and approvals unfilled until established by the user/site process.

## Verification scope

The automated fixtures exercise ID collisions, text edits, language-specific scores, invalid/conflicting scores, translated keywords, source revision invalidation and all-Locale output labels. Fixture tests do not measure real production recommendation accuracy. The remaining release gates are live DB auditing, regional data construction/review, score evaluation and full browser/PDF checks with the verified production data version.

### Results on 2026-10-14

- 44 tests passed with `node --test --test-concurrency=1 scripts/analysis-recommendations.test.js scripts/analysis-knowledge.test.js scripts/locales.test.js scripts/document-layout.test.js scripts/analysis-locales.test.js scripts/recommendation-data-audit.test.js scripts/recommendation-knowledge.test.js`.
- `node node_modules/vite/bin/vite.js build --configLoader runner` passed. Existing bundle-size and mixed PDF-import warnings remain. This is the frontend build, not the Supabase-dependent sitemap/prerender build.
- ESLint passed for the new recommendation/audit/knowledge utilities and tests. Analysis.jsx still has two pre-existing `react-hooks/set-state-in-effect` errors in draft recovery and procedure synchronization.
- `scripts/analysis-browser.cjs` provides an isolated local fixture for the selection/edit flow and blocks external requests. Execution could not reach the page: this environment denied the Chrome DevTools connection with `EACCES`. The browser assertions and PDF layout are therefore **unverified**, not passed.
- No production DB read/write, schema migration, new-country publication, merge or deployment was performed.
