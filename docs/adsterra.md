# Adsterra on the free version

The integration is based on production commit ea67dee9d1af9c07d2abf20e811c1847bae99fa1.
It does not include the paid-pass branch or enable payments.

One 300×250 banner is available on each populated public homepage and case-study page.
Authoring, accounts, private documents, administration, and PDF export have no Adsterra placement.
The existing Google advertising gates remain off.

## Placement configuration

Current approved website: 6179717. Banner 300×250 unit: 32122341. Adult ads: off.
The code was obtained from the publisher's Get code dialog on 2026-11-06.

Copy the exact key and HTTPS script URL from the approved Banner 300×250 unit for
smartjsabridge.com into src/config/adsterra.js. These are public placement identifiers,
not account credentials. Set enabled to true only for an approved unit.
No API key, payout information, or account password belongs in the repository.
Set enabled to false and deploy to disable all Adsterra requests.

## Loading and preferences

Advertising requires a separate affirmative choice, stored for 180 days. Analytics
consent does not authorize advertisements. The privacy page and each active banner
allow withdrawal. With no valid placement, no consent, denied consent, expired consent,
blocked storage, an unsupported page, a preview host, or a prerendering browser, no
advertising frame loads.

The banner loads once on entering the viewport. It does not refresh on scroll.
The 300×250 frame is isolated from application sessions and document data with an
opaque sandbox. Ad clicks may open a new tab; frame scripts cannot navigate the main
page. No Popunder, Social Bar, Smartlink, or automatic redirect is installed.
Keep the publisher account's adult-ad option disabled.

## Verification

Run node --test scripts/adsterra.test.js and node scripts/adsterra-browser.cjs.
The browser fixture intercepts every non-local request and uses inert example ads:
it generates no payable impressions or clicks.
A production check should inspect the public placement and privacy controls without
clicking an advertisement or repeatedly reloading it. Verify the ad frame's response
CSP, because its restricted advertising policy is separate from the application's CSP.
