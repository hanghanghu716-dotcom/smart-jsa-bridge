# Guidance source capture and review binding

## Current state — 2026-10-16

All **57/57 current guidance draft revisions** have fingerprints binding every active primary and supporting citation to captured source sections. There are **47** selected source representations. Twelve previously incomplete drafts were reauthored from material already captured; their inaccessible original URLs were not recovered, silently marked read, or replaced with AI-invented sources.

`guidance-evidence-dossiers.json` contains the twelve authored evidence dossiers: exact draft content and hash, source/section/fragment mapping, replacement rationale, prior sources and scope, and outstanding review limits. These dossiers are authoring records, not primary authorities or review approvals. `guidance-source-retrieval-status.json` preserves the earlier 12-draft retrieval blockage as history and marks the current revisions complete.

Content desk-review progress is **177/180**:60 technical,57 regional and60 translation/terminology areas. Batch21 completes Italy3,Russia3 and Korea welding1 after selected original-text/annex and amendment checks, corrects seven drafts and revalidates their fourteen technical/translation areas without double-counting. Saudi Arabia3 remain blocked on controlled-edition, adoption and task-specific requirements in `content-review-batch21.json`. Latest findings: `recommendation-content-review-batch21-20261017.md`. The INL editorial compilation, signed Russian page images, Korean notice/HWP and mislabelled Saudi download are distinguished in the evidence record. Earlier review records remain immutable; exact changes reconstruct historical hashes. Existing source captures/citation meanings stay unchanged, while current selected-provision checks are attached separately to the new review records. All60 units remain drafts with pending publication statuses, null scores and zero eligibility. Workstream3 remains active.

## Evidence changes (historical source-acquisition scope)

| Reauthored drafts | Captured basis and limits |
| --- | --- |
| Ontario maintenance/filter (2) | CCOHS and WSPS technical guidance; foreign OSHA and manufacturer references where cited. No assertion of reading the blocking alert or Regulation 851, and no provincial compliance certification. |
| Ontario welding (1) | IHSA construction-welding, CCOHS and OSHA. Construction scope retained; pre-start review Item 8 and current CSA obligations unverified. |
| Quebec maintenance/filter (2) | CNESST machinery guidance and CCOHS; filter also retains OSHA/Parker. No claim to have read the 2026 RSST consolidation; the 2023 Gazette is not substituted as an equivalent consolidation. |
| Italy filter (1) | INAIL 2023 research description supplies residual-energy context; OSHA/Parker supply technical examples. The INAIL research page is not represented as an operating procedure or Italian law. |
| Saudi maintenance/filter (2) | EXPRO EOM Rev 000 (2020-03-31); scope narrowed to government facilities/projects operation and maintenance with an adopted equipment procedure. Independent checking retained. Unread EPM construction procedure retired from active citations. |
| Brazil welding (1) | Fundacentro 2016 primary publication plus explicitly foreign OSHA/HSE guidance. Added elimination/reduction before extraction and respiratory protection; no claim of current GRO/PGR verification. |
| Russia maintenance/filter/welding (3) | Captured reproductions of 833n/884n and operator/foreign technical guidance. 287n is duration context only. Signed-source equivalence and current legal applicability remain unreviewed; no actual site is claimed to have passed rule 8 exclusions. |

The unread references are retained in the dossier's prior source records, including full citation scopes and retrieval status. The previous revisions remain in Git history. This is a documented change to authored evidence and scope, not recovery of the old inaccessible sources. During phase 11 source reauthoring, the 45 already bound units and the three earlier review records were preserved. Later content-review corrections are recorded separately with prior content and hashes.

## Representation and limits

`guidance-source-captures.json` stores URLs, observed editions, scope limits, exact covered citation strings, selected extraction ranges and SHA-256 digests. It does not store full HTML/PDF bytes. Captures reflect their collection-time scope; historical descriptions of incomplete drafts do not confer authority on later revisions. A digest identifies selected extracted text, not a whole document, current law or applicability. Changes outside the selected ranges are not detected.

Extraction removes line/page prefixes and converts retrieval links to visible text, preserving other text and joining lines with LF. The selectors refer to retrieval output, not permanent publisher line numbers. Source bodies are verified privately and are not redistributed in the repository or generated dossier. Changed evidence or citation meaning requires a new fingerprint and review. A retrieval date alone does not invalidate identical evidence.

Historical editions, foreign guidance and operator-specific procedures are never treated as universal local legislation. Pressure-filter opening always depends on the actual equipment procedure; no model-specific timing, torque or valve sequence is generalized. Welding scope remains regular indoor uncoated mild steel; numerical ventilation design and universal respirator specifications are not authored. Professional regional and technical review is still required before release.

## Commands

```sh
node scripts/recommendation-guidance-sources.js --check data/recommendation-knowledge/regional-drafts.json data/recommendation-knowledge/guidance-source-captures.json
node scripts/recommendation-guidance-sources.js --check data/recommendation-knowledge/pressure-welding-drafts.json data/recommendation-knowledge/guidance-source-captures.json
node scripts/recommendation-guidance-sources.js --bind bank.json manifest.json private-evidence.json next-bank.json
```

The bind command checks the actual supplied fragment text against each digest and byte length; the check command checks committed metadata consistency without network retrieval. Neither independently attests source provenance or grants approval. The existing release CLI rejects guidance compilation; this work does not enable production publication.

## Attribution

OSHA sources are US federal regulatory text. HSE content is licensed under the Open Government Licence v3.0: https://www.hse.gov.uk/help/copyright.htm . Contains public sector information published by the Health and Safety Executive and licensed under the Open Government Licence. Publisher identities and reproduction hosts are retained in source metadata. No third-party document full text is redistributed here.

## Additive source-section indexing

Batch 13 explicitly indexes OSHA 1910.147(c)(2)-(3) together with (d)(1)-(6) for the two revised US isolation drafts. Those paragraphs were already present in the verified capture bytes. No source text or fragment digest changed. The two new citation meanings receive new source fingerprints; previous reviews retain their original section lists and exact fragment hashes.

