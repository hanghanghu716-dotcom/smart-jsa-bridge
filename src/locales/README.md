# Canadian provinces

The selector exposes en-CA-AB (Alberta), en-CA-ON (Ontario), en-CA-BC (British Columbia), and fr-CA-QC (Québec). Québec uses French; the other three use English. Generic /en-CA URLs remain available. Old /en-CA-QC URLs redirect to /fr-CA-QC with their path, query, hash, and navigation state preserved. Saved English Quebec preferences also migrate. A fr-CA browser selects fr-CA-QC; fr and fr-FR still select French for France.

Each province has an overrides.json containing namespace objects. English provinces fall back to en-CA then en-US. Québec falls back to the existing fr-FR translations; its overrides supply AST/JSA titles, espace clos and cadenassage terminology instead of France-specific DUER form titles. Add Québec-specific translations here. This is language support, not a review of Québec legal compliance: informational/legal pages inherited from fr-FR still need separate localization.

Case studies use provincial content first, then en-CA for English provinces or fr-CA for Québec. Québec does not silently substitute English, Korean, or France-specific articles when a Canadian French article is missing. Upload Québec articles under fr-CA-QC. Hazard and measure queries use the existing en-CA or fr-FR datasets respectively; a dedicated Québec database is not included or migrated.

Province identifiers are internal URL/content keys. Dates, HTML lang and Open Graph use en-CA or fr-CA. The fr-CA hreflang points at /fr-CA-QC, while en-CA points at /en-CA. Province URLs are included in the sitemap generator and prerender list.

## Business and private storage

Business, company-template, invitation, approval, revision and private-storage messages support the ten base languages (Korean, English, German, Japanese, French, Italian, Spanish, Arabic, Brazilian Portuguese and Russian). The existing 17 routes reuse their base language: English regions use English and Québec uses French, including the legacy Quebec alias. Product plan names Free, Pro and Business remain unchanged.

`businessUi.js` and `storageUi.js` keep the Korean/English resources. Other translations live in `phase6/`; `phase6Ui.js` resolves the locale and formats dates/counts using a valid Intl language tag. Unknown UI languages fall back to English. These resources cover the new application interface; user-authored documents, organization names and comments are not automatically translated.

The Business page and embedded company-template/storage panels set their own reading direction. Controls wrap long labels, and arrows follow the reading direction. Automated checks verify complete keys, interpolation placeholders, regional aliases and dates/counts. With the local app running, `node scripts/business-locales-browser.cjs` checks all 17 routes in the Business desktop/mobile views, company-template controls and Export storage notices using intercepted fixture data. Set JSA_QA_OUTPUT to choose the screenshot directory.
