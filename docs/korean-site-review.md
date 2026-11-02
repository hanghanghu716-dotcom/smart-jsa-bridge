# Korean site review — 2026-11-03

Scope: the Korean site, including public navigation, account screens, authoring,
saved documents and work packages. Existing Case Study and JSA records are not edited.

## Changes

- Recent public JSA cards are capped at three in the summary reader, initial HTML
  and client renderer. Explore remains the route to the complete catalogue.
- Profile, Library, password reset and request administration are no longer hidden
  behind the mobile PC-only screen. Authentication and administrator checks remain.
- The profile form has a single-column mobile layout, scrollable content and visible
  save controls. Its Korean default-publication label now describes a default for
  new documents, rather than suggesting automatic publication of existing work.
- Korean password-reset labels, validation and expired-link messages are provided.
  The form can scroll on a small screen.
- Empty Korean news/jobs sections link to official destinations. Work24 is clearly
  described as awaiting automatic connection. The jobs initial HTML and interactive
  empty state use the same official link data.

## Verification boundaries

- `scripts/korean-site-browser.js`: 42 static Korean routes, desktop and mobile.
  Anonymous access only; external mutations blocked. Redirects to login/community
  are expected for protected pages. Dynamic document IDs and legal accuracy are
  not certified by this route sweep.
- `scripts/korean-account-browser.js`: isolated authenticated profile, Library,
  password reset and empty jobs screen, at desktop/mobile widths. All external
  requests are intercepted. This regression runs before production deployment.
- `scripts/authoring-workflow-browser.cjs`: template → Info → Procedure → Analysis
  → Export, mobile editor/preview, draft recovery and preview/PDF pagination.
- `scripts/korean-storage-browser.js`: reuses isolated storage tests
  and Korean regional work-package/PDF tests. No real account records are written.
- Existing deployment checks also cover administrator verification, resources,
  jobs, feedback, library recovery, public documents and regional guidance.

## External operational items

- Work24 has no active production connection. Its approved company-account API
  access is still required; a link to the official site is not an API integration.
- Korean MOEL news collection is active, but collected candidates require relevance
  and item-specific reuse checks. They are not blanket-approved for publication.
- The production account/permission system is not replaced by browser fixtures.
  Successful fixture checks do not assert that every real account or historic
  document has been exercised.

Official destinations checked: [Work24 API introduction](https://www.work24.go.kr/cm/e/a/0110/selectOpenApiIntro.do),
[MOEL RSS](https://www.moel.go.kr/site/rss/rssList.do),
[MOEL press releases](https://www.moel.go.kr/news/enews/report/enewsList.do),
[National Law Information Center](https://www.law.go.kr/).

The older `project-persistence-browser.cjs` still assumes a retired Library menu.
Its initial private-save assertions passed, but its Library navigation is not a
valid current regression. The deployment uses `library-discovery-browser.cjs`
for the current Library loading/reopen flow instead.
