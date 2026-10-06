// Dated additions: a review date never silently updates older evidence.
const source = (title, url, scope, basis = 'official-guidance') => ({
  title, url, scope, basis, checkedAt: '2026-10-05',
});
const finding = (noteKey, fields, evidence) => ({
  checkedAt: '2026-10-05', status: 'source-backed-prompts',
  noteKey, additionalNotes: [], fields, sources: [evidence],
});
export const REQUIREMENT_REVIEW_20261005 = {
  KR: {
    height: finding('krHeightDetail', ['fallProtectionBasis', 'ladderConditions', 'anchorCheck'], source(
      '국가법령정보센터 · 안전보건규칙 제42–44조',
      'https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029039573',
      'Published consolidation effective 2026-03-02: platform/net hierarchy and conditional mobile-ladder route in 42(4); opening protection under 43; anchorage and pre-work checks under 44. No universal exemption below 2 m', 'regulation')),
    electrical: finding('krElectricalDetail', ['electricalEligibility', 'isolationSequence', 'lockRemoval'], source(
      '국가법령정보센터 · 안전보건규칙 제318–320조',
      'https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029038625',
      'Published consolidation effective 2026-03-02: eligible electrical worker, all supplies, locks AND tags, stored-charge discharge, voltage test and conditional earthing; restoration requires installer removal of locks/tags. US absent-owner exception is not imported', 'regulation')),
    hot: finding('krHotDetail', ['permitDisplay', 'fireWatchBasis', 'fireBlanket'], source(
      '국가법령정보센터 · 안전보건규칙 제240–241조의2',
      'https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=75618',
      'Published consolidation effective 2026-03-02: container precautions, no oxygen ventilation, start-to-finish written posting with regular/repeated-place exception; certified welding blankets when used; conditional watcher appointment, alarm checks and evacuation equipment. No numeric post-work watch duration in these clauses', 'regulation')),
  },
  JP: {
    height: finding('jpHeightDetail', ['fallProtectionBasis', 'anchorCheck', 'ropeWorkPlan'], source(
      '厚生労働省 · 安衛則 第518–524条、第539条の4–9',
      'https://www.mhlw.go.jp/web/t_doc?dataId=74003000&dataType=0&pageNo=9',
      'Platforms/edge protection and alternatives under 518/519, anchorage and inspections under 521, weather stop and fragile roofs. Rope-work survey/plan/director/daily inspection applies only to rope work; no universal safe exemption below 2 m', 'regulation')),
    electrical: {
      ...finding('jpElectricalDetail', ['isolationSequence', 'workLeader', 'restorationNotice'], source(
        '厚生労働省 · 安衛則 第339条、第350条',
        'https://www.mhlw.go.jp/web/t_doc?dataId=74003000&dataType=0&pageNo=8',
        '339: lock OR no-energisation display OR watcher, discharge stored charge; high/extra-high-voltage de-energisation test and short-circuit earthing; safe restoration. 350: task/circuit briefing and appointed work director. Not the statutory operations-chief title or a universal electrician licence', 'regulation')),
      fieldLabels: { disconnect: 'jpIsolationChoice' },
    },
    hot: finding('jpHotDetail', ['containerHistory', 'oxygenExclusion'], source(
      '厚生労働省 · 安衛則 第285–286条',
      'https://www.mhlw.go.jp/web/t_doc?dataId=74003000&dataType=0&pageNo=7',
      'Remove dangerous/flammable substances and dust or otherwise prevent explosion/fire before hot/spark-producing work on pipes/containers; prohibit oxygen as ventilation in inadequately ventilated work. Does not prescribe a nationwide written permit or numeric watch duration', 'regulation')),
  },
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
      '2014 guidance remains publicly hosted: assess common hazards/controls for multiple locations, daily review for extended permits, assessor/applicant separation; assessor/manager combination only under stated conditions. Seven days is guidance, not an express statutory maximum. Historical retrieval limitation resolved by the separate 2026-10-05 SSO supplement')),
  },
};
