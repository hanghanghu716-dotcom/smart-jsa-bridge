# Korean government jobs: individual-account connection

Reviewed 2026-11-03 KST. Existing JSA, Case Study and authoring data are unaffected.

## Selected source

- [인사혁신처 공공취업정보 조회 서비스](https://www.data.go.kr/data/15156780/openapi.do), current catalogue ID 15156780. The older 15000485 URL is unavailable.
- The official catalogue states: free, real-time, no restrictions on the permitted use, automatic approval at development and operation stages. Development traffic is 10,000 requests; the application form grants 24 months from approval.
- [Public Data Portal registration](https://auth.data.go.kr/sso/common-signup) supports individual membership without business registration.
- [Portal policy](https://www.data.go.kr/ugs/selectPortalPolicyView.do) still requires permission for any third-party copyrighted material. This integration retains only API list metadata, not descriptions, pictures, logos, attached files, contact people or applicant data.
- This covers public-sector jobs, not all private-sector vacancies offered through Work24. Work24 remains disabled.
- [Job ALIO terms](https://opendata.alio.go.kr/new/odaApiMbrinfo/join.do), Article 12, require prior consent for profit-making use. Do not treat its free registration as permission for an advertising-supported service; it is not enabled by this change.

## Connection and publication gate

1. Individual member signs in and applies for the list operation (`getList`). The operator must approve the licence agreement at submission.
2. Store the decoded service key as `NARAILTER_API_KEY` in Supabase Edge Function Secrets. Never commit it, print it, put it in a VITE variable or expose it in the browser. API URLs contain the credential and must never be logged.
3. Verify real response success, documented search parameters, `idx` to original announcement link correspondence, Korean closing dates and current public-sector safety/health results. Local fixtures are not proof that the account is connected.
4. Complete any required operation-account transition before production publication. Only then approve the source with the actual permission evidence and a 90-day internal review deadline.
5. Use the existing daily job schedule and existing withdrawal/expiry lifecycle. The registration migration leaves the source disabled; it grants no new browser permissions.

The live API ignores `Kwrd` and `Sort_order`: keyword-only requests returned the same 293,870-record catalogue beginning in 2008. Do not use those fields as proof of filtering. The verified `Begin_de` / `End_de` date filter works. The adapter reads the latest 30-day registration window, using the current Korean date, at most five pages of 1,000 rows, a 2 MiB response cap and a 12-second timeout per page. It validates every registration date, page size and total, filters occupation titles locally, removes employer-name-only matches, and deduplicates IDs. More than 5,000 candidates, a changing total, a truncated page, ignored dates or more than 200 relevant results fail closed instead of silently committing a partial scan. It does not crawl detail pages or attachments. The shared collector supports at most three sources/nine external list requests per daily run, independent of page views. API use is free; existing hosting quotas still apply.

Only Korean results are retained. Result announcements and job cancellations are not imported as new vacancies. A missing/unknown closing date is excluded; invalid calendar dates fail the batch. `yyyymmdd` closes at the next midnight in Korea. Unknown area codes are left blank rather than mapped to a guessed workplace.

## Checks

`node --test scripts/narailter-jobs.test.js scripts/jobs.test.js scripts/resource-hub.test.js scripts/resource-collection.test.js`

Checks cover XML errors, malformed data, non-job results, deadlines, minimal fields, bounded queries and credential redaction. Run the existing transactional database security checks and live API checks before activation.

## Current status

Individual-account eligibility and catalogue licence verified. Development application and operation-account transition both approved on 2026-11-03 KST, valid through 2028-11-03. The operator explicitly approved both submissions, the public service screenshot, CAPTCHA processing and licence agreement. The key was saved as a Supabase Edge secret and never committed. Operation account permits 100,000 daily list requests; this integration needs only a few.

Live API verification returned 2,322 candidate records in three bounded pages for 2026-10-04 through 2026-11-03. Announcement `307324` was checked against its official page: the title, employer and closing date 2026-11-16 match. This API supplies a closing date, not an exact time; the source may close earlier in the day and the UI directs applicants to check the original time and conditions. The list may include advance announcements whose application period has not started. Long-running announcements outside the rolling registration window become unconfirmed after 48 hours without refresh; coverage is not all Korean vacancies.

Collector Edge Function version 7 is deployed. Source permission has been enabled with a 90-day review interval and an audit entry, using the existing 15:45 KST daily schedule. All 29 related unit tests passed. The transactional database checks passed for private-table access, service credential rejection, administrator/MFA enforcement, source approval, country isolation, deadline boundaries, stale records, withdrawal and permission expiry; all test records were rolled back.

The first production run returned HTTP 200 and committed 13 matching announcements: nine with a future closing date and four already closed. No source-request error or timeout occurred. No existing JSA, Case Study or news rows were changed.
