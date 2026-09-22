# Content publishing

The administrator edits Supabase records. A successful database save does not
regenerate the site's initial HTML. After a batch of article edits, run
**Vercel Production Deployment** in GitHub Actions. A push to `main` also runs it.

The workflow pulls the existing Vercel project settings, builds the current
public case-study data, verifies every generated article's data fingerprint,
title, description and canonical URL, and deploys `.vercel/output` with
`vercel deploy --prebuilt`. A mismatch stops deployment. Avoid simultaneous
article edits while a build is running; otherwise rerun after editing finishes.

Prerendered pages contain settled effects and minified inline styles, so the
browser mounts a fresh React tree instead of hydrating incompatible snapshots.
Case-study snapshots provide the initial article data to that tree. Fresh
database responses also update the Toast UI body for the same article ID.

Vercel's separate Git-triggered deployment is disabled in `vercel.json` so it
cannot publish a second build that bypasses these checks. CLI deployments from
Actions remain enabled. This follows Vercel's [Git configuration](https://vercel.com/docs/project-configuration/git-configuration)
and [prebuilt Actions workflow](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).

The existing GitHub secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and
`VERCEL_PROJECT_ID` are used without committing their values. Pull requests run
the same tests and full public-content build without deployment credentials.

## Local verification

Run `npm ci`, then `npm run test:locales`, `npm run test:site`, and
`npm run test:content`. Set `PUPPETEER_EXECUTABLE_PATH` to your Chrome executable
and run `npm run build`. Optionally set `JSA_PRERENDER_CONCURRENCY` to an integer
from 1 to 8; the Actions workflows use 4.

`JSA_CASE_EXPORT` can supply a local export for manifest/sitemap analysis.
Browser rendering still reads the public database, so an old export is not an
offline rendering mode and may correctly fail verification.

The administrator's JSON export includes every accessible language, regardless
of its search filter, and checks record counts and unique IDs. Pagination is
not a database transaction snapshot; do not edit concurrently during export.
Duplicate group/language records are retained and edited by their original ID.
