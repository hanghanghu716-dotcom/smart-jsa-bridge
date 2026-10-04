# Regional document packs — implementation status

Updated: 2026-10-05 (review version 2026-10-05.6). Scope: every currently supported locale — 14 countries, 18 country/region profiles, 10 languages.

## Progress

1. Work jurisdiction / document language independent of screen locale: implemented in Info and Work Packages.
2. Regional starter forms: 89 definitions across 18 profiles; scoped supplements for 72 task combinations and 224 runtime fields. The latest batch adds 19 fields across 10 combinations in Québec, Italy, Saudi Arabia, Brazil and Russia, after revisiting all 13 source-limited combinations. Those 13 retain explicit consolidation/implementation/scope limitations; narrow resolved clauses do not close whole legal topics. See [batch evidence](regional-batch-review-20261005.md) and [ledger](regional-review-ledger.md). These remain site-review drafts.
3. Localization: ten document languages connected, 218 task keys and 89 base keys. Individual wording review now records 111 closed terminology groups: 87 live base keys and 24 task keys, including all actual Korean variants in change-detection hashes. Two retired base keys, other task wording, document titles and native-role bundles still need final closure. Corrections preserve signatures, competence, approving responsibility and contracting parties. See [checkpoint progress](regional-progress-audit.md); this is not legal certification. Stages 2 and 3 precede resuming final regional-form user verification.
4. Save / copy / output: regional names and fields remain attached to the document; country changes do not overwrite existing forms. Incompatible selected forms block output until replaced or excluded. Output snapshots retain context and template version. Generic and legacy packages remain supported. JSA mapping retains standard steps, hazards, controls and original scores, while excluding prior measurements, dates, people and signatures.
5. Real-user verification: on 2026-10-04 two actual test accounts passed owner save/re-login restoration and cross-account/anonymous denial checks for packages, forms, drawings and outputs, using normal user Auth/Data/Storage APIs. The browser also saved a package and generated/archived a private PDF. Local UI draft restoration and save/clear were verified; concurrency and fresh-work reset were checked in the isolated browser fixture. Exhaustive regional-form output, physical printing and live quota-boundary scenarios remain unverified. See [work-package verification scope](work-packages.md). Legal/requirements review remains in stage 2; specialist terminology review remains in stage 3. The earlier basic-form source comparison is recorded in [the basic-form review report](regional-document-review.md).

## Storage

No new tables, columns or policies. Context lives in existing private `jsa_projects.form_data.context` and `work_packages.data.context`. Personal form metadata lives in `work_form_templates.data`; actual output context and form provenance are copied to `work_outputs.snapshot`. Public JSA redaction still excludes private context.

Internal rendering discriminators remain `jsa`, `form`, `drawing`, compatible with the deployed database guard. Canonical form types are additional metadata. Published JSA content, attachments and private packs remain separate.

## Catalog scope

- KR: Risk Assessment, work permit, TBM and inspection.
- GB: Risk Assessment, Method Statement (together presented as RAMS), PTW, Toolbox Talk and inspection.
- AU: Risk Assessment, conditional SWMS, PTW, Pre-start / Toolbox and inspection. SWMS requires an explicit high-risk-construction answer. State/territory is recorded but does not select legally reviewed state-specific rules yet.
- SG: RA, SWP, PTW, Toolbox Meeting and inspection.
- US: JHA, safe job procedure, permit, toolbox talk and inspection.
- Canada: national baseline plus separate Alberta, Ontario, British Columbia and Québec profiles. Québec uses French task-safety terminology, independently of France.
- DE: task-level Gefährdungsbeurteilung and safe work instructions; effectiveness/review fields.
- JP: task risk assessment, safe work procedure, permit, KY record and inspection; priority hazards and team commitments.
- FR: task risk assessment, mode opératoire, permit, causerie and inspection; work-unit and related DUERP reference.
- IT: task risk assessment, safe procedure, permit, safety meeting and inspection; related DVR/DUVRI reference.
- ES: task risk assessment, safe procedure, permit, safety talk and inspection; local procedures/interfaces.
- SA: Arabic task risk assessment, safe procedure, permit, pre-work safety meeting and inspection; right-to-left document rendering.
- BR: task AR, safe procedure, PT, DDS and inspection; related PGR reference and follow-up.
- RU: task risk assessment, safe work instruction, generic permit draft, pre-work safety discussion and inspection; consultation/reassessment fields. The generic discussion is not presented as a statutory training register.
- Permits are available for explicit addition, not automatically declared required. A task form does not replace enterprise-wide DUERP, DVR/DUVRI or PGR records.
- All 164 workspace UI keys, context UI and starter field labels support Korean, English, German, Japanese, French, Italian, Spanish, Arabic, Portuguese and Russian. English terminology is selected by locale; French Québec and France remain distinct. User-written JSA content is copied as written, not automatically translated.
- Every supported locale can be selected independently as the document language. When this differs from the regional profile's native language, the translated document title retains the regional title as context.

Official reference links, review scope and the source-check date are kept in `src/utils/regionalReview.js`, `src/utils/regionalWorkTemplates.js` and `src/utils/regionalCatalog.js`. Template version `2026-10-03.3` adds assessment dates, consultation, review and control-effectiveness records; PTW roles and handover records; and region-specific references. They support terminology and general structure, rather than certifying every industry-specific field. The GB profile retains distinct HSE and HSENI references. Regional guidance fields are prompts for site review, not a complete legal rules engine.

## Remaining work

- Detailed industry / work-activity and state/province applicability rules; determine when particular signature roles and specialist fields are required. Generic PTW role blanks are implemented.
- Further task-specific permit applicability and dedicated forms. Four opt-in PTW sections now cover height, confined spaces, electrical isolation and hot work, including measurement, emergency/rescue and competency prompts; these are not complete statutory forms for every sector.
- Targeted source review of specialist terminology, current sector-specific rules and detailed form applicability, following the concrete items in the review report.
- Structured role-specific approval workflows and risk-matrix definitions; these are not inferred from existing signature blanks or converted source scores.
- Validate real two-account save/copy/output access with deliberately created private test data before production rollout.
- No production deployment is implied by local verification.

## Verification commands

`node --test scripts/*.test.js`

`npx vite build`

Run Vite on port 5174, then `node scripts/regional-work-browser.cjs`. Set `WORK_TEST_COUNTRY` to any profile ID in `WORK_JURISDICTIONS` and `WORK_TEST_LOCALE` to the screen locale. The browser test intercepts remote traffic and never writes to the live database. It produces disposable PDFs/screenshots under `.cache/regional-qa/<profile>`. It checks regional titles, translated common fields, mobile overflow, review gating, actual PDF creation and the output snapshot. The SG fixture additionally checks the trailing-blank-page regression and document-language preservation across JSA preview/export; SA checks right-to-left preview direction.

Unit coverage also checks that all 18 supported locales are represented, all translation keys are present, all generated forms retain their context/source metadata, Québec remains separate from France, and private context is removed from public JSA snapshots.

Local verification on 2026-10-03: 132 automated tests passed; Vite client build passed; all 18 native-locale browser workflows passed using intercepted remote storage, including PTW forms with all four opt-in task sections. Generated PDF pages were visually checked for multiple scripts. SG and SA output workflows were repeated after preventing an isolated table header at a page boundary. Arabic tables use right-to-left layout while source risk-score sequences remain left-to-right, so likelihood/severity/risk values cannot visually swap order. These checks do not replace live multi-account access testing or the remaining specialist applicability work. See [the task review report](regional-task-review.md) for source limitations and the separate status of stages 2, 3 and 5.
