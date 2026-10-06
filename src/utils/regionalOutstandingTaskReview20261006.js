// Original-source reconciliation of the remaining ten task combinations.
export const OUTSTANDING_TASK_VERSION = '2026-10-06.26';
const source = (title, url, scope, basis = 'regulation-publication') => ({ title, url, scope, basis, checkedAt: '2026-10-06' });
const ru = (id, title, scope) => source(title, `https://minjust.consultant.ru/documents/${id}`, scope);
const extension = ru(55545, 'Минюст · Приказ 287н от 29.04.2025', 'Original official scan: amendment items 11, 34 and 35 extend 782н, 902н and 903н to 1 September 2031. This is not a new technical procedure or an individual permit extension.');
const fitness = source('HRSD · Occupational fitness procedural guide, June 2026', 'https://www.hrsd.gov.sa/sites/default/files/2026-06/qrar-wzary-ba-tmad-aldlyl-alajrayy-llayht-fhwsat-allyaqt-almhnyt-walamrad-ghyr-alm-dyt.pdf', 'Medical-record confidentiality and restricted medical access. Used only to minimise the application prompt to reviewer/time of authorised confirmation, not to reproduce approved medical forms. This guide is not the high-risk occupational-licensing implementation.', 'official-procedural-guide');
export const OUTSTANDING_TASK_REVIEW = {
  'RU.height': {
    fields: ['ruHeightCycle', 'heightAccessCheck', 'fallServiceRelease', 'rescueReadiness', 'permitCloseout', 'restartReview'],
    replaceNote: 'ruHeightReviewedNote', removeNotes: ['ruTaskEvidenceNote'], resolve: 'ru-782n-original-and-2025-amendment',
    sources: [ru(25045, 'Минюст · Приказ 782н, работа на высоте', 'Original scan pp.2–23, clauses 1–92: scope, avoidance/hierarchy, conditional permit exceptions, competence groups, work/rescue plans, weather, issuer/leader/producer roles, interruption/re-entry, changed crew/hazards, permit period and records. Later specialist equipment/engineering clauses are outside this generic task-checklist closure.'), extension],
  },
  'RU.confined': {
    fields: ['ruFacilityScope', 'ruEntryPurpose', 'ruEntryCycle', 'measurementCompetence', 'isolationVerification', 'restartReview', 'permitCloseout'],
    replaceNote: 'ruEntryReviewedNote', removeNotes: ['ruTaskEvidenceNote'], resolve: 'ru-902n-original-and-2025-amendment',
    sources: [ru(25506, 'Минюст · Приказ 902н, ОЗП', 'Original scan pp.2–40: applicability/excluded industrial-safety facilities; assessment entry versus work authorisation; roles, isolation, measurement, permit lifecycle and records; gas alarms, outside observation, rescue plan/training/communication and signs. Specialist process/respirator design and site acceptance values are not certified by the form.'), extension],
  },
  'RU.electrical': {
    fields: ['ruAdmittingCheck'],
    pending: '903н 5.8 original and 279н item 14 reconcile допускающий terminology. Full de-energised-work technical sequence and all applicable 2022 amendment provisions still need comparison; extension alone does not close them.',
    sources: [ru(25496, 'Минюст · Приказ 903н, электроустановки', 'Original scan pp.11–12 and 16–18, especially 5.8: допускающий prepares or assesses preparation of the workplace, briefs and admits the crew. Separate from issuer, responsible leader and work producer; electrical-safety group is a competence category, not crew size.'), ru(31327, 'Минюст · Приказ 279н от 29.04.2022', 'Amendment original pp.3–6: training/group assessment, coordination, role and permit changes. Item 14 adjusts voltage wording in 5.8 without changing the admitting role. Remaining technical amendments are not claimed reviewed.'), extension],
  },
  'RU.hot': {
    fields: [],
    pending: 'The cited MChS 1479 snapshot supports daily admission and the two-hour minimum post-work watch in that framework. Current later amendments and applicable welding/industrial-sector rules remain unclosed; do not transfer height/confined permit periods here.',
    sources: [],
  },
  'IT.electrical': {
    fields: ['itElectricalHandover', 'itDistanceReview', 'itCorrectionReview'],
    pending: 'CEI publisher confirms 11-27;EC (December 2025, valid January 2026). Full 11-27:2025 and EC text remain unread. The CNI professional presentation supports scoped prompts, not full-standard compliance.',
    sources: [source('CEI · CEI 11-27;EC, dicembre 2025', 'https://mycatalogo.ceinorme.it/cei/item/0010026052?sso=y', 'Publisher catalogue confirms correction of internal references, publication December 2025 and validity January 2026. Full corrigendum not obtained.', 'publisher-summary'), source('CNI · Norma CEI 11-27, sesta edizione, 30/03/2026', 'https://www.cni.it/images/eventi/2026/WEBINAR_NORMA_CEI_11-27_novit%C3%A0_6_edizione_30.03.2026.pdf', 'Professional council presentation pp.14–24 and 30–44: RI/RLE workplace handover/start/return, employer task-specific PES/PAV attribution, tools/movement in approach distance and task-specific arc assessment. Not the normative standard text.', 'professional-guidance')],
  },
  'CA-QC.hot': {
    fields: ['qcFireEdition', 'qcWatchStages', 'combustibleSurroundings'], replaceNote: 'qcFireReviewedNote',
    pending: 'Amended Quebec CNPI 2020 section 5.2 and published transition compared. Full incorporated CSA W117.2 requirements and site-specific code/transition applicability remain unresolved.',
    sources: [source('CNRC / RBQ · CNPI 2020 modifié Québec', 'https://publications-cnrc.canada.ca/fra/voir/td/?id=645222bb-21e8-44cc-853e-178b7aeafbaa', 'Section 5.2: noncombustible location or conditional precautions, nearby/adjacent combustibles, distinct continuous watch and final inspection. Do not turn conditional code times into universal defaults.'), source('RBQ · Changements CNPI 2020', 'https://www.rbq.gouv.qc.ca/fileadmin/medias/pdf/Publications/francais/cahier-explicatif-changements-cnpi-2020.pdf', 'Introduction p.5: effective 17 April 2025; prior provisions may be applied through 16 October 2026 under the transition. Requires actual site/code selection; the date does not select a code automatically.', 'regulator-guidance')],
  },
  ...Object.fromEntries(['height', 'confined', 'electrical', 'hot'].map(topic => [`SA.${topic}`, {
    fields: ['saPrivateConfirmation'], sources: [fitness],
    pending: 'High-risk occupation licensing implementation and sector-specific PTW details remain unverified. The June 2026 fitness procedural guide is a separate instrument and cannot close those issues. Do not collect medical records in the work document.',
  }])),
};
export const OUTSTANDING_TASK_CLOSABLE_IDS = Object.keys(OUTSTANDING_TASK_REVIEW).filter(id => OUTSTANDING_TASK_REVIEW[id].resolve);
export function applyOutstandingTaskReview(records) {
  const result = structuredClone(records);
  for (const [id, review] of Object.entries(OUTSTANDING_TASK_REVIEW)) {
    const [country, topic] = id.split('.'), record = result[country][topic];
    record.fields = [...new Set([...record.fields, ...review.fields])];
    if (review.replaceNote) record.noteKey = review.replaceNote;
    record.additionalNotes = (record.additionalNotes || []).filter(key => !review.removeNotes?.includes(key));
    record.sources = [...new Map([...record.sources, ...review.sources].map(s => [s.url, s])).values()];
    record.partial = !review.resolve;
    if (review.resolve) record.resolvedIssues = [...new Set([...(record.resolvedIssues || []), review.resolve])];
    record.version = OUTSTANDING_TASK_VERSION;
    record.checkedAt = '2026-10-06';
    record.evidence = 'regional-outstanding-task-review-20261006.md';
    record.remaining = review.pending || 'Scoped generic task checklist compared with original rules and amendment. Site values, individual authorisation, engineering, specialist processes and statutory-form certification remain outside this closure; see evidence.';
  }
  return result;
}
