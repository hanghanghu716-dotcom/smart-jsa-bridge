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
    fields: [], sources: [source('CEI · CEI 11-27:2025-10, fascicolo 25437', 'https://mycatalogo.ceinorme.it/cei/item/0000025437', 'Publisher catalogue: 84-page sixth edition, validity November 2025. Full text not obtained; a catalogue/preview is not a clause review.', 'publisher-summary')],
    blocker: { code: 'standard-access', required: 'Lawful full-text access to CEI 11-27:2025-10 and December 2025 EC; compare procedures, roles, distances and corrected references.', accessUrl: 'https://mycatalogo.ceinorme.it/cei/item/0000025437' },
  },
  'CA-QC.hot': {
    fields: [], sources: [source('CNESST · Consultation gratuite des normes CSA', 'https://www.cnesst.gouv.qc.ca/fr/prevention-securite/informations-prevention/normes-csa', 'Regulator documents free read-only CSA access after account registration. Reader requires login; incorporated W117.2 editions/clauses have not been read. No account was created and reader restrictions were not bypassed.', 'regulator-access-guide')],
    blocker: { code: 'standard-access', required: 'Authenticated CSA read-only access to the W117.2 editions incorporated by RSST/CSTC, followed by clause comparison; do not substitute the newest commercial edition automatically.', accessUrl: 'https://community.csagroup.org/login.jspa' },
  },
  ...Object.fromEntries(['height', 'confined', 'electrical', 'hot'].map(topic => [`SA.${topic}`, {
    fields: ['saTrainingRoute', 'saPtwRelease', 'saPtwChange', ...(topic === 'electrical' ? ['saElectricalEquipment'] : [])],
    removeFields: topic === 'electrical' ? ['weldingEquipmentCheck'] : [],
    note: 'saProcedureScopeNote', sources: [saOccupation, saPtw],
    blocker: { code: 'implementation-evidence', required: `High-risk occupation licensing implementation under articles 15/17 plus the applicable ${topic} sector procedure/current edition. EXPRO government-facility guidance and SEC company rules are not universal substitutes.`, accessUrl: 'https://www.ncosh.gov.sa/ar/knowledge-center/rules-regulations/administrative-systems/' },
  }])),
};
export function applyCloseoutReview(records) {
  const result = structuredClone(records);
  for (const [id, review] of Object.entries(CLOSEOUT_REVIEW)) {
    const [country, topic] = id.split('.'), record = result[country][topic];
    record.fields = [...new Set([...record.fields.filter(key => !review.removeFields?.includes(key)), ...review.fields])];
    record.additionalNotes = [...new Set([...(record.additionalNotes || []).filter(key => !review.removeNotes?.includes(key)), ...(review.note ? [review.note] : [])])];
    record.sources = [...new Map([...record.sources, ...review.sources].map(s => [s.url, s])).values()];
    record.partial = !review.resolve;
    if (review.resolve) record.resolvedIssues = [...new Set([...(record.resolvedIssues || []), review.resolve])];
    if (review.blocker) record.reviewBlocker = { ...review.blocker, checkedAt: '2026-10-06' };
    record.remaining = review.remaining || review.blocker.required;
    record.version = CLOSEOUT_VERSION;
    record.checkedAt = '2026-10-06';
    record.evidence = CLOSEOUT_EVIDENCE;
  }
  return result;
}
