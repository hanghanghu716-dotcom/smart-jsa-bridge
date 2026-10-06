// Provincial task prompts. These records do not certify a statutory permit.
export const CANADIAN_TASK_VERSION = '2026-10-06.21';
const source = (title, url, scope) => ({ title, url, scope, basis: 'regulation', checkedAt: '2026-10-06' });
const abBase = 'https://search-ohs-laws.alberta.ca/legislation/occupational-health-and-safety-code/';
const bcBase = 'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/';
const abPdf = 'https://kings-printer.alberta.ca/documents/OHS/OHSCode_March_31,_2025_(rep_s850)_only.pdf';
const ab = (part, title, scope) => [source(`Alberta OHS Code · ${title}`, abBase + part + '/', scope), source('Alberta OHS Code · March 31, 2025 consolidation', abPdf, `${title}: current government-linked consolidation cross-check; amendments through 210/2024. ${scope}`)];
const bc = (part, title, scope) => [source(`WorkSafeBC · ${title}`, bcBase + part, scope)];
const on = (id, title, scope) => source(`Ontario · ${title}`, `https://www.ontario.ca/laws/regulation/${id}`, scope);
export const CANADIAN_TASK_REVIEW = {
  'CA-AB.height': { fields: ['anchorCheck', 'trainingEvidence', 'fallServiceRelease'], sources: ab('part-9-fall-protection', '139–141, 150–150.2', 'Protection hierarchy and separate plan trigger; plan review after change, instruction, each-shift inspection, withdrawal and authorized return. Engineering and special equipment exceptions require separate assessment.') },
  'CA-AB.confined': { fields: ['planReference', 'trainingEvidence', 'rescueReadiness', 'atmosphericBasis', 'permitDisplay', 'standbyArrangement', 'restartReview'], note: 'abEntryScopeNote', sources: ab('part-5-confined-spaces', '44–58', 'Confined/restricted classification; written practice and confined-space permit; training, isolation, tests, ventilation failure, effective rescue and conditional tending-worker position. No automatic remote-monitoring approval.') },
  'CA-AB.electrical': { fields: ['isolationHandover', 'restorationRelease'], sources: ab('part-15-managing-the-control-of-hazardous-energy', '212–215.3', 'Equipment energy control: individual verification and locks, continuous protection across shifts, worker accounting and safe return. Complex groups, pipelines and utility electrical work need their own procedures.') },
  'CA-AB.hot': { fields: ['containerHistory', 'atmosphericBasis', 'weldingEquipmentCheck'], sources: ab('part-10-fire-and-explosion-hazards', '169–171.2', 'Conditional permit and testing, combustible isolation, continued safe performance and equipment checks. Section 169 limits are not a universal safe gas reading; hot tapping needs its own section 170 plan.') },
  'CA-BC.height': { fields: ['anchorCheck', 'trainingEvidence', 'rescueReadiness', 'fallServiceRelease'], sources: bc('part-11-fall-protection', '11.2–11.10', 'Protection versus written-plan triggers, instruction, anchor/inspection records and fall-arrest withdrawal/recertification. Engineering, rope access and planned entertainment falls remain separate.') },
  'CA-BC.confined': { fields: ['planReference', 'trainingEvidence', 'rescueReadiness', 'entryAuthorisation', 'permitDisplay', 'standbyArrangement', 'rescueNotification', 'restartReview'], note: 'bcStandbyScopeNote', sources: bc('part-09-confined-spaces', '9.5–9.16, 9.24–9.41', 'Programme, qualified assessment, conditional signed/posted permit and controlled updates; testing/ventilation; risk-specific standby; rescue agreement, drills and entry/exit notification. Posting exception is conditional.') },
  'CA-BC.electrical': { fields: ['countryProcedure', 'isolationHandover'], note: 'bcGroupScopeNote', sources: bc('part-10-de-energization-and-lockout', '10.2–10.12', 'Worker verification, shift transfer, personal-lock removal/contact/notification and group locking/release by two qualified workers. Exceptions do not grant energized-work approval; power systems use Part 19.') },
  'CA-BC.hot': { fields: ['atmosphericBasis', 'planReference'], sources: bc('part-12-tools-machinery-and-equipment', '12.112–12.122', 'Welding process scope, ventilation/coatings, container cleaning, qualified testing and safe procedures/retests, defects and flashback prevention. Referenced CSA standard and fire-code particulars are not reproduced or certified.') },
  'CA-ON.height': { fields: ['anchorCheck', 'planReference', 'fallServiceRelease'], sources: [on('910213', '213/91 · 26–26.9', 'Construction only: protection hierarchy, openings, written rescue, separate equipment and working-at-heights training, inspections and system suitability. Current e-Laws API consolidation from 2026-04-20; no blanket height exemption.')] },
  'CA-ON.confined': { fields: ['permitDisplay', 'standbyArrangement', 'restartReview'], sources: [on('050632', '632/05 · 4–21', 'Assessment endorsement versus each-shift permit verification; programme/plan, training, coordination, attendant outside, immediate rescue, availability, testing, task-dependent atmosphere, ventilation warning/exit and retention. Current API consolidation from 2016-07-01; do not import BC posting/signature rules.')] },
  'CA-ON.electrical': { fields: ['personalLockRegister', 'restorationRelease'], sources: [on('910213', '213/91 · 190–191', 'Construction dead-work written procedure, disconnect/lock/tag, stored energy, verification, multi-worker communication and safe tag removal. Section 191 energized-work route is outside this template; current API from 2026-04-20.'), on('900851', '851 · 42–42.2', 'Industrial establishment disconnect/lock/tag and worker verification; limited lock exceptions, separate energized work and utility rules. Current API from 2022-07-01; do not transfer exceptions between frameworks.')] },
  'CA-ON.hot': { fields: ['weldingEquipmentCheck', 'hotFireProtection', 'planReference'], note: 'onHotEquipmentNote', sources: [on('070213', 'Fire Code · 5.17', 'Equipment defects/inspection/leak tests, building precautions, concurrent ignition hazards, containers and extinguisher. Current API from 2026-01-01. Referenced CSA/NFPA standards need applicable-site review; no universal permit/watch duration claimed.')] },
};
export function applyCanadianTaskReview(records) {
  const result = structuredClone(records);
  for (const [id, review] of Object.entries(CANADIAN_TASK_REVIEW)) {
    const [country, topic] = id.split('.'), record = result[country][topic];
    record.fields = [...new Set([...record.fields, ...review.fields])];
    record.additionalNotes = [...new Set([...(record.additionalNotes || []), ...(review.note ? [review.note] : [])])];
    record.sources = [...new Map([...record.sources, ...review.sources].map(s => [s.url, s])).values()];
    record.version = CANADIAN_TASK_VERSION;
    record.checkedAt = '2026-10-06';
    record.evidence = 'regional-canadian-task-review-20261006.md';
    record.remaining = 'Application task-prompt checklist reviewed under the cited provincial scope. Site/sector decisions, incorporated standards, engineering, statutory form certification and actual-user validation are separate; see evidence.';
  }
  result['CA-BC'].height.sources.push({ ...source('WorkSafeBC · G11.3 rescue planning', 'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-guidelines/guidelines-part-11', 'Plan, training and rescue/evacuation arrangements; section 4.13 consideration remains even without a mandatory fall plan.'), basis: 'official-guidance' });
  return result;
}
