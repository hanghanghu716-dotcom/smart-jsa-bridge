const ref = (title, url, scope, basis = 'official-guidance') => ({ title, url, scope, basis, checkedAt: '2026-10-05' });
const ab = ref('Alberta OHS Code · Part 2, sections 7–10', 'https://search-ohs-laws.alberta.ca/legislation/occupational-health-and-safety-code/part-2-hazard-assessment-elimination-and-control/', 'Worksite assessment/report/date, reassessment triggers, affected-worker involvement, control hierarchy and emergency exception. Generic task records do not replace activity-specific requirements.', 'regulation');
const bcRisk = ref('WorkSafeBC · Assessing risks', 'https://www.worksafebc.com/en/health-safety/create-manage/managing-risk/assessing-risks', 'Site/hazard/affected groups, current risk judgement, controls and review. Suggested ratings/review interval are guidance, not a universal statutory matrix or interval.');
const bcProcedure = ref('WorkSafeBC · Developing a health and safety program', 'https://www.worksafebc.com/en/health-safety/create-manage/health-safety-programs/developing-health-safety-program', 'Safe sequence, worker consultation, accessible instructions, instruction/understanding and change review. Task records are not a whole organisational OHS program.');
const bcRules = ref('WorkSafeBC · OHS Regulation Part 3', 'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-03-rights-and-responsibilities', '3.1–3.3 program/meeting scope; 3.5/3.7–3.10 inspection triggers, feasible representative participation and prompt remedy/reporting. Monthly small-operation meetings are not a rule for all toolbox talks.', 'regulation');
const bcInspection = ref('WorkSafeBC · Workplace inspections', 'https://www.worksafebc.com/en/health-safety/create-manage/workplace-inspections', 'Inspection roles, risk-based frequency, findings and follow-up. General worksite record, not a specialist equipment certificate.');
const caJsa = ref('CCOHS · Job Safety Analysis', 'https://www.ccohs.ca/oshanswers/hsprograms/job-haz.html', 'Task sequence, hazards, controls and procedure communication; generic method guidance, not province-specific legislation.');
const caTalk = ref('CCOHS · Safety Talks – How to', 'https://www.ccohs.ca/oshanswers/hsprograms/safety-talks-how-to.html', 'Task-relevant discussion, worker feedback, notes/attendance and follow-up; not qualification or required training certification.');
const caInspection = ref('CCOHS · Effective Workplace Inspections', 'https://www.ccohs.ca/oshanswers/prevention/effectiv.html', 'Plan, locations/findings, priorities, actions, owners/dates, incomplete areas, reporting and effectiveness follow-up. No universal legal inspection interval inferred.');
const deRisk = ref('ArbSchG · § 5', 'https://www.gesetze-im-internet.de/arbschg/__5.html', 'Task-related assessment and protective measures; physical, chemical, biological, organisational and psychological hazards require site consideration.', 'regulation');
const deRecord = ref('ArbSchG · § 6', 'https://www.gesetze-im-internet.de/arbschg/__6.html', 'Record assessment outcomes, selected controls and review results. Task assessment/checklist does not replace separate accident records or specialist inspections.', 'regulation');
const deTraining = ref('ArbSchG · § 12', 'https://www.gesetze-im-internet.de/arbschg/__12.html', 'Task/workplace instruction before relevant starts/changes and repetition as necessary. This short-talk record does not certify full required instruction.', 'regulation');
const deProcedure = ref('DGUV · Betriebsanweisungen richtig nutzen (2023)', 'https://aug.dguv.de/arbeitssicherheit/wie-unternehmen-betriebsanweisungen-richtig-nutzen/', 'Distinguish employer Betriebsanweisung from manufacturer instructions; local scope, protective behaviour/emergency response, accessible dated approval and revisions. A generic sequence is not a statutory specialist Betriebsanweisung replica.');
const deBriefing = ref('DGUV · Unterweisung: Tipps für Führungskräfte (2023)', 'https://topeins.dguv.de/arbeitssicherheit/unterweisung-tipps-fuehrungskraefte/', 'Work-specific explanation, demonstration, questions, effectiveness and documentation. Scheduling examples are not implemented as mandatory meeting times.');
export const COUNTRY_FORM_SOURCES = {
  'CA-AB.risk_assessment': [ab, caJsa],
  'CA-AB.method_statement': [ab, caJsa],
  'CA-AB.toolbox_talk': [ab, caTalk],
  'CA-AB.inspection': [ab, caInspection],
  'CA-BC.risk_assessment': [bcRisk, bcRules],
  'CA-BC.method_statement': [bcProcedure, bcRules],
  'CA-BC.toolbox_talk': [bcRules, bcProcedure, caTalk],
  'CA-BC.inspection': [bcRules, bcInspection, caInspection],
  'DE.risk_assessment': [deRisk, deRecord],
  'DE.method_statement': [deProcedure, deTraining],
  'DE.toolbox_talk': [deTraining, deBriefing],
  'DE.inspection': [deRisk, deRecord, deBriefing],
};
export const COUNTRY_FORM_IDS = Object.keys(COUNTRY_FORM_SOURCES);
