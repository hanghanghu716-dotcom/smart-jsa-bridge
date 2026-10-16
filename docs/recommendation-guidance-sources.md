# Guidance source capture and review binding

Guidance drafts previously retained source URLs without a fingerprint. Their supporting references were also absent from the capture inventory. The new capture manifest records selected source representations and binds every primary and supporting citation before assigning a unit fingerprint.

## Current evidence

On 2026-10-16, forty-two source representations were collected. The initial five cover OSHA 1910.147 and 1910.252, HSE maintenance and welding guidance, and the Parker OIL-X user guide (17 118 6204, 07/21 Rev -). Nine Canadian captures cover CCOHS lockout and ventilation, Alberta Parts 15 and 26, WorkSafeBC lockout and welding, CNESST machinery and ventilation, and IHSA construction welding pages. Two Romanian captures cover an ILO-hosted archived HG 1146/2006 text and the Portal Legislativ representation of HG 1218/2006.

All cited sections of forty-five drafts are bound: six US/GB drafts, ten Canadian drafts, three Romanian drafts, three Korean drafts, three Australian drafts, three Singapore drafts and three Japanese drafts, three German drafts, three French drafts, three Spanish drafts two Italian drafts, two Brazilian drafts and one Saudi draft. The other 12 guidance drafts retain null fingerprints. All 57 guidance drafts and the three case drafts remain unpublished and await actual content reviews. Source binding is preparation and does not increment content-review decisions. Adding the Romanian maintenance, pressure-filter and welding drafts fills all 57 priority cells; it expands the source-binding denominator from 54 to 57 and the technical/regional/translation review denominator from 171 to 180.

Five Canadian drafts remain unbound: all three Ontario drafts and Quebec maintenance/pressure-filter drafts. Ontario government content was unavailable; the WSPS extraction did not contain the cited article. The Quebec RSST PDF edition metadata was retrieved, but the cited articles could not be recaptured after a 502 response. Neither an error response nor navigation or edition metadata counts as captured technical content.

`data/recommendation-knowledge/guidance-source-captures.json` stores URLs, observed editions, scopes, exact covered citation strings, selected extraction ranges and SHA-256 digests. It does not store complete original HTML/PDF bytes. A digest identifies the selected extracted text, not the entire document, legal applicability, or currentness of a live website. Changes outside the selected ranges are not detected. A new retrieval and comparison are needed to check upstream changes.

The extraction procedure removes line/page prefixes and converts retrieval link markers to visible link text, preserving other text and joining lines with LF. The selectors refer to the recorded extraction, not stable publisher line numbers. Future collectors must read the cited sections, record their new selectors and regenerate the manifest; a changed representation conservatively requires review again. Retrieval dates alone do not invalidate identical evidence.

Third-party source text is supplied separately for digest verification. It is not included in the repository or recommendation release. Do not substitute a summary or URL for captured source content. Preserve authorized source evidence privately under the applicable reproduction terms, or re-fetch it when needed.

## Scope findings requiring professional review

- OSHA 1910.147 supports the energy-control concepts within its stated scope. It does not supply a complete filter-opening procedure.
- OSHA 1910.252(c)(1)-(3) contains several ventilation arrangements and conditions. A conservative source-extraction recommendation must not be presented as a universal federal requirement for every welding situation.
- HSE maintenance guidance describes isolation, prevention of reconnection and control of stored energy. Great Britain scope is retained; Northern Ireland applicability has not been established.
- HSE welding guidance distinguishes regular and sporadic work. The current drafts cover regular indoor work; the sporadic-work example must not be generalized to it.
- The Parker manual gives model-specific reverse-flow precautions and depressurisation guidance. It is a manufacturer example, not a universal procedure or local legislation. Valve sequences, waiting times and torque values are not transferred to other equipment.
- Alberta's publisher disclaimer states current to March 2023. Capturing that representation does not establish current legal requirements. Later amendments remain a regional-review blocker for all three Alberta drafts.
- Alberta Part 15 separately addresses piping/pipelines in sections 215.4-215.5. The pressure-filter draft now states that it is not a piping-isolation procedure and requires a separate applicability determination.
- WorkSafeBC's welding advisory identifies the need for a site exposure-control plan. Its lockout text supports worker verification; neither replaces site-specific assessment.
- CNESST ventilation guidance includes fixed welding stations. Its machinery guidance does not substitute for the separately cited, currently uncaptured RSST articles.
- IHSA's construction text includes historical CSA references. Those references have not been verified as current standards and do not establish applicability to other industries.
- Romanian HG 1146/2006 was read from an ILO NATLEX archived copy because the publisher page was unavailable. Its current consolidation is unverified. Its maintenance/isolation clauses do not supply pressure-filter opening instructions or establish the applicable pressure-equipment regime.
- Romanian HG 1218/2006 supports risk assessment and the prevention hierarchy. The welding draft includes consideration of elimination/substitution before source extraction and respiratory protection. Additional carcinogen duties, current exposure limits and local-language suitability still require review. Foreign technical references are identified as foreign; they are not treated as Romanian law.

