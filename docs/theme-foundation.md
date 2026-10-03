# Phase 2.5 — Theme foundation

The main menu and Profile offer System, Light and Dark. System is the default.
The choice is stored under the original `smartjsa_theme_preference` key in this browser; changing it in one
tab updates the other tabs. OS changes affect System mode only. A blocked storage
API leaves the current in-memory selection usable.

The original compact selectors remain available in each core workflow header.
Existing `auto` preferences remain compatible with the displayed System mode.

## Coverage

- Info, Procedure and Step Composer
- Analysis, Module Builder, Table Builder and Export
- My Library, including drafts, reusable steps and history
- Login, Reset Password, Profile, main menu and main workflow entry modal

The landing hero and existing editorial/content pages retain their designed
palettes in this foundation phase. Legacy LayoutBuilder and standalone public
JSA previews are also outside this migration. Phase 3 and Phase 4 should use the
shared tokens from their first implementation.

## Implementation rules

`public/theme-init.js` resolves the preference before the first paint, including
prerendered entry pages. Keep its storage key and normalization consistent with
`src/theme/preferences.js`; the theme tests verify their agreement. React's
ThemeProvider owns subsequent OS and storage event listeners and removes them
on unmount.

Use the semantic variables in `src/theme/theme.css` for UI surfaces, text,
borders and status messages. `--accent` is readable foreground text;
`--action-bg` and `--on-accent` are the solid button pair. Do not use a text
color as a button background without checking its contrast in both modes.

Document paper has a separate `.theme-paper` boundary. Paper background, text,
table borders, column category colors and canvas export parameters retain their
print colors. Do not migrate PDF canvas options or document-rendering functions
to application UI tokens. Screen theme never changes the exported document.

The global black-background, hidden-scrollbar and removed-focus rules formerly
in Procedure, Export and MyLibrary were removed because importing these modules
applied them to unrelated routes too.

## Verification

Run `npm run test:theme`, `npm run test:locales`, `npm run test:site`,
`npm run test:content`, and `npm run build`.

Browser checklist:

- Open the main menu as a guest; select each mode with mouse and keyboard.
- Reload after an explicit choice. Change the OS appearance in System mode and
  verify that an explicit Light or Dark choice remains fixed.
- Open another tab and verify preference changes propagate.
- Inspect the six JSA workflow stages in both modes; preserve entered values.
- Inspect Step Composer, Library drafts/steps/history and Profile with a test
  account or isolated fixtures.
- Confirm document previews, PDF and copied table output keep white paper.
- Check Arabic labels and the native radio group in the main menu/Profile.

Local browser QA uses isolated browser profiles and mocked account requests;
it does not write to live user data. Backend draft/version behavior is unchanged
by this patch and is still covered by the Phase 2 acceptance checklist.
