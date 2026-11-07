# Food-process recommendations and catalogue completion

The shared engine considers industry context as well as task and hazard controls
for both public JSA and case studies. It does not special-case a content ID.
Food/dairy/beverage/bakery context plus hygiene/cleaning work creates needs for
food hygiene clothing and hair containment. Manual cleaning of exposed equipment
creates a dedicated food-contact cleaning tool need. General housekeeping supplies
are not substitutes. These needs rank above generic marking accessories; critical
hazard controls retain their existing priority.

## Catalogue work still required

This code change **does not add live products**. The repository catalogue is empty;
the production catalogue is supplied privately. Do not overwrite that catalogue
with fixtures or claim that new items are published merely because tests pass.

Review actual SKUs and issued affiliate links in the operator's existing catalogue:

| Category | Exact `attributes.purpose` | Evidence to review |
| --- | --- | --- |
| `food-hygiene-clothing` | `food-production-hygiene-clothing` | Manufacturer's intended food-production use, garment construction and cleaning instructions; not chemical PPE |
| `food-hair-cover` | `food-production-hair-containment` | Food-zone hair containment and fit; not a safety helmet |
| `food-cleaning-brush` | `food-contact-equipment-manual-cleaning` | Exact model's contact-material documentation, temperature/chemical limits, bristle type and zone/color assignment |
| `food-equipment-sanitizer` | `food-contact-equipment-disinfection` | Local permitted use, label, contact surface, method, concentration, time, temperature and rinsing conditions |
| `food-cip-cleaner` | `validated-food-cip-cleaning` | Specified process chemistry and CIP conditions, equipment/seal compatibility and rinse verification |

All normal merchant, affiliate URL, country, expiry, exact offer fingerprint and
manufacturer-specification review gates remain in force. Supported specification
hosts are in `industry-needs.js`; adding a manufacturer requires verifying its
official product documentation. A search result or marketplace keyword such as
"HACCP" is not product approval. Do not call generic clothing a HACCP-certified
product or reuse a chemical-protection category for food hygiene clothing.

Process chemicals additionally require:

- Product review: `countryUseReviewed: true` and `labelUseReviewed: true`.
- An approved, unexpired content profile matching the current source fingerprint.
- A profile need with the exact purpose and any applicable product constraints.
- `profile.processApprovals` entry with that exact `offerFingerprint`,
  `materialCompatibilityReviewed: true`, and `processConditionsReviewed: true`.

Record the actual reviewed conditions/evidence in the private operator record;
do not mechanically set these flags. Changed content, a changed SKU or expiry
invalidates the approval. CIP alone never implies a hand brush, and thermal milk
pasteurization alone never implies chemical disinfection. Existing suppression
and approved content profiles remain authoritative; review those profiles too
when filling gaps rather than silently replacing operator decisions.

## Audit and acceptance

Run `node scripts/audit-commerce-corpus.mjs snapshots.json private-catalog.json report.json`
with current public snapshots and the private production catalogue. The output
now includes detected needs, unmatched needs and whether a profile overrides the
automatic rules. Unmatched means "not represented in the selected result", which
can reflect catalogue gaps, review/expiry gates, suppression, or selection limits.
It does not mean products have been added. Reports omit affiliate links.

Verify multiple food cases and non-food controls, including generic maintenance
titles whose scope is food processing. Check actual selected SKUs, not merely
product counts. Avoid duplicating generic accessories to fill eight slots.

References for operator review (not product endorsements):

- [MFDS food sanitizer field guideline](https://mfds.go.kr/brd/m_218/view.do?seq=33700)
- [Vikan food-contact documentation](https://www.vikan.com/us/support/food-grade-documentation)
- [Vikan dairy processing](https://www.vikan.com/us/industries/food-beverage-processing/dairy-processing)
- [Portwest food coverall documentation](https://www.portwest.com/products/view/2201/No%20Colour/T/)

The inline layout uses two compact horizontal cards per row on desktop and one
per row at 600px and below. Thumbnails are 80px/64px, titles wrap fully, and sidebar
layout is unchanged. Browser checks exercise real image boxes, long product names,
empty-image cards, light/dark themes, desktop/tablet/mobile and RTL.
