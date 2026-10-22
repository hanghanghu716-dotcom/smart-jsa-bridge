# Indexing investigation and bounded code corrections

## Evidence

Search Console page report last updated 2026-10-16: 559 indexed; 566 excluded
(432 discovered/not crawled, 73 crawled/not indexed, 29 alternate canonical,
19 duplicate without selected canonical, 9 Google-selected canonical, 4 noindex).
All 432 discovered examples are Case Studies, including 120 Korean and 102 US English.
These counts are a baseline, not a deployment success criterion.

Search Console crawl report last updated 2026-10-21: 4.3K requests over 90 days,
98% HTTP 200, average response 759 ms, no reported host problems. This does not
support claiming widespread server failure as the cause of all exclusions.
Recent Vercel error-level entries inspected were HTTP 200 deprecation warnings;
this short log window does not establish historical availability.

URL Inspection for `/fr-CA-QC/protectiveequipment`: last crawl 2026-09-21,
fetch/indexing allowed; Google chose `/fr-FR/protectiveequipment` instead of the
declared Quebec canonical. The Quebec page inherited France-specific PPE copy.

## Corrections

- Known whitespace aliases now use clean public URLs consistently in server HTML,
  client navigation/metadata, sitemap, RSS and build verification. Old URLs redirect.
  Lookup accepts the existing stored group IDs; no database row is renamed.
- A Case Study request fetches only the requested language's full article.
  Other language variants are read as IDs/language metadata for hreflang.
  Withdrawal/no-stale policies and real 404/503 responses remain in place.
- Quebec PPE fixed guidance overrides France-specific headings, tags and FAQ.
  Sources: [CNESST](https://www.cnesst.gouv.qc.ca/fr/prevention-securite/organiser-prevention/sante-securite-travail-pour-tous/equipement-protection-individuelle)
  and [CCHST](https://www.cchst.ca/oshanswers/prevention/ppe/designin.html).
- Release checks reject reintroduced legacy URLs and France-only Quebec metadata.
- `audit-indexing-urls.js` reads a JSON URL array and writes an HTTP report, with
  two concurrent GET requests. It does not modify content or request indexing.

## Boundaries and follow-up

### Current checks on October 23

- All 432 discovered/not-indexed and 73 crawled/not-indexed exported URLs were
  fetched, with two concurrent requests. First pass: 501 HTTP 200, four HTTP 503.
  All four returned HTTP 200 with article content on a targeted recheck. This
  confirms intermittent failures, but does not establish the upstream root cause
  or explain all Google exclusions. The two empty Explore pages remain intentionally
  noindex; successful Case Study responses included their article HTML.
- Case Study reads now retry transport failures, HTTP 429 and upstream 5xx once,
  within the original read deadline. Other 4xx responses are not retried. Persistent
  failures still return 503; missing/withdrawn rows remain 404. No stale fallback.
- URL Inspection already reports indexed for the US oxyacetylene-cutting and
  AHU-ducting cases, despite their presence in the older excluded-page exports.
- The original US public JSA `a3598d85-2f6c-4f40-a555-5fc242dee9d9` also reports
  "URL is on Google" / "Page is indexed". These results preceded this deployment;
  they are not evidence that this patch caused indexing or guarantees ranking.

No Case Study/JSA body, attachment, database schema, permission, publication state,
advertising setting or stored metadata was modified. Live-read checks compared
original content fingerprints for the affected aliases and a normal US article.
Do not clear intentional noindex rules or request removals to reduce report counts.

After recrawling, compare the same URLs' Google-selected canonicals and indexing
state against this baseline. A successful build or indexable live test is not proof
of indexing. Remaining crawled/not-indexed pages may require content evaluation;
this change neither proves a quality diagnosis nor guarantees Google inclusion.
