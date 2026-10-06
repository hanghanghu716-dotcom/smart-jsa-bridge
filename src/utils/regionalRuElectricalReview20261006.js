// Generic de-energised-work checks, not a live-work method or statutory permit.
export const RU_ELECTRICAL_VERSION = '2026-10-06.27';
export const RU_ELECTRICAL_FIELDS = ['ruElectricalPreparation', 'ruElectricalAdmission', 'ruElectricalReissue', 'ruElectricalRelease', 'ruElectricalRecords', 'ruElectricalPermitCycle', 'isolationVerification', 'restartReview', 'permitCloseout'];
export function applyRuElectricalReview(records) {
  const result = structuredClone(records), record = result.RU.electrical;
  record.fields = [...new Set([...record.fields, ...RU_ELECTRICAL_FIELDS])];
  record.noteKey = 'ruElectricalReviewedNote';
  record.additionalNotes = record.additionalNotes.filter(key => key !== 'ruTaskEvidenceNote');
  const scopes = {
    '25496': 'Original 903н scan pp.11–56, chapters IV–XXIII: permit/order distinction, roles, admission, crew changes, interruptions, handback, de-energised preparation, re-energisation prevention, voltage verification, earthing and barriers. Special live work, overhead-line engineering and equipment-specific methods are outside the generic checklist closure.',
    '31327': 'All 11 pages of 279н reconciled. In-scope items include 4.1/4.3, 5.5/5.8/5.9, 6.1/6.4/6.27, 9.3/10.3, 11.6/13.3, 15.1/15.2, 19.1/21.1/23.5. Special secondary-system, meter, overhead-line and visiting-personnel exceptions are not generic permissions.',
  };
  record.sources = record.sources.map(s => ({ ...s, ...(scopes[s.url.split('/').at(-1)] ? { scope: scopes[s.url.split('/').at(-1)] } : {}) }));
  record.partial = false;
  record.resolvedIssues = [...new Set([...(record.resolvedIssues || []), 'ru-903n-original-and-2025-amendment', 'ru-279n-2022-deenergised-sequence'])];
  record.version = RU_ELECTRICAL_VERSION;
  record.checkedAt = '2026-10-06';
  record.evidence = 'regional-ru-electrical-review-20261006.md';
  record.remaining = 'Generic de-energised checklist compared with 903н, all 279н amendments and 287н item 35. Actual switching, voltage/earthing method, competence, individual permits, live work and equipment/sector-specific procedures remain outside this closure.';
  return result;
}
