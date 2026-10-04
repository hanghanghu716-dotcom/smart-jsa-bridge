// Source-to-field review of generic starter forms, not sector permit approval.
const source = (title, url, scope) => ({ title, url, scope, basis: 'official-guidance', checkedAt: '2026-10-05' });
const gbRisk = source('HSE · Risk assessment templates', 'https://www.hse.gov.uk/simple-health-safety/risk/risk-assessment-template-and-examples.htm', 'Great Britain: hazards, affected people, controls, action owners and dates; site-specific assessment required.');
const gbMethod = source('HSE · Administration: method statements', 'https://www.hse.gov.uk/construction/safetytopics/admin.htm', 'Construction sequence, resources, competence, emergency arrangements and interfaces. Demolition/dismantling/structural alteration requires written arrangements; this generic draft is not a construction phase plan.');
const gbPermit = source('HSE · Permit to work systems', 'https://www.hse.gov.uk/humanfactors/topics/ptw.htm', 'Generic permit communication, competence, coordination, shift handover and handback. Not the detailed technical permit for each hazardous activity.');
const gbTalk = source('HSE · Toolbox talks', 'https://www.hse.gov.uk/construction/resources/toolboxtalks.htm', 'Short focused construction safety discussion; not a substitute for induction or required training.');
const gbParticipation = source('HSE · How to involve employees', 'https://www.hse.gov.uk/involvement/consult/involveemployees.htm', 'Job-specific discussion and worker contribution to risks and solutions.');
const usJha = source('OSHA · Job Hazard Analysis worksheet', 'https://www.osha.gov/sites/default/files/Job_Hazard_Analysis_Worksheet.pdf', 'Job steps, exposure and incident scenarios, hierarchy of controls, worker input and reassessment. Federal general guidance; applicable state and sector requirements remain separate.');
const usProcedure = source('OSHA · Job Hazard Analysis, OSHA 3071', 'https://www.osha.gov/sites/default/files/publications/osha3071.pdf', 'Job procedures derived from hazard analysis, communicating changes and periodic/incident review. The older publication is used for method principles, not current state-plan counts or legal consolidation.');
const caJsa = source('CCOHS · Job Safety Analysis', 'https://www.ccohs.ca/oshanswers/hsprograms/job-haz.html', 'Canadian general guidance: sequence, hazards, preventive measures, written procedures, review and participation. Does not establish a federal/provincial statutory form.');
const caTalk = source('CCOHS · Safety Talks – How To', 'https://www.ccohs.ca/oshanswers/hsprograms/safety-talks-how-to.html', 'Work-relevant topic, contents, feedback, attendance, action and communication; not formal training. No mandatory five-minute duration or universal frequency.');
const caInspection = source('CCOHS · Effective Workplace Inspections', 'https://www.ccohs.ca/oshanswers/prevention/effectiv.html', 'Planning, areas and findings, equipment/location references, priorities, owners/dates, incomplete areas, report distribution and follow-up. General inspection only, not a statutory technical examination or province-specific committee procedure.');
export const REGIONAL_FORM_SOURCES = {
  'GB.risk_assessment': [gbRisk], 'GB.method_statement': [gbMethod],
  'GB.permit_to_work': [gbPermit], 'GB.toolbox_talk': [gbTalk, gbParticipation],
  'US.risk_assessment': [usJha], 'US.method_statement': [usJha, usProcedure],
  'CA.risk_assessment': [caJsa], 'CA.method_statement': [caJsa],
  'CA.toolbox_talk': [caTalk], 'CA.inspection': [caInspection],
};
