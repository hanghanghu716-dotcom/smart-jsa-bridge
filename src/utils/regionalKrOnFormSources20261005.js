const ref = (title, url, scope, basis = 'official-guidance') => ({ title, url, scope, basis, checkedAt: '2026-10-05' });
const krRisk = ref('고용노동부 · 위험성평가 지침 2024-76 (2025-01-02 시행)', 'https://www.moel.go.kr/info/lawinfo/instruction/view.do?bbs_seq=20241201150', 'Downloaded complete HWPX: articles 5–15, worker participation, criteria, control implementation, sharing, records and review. The September 2026 administrative proposal is not treated as enacted. Task record does not replace whole-workplace rules or automatic recognition.', 'regulation');
const krTbm = ref('고용노동부 · 작업 전 안전점검회의 가이드 (2023)', 'https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20230200455', 'Downloaded PDF: preparation, assessment linkage, understanding/absentees, pre-work checks, feedback and sample records. Time/frequency suggestions are not imposed as universal law; form completion does not establish training-credit eligibility.');
const krPermit = ref('KOSHA · 위험성평가 이행·점검 매뉴얼 (2023), 참고자료 01', 'https://oshri.kosha.or.kr/kosha/business/PublicInstitution_SafetyManagementRecord.do?articleNo=444292&attachNo=250186&mode=download', 'Downloaded PDF: public-institution contractor-work permit workflow, request, review, precautions, approval and work checks. General record design only; public-sector examples do not impose a nationwide permit rule. P-94-2021 itself was not retrieved or claimed fully reviewed.');
const caJsa = ref('CCOHS · Job Safety Analysis', 'https://www.ccohs.ca/oshanswers/hsprograms/job-haz.html', 'Task steps, hazards, worker input, hierarchy and communication of a usable work procedure. General methodology; sector rules and required training remain separate.');
const caTalk = ref('CCOHS · Safety Talks – How to', 'https://www.ccohs.ca/oshanswers/hsprograms/safety-talks-how-to.html', 'Task-relevant discussion, feedback, attendance, understanding and follow-up; does not replace formal training.');
const caInspection = ref('CCOHS · Effective Workplace Inspections', 'https://www.ccohs.ca/oshanswers/prevention/effectiv.html', 'Locations/findings, priority, owners/deadlines, missing coverage, corrective-action monitoring and reporting; generic inspection method.');
const onInspection = ref('Ontario · Committees and representatives guide', 'https://www.ontario.ca/page/guide-health-and-safety-committees-and-representatives', 'Official indexed body read; direct fetch returned 403. Applicable designated-worker/representative inspections: monthly coverage or annual whole-site/monthly-part schedule with exceptions; written recommendations and 21-day employer reply. Does not turn every checklist into a statutory committee inspection.');
const onTraining = ref('Ontario · Basic awareness training: general questions', 'https://www.ontario.ca/document/guide-occupational-health-and-safety-act-requirements-basic-awareness-training/general', 'Official indexed body: awareness training does not replace task-specific information, instruction and supervision. No course completion certification from a Safety Talk record.');
const onPermit = ref('Ontario · Confined-space entry permit guidance', 'https://www.ontario.ca/document/guideline-working-confined-spaces/entry-permit', 'Official indexed section 10 body read; direct fetch returned 403. Entry-specific work/location/controls/period, attendant, entry-exit, equipment/rescue and test records, pre-shift competent verification and accessibility. Generic PTW remains a linking record, not the complete confined-space permit.');
export const KR_ON_FORM_SOURCES = {
  'KR.risk_assessment': [krRisk],
  'KR.permit_to_work': [krPermit],
  'KR.toolbox_talk': [krTbm, krRisk],
  'KR.inspection': [krRisk, krTbm],
  'CA-ON.risk_assessment': [caJsa, onTraining],
  'CA-ON.method_statement': [caJsa, onTraining],
  'CA-ON.permit_to_work': [onPermit],
  'CA-ON.toolbox_talk': [caTalk, onTraining],
  'CA-ON.inspection': [caInspection, onInspection],
};
export const KR_ON_FORM_IDS = Object.keys(KR_ON_FORM_SOURCES);
