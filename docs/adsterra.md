# Adsterra placements

Free functionality remains unchanged; no paid-plan changes are included.

| Position | Format | Ad unit |
|---|---|---|
| Left | 160x600 | 32123433 |
| Right | 160x300 | 32123548 |
| Bottom desktop | 728x90 | 32123549 |
| Bottom mobile | 300x250 | 32122341 |

Each placement has its own approved key. Adsterra selects creatives and may repeat an advertiser across placements. No timed refresh or duplicate-placement request is used. Only visible placements request ads, after consent. Small screens hide side rails. Print hides advertisements.

The separately deployed advertisement origin contains only the ad endpoint and public configuration, without authentication or application environment variables. Its same-origin sandbox permission lets the provider write its nested creative document. The application remains cross-origin and inaccessible to it. The main-domain endpoint returns 404.

Deploy the advertising host with scripts/deploy-adsterra-host.js. Mock browser checks intercept every provider request and test nested document writes, independent keys, app storage isolation, responsive visibility, consent withdrawal and no refresh. Production verification fetches only first-party frame HTML and does not generate impressions.
