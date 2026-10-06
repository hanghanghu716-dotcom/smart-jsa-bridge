const ref = (title, url, scope, basis = 'official-guidance') => ({ title, url, scope, basis, checkedAt: '2026-10-05' });
const inail = 'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/';
const equipment = `${inail}conoscere-il-rischio/attrezzature-di-lavoro/`;
const itRisk = ref('INAIL · Valutare il rischio', `${inail}valutare-il-rischio.html`, 'Workplace assessment, employer responsibility and prevention programme. Task-level evidence supports rather than replaces DVR; guidance does not establish complete current statutory compliance.');
const itEquipment = ref('INAIL · Valutazione del rischio di un’attrezzatura', `${equipment}la-valutazione-del-rischio-di-un-attrezzatura.html`, 'Hazards, persons, work conditions, controls and review over equipment lifecycle. CE marking does not complete the employer assessment.');
const itTraining = ref('INAIL · Informazione, formazione e addestramento', `${equipment}informazione,-formazione-e-addestramento.html`, 'Understandable instructions, normal/abnormal use, nearby equipment, change and practical instruction. Dated general guidance supports fields; not a current course-duration or qualification ruleset.');
const itInspection = ref('INAIL · Manutenzione, controllo e verifica', `${equipment}manutenzione,-controllo-e-verifica-di-un-attrezzatura.html`, 'Distinguish maintenance, controls and specialist periodic verification. General checklist records findings, response and follow-up; not an Annex VII examination or universal interval.');
const nr1 = ref('MTE · NR-1, text effective 26 May 2026', 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-01-atualizada-2025-i-3.pdf', '1.5.3–1.5.8: hazard coverage, grading method, review cycle, worker input, inventory/action plan and contractor coordination. 1.6/1.7: output is not electronic-signature compliance or training certification. No automatic legal retention or sector exemption determination.', 'regulation');
const qcBase = 'https://www.cnesst.gouv.qc.ca/fr/prevention-securite/organiser-prevention/';
const qcPrevent = `${qcBase}mesures-specifiques-etablissements/appliquer-mecanismes-prevention-participation/mecanismes-prevention/`;
const qcRisk = ref('CNESST · Identifier les risques', `${qcBase}sante-securite-travail-pour-tous/demarche-prevention/identifier-risques-milieu-travail`, 'Routine/nonroutine work, exposed people and consultation; observations support the applicable prevention mechanism. No automatic construction-site or federal-jurisdiction selection.');
const qcProgramme = ref('CNESST · Contenu du programme de prévention', `${qcPrevent}faire-programme-prevention/contenu-programme-prevention`, 'Psychosocial/young-worker risk scope, hierarchy, priority, deadlines, owners/frequency, training and information. Generic records feed the applicable programme without replacing it.');
const qcPlan = ref('CNESST · Plan d’action', `${qcPrevent}faire-plan-action/plan-action`, 'Establishment plan applicability has exceptions to the small-headcount rule. The user records the applicable mechanism; no automatic selection solely by employee count.');
const qcControl = ref('CNESST · Contrôler les risques', `${qcBase}sante-securite-travail-pour-tous/demarche-prevention/controler-risques-milieu-travail`, 'Workers, effectiveness surveillance, inspection evidence, owners and verification frequency; general checklist is not a specialist examination.');
const qcTraining = ref('CNESST · Formation des travailleurs', 'https://www.cnesst.gouv.qc.ca/fr/conditions-travail/horaire-travail/formation-travailleurs', 'New/changed work instructions, practice, understanding, hazardous-product and emergency information. A short talk does not certify required training.');
export const IT_BR_QC_FORM_SOURCES = {
  'IT.risk_assessment': [itRisk, itEquipment],
  'IT.method_statement': [itEquipment, itTraining],
  'IT.toolbox_talk': [itTraining],
  'IT.inspection': [itInspection, itEquipment],
  'BR.risk_assessment': [nr1],
  'BR.method_statement': [nr1],
  'BR.toolbox_talk': [nr1],
  'BR.inspection': [nr1],
  'CA-QC.risk_assessment': [qcRisk, qcProgramme, qcPlan],
  'CA-QC.method_statement': [qcTraining, qcControl, qcPlan],
  'CA-QC.toolbox_talk': [qcTraining, qcPlan],
  'CA-QC.inspection': [qcControl, qcProgramme, qcPlan],
};
export const IT_BR_QC_FORM_IDS = Object.keys(IT_BR_QC_FORM_SOURCES);