- Australian captures retain the WorkSafe Victoria reviewed date (10/05/2023), the November 2024 plant model Code and July 2020 welding model Code. State/territory adoption and current exposure limits remain unreviewed. The welding citation now includes the respiratory-protection passage on printed page 34.
- Singapore machinery citations distinguish printed pages 27 and 37-38 from PDF pages 30 and 40-41. The machinery publication date was not established from extracted text. The metalworking permit example is explicitly October 2012 guidance, not a universal legal permit requirement.
- Japanese captures cover rules 107-108, the March 2010 manufacturer manual, the 2007 machinery guideline and Mie Labour Bureau metal-arc welding guidance. The latter describes 2021-2022 implementation; its historical transition dates are not current deadlines. Current legal consolidation and equipment-specific applicability remain unreviewed.

- European captures add DGUV FBHM-127 (May 2022), FBHM-077 (October 2021), BetrSichV section 10 (publisher consolidation amended December 2025), INRS ED 6109 (October 2020), INRS restart/welding pages, INAIL production-line research (June 2023) and protection guidance (June 2017), and INSST NTP 1117 (2018)/494 (1999). German maintenance now correctly cites Annex 2. French maintenance cites actual ED 6109 PDF sections rather than its landing page; fluid-isolation citations include the later purge and verification text. Historical limits and guidance do not establish current legal applicability. The Italian pressure-filter presentation could not be recaptured and its draft remains unbound.

The next five captures cover Brazilian NR-12 clauses 12.11.3 through 12.11.3.3 and its publisher index, the Saudi HRSD arc-welding table, EXPRO EOM-KSS-PR-000028-AR Rev 000 (2020-03-31), and Fundacentro respiratory guidance (fourth edition, 2016). Only Brazilian maintenance/filter and Saudi welding become fully bound. Saudi maintenance and Brazilian welding remain unbound because other citations are missing. Historical respiratory guidance and a general ventilation table do not establish current requirements or a complete welding-control specification.

The remaining 12 are Ontario 3, Quebec 2, Italy 1, Saudi maintenance/filter 2, Brazilian welding 1 and Russia 3. Recapture encountered Ontario/Quebec retrieval errors, an INAIL timeout, an EXPRO project-procedure timeout, an oversized Brazilian GRO/PGR PDF, a CBIC access failure and unread Russian official scans. These failures and partial captures are not counted as completed bindings.

These are AI-assisted source comparisons, not technical, regional or translation approvals. No reviewer identities or decisions have been generated.

## Commands

Check committed metadata against the exact references in a bank:

```sh
node scripts/recommendation-guidance-sources.js --check data/recommendation-knowledge/regional-drafts.json data/recommendation-knowledge/guidance-source-captures.json
node scripts/recommendation-guidance-sources.js --check data/recommendation-knowledge/pressure-welding-drafts.json data/recommendation-knowledge/guidance-source-captures.json
```

Bind newly captured evidence into a separate output for review:

```sh
node scripts/recommendation-guidance-sources.js --bind bank.json manifest.json private-evidence.json next-bank.json
```

Evidence input has `schemaVersion: 1` and `captures`, each with an `id`, exact `url`, and ordered `fragments` containing `selector` and `text`. Each fragment must match the manifest SHA-256 and UTF-8 length. A missing citation, missing covered section or changed fingerprint clears prior approval and content-review hash. Retired units stay retired. Revisions should be incremented when accepting a changed bound bank.

The check command runs in recommendation CI. It checks consistency with recorded captures, without network retrieval. The bind command verifies the supplied extracted text but cannot attest its origin independently; reviewers must inspect provenance and content. A matching hash is not approval. The existing case-based release CLI still rejects guidance compilation; this change prepares reviewable drafts and does not enable guidance publication or alter the production DB, mappings or scores.

## Attribution

OSHA sources are US federal regulatory text. HSE source material is licensed under the Open Government Licence v3.0: https://www.hse.gov.uk/help/copyright.htm . Contains public sector information published by the Health and Safety Executive and licensed under the Open Government Licence. Parker source metadata identifies the copyrighted manufacturer manual; no manual text is redistributed here.

Korean captures identify Rules on Occupational Safety and Health Standards articles 92(1)-(4) and 617(1)-(3), effective 2026-03-02. They bind existing maintenance, filter and welding drafts without changing their control text or granting review approval. Article 617's exception conditions must not be reduced to a generic exposure-assessment exemption.
