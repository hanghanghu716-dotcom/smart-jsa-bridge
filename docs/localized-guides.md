# Localised guide HTML and PDF

Updated 2026-10-03. Scope: six existing `/guideline/*` routes × all 18 supported country/region locales (108 editions).

## Content and user flow

- Each route uses a semantic HTML article with a country-specific introduction, local document names, three planning steps, existing task titles/hazards, rewritten site-check prompts, fresh-record guidance and official sources.
- `src/locales/guideText.js` contains editorial copy in all ten languages. `src/utils/guideContent.js` keeps language separate from jurisdiction. Québec does not inherit France's DUERP context; Alberta, Ontario and BC have distinct notes; AU SWMS and SG RA/SWP are not renamed US JHA pages.
- Legacy example titles and hazard descriptions reuse their existing native translations. Their old control recommendations and Korean PDF/image links are not rendered. Universal pressure multipliers, gas percentages, wind limits, lifting configurations and traffic speeds are removed from the guide presentation. The original translation files and old assets remain untouched for compatibility with unrelated consumers.
- Examples are editable planning references, not certified assessments or official permit forms. Country notes explain scope. Sector-specific legal review remains ongoing under stage ②, terminology review under stage ③. This work does not complete stage ⑤ live-account tests.
- The primary actions download/preview the same locale PDF, open an assessment, open work packages, or browse public JSA. They do not silently create or publish user documents.
- Mobile layout, dark/light themes, keyboard focus and Arabic RTL use the existing design tokens.

## PDF and search delivery

`scripts/render-guides.js` renders each article with Chromium print CSS to a searchable, tagged A4 PDF. This preserves Arabic shaping and CJK glyphs and prevents translations diverging between HTML and PDF. It emits the initial HTML and a manifest of PDF hashes. It does not fetch private data; all external requests are blocked during rendering.

Production `npm run build` generates guide HTML/PDF pairs after the other public-page snapshots. `verify-public-build.js` requires all 108 pairs. GitHub build environments install Noto CJK/core fonts. No DB migration or new service is required.

Each route has a localised title, description, self-canonical, valid language alternates and Article metadata. Canadian province codes remain application routes, not invalid hreflang values. PDF files use `/assets/guides/<locale>/<category>-<version>.pdf`. Publication of valid HTML helps crawlability; rankings or advertising approval are not guaranteed.

During local development, Vite serves existing PDFs or generates a missing/stale edition on its first preview/download request. The cache lives in `.cache/guide-preview`, so a fresh checkout does not need committed PDF binaries. The first request can take several seconds; Chrome must be available (the existing browser-test dependency). `PUPPETEER_EXECUTABLE_PATH` overrides the detected Windows/Linux path.

To pre-generate all PDFs locally after Vite is running:

```powershell
$env:GUIDE_BASE_URL='http://127.0.0.1:5174'
$env:GUIDE_OUTPUT_ROOT='public'
node scripts/render-guides.js
```

Generated `public/assets/guides/` is ignored by Git. Production independently regenerates it from the committed content; no external Korean PDF fallback is used. To test a smaller subset, set `GUIDE_LOCALES` and `GUIDE_CATEGORIES` to comma-separated supported values. A subset manifest must not be used as a production build.

## Verification

- Unit tests: complete language keys, all editions, region distinctions, unique PDF routes and removal of legacy universal numbers.
- Browser checks: all 18 locales, initial article/metadata, mobile overflow, theme screenshots and locale-matched preview.
- PDF review: representative Korean, Japanese and Arabic pages visually inspected; full output text/page checks recorded under `.cache/guide-qa`.
- The guide generator verifies initial article length, language, canonical and PDF signature before writing the build manifest. Failures stop the build.

The six routes preserve existing URLs and discovery associations. Old guide PDFs have not been deleted or overwritten.
