const ref = (title, url, scope, basis = 'official-guidance') => ({ title, url, scope, basis, checkedAt: '2026-10-05' });
const frRisk = ref('INRS · Document unique et plans d’actions', 'https://www.inrs.fr/demarche/document-unique/ce-qu-il-faut-retenir.html', 'Task/work-unit findings feed DUERP and the applicable action list or Papripact; resources, deadlines and effectiveness tracking. This task sheet is not the complete company record or a retention-compliance system.');
const frInstruction = ref('INRS · Formation et information', 'https://www.inrs.fr/demarche/formation-information/ce-qu-il-faut-retenir.html', 'Work-specific instructions, accessible manufacturer information, changed conditions, emergency explanation and reporting. Short discussion supports communication but is not mandatory training certification; dated general guidance is not a complete training ruleset.');
const frCoordination = ref('INRS · Entreprises extérieures: mesures préalables', 'https://www.inrs.fr/risques/entreprises-exterieures/mesures-prevention-prealables-intervention', 'Applicable external-company coordination, prior joint visit, interference risks, work methods and allocated controls. Generic work sequence does not replace Plan de prévention or separate construction coordination.');
const frInspection = ref('INRS · Réaliser une inspection, ED 6513 (April 2023)', 'https://www.inrs.fr/dam/jcr:d975c3d3-384d-46a8-9054-dfd9b889028e/ed6513.pdf', 'Pages 1–2: planning, worker discussion, actual observations, findings, shared report and prevention follow-up. CSE method guidance informs general checklist fields; this checklist does not itself constitute the full CSE process or a specialist equipment inspection.');
const esLaw = ref('BOE · Ley 31/1995, articles 15–20, 23–24', 'https://www.boe.es/buscar/act.php?id=BOE-A-1995-24292', 'Current task assessment, control priorities, owners/deadlines/resources, follow-up, information and training distinction, emergency and company coordination. No claim to replace complete prevention planning or special permits.', 'regulation');
const esAssessment = ref('BOE · RD 39/1997, articles 3–9', 'https://www.boe.es/buscar/act.php?id=BOE-A-1997-1853', 'Affected jobs/workers, competent assessment, methods/evidence, change/ineffectiveness review, action priorities and human/material/financial resources. Periodic controls are risk- and applicable-rule-based, not a universal checklist interval.', 'regulation');
const esManagement = ref('INSST · Gestión de la prevención', 'https://www.insst.es/materias/transversales/gestion-prevencion', 'Integrate procedures, worker information/training and prevention-service collaboration into company management. A task sequence or talk is not the whole Plan de prevención or CAE process.');
export const FR_ES_FORM_SOURCES = {
  'FR.risk_assessment': [frRisk],
  'FR.method_statement': [frInstruction, frCoordination],
  'FR.toolbox_talk': [frInstruction],
  'FR.inspection': [frInspection, frRisk],
  'ES.risk_assessment': [esLaw, esAssessment],
  'ES.method_statement': [esLaw, esManagement],
  'ES.toolbox_talk': [esLaw, esManagement],
  'ES.inspection': [esLaw, esAssessment],
};
export const FR_ES_FORM_IDS = Object.keys(FR_ES_FORM_SOURCES);
