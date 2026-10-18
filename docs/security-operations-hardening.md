# Security and operations hardening — 2026-10-18

This change preserves published documents and existing storage objects. It does not automatically delete accounts, drawings, or archived outputs.

## Boundaries

- Replace vulnerable DOMPurify, ProseMirror, router and CSS dependencies. Replace the unmaintained react-snap build dependency with an explicit-route Puppeteer renderer. The app's `ReactSnap` user-agent marker and route configuration remain for compatibility; private routes are not crawled.
- An authentication error is not a guest session. Queued draft saves capture the account and reject an account change. Switching accounts clears the active draft pointer while preserving deliberately saved guest drafts.
- Public profile updates use an allowlist. Work defaults live in an owner-only table; signatures use one private PNG/JPG object per account (1 MiB maximum), fetched with the user's session.
- Account deletion is an **operator-reviewed erasure request**, visible in the existing inbox and request history. Request submission does not claim the account or its documents were deleted. The operator must verify ownership, resolve organization ownership and retention obligations, remove user-owned Storage files through the Storage API, revoke sessions, and perform the actual deletion. Do not resolve an erasure ticket before the requested action is completed or a reasoned refusal is recorded.
- Administrative RPCs and editorial/storage writes require the current authoritative admin role, a verified MFA factor, an AAL2 token and a live session. Administrators enroll/verify an authenticator in Profile or Support. No administrator factors are enrolled by this migration.
- Work storage is limited to 250 MiB / 100 objects per account, with a 5 GiB aggregate work-bucket guard. Each pending upload reserves 40 MiB for 20 minutes, regardless of the declared size; it therefore requires that much headroom. Existing oversized accounts keep read access. Existing immutable archives stay immutable. Unregistered objects count toward usage and require operator review rather than automatic deletion. These guards do not cap hosting/network bills or the separate editorial bucket.
- Editorial uploads are limited to 40 MiB and PDF/PNG/JPEG/WebP/GIF. Existing objects are preserved.

## Public gateway

`JSA_PUBLIC_GATEWAY_KEY` is a production **server-only** Vercel secret; never use a `VITE_` prefix. Generate at least 32 random bytes (64 hex characters). Store only `sha256(convert_to(key,'UTF8'))` in `jsa_private.public_gateway_keys`. Never commit or log the raw value. There are no service-role or database-admin credentials in Vercel.

The capability only accepts bounded public view events and support submission/receipt lookup. It cannot read private documents, change accounts, or moderate content. The gateway uses Vercel's overwritten `x-vercel-forwarded-for` header, hashes it with a daily scope and does not store the IP. Client-supplied visitor UUIDs and forwarded headers cannot select the counter identity. View totals are approximate: people sharing an IP can be deduplicated together, and changing networks can still produce another view. Reuse remains authenticated and deduplicated by account/step.

Support submissions are limited to five per daily network key; status lookups to 100, views to 500. Global daily guards also bound accepted writes. A receipt includes a random 256-bit secret; keep it out of URLs, analytics and public logs. Only its hash is stored. An authenticated MFA administrator reviews requests, records responses and status, with an audit trail. No email is sent automatically. The gateway fails closed if its secret or trusted hosting context is missing.

## Analytics and discovery

- Korea's automatic public-page analytics stays enabled, subject to an existing refusal. The US, Japan, Australia and Singapore use the same configured behavior. Other or unknown regions require an affirmative, expiring browser choice. This is a conservative product configuration, not a certification of every jurisdiction's legal compliance.
- Country decisions come from the hosting edge, never from a selected interface language. Both the app and its isolated analytics frame enforce the choice. Private forms, queries and tokens remain excluded.
- RSS returns at most 50 complete recent entries under the existing byte ceiling. Older content remains discoverable through the sitemap. Full public reads have a shared deadline, row and byte budgets; failure returns 503 rather than an incomplete successful sitemap.
- Trailing-slash locale URLs redirect to their live canonical handler. Common security headers cover static and dynamic pages. CSP permits inline scripts for the existing bootstrap; it is not a substitute for content sanitization.

## Release and recovery

1. Run the unit suite, isolated database test and full HTML/PDF build.
2. Provision the limited gateway secret and apply the two migrations in order. Coordinate with the frontend release: old clients cannot use newly restricted administrator/anonymous-metric/upload endpoints.
3. Publish the frontend and run existing live discovery, PDF and operator-document checks. Verify `/api/privacy-region` and the gateway without creating test view counts or real support tickets.
4. If a published release fails its checks, the workflow restores the captured prior Vercel deployment only if no other deployment replaced it. Keep the failed release evidence.

Rollback restores frontend deployment assets, **not database permissions or data**. On this first schema-changing release, an old frontend cannot use the new MFA/reservation flows. Keep the strengthened DB restrictions and deploy a corrected compatible frontend; do not silently reopen write access to make an old build work. Use a maintenance notice if these workflows must stay unavailable during recovery.

Run isolated database checks with `PGLITE_MODULE` pointing to a test installation of `@electric-sql/pglite`, then `node scripts/security-operations-db.cjs`. It tests owner isolation, private signatures, reservation bypass, quota exhaustion, MFA/session requirements, direct metric RPC rejection, receipt secrecy and support rate limits. It never connects to production.

Supabase leaked-password protection is a separate hosted Auth setting. Its activation and the administrator's authenticator enrollment must be verified independently of the code/migration tests.

## Verification record

- 464 automated tests passed, plus the isolated database boundary checks.
- All 114 localized guide HTML/PDF pairs and every public static canonical passed verification.
- Operator list navigation, mobile widths, 36 independent document previews and three PDF downloads passed the existing browser check.
- The full locked dependency audit, including development dependencies, reports zero known vulnerabilities at this release check.
- Hosted leaked-password protection was enabled. The limited gateway key was stored as a Production-only Vercel Secret. Administrator authenticator enrollment remains an account-owner action.

## Sources used

- [Supabase storage schema](https://supabase.com/docs/guides/storage/schema/design): use storage APIs for object lifecycle; no custom triggers on storage tables.
- [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa): AAL2 enforcement and factor verification.
- [Vercel trusted request headers](https://vercel.com/docs/headers/request-headers): platform-supplied client and country headers.
- [Vercel rollback](https://vercel.com/docs/cli/rollback): restore a captured deployment.
- [Google user consent policy](https://www.google.com/about/company/user-consent-policy/): regional consent requirements.
