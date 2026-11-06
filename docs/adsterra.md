# Adsterra placements

Free functionality remains unchanged; no paid-plan changes are included.

| Position | Format | Ad unit |
|---|---|---|
| Left | 160x600 | 32123433 |
| Right | 160x300 | 32123548 |
| Bottom desktop | 728x90 | 32123549 |
| Bottom mobile | 300x250 | 32122341 |

Each placement has its own approved key. Adsterra selects creatives and may repeat an advertiser across placements. No timed refresh or duplicate-placement request is used. Only visible placements request ads, subject to the regional policy and any saved preference. Small screens hide side rails. Print hides advertisements.

The separately deployed advertisement origin contains only the ad endpoint and public configuration, without authentication or application environment variables. Its same-origin sandbox permission lets the provider write its nested creative document. The application remains cross-origin and inaccessible to it. The main-domain endpoint returns 404.

Deploy the advertising host with scripts/deploy-adsterra-host.js. Mock browser checks intercept every provider request and test nested document writes, independent keys, app storage isolation, responsive visibility, consent withdrawal and no refresh. Production verification fetches only first-party frame HTML and does not generate impressions.

## Regional behavior

KR and JP requests use automatic ads unless a visitor has opted out or sends GPC/DNT. The country comes from the Vercel request header, never the page language. All other countries, missing/untrusted location and failed policy requests require an explicit choice. Automatic serving does not write an allowed consent record. Existing denials are preserved. This is a limited product rollout, not a general claim about each country's law.

The blanket prompt and repeated per-banner disable buttons are removed for automatic regions. An inline advertising/data-use notice and a link to privacy settings remain below the bottom banner. The privacy page retains explicit allow/deny controls. Analytics preferences are separate and unchanged.

Policy reference: https://adsterra.com/publishers-terms-managed/ (4.9 requires a privacy policy and a cookie consent message when collecting information with cookies). This implementation does not assert the provider is cookie-free or non-personalized. Provider confirmation of collection and consent requirements remains advisable. Section 4.7 also requires prior written approval for the existing custom iframe wrapper; do not treat successful rendering as proof of that approval.
