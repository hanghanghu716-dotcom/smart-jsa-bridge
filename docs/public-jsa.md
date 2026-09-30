# Phase 5: public JSA

Public Explore and /:lng/public-jsa/:id support anonymous readers and fresh forks. A fork is a new draft; it cannot update the source. Scraps require sign-in and are unique per user/project. Database triggers maintain the aggregate; the legacy increment RPC is a compatibility no-op.

New publications store their content language. Indexing requires a descriptive title, at least three distinct complete steps, risks with controls, and at least 180 characters of substantive descriptions. Older publications without a known language remain readable with noindex. These thresholds indicate content completeness, not safety certification. UI translations do not create translated JSA content or fake language alternates.

Vercel serves detail requests through api/public-jsa.js. It reads only public rows using the anonymous publishable key and returns real content in initial HTML, 404 for private/missing documents, or noindex 503 for read failures. All responses are no-store. The clean HTML shell is captured before static article prerendering; public JSA pages are excluded from static capture. Existing articles retain their build pipeline.

Public projections strip structured private fields; authors still need to review free text before publishing. Existing hide/block preferences are honored by Explore. Reporting is available from detail pages.

Validation: 60 automated tests, rollback-only database checks in scripts/public-jsa-rls.sql, and browser checks for guest listing/detail, sanitized content, fresh forks, withdrawn documents and mobile layout. The additive migration was applied to the linked database. Frontend deployment is separate and has not been performed.
