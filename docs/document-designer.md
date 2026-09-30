# Phase 4 — Unified document designer

Analysis now opens `/document-designer`. This workspace combines document
blocks, table columns, typed custom values and reusable templates. It includes
Phase 2.5 themes and the current Phase 3 analysis workspace. Legacy module/table
routes and their existing Export rendering remain available.

## Editing and output

- Six blocks: project information, PPE/permits, JSA table, participant
  signatures, approval and notes. Blocks can be enabled/disabled and reordered
  with drag/drop or keyboard-accessible arrow buttons.
- Columns can be enabled/disabled, reordered, renamed and resized. Widths are
  relative weights normalized to 100%, including formerly flexible columns.
- Custom columns support text, number, date, checkbox and dropdown values per
  work step. Number zero and checkbox false are retained. Dropdown options are
  committed on blur so commas remain typable.
- Three-step documents include both control columns by default. Signature
  rendering includes every supplied participant, adding rows when necessary.
- `DocumentContent` renders both the designer's white paper and designer-based
  Export output. It uses the same width, padding and font; the editor scales the
  paper to fit its viewport. The preview is continuous, while the existing PDF
  exporter applies page breaks when downloading.
- Default and grouped column header overrides are honored. React escapes user
  content in preview/output.

## Persistence

The editor mounts only after draft recovery settles, so initial defaults cannot
overwrite recovered settings. Designer state stays in `layout_data` with the
existing `table` draft stage. Library routes those drafts to the designer.
Analysis and Export round-trips carry the resolved settings, including after
refresh. Custom values stay in `analysis_data[*].customFields`.

Templates use the existing owner-scoped `user_layouts` table. New templates save
layout settings, not project-specific custom field values. Legacy TableBuilder
templates are recognized; applying one resets newer overrides/notes rather than
silently inheriting settings from the previously selected template. Existing
cloud project output includes designer settings in `custom_layout`.

No schema, policy or live account data changes were required. This phase covers
the six supported blocks; arbitrary custom blocks and company-logo editing are
not included. Photo attachment continues through the existing Export control.

## Verification

Run all six test scripts (`test:document`, `test:analysis`, `test:theme`,
`test:locales`, `test:site`, `test:content`) and `npm run build`.

Browser acceptance:

1. Change the title, enable notes, hide PPE and move notes above project info.
2. Rename a grouped risk header, change its width and reorder columns.
3. Add custom values of each supported type and check the white paper.
4. Save a template, apply a legacy template and restore the saved template.
5. Reload without route state and verify settings and custom values.
6. Visit Analysis and return; verify settings also survive its autosave.
7. Resume a designer draft from Library.
8. Compare the shared document body between designer and Export; download a
   PDF and copy the table. Check both themes and portrait/landscape.

Local browser checks use isolated mocked accounts and intercept writes. The PDF
download was opened, checked as A4 landscape and rendered for visual inspection.
Live account acceptance remains appropriate before production release.
