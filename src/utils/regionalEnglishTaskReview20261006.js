// Closure covers the application's task-prompt scope, not a certified statutory
// permit or all local legislation. Canadian provincial profiles remain separate.
export const ENGLISH_TASK_VERSION = '2026-10-06.20';
const source = (title, url, scope, basis = 'official-guidance') => ({ title, url, scope, basis, checkedAt: '2026-10-06' });
const osha = (section, scope) => source(`OSHA · 1910.${section}`, `https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.${section}`, scope, 'regulation');
export const ENGLISH_TASK_REVIEW = {
  'GB.height': { fields: ['planReference', 'anchorCheck', 'rescueReadiness'], sources: [source('HSE · Working at height', 'https://www.hse.gov.uk/work-at-height/introduction.htm', 'Avoid/prevent/minimise, collective protection, competence, planning, fragile surfaces, falling objects and rescue. GB guidance; NI and equipment-specific engineering remain outside this prompt review.')] },
  'GB.confined': { fields: ['permitTrigger', 'planReference', 'trainingEvidence', 'rescueReadiness', 'entryAuthorisation', 'permitCloseout', 'permitCoordination'], note: 'gbEntryPermitScope', sources: [source('HSE · L101, paragraphs 82–85, 138–144 and regulation 5', 'https://www.hse.gov.uk/pubns/priced/l101.pdf', 'Safe system, competence, conditional PTW, coordination, cancellation and emergency arrangements. Permit supports the system; no universal permit mandate. NI adoption is recorded separately.', 'approved-code-and-guidance')] },
  'GB.electrical': { fields: ['planReference', 'isolationHandover', 'restorationRelease'], sources: [source('HSE · HSG85, paragraphs 47–60, 65, 69–84', 'https://www.hse.gov.uk/pubns/priced/hsg85.pdf', 'Dead-work isolation, proving dead, relevant earthing, adjacent live parts, shift procedures and permit issue/return/cancellation. No live-work approval or universal low-voltage permit requirement.')] },
  'GB.hot': { fields: ['hotAuthorisation', 'fireWatchBasis'], sources: [source('HSE · Welding: other risks', 'https://www.hse.gov.uk/welding/other-welding-risks.htm', 'Combustibles on all sides, watch during work and at least 30 minutes after, 60 for slow/hidden ignition; tanks/drums need a separate safe method. Sector-specific rules remain separate.')] },
  'US.height': { fields: ['frameworkBasis', 'anchorCheck', 'fallingObjects'], sources: [osha('28', 'General-industry applicability/exceptions, task-specific fall and falling-object protection. Portable ladders, aerial lifts and other excluded activities use separate provisions; no universal threshold or engineered-system approval.'), osha('140', 'Personal protection equipment, competent/qualified responsibilities, pre-shift inspection, impact withdrawal and prompt rescue, especially (c)(11)–(13), (17)–(21).')] },
  'US.confined': { fields: ['spaceClass', 'permitTrigger', 'permitDisplay', 'trainingEvidence', 'rescueReadiness', 'atmosphericBasis', 'permitCoordination', 'restartReview'], note: 'usEntryPathNote', sources: [osha('146', 'General industry only: (c)(5)/(7) alternative entry versus reclassification, (c)(8)/(9) host/contractor duties; (d) programme, (e)/(f) permit lifecycle/content, (g) training, (j)/(k) supervision/rescue. A field entry does not certify an alternative route.')] },
  'US.electrical': { fields: ['planReference', 'frameworkBasis'], sources: [osha('333', 'Written dead-work procedure and ordered isolation/verification/restoration under (b)(2). Lock/tag exceptions require specific conditions and additional safeguards. Tester before/after condition >600 V is US-specific. No energized-work approval.')] },
  'US.hot': { fields: ['containerHistory', 'fireWatchBasis', 'hotFireProtection'], note: 'usHotProhibitionNote', sources: [osha('252', '(a)(1)–(4): guards/removal, conditional watch, area authorisation (written preferred), prohibited circumstances, used containers and confined work. Permit cannot override a prohibition; not a shipyard permit.')] },
  'CA.height': { fields: ['fragileSurface', 'fallingObjects'], sources: [source('CCOHS · Fall protection, general information', 'https://www.ccohs.ca/oshanswers/hsprograms/fall/fall_protection_general.html', 'General site-plan, equipment, anchors and rescue guidance. Protection can be needed below usual thresholds because of hazards; actual federal/provincial duties and engineering are separate.')] },
  'CA.confined': { fields: ['planReference', 'trainingEvidence', 'rescueReadiness', 'entryAuthorisation', 'permitDisplay', 'permitCloseout'], sources: [source('CCOHS · Confined space programme', 'https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_program.html', 'General programme/entry-permit guidance: roles, testing, training, rescue, authorisation, availability, closeout and records. Permit applicability, signatures and retention follow actual jurisdiction; not national law.')] },
  'CA.electrical': { fields: ['planReference', 'restorationRelease'], sources: [source('CCOHS · Lockout/Tag out', 'https://www.ccohs.ca/oshanswers/hsprograms/lockout.html', 'Equipment-specific written energy-control procedure, stored energy, worker communication, verification and removal/return to service. Electrical and other energy sources both matter; jurisdiction-specific authorisation remains separate.')] },
  'CA.hot': { fields: ['hotFireProtection', 'fireWatchBasis'], note: 'caWatchGuidanceNote', sources: [source('CCOHS · Welding, hot work', 'https://www.ccohs.ca/oshanswers/safety_haz/welding/hotwork.html', 'Programme roles, cold alternatives, operable fire protection, explosive-atmosphere prohibition, watch during breaks and at least 60 minutes afterwards with further risk-based monitoring. Guidance, not a uniform statutory duration.')] },
};
export function applyEnglishTaskReview(records) {
  const result = structuredClone(records);
  for (const [id, review] of Object.entries(ENGLISH_TASK_REVIEW)) {
    const [country, topic] = id.split('.');
    const record = result[country][topic];
    record.fields = [...new Set([...record.fields, ...review.fields])];
    record.additionalNotes = [...new Set([...(record.additionalNotes || []), ...(review.note ? [review.note] : [])])];
    record.sources = [...new Map([...record.sources, ...review.sources].map(s => [s.url, s])).values()];
    record.version = ENGLISH_TASK_VERSION;
    record.checkedAt = '2026-10-06';
    record.evidence = 'regional-english-task-review-20261006.md';
    record.remaining = 'Scoped software task-prompt review recorded. Site-specific thresholds, engineering, statutory permit completeness, sector/NI/State Plan/provincial exceptions and actual-user validation are outside this closure; see evidence.';
  }
  return result;
}
