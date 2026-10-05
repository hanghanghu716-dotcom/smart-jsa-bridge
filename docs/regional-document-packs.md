# Regional document packs — implementation status

Updated: 2026-10-06 (review version 2026-10-06.25). Scope: every currently supported locale — 14 countries, 18 country/region profiles, 10 languages.

## Progress

1. Work jurisdiction / document language independent of screen locale: implemented in Info and Work Packages.
2. Regional starter forms: 89 definitions across 18 profiles, all with scoped form closures. The 72 task combinations now have 600 current-work supplement fields; 62 task combinations have individual checklist closures. This batch addresses all 24 previously unclosed combinations with 137 additional fields and resolves three source issues (IT height, BR height, Quebec confined space). Ten combinations retain explicit source gaps and final checks: Italy electrical, Quebec hot work, Saudi Arabia and Russia in all four topics. Existing saved forms, versions and generic-form fingerprints remain unchanged. These are editable site-review drafts, not certified statutory permits. See [latest comparison and remaining items](regional-final-task-review-20261006.md) and [ledger](regional-review-ledger.md).
3. Localization: all ten document languages connected, with 87 base keys and 335 task/assessment keys. Individual meaning review records 582 of 583 groups: 87 base labels, 335 task/assessment keys, 89 regional titles and 71 native-role bundles. This batch adds 13 labels/notices in ten languages and verifies Russian height/confined native terms against regulator-hosted material. Russian electrical role terminology remains open. Stage 2 retains ten source-resolution checks and ten task final checks; stage 3 retains one native-term final check. See [checkpoint progress](regional-progress-audit.md).
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
- Extend the completed two-account checks to remaining live quota-boundary scenarios and regional output combinations before claiming exhaustive coverage.
- No production deployment is implied by local verification.

## Verification commands

`node --test scripts/*.test.js`

`npx vite build`

Run Vite on port 5174, then `node scripts/regional-work-browser.cjs`. Set `WORK_TEST_COUNTRY` to any profile ID in `WORK_JURISDICTIONS` and `WORK_TEST_LOCALE` to the screen locale. The browser test intercepts remote traffic and never writes to the live database. It produces disposable PDFs/screenshots under `.cache/regional-qa/<profile>`. It checks regional titles, translated common fields, mobile overflow, review gating, actual PDF creation and the output snapshot. The SG fixture additionally checks the trailing-blank-page regression and document-language preservation across JSA preview/export; SA checks right-to-left preview direction.

Unit coverage also checks that all 18 supported locales are represented, all translation keys are present, all generated forms retain their context/source metadata, Québec remains separate from France, and private context is removed from public JSA snapshots.

Local verification on 2026-10-03: 132 automated tests passed; Vite client build passed; all 18 native-locale browser workflows passed using intercepted remote storage, including PTW forms with all four opt-in task sections. Generated PDF pages were visually checked for multiple scripts. SG and SA output workflows were repeated after preventing an isolated table header at a page boundary. Arabic tables use right-to-left layout while source risk-score sequences remain left-to-right, so likelihood/severity/risk values cannot visually swap order. These checks do not replace live multi-account access testing or the remaining specialist applicability work. See [the task review report](regional-task-review.md) for source limitations and the separate status of stages 2, 3 and 5.

## Generic-form field review — 2026-10-05

Ten GB/US/CA starter forms now have individual field-to-source comparisons, fresh-work action/inspection/coordination records and pinned closure evidence. Four Ontario/Saudi combinations no longer display Quebec-only RSST/CSTC labels. An additional 45 ten-language vocabulary groups were reviewed (33 existing, 12 new), with 25 wording corrections across 12 existing keys. See [form review](regional-form-review-20261005.md) and [current progress](regional-progress-audit.md). These closures do not close separate hazardous-task or site-specific legal reviews.

## Provincial task review — 2026-10-06

AB, BC and Ontario height/confined/electrical/hot task forms now retain distinct provincial permit, standby, isolation, equipment and return-to-service prompts. Full automated tests: 220/220; client build: 876 modules; four isolated browser workflows and all 76 generated PDF pages checked (English, French and Arabic). No live database writes or deployment. See [source comparisons, terminology and validation limits](regional-canadian-task-review-20261006.md). Stage 2: 422/483 checkpoints (87.4%); stage 3: 1,650/1,653 (99.8%); combined remaining: 64/2,136 (3.0%).

## AU/SG task review — 2026-10-06

Eight AU/SG height/confined/electrical/hot combinations now record additional current-work planning, access, rescue, atmospheric criteria, equipment, isolation and fire-response checks. Australian model-code adoption and Singapore sector-specific permit boundaries remain explicit. Full automated tests: 225/225; client build: 878 modules; four isolated browser workflows and all 76 generated PDF pages checked (AU English 18, SG English 19, AU German 20, SG Arabic 19). Previous 548 terminology, 89 generic-form and 24 task closure fingerprints are preserved. No live database writes or deployment. See [source comparisons, terminology and validation limits](regional-au-sg-task-review-20261006.md). Stage 2: 430/483 checkpoints (89.0%); stage 3: 1,671/1,674 (99.8%); combined: 2,101/2,157 (97.4%), with 56 checkpoints remaining (40 task final checks, 13 source limitations and three Russian terminology groups).

## DE/FR task review — 2026-10-06

Eight DE/FR height/confined/electrical/hot combinations add 57 current-work checks and six labels/notices in ten languages. German release/handback and confined-entry exceptions, French fall-arrest rescue, continuous entry monitoring, employer electrical authorisation and hot-permit guidance retain their local scope. Full automated tests: 230/230; client build: 880 modules; four isolated browser workflows and all 78 generated PDF pages checked (DE German 19, FR French 21, DE Korean 18, FR Arabic 20). Previous 555 terminology, 89 generic-form and 32 task closure fingerprints are preserved. No live database writes or deployment. See [source comparisons, terminology and validation limits](regional-de-fr-task-review-20261006.md). Stage 2: 438/483 checkpoints (90.7%); stage 3: 1,689/1,692 (99.8%); combined: 2,127/2,175 (97.8%), with 48 checkpoints remaining (32 task final checks, 13 source limitations and three Russian terminology groups).

## 2026-10-06 KR/ES task review (batch 24)

Eight KR/ES height/confined/electrical/hot combinations add 48 current-work checks and six labels/notices in ten languages. Korean entry measurement/retention, 119 notification and installer lock removal remain distinct from Spanish preventive-resource roles, authorised/qualified electrical work and NTP permit guidance. Full automated tests: 235/235; client build: 882 modules; four isolated browser workflows and all 74 generated PDF pages checked (KR Korean 16, ES Spanish 21, KR German 17, ES Arabic 20). Previous 561 terminology, 89 generic-form and 40 task closure fingerprints are preserved. See [source comparisons and validation limits](regional-kr-es-task-review-20261006.md). Stage 2: 446/483 (92.3%); stage 3: 1,707/1,710 (99.8%); combined: 2,153/2,193 (98.2%), with 40 checkpoints remaining (24 task final checks, 13 source limitations, three Russian terminology groups). No live database writes or production deployment.
