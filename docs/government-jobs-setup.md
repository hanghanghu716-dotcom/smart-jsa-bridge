# Government jobs and safety news — release status (2026-11-03 KST)

Public route: `/:locale/jobs`. Operator route: `/ko/admin/jobs` (Community → 채용정보 관리).
All 19 supported locale routes have their own source mapping and translated public UI.
Source registry: `src/data/jobSources.js`. Registration is not access/publication approval.
The catalogue migration starts sources disabled. The following publication migration enables only the operator-approved USAJOBS connection and a bounded daily collector. Work24 and all other job sources remain disabled.
Existing JSA, Case Study and document authoring content are unchanged.

## Implemented

- Minimal official listing: title, employer, work location, original URL, deadline and last verification time.
- Open / closed / needs-verification views, 12 listings per page, country/region-isolated search.
- Deadline evaluated by the database on every read; expiration requires no deletion or cron job. Client view also checks every minute without periodic network polling.
- Work24 date-only deadlines expire at the following midnight in Korea. USAJOBS date-only/midnight-coded dates use the documented end of closing date in US Eastern time, including DST. Explicit other offset timestamps are preserved; ambiguous non-midnight timestamps are not guessed.
- Until-filled/no-date listings retain the original wording. After 48 hours without source re-verification, availability becomes unconfirmed, not falsely closed.
- Missing results from a bounded search are not treated as withdrawn/closed. Source outages never delete listings.
- Operator withdrawal is retained across imports. Source suspension / permission expiry immediately hides that source's listings in all public views.
- No applicant data, application forms, contact persons, full job descriptions, logos, copied PDFs or automated translations.
- Initial readable HTML, `noindex,follow`; no standalone JobPosting schema or sitemap entries for the link directory.
- Service-only import endpoint, credential check, 20-hour per-source claim interval, maximum 200 minimal records/source/run; raw tables have no browser access.

## Credential connection verified (2026-11-03 KST)

USAJOBS email verification was completed by the operator. The API key and API email are stored in the project's Edge Function Secrets, never repository files. Both migrations and `collect-government-jobs` are deployed. The first successful collection stored 64 safety / industrial-hygiene listings; the country-scoped homepage query returns four. This is a bounded recent-job sample, not all US vacancies.

The collector requests two title-filtered lists of at most 50 summary records, with a 2 MiB response limit and a 12-second timeout per request. Official default HTTPS port links are normalized; other ports and lookalike domains remain rejected. No full descriptions are retained.

## Official connections

1. Work24: approved corporate API account and approval for this service's display/use required. Corporate access and key approval are documented at https://www.work24.go.kr/cm/e/a/0110/selectOpenApiIntro.do . API schema: https://www.work24.go.kr/cm/e/a/0110/selectOpenApiSvcInfo.do?fullApiSvcId=000000000000000000000000000000 . Do not assume a public API is a commercial reuse licence. Verify the actual service approval and any attribution/branding conditions before enabling.
2. USAJOBS: **active**, registered API credentials; federal jobs only. Terms: https://developer.usajobs.gov/apirequest/index . API guide: https://developer.usajobs.gov/api-reference/get-api-search . Closing-date rule: https://help.usajobs.gov/how-to/job-announcement/overview . API terms pages showed differing cached versions during review; use the terms actually accepted for the account. No government endorsement or applications on Smart JSA Bridge.

Server secret names (never VITE variables, repository files or chat): `WORK24_API_KEY`, `USAJOBS_API_KEY`, `USAJOBS_API_EMAIL`.
After credentials and permission are confirmed, deploy `collect-government-jobs` with its local `deno.json` and `verify_jwt=false` (the handler verifies the private collector credential).
It reuses the existing Vault-backed `safety_resource_collector` invocation credential and does not expose it to the browser or GitHub.
`government-jobs-daily` invokes the collector at 06:45 UTC (15:45 KST). The existing news collector remains at 06:15 UTC (15:15 KST). A private Vault token authenticates invocations and cannot be read by browser users.
Approve the applicable source in the administrator page, including evidence URL, permitted commercial display scope and account approval. Approval expires after 90 days.
Both prepared adapters together issue at most four external list requests/run. No detail-page crawling or paid translation service is used.

## News publication and homepage

