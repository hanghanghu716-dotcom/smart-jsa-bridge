# Romanian locale release — 2026-10-15

## Scope and boundaries

Adds `ro-RO` UI/document language, Romania (`RO`) work/public-country selection, 27 JSON resources, shared interface messages, public HTML/SEO/RSS labels and six Romanian guide HTML/PDF editions. Native Romanian diacritics and Intl dates are preserved. Existing translation keys, arrays, interpolation and markup are retained; `main.header` supplies previously optional header labels.

The 199 Romanian case studies are authored and published by the separate content campaign. This change does not insert case studies, upload storage files, publish a deployment, or populate hazard/measure translations. Romanian case and dictionary queries use only `ro-RO`; missing translations do not borrow another country's data. Existing recommendation banks are unchanged; the generated coverage report explicitly records Romania's three missing task cells and zero publication-eligible units.

Romanian generic JSA creation remains usable. Regional starter forms are unavailable for `RO` and for Romanian document language until that distinct form catalogue has been reviewed and translated. The UI explains this; no foreign regulatory form is relabelled as Romanian. Existing 18-jurisdiction form/review tests now use an explicit form-capability list, while locale-selection tests still cover all 19 routes. Historical review evidence and approvals are unchanged.

## Source review and limits

Checked on 2026-10-15 for UI terminology and broad scope only. This is AI editorial review, not legal advice, technical approval or a current-law compliance certification. No qualification, numerical exposure limit, universal permit or statutory JSA template is asserted. ISCIR/ANRE activity-specific authorizations remain outside this UI release.

