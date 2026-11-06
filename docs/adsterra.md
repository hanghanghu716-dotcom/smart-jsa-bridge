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

Location is derived from trusted Vercel country/subdivision headers, never the selected language. Every supported locale uses the same policy:

| Visitor location | Initial behavior |
|---|---|
| Korea, Japan, United States, Australia | Automatic visible ads with data-use notice and opt-out settings |
| Canada, known province/territory other than Quebec | Automatic visible ads with notice and opt-out settings |
| Quebec or unknown Canadian subdivision | Explicit consent before ads |
| Other countries, missing location, untrusted host or failed lookup | Explicit consent before ads |

This is an implementation policy for the current service, not a guarantee of legal compliance for every provider data flow. All pages remain accessible when advertising is refused. Existing denials and GPC/DNT take priority everywhere. Denials are persistent until changed; affirmative consent expires after 180 days. Automatic display never fabricates consent. No signed-in user identifiers, document content or full article URLs are passed by our frame endpoint.

A short non-modal notice appears before advertising starts in automatic regions, with a direct link to privacy choices. There are no accept/decline questions or per-banner off buttons in those regions. The bottom advertising notice remains. Privacy settings retain explicit allow/deny controls. Analytics preferences are separate.

### Basis and limits

- US: California DOJ describes notice at collection, sale/sharing opt-out and GPC requirements: https://oag.ca.gov/privacy/ccpa and https://www.oag.ca.gov/privacy/ccpa/gpc
- Australia: OAIC guidance permits advertising tracking subject to transparency, minimisation, opt-out and other APP obligations; sensitive information needs consent: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations
- Canada: OPC allows opt-out for non-sensitive online behavioural advertising subject to clear advance notice, meaningful persistent opt-out and other limits: https://www.priv.gc.ca/en/privacy-topics/technology/online-privacy-tracking-cookies/tracking-and-ads/gl_ba_1112/
- Quebec: identification/profiling cookies start disabled: https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/interfaces-truquees
- Singapore: advertising using personal data requires notification and consent: https://www.mddi.gov.sg/newsroom/mci-response-pq-accountability-coys-surveillanceadvertising/
- UK: advertising storage/access technologies require consent: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-the-rules-apply-to-online-advertising
- Other or unreviewed locations remain consent-first rather than being assumed exempt.

Provider policy: https://adsterra.com/publishers-terms-managed/ section 4.9 requires privacy disclosure and a cookie consent message when cookies collect information. We do not claim a documented cookie-free or non-personalized Adsterra mode. Provider confirmation of its actual collection/retention and regional consent requirements remains unresolved. Section 4.7 also requires prior written approval for the existing custom iframe wrapper; successful rendering does not prove approval.
