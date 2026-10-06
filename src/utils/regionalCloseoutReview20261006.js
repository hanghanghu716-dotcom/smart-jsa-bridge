// Final pass over all seven open combinations. Access gaps stay explicit.
export const CLOSEOUT_VERSION = '2026-10-06.28';
export const CLOSEOUT_EVIDENCE = 'regional-closeout-review-20261006.md';
const source = (title, url, scope, basis = 'regulation-publication') => ({ title, url, scope, basis, checkedAt: '2026-10-06' });
const saOccupation = source('NCOSH · High-risk occupations, articles 5–19', 'https://ncosh.gov.sa/media/gwwhsqoc/rowhro-25-ar.pdf', 'Final council text pp.8–18: actual occupation/exposure classification, validity, task-specific competence and accredited specialist training. Article 14 names the council application route; articles 15/17 delegate implementing procedures. This text is not evidence that a particular licensing service or sector procedure has been verified.');
const saPtw = source('EXPRO · EOM-KSS-PR-000016-AR, Rev 000', 'https://expro.gov.sa/api/uploads/الدليل الإجرائي لتصريح الأعمال الخطرة.pdf', 'Government facilities operation/maintenance guidance, 31 March 2020, sections 2, 5–7: specific procedures take precedence; issuer/receiver acceptance, linked permits, changes, closure and records. Scope and current controlled edition must be checked locally; not national occupational-licensing implementation.', 'official-procedural-guide');
export const CLOSEOUT_REVIEW = {
  'RU.hot': {
    fields: ['ruWeldingScope', 'ruWeldingPermitCycle', 'ruWeldingShutdown', 'ruWeldingRecord', 'combustibleSurroundings', 'isolationVerification'],
    note: 'ruWeldingReviewedNote', removeNotes: ['ruTaskEvidenceNote'], resolve: 'ru-884n-287n-and-1479-hot-work',
    sources: [
      source('Минюст · Приказ 884н, сварочные работы', 'https://minjust.consultant.ru/documents/25450', 'Original 24-page scan reviewed: 1–9 scope/exclusion; 10–22 premises; 23–30 permit roles, coordination, cancellation/reissue and register; 31–58 preparation/equipment; 77–117 gas checks, shutdown and confined-work interfaces. Specialist methods/equipment engineering are not certified.'),
      source('Минюст · Приказ 287н, пункт 30', 'https://minjust.consultant.ru/documents/55545', 'Original scan p.5 item 30 extends 884н to 1 September 2031; it does not extend an individual permit.'),
      source('МЧС · Правила 1479, редакция 03.02.2025', 'https://16.mchs.gov.ru/uploads/resource/2026-02-11/perechen-normativnyh-pravovyh-aktov-v-oblasti-pozharnoy-bezopasnosti_1770816913228588720.pdf', 'Agency-hosted consolidation saved 2 February 2026. Clauses 354–372 and clearance table annex 5 compared with welding rules. Clause 372 has temporary-location exceptions; 363 requires at least two hours of post-work observation in its scope. Later replacement plans are not enacted rules.', 'regulation-consolidation'),
    ],
    remaining: 'Generic hot-work checklist closed against 884н/287н and the cited 1479 consolidation. Apply 884н clause 8 exclusions and separate industrial/sector procedures; do not transfer height/confined permit periods. Individual permits, engineering, live site readings and post-work release are not certified.',
  },
  'IT.electrical': {
    version: '2026-10-06.31', evidence: 'regional-source-access-review-20261006.md',
    fields: [], sources: [source('CEI · CEI 11-27:2025-10, fascicolo 25437', 'https://mycatalogo.ceinorme.it/cei/item/0000025437', 'Publisher catalogue: 84-page sixth edition, validity November 2025. Full text not obtained; a catalogue/preview is not a clause review.', 'publisher-summary')],
    blocker: { code: 'standard-access', required: 'Lawful full-text access to CEI 11-27:2025-10 and December 2025 EC; compare procedures, roles, distances and corrected references. The EC PDF is listed at EUR 0.00 but its acquisition opens a CEI login; no CEI account/session or full-standard entitlement is available.', accessUrl: 'https://mycatalogo.ceinorme.it/cei/item/0010026052', nextAction: 'Obtain authorised CEI access or a publisher-provided no-cost consultation route. The free EC does not grant access to the 84-page parent standard.' },
  },
  'CA-QC.hot': {
    version: '2026-10-06.31', evidence: 'regional-source-access-review-20261006.md',
    fields: ['qcWeldingBasis', 'qcArcEquipment', 'qcResistanceEquipment', 'qcGasEquipment'],
    removeFields: ['weldingEquipmentCheck'], replaceNote: 'qcWeldingReviewNote',
    sources: [
      source('CNESST · Consultation gratuite des normes CSA', 'https://www.cnesst.gouv.qc.ca/fr/prevention-securite/informations-prevention/normes-csa', 'Authenticated read-only access now works. M87 general checklist provisions were visually compared in the permitted viewer; M94 remains unavailable in the inspected free catalogue/search. No standard was downloaded, copied or redistributed.', 'regulator-access-guide'),
      source('CSA · CAN/CSA-W117.2-M87, read-only original', 'https://community.csagroup.org/docs/DOC-3695', 'Printed pp.11–29, 38, 40–46 and amendment instructions compared for general process checks; see evidence for exact viewer pages and exclusions. Chapters 5/6/7 are arc/resistance/gas; M94 chapter numbering must not be inferred from M87. CSTC 3.14.2 excludes 7.8.2.2. No specialist-process, engineered-system or equipment certification.', 'standard-original-read-only'),
      source('Légis Québec · CSTC 3.14.1–4', 'https://www.legisquebec.gouv.qc.ca/en/pdf/cr/S-2.1%2C%20R.%204.pdf', 'Official indexed consolidation updated 15 July 2025: 3.14.2 incorporates M87 except 7.8.2.2; 3.14.3 contains distinct vessel-work conditions. Retrieved excerpt, not a newly read complete code.', 'regulation-excerpt'),
      source('CNESST Centre IST · CSA W117.2-94, French holdings', 'https://www.centredoc.cnesst.gouv.qc.ca/notice?id=p%3A%3Ausmarcdef_0000131140', '1994 edition, call number NO-001563; Centre IST physical copy shown available. Electronic access is explicitly restricted to authorised personnel. Holdings evidence only; M94 content has not been read.', 'library-holdings'),
    ],
    blocker: { code: 'standard-access', required: 'M87 general construction-check comparison recorded. Obtain lawful original M94 chapters 5, 6 and 8 incorporated by RSST 314–316 and compare them; the exact 1994 edition is now located in Centre IST, but electronic access is restricted to authorised personnel. Do not substitute M87 or a newer edition for M94.', accessUrl: 'https://www.centredoc.cnesst.gouv.qc.ca/notice?id=p%3A%3Ausmarcdef_0000131140', nextAction: 'Ask Centre IST for a lawful no-cost remote consultation route for an overseas user, specifying W117.2-94, NO-001563 and RSST chapters 5/6/8. No eligibility or access is assumed.' },
    remaining: 'M94 chapters 5/6/8 remain unread. M87 comparison covers generic construction checklist prompts only; specialist processes, engineered equipment, site fire-code/transition selection and actual authorisation are not certified. Keep CA-QC.hot partial until its RSST basis is compared.',
  },
  ...Object.fromEntries(['height', 'confined', 'electrical', 'hot'].map(topic => [`SA.${topic}`, {
    version: '2026-10-06.31', evidence: 'regional-source-access-review-20261006.md',
    fields: ['saTrainingRoute', 'saPtwRelease', 'saPtwChange', 'saRuleApplicability', ...(topic === 'electrical' ? ['saElectricalEquipment'] : []), ...(topic === 'hot' ? ['saWeldingMachine', 'saGasLeakStop'] : [])],
    removeFields: topic === 'electrical' ? ['weldingEquipmentCheck'] : [],
    note: 'saProcedureScopeNote', sources: [saOccupation, saPtw,
      source('Umm Al-Qura · Adoption of high-risk occupation regulation', 'https://www.uqn.gov.sa/details?p=28771', 'Official gazette announcement dated 9 January 2026: adoption and effect after 180 days from gazette publication. Confirms the publication/effectivity basis, not operation of a licence service or the content of delegated implementation rules.', 'official-gazette'),
      source('NCOSH · Industrial hazards guide, November 2025', 'https://www.ncosh.gov.sa/media/bmtanopw/construction-safety-guide.pdf', 'Advisory industrial-hazards guide despite the filename. Pages 5–11 compared: fall/electrical controls, hot work, engine-driven welders, gas leaks, hose/cylinder protection. Pages 8–9 visually checked. Not a licensing implementation, complete confined-entry procedure or universal statutory permit.', 'official-procedural-guide'),
    ],
    blocker: { code: 'implementation-evidence', required: `High-risk occupation licensing implementation under articles 15/17 remains unverified. Previously established gazette publication/effectivity has been rechecked. The actual ${topic} sector/site controlled procedure is an operational input; EXPRO and the industrial-hazards guide do not establish a universal sector procedure.`, accessUrl: 'https://www.ncosh.gov.sa/ar/knowledge-center/rules-regulations/administrative-systems/', nextAction: 'Ask NCOSH for the currently applicable article 15/17 instrument numbers, effective dates and high-risk worker licence application/verification service. OSH-practitioner accreditation and medical-fitness rules are different services.' },
  }])),
};
export function applyCloseoutReview(records) {
  const result = structuredClone(records);
  for (const [id, review] of Object.entries(CLOSEOUT_REVIEW)) {
    const [country, topic] = id.split('.'), record = result[country][topic];
    record.fields = [...new Set([...record.fields.filter(key => !review.removeFields?.includes(key)), ...review.fields])];
    record.additionalNotes = [...new Set([...(record.additionalNotes || []).filter(key => !review.removeNotes?.includes(key)), ...(review.note ? [review.note] : [])])];
    if (review.replaceNote) record.noteKey = review.replaceNote;
    record.sources = [...new Map([...record.sources, ...review.sources].map(s => [s.url, s])).values()];
    record.partial = !review.resolve;
    if (review.resolve) record.resolvedIssues = [...new Set([...(record.resolvedIssues || []), review.resolve])];
    if (review.blocker) record.reviewBlocker = { ...review.blocker, checkedAt: '2026-10-06' };
    record.remaining = review.remaining || review.blocker.required;
    record.version = review.version || CLOSEOUT_VERSION;
    record.checkedAt = '2026-10-06';
    record.evidence = review.evidence || CLOSEOUT_EVIDENCE;
  }
  return result;
}
