# Public resource home

The home now starts with task/equipment search and six recent public JSA cards, followed by three editorial guides. Sharing and private-workspace entry points appear below the reading catalog. The common navigation links the public catalog, task articles, writing guide and work packages; the footer exposes About, Contact, Privacy and Terms.

## Reading and discovery

- Case-study introductions appear before numbered work content. Original work, references, review records and PDF links are preserved. Empty commerce headings are omitted.
- Public JSA scope, region, limitations and linked sources appear before the step analysis. Print layouts remain available in a closed disclosure, opened by the document navigation link.
- Explicit document groups occupy one home card with the selected version label. This does not delete or merge source documents; every version remains in the full catalog.
- The home uses public-only, bounded database reads and a compact bootstrap. Restricted, rejected and known duplicate rows are excluded. Failed reads return a retryable error; withdrawn rows are not served from a static catalog snapshot.
- All 11 supported base languages have the new copy. Saved private documents, reuse permissions, payment access and risk assessment content are unchanged.

## Verified tag correction

Two Korean public documents had substring classification errors: battery wording matched pruning, and workbench wording matched ladders. Three incorrect tags were removed from those two records, and the inference rules now require specific evidence. The exact original arrays are in home-tag-corrections-2026-10-25.json. No documents or search index entries were deleted. Restore only the removed tags if necessary, after comparing current tags to avoid overwriting later edits.

## Operations still requiring real configuration

The repository does not contain a confirmed operator identity or a tested public contact email. The contact form still requires an account. Populate operations.js only with the actual operator name and working contact addresses after a receive/reply check, and update the existing localized About/Privacy copy accordingly. Do not replace these with invented values.

The public-JSA ad unit is after the reading content. Its existing eligibility checks still require enabled operations, verified contacts, regional review, a configured CMP, valid consent and an approved/indexable document. Ads remain disabled under the current configuration. There is no automatic pagination or refresh intended to increase impressions.

## Validation

- Focused regression suite: 32 passed, including private-field exclusion, withdrawn records, server escaping, retained article content, tag disambiguation and all supported locales.
- Desktop and 390px mobile home inspected; public reading and disclosure navigation checked in a guest browser session.
- Full unit/regression suite: 597 passed. Changed JavaScript files pass ESLint.
- Run npm run build before release. The release workflow also checks document PDF generation, regional navigation and live content delivery.
