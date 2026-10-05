# Regional output verification — 2026-10-06

## Scope and result

This follow-up improves output layout and verifies one representative work-package fixture in each of the ten supported document languages. It does not create new legal-review closures: stage 2 remains **471/483 (97.5%)**, with 12 checkpoints across six combinations pending; stage 3 remains **1,842/1,842 (100%)**, covering the declared 614 terminology groups.

The package common-information rows and spacing between fields are more compact. Field-title font size remains 14 CSS pixels and handwriting areas retain their 44-pixel minimum. Short tables occupying at most 40% of a printable page now stay together, avoiding the observed Singapore attendance-table split with unlabelled rows on the next page. Longer tables retain row-based pagination.

Existing saved forms and archived PDFs are unchanged. The layout applies when generating a new output. No database, public JSA content, Case Study or guideline content changes are included.

## Ten-language fixture matrix

Each fixture includes its regional starter pack and the selected permit supplement. Source user-entered content remains English deliberately; only template content is localized.

| Profile | Document language | Permit supplement | PDF pages | Print-emulation pages |
| --- | --- | --- | ---: | ---: |
| KR | Korean | Height | 10 | 10 |
| SG | English (Singapore) | Confined space | 13 | 13 |
| DE | German | Electrical | 12 | 12 |
| JP | Japanese | Hot work | 12 | 12 |
| CA-QC | French (Québec) | Hot work | 14 | 14 |
| IT | Italian | Electrical | 13 | 13 |
| ES | Spanish | Height | 13 | 13 |
| SA | Arabic | All four topics | 20 | 20 |
| BR | Portuguese | Confined space | 14 | 14 |
| RU | Russian | Hot work | 15 | 15 |
| **Total** | **10 languages** | | **136** | **136** |

All 136 generated PDF pages were rendered with Poppler and visually inspected. The real application print button/iframe was exercised in an isolated browser, with the dialog intercepted and its resulting HTML printed through Chromium PDF emulation. All 136 print-emulation pages were rendered and checked for page count, nonblank content, page size and content boundaries; Arabic, Japanese and Russian pages were also visually sampled. This is not a physical-printer test. Boundary differences were at most five pixels in renders scaled to 1,450 pixels, consistent with rasterization rounding; this is not a claim of pixel identity.

For the four fixtures checked before this change, page counts fell from 71 to 62 without removing fields: IT 16→13, CA-QC 16→14, SA 22→20, RU 17→15. Some document-ending pages still have substantial blank space because documents start separately and handwriting areas are retained. The change does not claim optimal pagination for arbitrary user content.

## Validation and reproduction

- All 249 unit tests passed (`node --test --test-concurrency=1 scripts/*.test.js`); all existing review fingerprints remain valid.
- Targeted ESLint passed for `src/utils/reportPdf.js` and `scripts/regional-work-browser.cjs`.
- Vite client build passed (890 modules); the existing large-chunk warning remains.
- Ten isolated browser flows passed mobile overflow, source mapping, mocked persistence, review gating, PDF creation and immutable output snapshot checks.
- Added checks observe actual canvas slices: every selected document is captured, short tables remain intact, and adjacent slices have no missing or duplicated image rows. Field labels do not overlap their values; font and handwriting-area minimums are retained.
- Printing an existing artifact does not create another archived output; all captured page images finish loading before print emulation and no extra blank page is introduced.
- Additional SG fixture without PTW remains nine pages. Existing JSA Export with the correctly specified three-step fixture generates one page, retaining the document language, signatures and current control text.

Run Vite, then set `WORK_TEST_URL`, `WORK_TEST_COUNTRY`, `WORK_TEST_LOCALE`, `WORK_TEST_PERMIT=1`, `WORK_TEST_TASKS` and `WORK_TEST_PRINT=1` before running `node scripts/regional-work-browser.cjs`. `WORK_TEST_OUTPUT_GROUP` separates artifact runs; `WORK_TEST_DOCUMENT_LOCALE` optionally overrides the profile's native document language. The existing test uses local Windows Chrome and intercepts remote requests; it does not write to production accounts or storage.

Disposable artifacts are under `.cache/regional-qa/batch29/<profile>` and `.cache/regional-qa/batch29-smoke/SG`. They are not committed. This matrix covers all ten languages, not every profile × language × task combination. Actual-account checks, quota-boundary tests, physical printing and production/server-prerender verification were not repeated in this follow-up.

## Remaining source access, rechecked

The six gaps in [the closeout review](regional-closeout-review-20261006.md) remain open. No account was created, paid standard purchased or inaccessible provision inferred from a catalog entry.

- **Italy electrical:** [CEI's EC catalog](https://mycatalogo.ceinorme.it/cei/item/0010026052?sso=y) and [official errata index](https://www.ceinorme.it/wp-content/uploads/2026/06/ErrataCorrige_2026-06-05.pdf) identify the December 2025 correction. They do not replace full access to CEI 11-27:2025 and the correction's clauses.
- **Québec hot work:** [CNESST's free CSA viewing instructions](https://www.cnesst.gouv.qc.ca/fr/prevention-securite/informations-prevention/normes-csa) describe a free account and read-only access. The incorporated W117.2 provisions were not obtained in this session. The Québec legislation fetch also failed; an older indexed excerpt was not treated as fresh closure evidence.
- **Saudi height, confined space, electrical and hot work:** [NCOSH's regulations index](https://www.ncosh.gov.sa/ar/knowledge-center/rules-regulations/administrative-systems/) was rechecked. The high-risk-occupation regulation, occupational-fitness guide and service-provider licensing materials are distinct. None was substituted for missing applicable occupational-licensing implementation and sector/site permit procedures.

These are evidence gaps in stage 2, not untranslated strings in stage 3. Output-layout validation does not close them.
