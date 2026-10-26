# Public discovery and cached JSA thumbnails

The public home now reads metadata for six visible document groups and displays saved first-page WebP images instead of rendering risk PDFs on each visitor's device. Missing images retain readable title/summary previews.

Authenticated authors generate missing current-revision thumbnails serially in the library/export workspace. Captures use the persisted, sanitized public risk assessment, its language and saved layout. A failed capture never changes document-save success. Images are capped at 200 KiB; the private bucket checks current publication before serving them.

This release also includes archive search/filter/sort and localization, the complete home tag browser, article-image thumbnails, subtle UI rounding, the existing shield logo and session-aware account navigation.

## Database

Applied migrations: 
- 20261026091423_cached_public_jsa_thumbnails
- 20261026092008_optimize_public_thumbnail_reads

The second migration allows the query planner to apply LIMIT before expensive assessment calculations and uses indexed project IDs in storage permission checks. Table RLS and security-invoker access remain enforced.

Production transaction tests verified owner inserts, rejection of stale revisions and foreign-owner writes, and anonymous current-public reads. Test writes were rolled back. No JSA body content was modified.

Existing images are generated when their author visits the workspace; deployment alone does not render them.

## Validation

Node tests and the Vite build run locally. The production pipeline additionally runs isolated browser thumbnail tests before building/promoting the release, plus the existing multilingual HTML/PDF, discovery, library and rollback checks.
