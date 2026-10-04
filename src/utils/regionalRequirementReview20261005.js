// Dated additions: a review date never silently updates older evidence.
const source = (title, url, scope, basis = 'official-guidance') => ({
  title, url, scope, basis, checkedAt: '2026-10-05',
});
const finding = (noteKey, fields, evidence) => ({
  checkedAt: '2026-10-05', status: 'source-backed-prompts',
  noteKey, additionalNotes: [], fields, sources: [evidence],
});
export const REQUIREMENT_REVIEW_20261005 = {
  US: {
    height: finding('usHeightNotice', ['equipmentRelease', 'rescueReadiness'], source(
      'OSHA · 1910.140(c)(17), (18), (21)',
      'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.140',
      'General-industry personal fall protection: each-shift initial-use inspection, impact-loaded equipment withdrawal and competent-person clearance, prompt rescue. Does not decide when fall protection is required', 'regulation')),
    electrical: finding('usIsolationNotice', ['isolationVerification', 'restorationRelease'], source(
      'OSHA · 1910.333(b)(2)(ii)–(v)',
      'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.333',
      'De-energised fixed equipment: all energy sources, qualified-person verification including induced/backfeed voltage; tester operation checks over 600 V; ordered restoration and absent lock-owner exception. Not a live-work permit', 'regulation')),
    hot: finding('usHotNotice', ['hotAuthorisation', 'watchCloseout'], source(
      'OSHA · 1910.252(a)(2)(iii)–(iv)',
      'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.252',
      'General-industry welding/cutting: conditional fire watch during work and at least half an hour afterward; site inspection and authorization, preferably a written permit. Not a universal written-permit mandate', 'regulation')),
  },
  GB: {
    height: finding('gbHeightNotice', ['fragileSurface', 'fallingObjects'], source(
      'HSE · Introduction to working at height safely',
      'https://www.hse.gov.uk/work-at-height/introduction.htm',
      'Great Britain guidance: avoid/prevent/minimise, collective protection first, fragile surfaces, falling objects and rescue. No universal safe-height exemption')),
    electrical: finding('gbIsolationNotice', ['isolationVerification'], source(
      'HSE · HSG85, paragraphs 53–55',
      'https://www.hse.gov.uk/pubns/priced/hsg85.pdf',
      'Great Britain guidance, third edition 2013: prove dead and check voltage detector before/after use. The US over-600-V statutory condition is not a GB threshold')),
    hot: finding('gbHotNotice', ['watchCloseout', 'containerHistory'], source(
      'HSE · Safety risks from welding',
      'https://www.hse.gov.uk/welding/other-welding-risks.htm',
      'Great Britain welding guidance: fire watch during/after work where safe area or combustible removal is unavailable; used containers need separate safe methods. At least 30 minutes after completion, extended to 60 for hard-to-detect/slow ignition; further sector guidance may differ')),
  },
  SG: {
    height: finding('sgHeightReviewNotice', ['roleSeparation', 'dailyReview', 'permitCoverage'], source(
      'MOM · WAH amendment factsheet, Annex A questions 3–5',
      'https://www.mom.gov.sg/-/media/mom/documents/safety-health/factsheet-on-wahamendmentregulations.pdf',
      '2014 guidance remains publicly hosted: assess common hazards/controls for multiple locations, daily review for extended permits, assessor/applicant separation; assessor/manager combination only under stated conditions. Seven days is guidance, not an express statutory maximum. Current consolidated SSO text could not be retrieved')),
  },
};
