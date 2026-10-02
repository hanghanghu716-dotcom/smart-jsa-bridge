# Community private document storage

## 2026-10-02 policy restoration

Community is limited to **three concurrently saved private documents**, not three monthly creations. `20261001102907_community_operations.sql` had removed enforcement while retaining counters. The new migration `20261001162553_community_private_storage_visibility.sql` restores the cap using those counters and the existing row-locking trigger. No stored document is deleted, hidden or published by this change. Professional free beta lifts the cap while active; expiry preserves existing documents and restricts only additional private slots.

Info defaults new documents and reused public examples to private. The `formData.saveVisibility` choice travels through editor navigation and private draft recovery. Export displays the matching save actions and allows changing the choice. Public saving still requires explicit publication/reuse consent and existing content-quality checks. An existing private original is never overwritten by a public save. Public copies exclude structured private fields, but free text must be reviewed by the author.

The selection, privacy guidance and quota descriptions cover all supported locales. Private usage appears in Info, Export, Library and Business. Community and Professional plan descriptions explain their storage rules.

Validation: application tests; isolated intercepted-browser checks for Info selection/navigation/recovery, public-source privacy defaults, explicit consent, public saving at the private cap, concurrent-save rejection, draft preservation and existing-document updates; client production bundle; isolated PostgreSQL (PGlite) checks for restoring the cap over existing counts, null visibility, bulk rollback, ownership, conversion, deletion and beta expiry. `scripts/quota-concurrency.cjs` also applies the new migration before its two-session CI checks. These checks do not access real user records.

**Deployment:** the new migration has not been applied to the hosted database. This session has no Supabase CLI authentication or linked project. Apply the migration with the matching frontend release; local UI changes alone do not enforce the hosted database limit. Do not run `project-storage-rls.sql` against production: its account fixtures are intended only for the disposable test database.

## Original implementation notes (historical)

Free accounts may keep three saved private JSA projects. This is a concurrent storage limit, not a monthly creation allowance. Steps, risks, drafts, public projects and public bookmarks do not consume additional private slots. Existing private documents remain editable and exportable. Deleting a private document frees a slot. Saving a new private copy or changing a public project to private consumes a slot.

An active one-time Business beta removes this limit. Expiry restores the three-document limit without deleting or freezing existing documents. An account with four documents can still edit all four but cannot add another until below three or otherwise entitled by the server. Clients cannot grant or extend their trial.

## Enforcement

Migration `20260930150840_free_private_project_quota.sql` backfills a private counter under a table write lock. Actual row changes update it through an AFTER trigger, including bulk inserts, UPSERT and visibility changes. The per-account counter is locked before checking current trial expiry and conditionally incrementing. Failure rolls back the project write and all related trigger work. Trusted database maintenance without a user JWT is exempt from the cap but still updates counters.

Both ownership columns must match the authenticated user and cannot be reassigned. Restrictive RLS policies supplement the older permissive policies. Clients cannot modify the private counter or execute its trigger functions directly. Usage is exposed through an authenticated, zero-argument RPC scoped to the current user. Security-definer helpers use an empty search path.

The private counter deliberately has RLS enabled, no policies and no client grants. The Supabase advisor reports this as INFO `rls_enabled_no_policy`; it is intentional default-deny access. Existing unrelated warnings are unchanged. See [Supabase RLS advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) and [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

## Verification

- `node --test scripts/*.test.js`: 74 automated tests, including caller-scoped usage, failures, quota error recognition and preserved-draft copy.
- `scripts/project-storage-rls.sql`: real-database transactional fixtures ending in ROLLBACK verify fourth-save rejection, ownership, counter tampering, public/private conversion, UPSERT, atomic bulk failure, deletion, trial expiry and existing-document edits. Existing user data is not retained from the test.
- `scripts/quota-concurrency.cjs`: two independent PostgreSQL sessions contend for the third slot under Read Committed and Repeatable Read; exactly one may commit and the counter must equal three. Runs only against the disposable local `quota_test` database in the dedicated GitHub Actions workflow.
- The Export, Library and Business screens display usage and free-trial guidance. A server rejection preserves the active draft; only successful private persistence archives it.

The database migration has been applied. Frontend changes remain in the Phase 6 draft PR until merged and deployed.
