# Phase 4.5: completed documents and reusable templates

This phase builds on the Phase 4 document designer. A reusable template and a
completed private document are separate records. Saving a template before
Export is optional; Export never creates or updates a template implicitly.

## User flow

- **New private completed document:** preserves all form fields, participants,
  procedures, analysis, custom values, document settings, notes and step photos.
- **Update existing private document:** appears for an owned private document
  opened from Library. It updates that record only if its saved revision still
  matches. A stale revision leaves the editor and draft intact so the user can
  reopen the current version or save a new private copy.
- **Public copy:** inserts a separate public record and leaves the private
  source unchanged. Date, department, location, manager, equipment, additional
  form items, participants, custom field values, notes, photos and procedure
  provenance are excluded. Titles and analysis text still require user review;
  a confirmation states this before publication. Existing public quality checks
  still apply. The active private draft remains available after publication.
- **Library:** both owned documents and scraps offer View Report with the saved
  layout. Editing an owned document keeps its identity and revision. Referencing
  another document cannot overwrite it. Starting from Library uses a separate
  active draft rather than overwriting whichever draft was previously active.
- **Templates:** the designer supports create, rename, update from current
  layout, delete, set default and clear default. A template stores layout and
  reusable note text, not participants, analysis values, photos or save targets.
  Its default is applied only to a new unconfigured document and never over an
  existing document, recovered layout or edits made while templates load.

Private completion first flushes the current draft and pauses autosave. Only
after a successful project write does it archive the matching draft revision.
A failed project write retains the draft and resumes autosave; an archive
conflict reports that the project saved while leaving the draft available.
Photos and custom values follow their work step when reordered in the composer.

## Data and migration

No extra project table is introduced. `jsa_projects.custom_layout` retains the
layout, `stepPhotos` and procedures; procedure fallback supports older records.
`projectSaveContext` is editor/draft metadata and is omitted from completed
records and templates. Updates filter by owner, private status and `updated_at`.

Migration `20260930121242_phase45_document_template_defaults.sql` adds:

1. `user_layouts.is_default` and a partial unique index per owner.
2. `set_default_document_template(uuid)`, a SECURITY INVOKER function that
   serializes default changes per owner, validates ownership and allows null
   to clear the default. Existing owner RLS remains enabled.
3. A SECURITY INVOKER project trigger enforcing the structured public-field
   exclusions, including when an older client changes a private row to public.
   It does not rewrite existing records until they are written again.

The migration was applied to the connected project on 2026-09-30. Apply it before
deploying this frontend in another environment. Functional default switching,
clearing and private/public retention tests ran in rolled-back transactions;
no test records remain. Owner isolation was also checked with authenticated
fixture roles. Post-migration advisors introduced no new findings. Existing
unrelated findings concern [function search paths](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable),
[public extensions](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public),
[callable definer functions](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
and [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Verification

Run `npm run test:persistence` and the existing document, analysis, theme,
locale, site and content suites. The persistence suite covers private round
trips, public redaction without source mutation, old documents, template
exclusions, translations and owner/revision-aware service writes.

With `npm run dev -- --host 127.0.0.1` running, execute
`npm run test:persistence:browser`. Set `PUPPETEER_EXECUTABLE_PATH` outside the
default Windows Chrome location, and optionally `JSA_QA_BASE_URL` or
`JSA_QA_OUTPUT`. All external requests are intercepted: auth, projects, drafts
and templates use isolated fixtures, so this test does not write real accounts.
It covers exact report-body restoration from Library, double-click protection,
update versus insert, failed/stale writes, refresh recovery, archive conflicts,
public exclusions, template CRUD/default application and photo reordering.

Run `npm run build` for the release bundle and the full public-page render
check. Frontend merge/deployment is a separate release step. Photos continue
to use the existing data-URL mechanism; larger-file storage and image limits
are outside this phase.
