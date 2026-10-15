# Reviewed case recommendation activation

CaseStudyDetail now offers explicit work-step and site-condition selection. Only the exact document Locale, jurisdiction and current case-source fingerprint are eligible. The selected steps pass through Info and Procedure into Analysis. Imported hazards have blank controls and unassessed risk values; applying a current-control recommendation does not mark it implemented. Additional controls require the original hazard, task, applicable conditions and confirmed selected current control.

The percentage remains a localized text-similarity score. Reviewed cards show applicability, exclusions, site verification, source links, source revision and review date. They do not claim a probability of safety or statutory compliance.

`src/data/reviewed-recommendations.json` is deliberately empty. The 57 existing knowledge drafts (54 regional guidance units and three case-derived pilots) have not received the required technical, regional and translation reviews. Browser tests inject explicitly synthetic releases through a test-only Vite alias; production imports the checked-in empty release. Authored-unit coverage is tracked in `recommendation-task-coverage.json` and does not establish publication eligibility.

## Publication procedure

1. Structure and review each unit, including applicability identifiers and localized `conditionLabels` for every required and excluded condition. The same condition identifier must have the same meaning throughout one case/Locale/jurisdiction.
2. Record technical, regional and translation approval against `knowledgeContentHash`, together with reviewer, review date and current source fingerprint. Approvals must come from actual review.
3. Generate mapping scores offline. Record score model/version/Locale/date and a separate mapping approval covering both the unit hash and `mappingContentHash`. A supplementary mapping must reference a current mapping with the same task/hazard/target context and case source.
4. Export the current exact-language case rows through an authorized read-only path. Compile a separate file with:

   `node scripts/recommendation-release.js bank.json mappings.json current-case-rows.json release-id output.json`

5. Review the output, evaluation and country coverage before promoting it to `src/data/reviewed-recommendations.json`. The compiler refuses to overwrite an existing file. `npm run prebuild` verifies release content and approval hashes.
6. Run the recommendation tests and isolated browser tests, then follow the existing production release checklist. Reverting the bundled release is independent of legacy table IDs and user documents.

The browser re-reads the exact case row before every case recommendation. A changed, missing or ambiguous source returns no recommendation; read failures remain errors. No live AI extraction or database mutation is performed by this flow. Updating an article therefore blocks its old recommendations until a reviewed release is built against the new source. Work-step or work-context changes preserve user text but clear references, confirmation and old risk ratings.

## Remaining dependencies

The 2026-10-14 10:44 UTC public-data audit retry failed with HTTP 522; later read-only audits recovered. The historical CI audit beginning at 13:38 UTC completed reads of all nine tables, with aggregate coverage for all 18 Locales. These are sequential public-anon/RLS reads, not privileged schema verification or a consistent backup. Consult the private operational handover for current schema, backup, restoration and correction evidence; this historical audit does not establish their present status. Source-based resolution of outstanding data gaps, genuine content reviews, reviewed release population, independent relevance evaluation, authenticated staging and production rollout remain open. Test fixtures do not satisfy those requirements. Current-head CI results are tracked in Draft PR #25.
