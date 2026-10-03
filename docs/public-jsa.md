# Phase 5: public JSA

Public Explore and /:lng/public-jsa/:id support anonymous readers and fresh forks. A fork is a new draft; it cannot update the source. Scraps require sign-in and are unique per user/project. Database triggers maintain the aggregate; the legacy increment RPC is a compatibility no-op.

New publications store their content language. Indexing requires a descriptive title, at least three distinct complete steps, risks with controls, and at least 180 characters of substantive descriptions. Older publications without a known language remain readable with noindex. These thresholds indicate content completeness, not safety certification. UI translations do not create translated JSA content or fake language alternates.

Vercel serves detail requests through api/public-jsa.js. It reads only public rows using the anonymous publishable key and returns real content in initial HTML, 404 for private/missing documents, or noindex 503 for read failures. All responses are no-store. The clean HTML shell is captured before static article prerendering; public JSA pages are excluded from static capture. Existing articles retain their build pipeline.

Public projections strip structured private fields; authors still need to review free text before publishing. Existing hide/block preferences are honored by Explore. Reporting is available from detail pages.

## Explore filters and engagement (October 2026)

The Material Explore screen restores the four tag groups, multiple-tag intersection, title search, translated tag suggestions, reset, exact filtered result count, and per-card scrap/reuse/report/hide/block actions. Filters and exclusions apply before pagination. Latest, scraps, views, and reused-step sorts use a stable project-ID tie breaker.

Deploy migration `20261001095606_public_jsa_engagement.sql` before the frontend/API changes. The public catalog is a security-invoker view; counter writes and raw events are not client-writable. Counters do not update project timestamps or revision state. The migration is additive and has been applied to the linked database.

Views count one visit per account (or anonymous browser token), document and UTC day. Reuse counts distinct source step indices applied by a signed-in account per document and UTC day, including full-document forks, Composer apply and Analysis content merge. Author activity is excluded. Cancelled Composer imports and merges that add no content do not count. Anonymous browser identity is approximate and can reset with browser storage; these are engagement indicators, not billing or fraud-proof analytics. Tracking starts with this release, without historical backfill. RPC failures never block reading or applying content. The UI explains these rules in every supported locale.

Security regression checks are in `scripts/public-engagement-rls.sql` and run inside a rolled-back transaction. They cover deduplication, author exclusion, private visibility, authenticated-only reuse, direct-write denial and unchanged document timestamps.

Verification for this update: 24 public/analysis/locale tests passed, Vite production compilation passed, and lint passed for the new Explore/actions/engagement code. Browser checks covered title/tag intersections, empty results/reset, all sort choices, reuse deduplication, scrap, report dialog, and 390px English provincial/German layouts. Test A1 displayed 1 view, 4 reused steps and 1 scrap; a second fork left reuse at 4. No test report was submitted.

Known validation limits: the pre-existing WorkStepWorkbench effect still fails the `react-hooks/set-state-in-effect` lint rule. Full prerender build on Windows still requires replacing the existing Linux-only Chrome executable setting; Vite compilation was verified separately. Database advisors found no new performance findings on the metrics objects; the private event table intentionally has RLS with no client policies. Existing unrelated advisor warnings remain, including [mutable function search paths](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) and [anonymous security-definer execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable). Frontend code remains local, not deployed to smartjsabridge.com.

Validation: 60 automated tests, rollback-only database checks in scripts/public-jsa-rls.sql, and browser checks for guest listing/detail, sanitized content, fresh forks, withdrawn documents and mobile layout. The additive migration was applied to the linked database. Frontend deployment is separate and has not been performed.
