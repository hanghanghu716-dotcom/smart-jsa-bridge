# Professional 30-day pass

Implementation candidate for a Korean launch. This does **not** activate sales by itself. The initial proposed price is KRW 9,900 per 30 days, paid once with no automatic renewal. No real merchant keys, seller identity, payment terms, or refunds policy are embedded in source.

## Product

Community authoring, personal saving, public examples and basic PDF export remain free. Professional includes personal revisions and restore, company templates, member roles, private team documents and version-specific approvals. The purchasing account owns up to three organizations; members use their assigned permissions. Existing one-time 30-day free trials remain valid. A new order is blocked while a trial or paid pass is active. Expiry and cancellation stop Professional writes while preserving readable documents/history.

The Korean `/ko/billing` page compares features, displays price and seller details, records the purchased terms version, opens Toss's hosted card checkout, confirms payment, lists the last 20 orders, and provides status reconciliation and a refund-request record. Card details never reach our server. Refund requests are **not automatic refunds or notifications**: the page asks the customer to contact support with the order ID. The operator must process approved refunds in the Toss merchant console, then verify cancellation reconciliation. Partial cancellation suspends the corresponding pass and requires support review; publish the exact policy before selling.

## Server and database

`api/billing.js` uses authenticated Supabase users, server-owned prices, fixed redirect origin and opaque random order IDs. Credentials have no `VITE_` prefix. The service-role-only `jsa_billing_service` RPC writes a private, RLS-enabled order table. Browser clients cannot read payment keys or assign entitlements. `jsa_professional_access()` exposes only the caller's access summary. The existing `beta_active()` write gate and organization status now accept active live purchases as well as existing trials.

The confirmation callback binds the provider key to the user's order, uses the order ID as the provider idempotency key, and reads current provider state before granting access. A timeout or failed database write can be retried without extending the pass. Database row/advisory locks cover concurrent orders and confirmations. Terminal cancellation cannot be overwritten by an old success response. Test-mode purchases never enable production features.

Webhooks require a random URL token and still retrieve the authoritative payment from Toss; incoming status/amount fields are ignored. Register `PAYMENT_STATUS_CHANGED` to `/api/billing?action=webhook&token=<secret>`. Do not paste this URL or keys into public issues/logs. Provider keys are persisted before charge confirmation, allowing webhook recovery. A protected daily Vercel cron (`03:00 UTC`) reconciles up to 12 recent unsettled/active orders, oldest checked first. This is a small-launch backstop, not a high-volume reconciliation queue; increase capacity before exceeding 12 relevant orders per day and monitor failures. All callbacks remain available when new sales are paused.

## Before enabling test checkout

1. Apply `supabase/migrations/20261106055451_professional_pass.sql` in a staging project after isolated tests pass. This migration has a guard against unexpected `business_dispatch` drift. Review Supabase security/performance advisors after application. Do not run the fixture setup against a hosted database.
2. Configure staging Supabase URL + publishable key together and its server-only service-role/secret key. Configure `JSA_BILLING_MODE=test`, `JSA_BILLING_SALES_ENABLED=true`, `JSA_BILLING_ORIGIN` (the HTTPS preview origin), `TOSS_CLIENT_KEY=test_ck_...`, `TOSS_SECRET_KEY=test_sk_...`, matching `TOSS_MID`, `JSA_BILLING_TEST_USER_IDS` (comma-separated account UUIDs), and random `JSA_BILLING_WEBHOOK_TOKEN` and `CRON_SECRET` (at least 32 characters).
3. Set `JSA_BILLING_SELLER_JSON` with all these nonempty fields: `businessName`, `representative`, `registrationNumber`, `mailOrderNumber`, `address`, `supportEmail`, `supportPhone`, `termsUrl`, `privacyUrl`, `refundUrl`, `termsVersion`. All policy URLs must be on the configured origin. Test seller values are acceptable only in test mode; publish genuine details and reviewed policies for live sales.
4. Use **API individual-integration** keys (`*_ck_` / `*_sk_`) for the SDK v2 payment window. Widget/order-form keys (`*_gck_` / `*_gsk_`) are not interchangeable. Create the webhook in the matching test MID. Exercise a provider test payment, replay, cancellation, lost callback and expired session. The isolated fixtures do not replace this merchant integration test.

## Live activation

Finish the Toss merchant contract and checkout review; confirm the product scope, KRW 9,900 final price, seller details, refund policy, payment-related privacy disclosures and support process. Complete merchant test checkout and cancellation first. Apply the tested database migration to production, review advisors, deploy, then configure matching live keys/MID, the production origin, webhook and cron secrets. Set `JSA_BILLING_MODE=live`, `JSA_BILLING_SALES_ENABLED=true` and `JSA_BILLING_LIVE_APPROVED=professional-9900-v1`. The last flag is an operator release gate, not a substitute for merchant onboarding or policy review. No user is charged merely by enabling the flag: the user must start and authenticate checkout.

Keep the mode, provider credentials and webhook endpoint configured after the first sale. To pause sales, set **only** `JSA_BILLING_SALES_ENABLED=false`; this preserves confirmation retries, order history, reconciliation and refund requests. Do not set mode to disabled or remove credentials while paid customers exist. Monitor failed webhooks, cron responses and pending refund requests daily. No general ledger, tax invoice issuance, automatic prorated refunds, subscriptions, overseas launch or chargeback workflow is included in this first pass.

## Verification

- `npm run test:billing`: config gates, identity verification, fixed prices, ownership, retries, cancellation reconciliation, private responses and webhook/cron authentication.
- `npm run test:billing:db`: PostgreSQL 17 fixture; actual permissions, existing business migration plus billing migration, concurrent checkout/confirmation, paid org writes/revisions, expiry, cancellation, preserved reads and test/live separation. Requires local `PGDATABASE=billing_test`.
- `node scripts/billing-browser.cjs`: isolated browser provider/auth fixtures, disabled state, consent, checkout redirect, confirmation, recovery, refunds and mobile layout; no real payments or customer writes.

Primary integration references: https://docs.tosspayments.com/guides/v2/payment-window/integration · https://docs.tosspayments.com/reference · https://docs.tosspayments.com/guides/v2/webhook · https://supabase.com/docs/guides/database/postgres/row-level-security