| Source | Material inspected | Applied scope and limits |
|---|---|---|
| [Legea 319/2006](https://legislatie.just.ro/public/detaliidocument/73772) | Portal text; employer risk/prevention/document duties in arts. 7, 12, 13 | SSM, risk assessment and prevention/protection vocabulary. No finding about a specific workplace or complete sector compliance. |
| [Norms under HG 1425/2006](https://legislatie.just.ro/Public/DetaliiDocumentAfis/182889) | Portal text, especially art. 15(1) items 1–3; page identifies the 2016 consolidated view and links a 2022 view | Hazard/risk evaluation, prevention/protection plan, employer's own instructions. The 2022 link could not be opened through the browser retrieval tool; no full current-version review claimed. UI directs readers to the applicable updated text and avoids fixed review intervals. |
| [HG 1146/2006](https://legislatie.just.ro/Public/FormaPrintabila/00000G1CFMLMLM46XGG188ZQACIHREDV) | Official printable text for work equipment scope | Identifies equipment-use domain. No automatic qualification or task-control approval. |
| [HG 300/2006](https://legislatie.just.ro/Public/DetaliiDocumentAfis/69995) | Official text, scope for temporary/mobile construction sites and relationship to general framework | Construction-specific scope, not a rule for every industry. |
| [HG 1048/2006](https://legislatie.just.ro/Public/DetaliiDocumentAfis/74559) and [Inspecția Muncii listing](https://www.inspectiamuncii.ro/web/itm-constanta/legislatie-ssm) | Official search extracts and authority listing; an earlier different Portal URL returned an access error | PPE use at work. Detailed consolidated obligations were not fully re-reviewed here. |
| [EU 2016/425 consolidated Romanian edition](https://eur-lex.europa.eu/legal-content/RO/TXT/PDF/?uri=CELEX%3A02016R0425-20260529) | Official search extract of product-design/manufacture and market scope; full PDF retrieval did not return readable text | Distinguishes product requirements from workplace-use selection. No paid EN/ISO standard was read or conformity claimed. |
| [Inspecția Muncii risk-evaluation guide](https://angajator.inspectiamuncii.ro/web/guest/ghidul-de-evaluare-a-riscurilor) | Official guide listing/description | Guidance reference, not legislation or an approved universal form. |

Privacy/terms retain existing operator/contact and product facts; no new GDPR certification or privacy guarantee is added. Romanian guide and archive notices state AI generation and absence of specialist technical approval.

## Verification

- Full Node suite: 387 tests passed, 0 failed, before the final optional-header and secondary admin-copy additions; 23 final targeted checks also passed after those additions.
- Frontend production bundle built successfully. Existing large-bundle warning remains (main JS approximately 5.5 MB uncompressed).
- Ten local browser routes tested at desktop/mobile widths, using intercepted synthetic data and blocking external network requests: home, archive, case detail, regulation, PPE, common guide, project info, procedure, business and dictionary. No page errors or page-wide horizontal overflow. Native language names in language selectors are intentional.
- Six Romanian guide HTML/PDF pairs generated with `2026-10-15` version. PDF text extraction preserved Romanian characters. All 28 pages were rendered and visually inspected in five contact sheets; no clipped/overlapping text or missing glyphs observed. These are application build outputs, separate from the campaign's 597 case-study PDFs.
- New regression tests check JSON contracts, locale/data identity, unavailable regional forms, actual Romanian SEO/RSS/PDF links and a real 404 for a missing Romanian case translation. Synthetic fixtures are test-only.

No authenticated production save or production rollout was tested in this chat.

## Public-country database prerequisite

`20261015095535_romanian_public_country.sql` is prepared, not applied. It updates `public.jsa_projects_public_country_check` and the single country guard in `jsa_private.editorial_jsa_by_country(text,text,text)`, retaining the 14 existing codes and adding `RO`. It compares the actual validated check against a temporary-table definition before changing anything, aborts on drift, changes the check in one transaction, and asserts the exact validated 15-code result. Lock timeout is 5 seconds; statement timeout is 30 seconds. No document rows, RLS policies, grants, public wrapper or storage objects are changed. The private function is read with `pg_get_functiondef`; replacement requires exactly one matching old guard. Its entire remaining definition, owner, ACL, SECURITY DEFINER setting, search_path/configuration, volatility and argument names are checked unchanged afterward. Both changes roll back together on a preflight/postflight failure.

The coordinator reported both the production check and the matching private-function allowlist; it also reported no country/language RLS conditions. Repository search found the original lists in `20261008035606_explore_country_case_views.sql` and `20261014035806_editorial_jsa_country_filter.sql`. This chat did not connect to the production DB. PostgreSQL execution remains a coordinator pre-publication check; this local environment has no configured disposable PostgreSQL instance. Do not bypass a preflight failure or apply unrelated pending migrations blindly.

## One-deployment publication order

1. Coordinator acquires the campaign's common publication lock and confirms the accepted 199-content manifest and 597 PDFs. Integrate this commit with any newer main changes and rerun relevant checks.
2. Re-read the production country check and inspect applicable RPC/function country validation. Apply only the reviewed RO prerequisite migration and capture its postflight result before enabling public `RO` saves.
3. Upload the accepted final PDFs and insert/update only the campaign's 199 assigned `ro-RO` case rows with final PDF URLs and coordinator timestamps. Verify exact identities, no extra languages/rows, all PDF links and public readability. Do not rely on counts alone.
4. Build once from the integrated code after those writes, using a fresh complete case export if `JSA_CASE_EXPORT` is supplied. Run the repository's full build, which creates static route shells, all guide editions, metadata checks and live-content shells. Never reuse a pre-insert snapshot or deploy this chat's synthetic test build. Deploy once through the coordinator's authorized release process.
5. Verify initial HTML (before client hydration) for `/ro-RO/`, `/ro-RO/archive`, all 199 detail URLs, canonical/hreflang/schema/PDF links, sitemap entries and `/ro-RO/feed.xml`. Home shows a limited selection; archive/sitemap carry all eligible cases. RSS reads all pages but its 4 MB byte cap omits whole oversized entries, so count equality with 199 is not an unconditional feed guarantee.
6. Check actual public pages at 360/390 px and desktop, campaign table wrappers, downloadable case PDFs and the six guide PDFs; test authorized public-JSA RO save only in the coordinator's permitted test context. Record deployment identity, byte hashes and observed results before marking published.

Home/archive/detail/sitemap/feed handlers re-read public data at request time. Successful HTML uses `max-age=0, must-revalidate` and both CDN cache controls are `no-store`; errors are noindex/no-store. RSS is private/no-store. Thus code and new content can be released with one deployment after database/storage publication, while preserving immediate withdrawal/update behavior.
