# Saudi and Russian generic form review

Checked 2026-10-06. Stage ②: source-to-field requirements review. Stage ③: terminology. Scope: SA and RU risk assessment, procedure, generic permit, briefing and inspection — ten starter forms, all ten document languages. No changes to Case Study, guidelines, public documents or database schema.

## Source boundaries

Exact URLs, publication editions and per-form attribution are stored in `src/utils/regionalSaRuFormSources20261006.js`.

- Saudi HRSD lower-level OSH implementation guide: downloaded the 13-page Arabic PDF and visually read pages 6–13. Used the roles, preparation, inspection, corrective-action and review workflow. Its own footer identifies it as guidance, not a replacement for other forms. The HRSD nine-page toolbox publication supports task communication and reporting.
- [NCOSH high-risk occupation regulation](https://www.ncosh.gov.sa/media/if1lxppg/rowhro-25-en.pdf): articles 1 and 5–7 distinguish the worker's occupational authorisation from site work permission. The generic record links applicable evidence; it does not certify a worker or collect medical diagnoses. Sector implementation questions remain in the task-review backlog.
- [Mintrud 926, official Rostrud mirror](https://git04.rostrud.gov.ru/upload/iblock/573/pismo_vkhodyashchee_prikaz_926_ot_28.12.2021_reg._tz_57_iz_mintrud_rossii_ob_utverzhdenii_rekomend_5529728v1_.pdf): downloaded the 67-page scan; visually read recommendations 1–30. Scope, method suitability, uncertainty, evidence, communication and review inform the generic record. The whole annex collection and currency of every referenced standard are not claimed reviewed.
- [Rostrud inspector explanation, April 2023](https://git61.rostrud.gov.ru/upload/iblock/501/03.2023.pdf): downloaded and read both PDF pages. Used instruction inputs, approval/representation, five sections, changes and meaningful knowledge checks. The original 772n attachment was unavailable; this is an official explanation, not full statutory annex verification. Historical training intervals and the current validity of 2464 are not asserted.
- [MChS-hosted fire rules 1479, edition 2025-02-03](https://16.mchs.gov.ru/uploads/resource/2026-02-11/perechen-normativnyh-pravovyh-aktov-v-oblasti-pozharnoy-bezopasnosti_1770816913228588720.pdf): clause 372, PDF pages 75–76, supports linking the actual temporary hot-work permit and its responsible, timed preparation/admission/completion records. Its exceptions and electronic-signature conditions remain specific to that context. **Annex 5 concerns clearance radii, not a permit form.** No claim of a universal Russian permit template.

## Field comparison

| Form | Shared additions | Country-specific treatment |
| --- | --- | --- |
| Risk assessment | `riskMethodChoice`, current decision, action closeout, prevention-plan link and resources; existing exposed-person, controls, consultation, review and source-score fields retained | Choose a suitable method and document assumptions; do not force a universal matrix. SA links establishment-level arrangements; RU separates the task record from СУОТ/СОУТ. |
| Procedure | Current revision/change record and accessible instructions, alongside sequence, equipment, PPE, competence, emergencies, stop/change conditions and signatures | RU adds approved-instruction inputs and a five-section cross-reference/gap check. Existing safe completion stays present. This supporting task procedure does not itself approve an employer instruction. |
| Generic permit | Applicable basis, competence, coordinated roles, linked specialist documents, restart decisions and closeout/custody; existing validity, isolation, fresh tests and signatures retained | SA adds site permit versus occupational licence applicability/evidence. RU links the actual applicable наряд-допуск; no daily admission or statutory training completion is inferred from a copy. |
| Briefing | Discussion scope, understanding check and follow-up | SA adds understandable-language communication, stop/report arrangements and absent-worker follow-up. RU links the required training/knowledge-check record and its current status. Attendance alone is not training completion. |
| Inspection | Landscape checklist with location, result, priority, action owner/deadline, closeout, coverage limitations and review; plan and resources links | Generic risk-control monitoring; no universal mandatory inspection interval or claim to replace specialised equipment examination. |

All fresh decisions and record checks use runtime verification fields. Named roles use runtime worker fields. Standard instructions may be reused; measurements, people, dates, signatures and previous verification results are cleared by the existing new-work/copy boundary. Source metadata and saved versions remain attached to the document; older user forms are not upgraded silently.

## Terminology and closure

Eight keys × ko/en/de/ja/fr/it/es/ar/pt/ru. Reviewed country scope, occupational licence versus site permit, approved instruction versus task procedure, training/knowledge check versus meeting attendance, method choice and fresh evidence. The Russian names СУОТ, СОУТ and наряд-допуск remain identifiable in translations. Arabic output is included in visual QA.

Before recording ten generic-form and eight terminology closures, verify the previous **79 form and 528 terminology hashes** are unchanged. These are scoped software/form-content checks, not legal certification. They do not close any of the 72 hazardous-task final checks, 13 partial-source combinations or three RU native-role bundles.

## Validation

Automated coverage includes all 100 form/language combinations, runtime clearing even after a field mode is changed, independent copies, unchanged old saved forms, country isolation, unique field keys, applicable sources and coexistence with specialist task supplements.

- Full suite: **210/210 passed**. Initial sandbox run encountered module-path permission failures; an unrestricted local rerun passed after updating two older country-boundary assertions for the newly reviewed forms.
- Vite client build: **872 modules**, passed; existing bundle-size notice remains. Targeted ESLint passed. Inventory/progress generation validates 890 generic forms and 720 task variants plus all closure hashes.
- Four isolated browser flows passed: SA Arabic (13 PDF pages), RU Russian (14), SA English (14), RU Arabic (13). Each covers mobile editing, source JSA mapping, mocked persistence, review gate, real PDF generation and immutable output snapshots. Remote requests were intercepted; no real account or database changes.
- All **54 PDF pages** rendered using Poppler and visually inspected. No clipped/overlapping text observed. Some forms have sparse continuation pages; pagination compactness is not claimed improved. Imported English JSA content stays as authored while field labels follow the chosen document language.
- Physical printing, all ten languages in visual PDF QA, live-account access and server prerender release checks were not repeated. This is a draft-branch update, not production deployment.