- Main pages show four current-country safety news links and four open jobs. An unconnected region shows an honest preparation message; US listings are not copied into Korea or other regions.
- `/ko/admin/resources` manages news permissions and hide/restore; `/ko/admin/jobs` manages job sources and hide/restore. Both require operator authorization and additional authentication. Community provides entry links.
- Only HSE (`en-GB`) has automatic news publication enabled: original title, URL, date and attribution, under https://www.hse.gov.uk/help/copyright.htm and OGL v3. No images, logos or full text. Five eligible existing unedited feed items were published. Items with placeholder titles, missing dates, unverified rights or incorrect regions remain pending.
- Automatic items display an automatic-collection label and never claim a human review. Rights expiry or source suspension removes them from public queries. Withdrawn items do not return on re-import; restoration requires a previously published item and still-valid permission.
- Other countries retain the existing review queue. Merely collecting a link does not enable automatic publication. Approved automatic sources can be switched off by the operator.
- Public jobs/news lists provide search, pagination, original links and responsive layouts. Jobs have open, closed and needs-verification views. Full source text is not mirrored.
- No periodic browser network polling or paid service is added. Hosting usage still depends on traffic and provider quotas; these bounds are not a guarantee of zero hosting charges.

## Other country/provider candidates — not permission-cleared

| Country / region | Candidate | Current limitation |
| --- | --- | --- |
| Canada, Alberta, Ontario, BC, Quebec | Job Bank / Guichet-Emplois | Official syndication / reuse terms must be verified. Province-specific jobs require actual work-location mapping. No copying federal listings into every province. |
| UK | Find a job (DWP) | Verify syndication terms; employer text is not automatically Crown material. |
| Australia | APS Jobs | Federal public-service scope. Verify feed, reuse terms and timezones; no private Salesforce endpoint scraping. |
| Singapore | MyCareersFuture | https://www.mycareersfuture.gov.sg/terms-of-use/ requires prior permission for reproduction and hyperlinks. No public source hyperlink or import enabled. |
| Germany | Bundesagentur für Arbeit | Official partner access/reuse unverified; do not use unofficial APIs. |
| Japan | Hello Work | Provider eligibility and distribution restrictions apply: https://www.hellowork.mhlw.go.jp/info/terms_regist01.html . |
| France | France Travail | Licence/partner access required. Official data.gouv catalogue currently reports restricted/unexposed offers API: https://www.data.gouv.fr/organizations/france-travail/dataservices . |
| Italy | Cliclavoro | Official dissemination/reuse terms for individual job listings unverified. |
| Spain | Empléate (SEPE) | Portal legal terms do not establish third-party employer/partner syndication rights. |
| Saudi Arabia | Jadarat (HRDF) | Saudi-national eligibility; API and redistribution terms unverified. https://www.hrdf.org.sa/en/products-and-services/programs/individuals/other/jadarat/ |
| Brazil | SINE / Emprega Brasil | Regional open-data pages are not a verified nationwide current-jobs feed. |
| Russia | Работа России | Official production endpoint, reuse terms and deadline semantics unverified; no indexed demo/test endpoints. |
| Romania | ANOFM | Official news/stats are not individual vacancies with verified deadlines. Feed and reuse terms unverified. |

This is a connection inventory, not a claim that all countries have a working feed or legal clearance. Platform/job-information-service obligations, if applicable to the operator, also remain separate from API access permission.

## Verification

`node --test scripts/jobs.test.js scripts/resource-hub.test.js scripts/resource-collection.test.js`

`node scripts/jobs-browser.js` (mocked data/external traffic only)

`scripts/jobs-security.sql` runs inside a rollback transaction. It verifies admin/MFA enforcement, service credential rejection, private-table grants, approval gates, country isolation, deadline boundaries, stale status, withdrawal and source permission expiry.

`scripts/resource-publication-security.sql` verifies automatic-publication gates, country-specific home results, withdrawal/re-import, restoration, source suspension and expired rights inside the same rollback fixture setup. Both production-database rollback checks passed. Full unit suite: 676 passed before the live API regression test; the additional default-port/summary regression test also passed. Browser checks passed for all 19 locales, mobile/desktop, search, pagination, status changes, homepage sections and existing news review. The new browser fixture is included in the production workflow.
