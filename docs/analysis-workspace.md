# Phase 3 — Analysis knowledge workspace

The analysis screen keeps the current assessment visible while a knowledge panel
shows saved work steps and authored/bookmarked projects. Users can import one
hazard or all hazards from a step, with or without its control text. A quick step
strip switches the current work step without closing the knowledge panel.

## Import behavior

- Existing hazards and edited controls are retained. Normalized hazard text
  identifies duplicates (case, Unicode width and repeated whitespace ignored).
- Importing hazards only clears control text and its database references.
- A full import includes control text; it never replaces the current step's
  frequency, severity or assessed score. Prior scores need reassessment for the
  current work and are not silently transferred.
- Three-step controls become two separate lines in a two-step document; a
  legacy combined control becomes the current control in a three-step document.
- Imported hazards record the source project/work-step, original step index and
  source risk ID. Generated IDs belong to the current document.
- Repeating an import skips duplicates and reports the result. To revise an
  already imported hazard's controls, edit that row directly.

## Search and loading

Search includes titles, details, tags, hazards and control text. Opening a
project found by its title keeps its steps visible. A step-text search retains
the original step numbers. The panel currently loads up to 100 saved work steps;
project queries retain the existing API row limit. Server-side library paging
and search remain future work for larger libraries.

Loading, empty results and query failures have separate states. A failed query
is reported with a retry action instead of appearing to be an empty library.
Account operations retain existing Supabase ownership filters and policies.
No database schema or policy changes are included.

## Integration and verification

This branch incorporates Phase 2.5 and the latest Phase 2 draft locking/version
history. It targets the theme branch so its PR shows only Phase 3 changes.
Phase 4 Document Designer remains a separate draft and must incorporate this
branch before its review.

Run `npm run test:analysis`, `npm run test:theme`, `npm run test:locales`,
`npm run test:site`, `npm run test:content` and `npm run build`.

Browser acceptance checks:

1. Open Analysis with two steps and existing controls; open the knowledge panel.
2. Import one hazard and then a full step. Existing controls and scores remain.
3. Repeat the import; the count reports skipped duplicates.
4. Switch steps, import hazards only and verify empty control fields.
5. Return to the first step and verify its controls are unchanged.
6. Search by project title, then by a control in its second step. Original step
   numbering and source labels remain correct.
7. After autosave, reload without route state and verify draft recovery.
8. Simulate a library query failure and retry after restoring access.
9. Repeat in light/dark at desktop widths of 1440 and 1920 pixels.

Automated browser verification uses isolated account fixtures and intercepts
network writes. A live account acceptance check remains appropriate before
production release. Existing Analysis hook-effect lint findings predate this
change; the new import/search helper and its tests pass targeted lint.
