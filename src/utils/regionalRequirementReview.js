import { applyCloseoutReview } from './regionalCloseoutReview20261006.js';
import { applyRuElectricalReview } from './regionalRuElectricalReview20261006.js';
import { applyOutstandingTaskReview } from './regionalOutstandingTaskReview20261006.js';
import { applyFinalTaskReview } from './regionalFinalTaskReview20261006.js';
import { applyKrEsTaskReview } from './regionalKrEsTaskReview20261006.js';
import { applyDeFrTaskReview } from './regionalDeFrTaskReview20261006.js';
// Clause-level additions to the original review. Dates apply only to these
// findings, not to every reference in the country catalogue. No pass/fail defaults.
import { applyEnglishTaskReview } from './regionalEnglishTaskReview20261006.js';
import { applyAuSgTaskReview } from './regionalAuSgTaskReview20261006.js';
import { applyCanadianTaskReview } from './regionalCanadianTaskReview20261006.js';
import { REQUIREMENT_REVIEW_20261005 } from './regionalRequirementReview20261005.js';
import { REQUIREMENT_REVIEW_REMAINING_20261005 } from './regionalRequirementReviewRemaining20261005.js';
import { applyReviewFollowup } from './regionalReviewFollowup20261005.js';
import { applyRegionalBatchReview } from './regionalBatchReview20261005.js';
export const REQUIREMENT_REVIEW_DATE = '2026-10-04';
const source = (title, url, scope, basis = 'official-guidance') => ({
  title, url, scope, basis, checkedAt: REQUIREMENT_REVIEW_DATE,
});
const finding = (noteKey, fields, sources, additionalNotes = []) => ({
  checkedAt: REQUIREMENT_REVIEW_DATE,
  status: 'source-backed-prompts', noteKey, additionalNotes, fields, sources,
});
const br = 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/';
const ruExtension = () => finding('ruExtensionNotice', ['applicableEdition'], [source(
  'Каневской ЦЗН · Приказ 287н, продление 782н / 902н / 903н',
  'https://kanevskadm.ru/news/mintrud-rossii-prodlil-srok-deystviya-pravil-po-okhrane-truda/',
  'Official municipal employment-centre notice, 2025-09-03: extension to 2031-09-01 effective 2025-09-01. Corroborates duration only; amendment full text and subsequent changes remain unreconciled', 'official-notice')]);

const BASE_REQUIREMENT_REVIEW = {
  KR: { confined: finding('krEntryNotice', ['permitDisplay'], [source(
    '안전보건규칙 · 제619조제3항',
    'https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1028543703',
    '2026-03-02 edition: posting pre-entry information until completion; Article 626 exceptions require site review', 'regulation')]) },
  GB: { confined: finding('gbEntryNotice', ['countryProcedure'], [source(
    'HSENI · Approval of L101 (2022)',
    'https://www.hseni.gov.uk/news/hseni-approves-two-revised-acops-l101-and-l113-use-northern-ireland',
    'L101 third edition approved for Northern Ireland from 2022-03-21; NI regulations remain distinct')]) },
  AU: { confined: finding('auEntryNotice', ['permitCloseout', 'permitRecord', 'stateCodeBasis'], [source(
    'Safe Work Australia · Confined spaces, November 2024',
    'https://www.safeworkaustralia.gov.au/sites/default/files/2024-11/model_code_of_practice-confined_spaces-nov24.pdf',
    'Model WHS Regulations 67/77: written entry permit, exit acknowledgement and incident-dependent retention; local adoption required', 'model-code'), source(
    'Safe Work Australia · Jurisdictional adoption',
    'https://www.safeworkaustralia.gov.au/law-and-regulation/legislation',
    'Victoria has not adopted the model WHS laws; other jurisdictions can vary them and model amendments do not apply automatically'), source(
    'WorkSafe Victoria · Confined spaces compliance code, December 2019',
    'https://www.worksafe.vic.gov.au/resources/compliance-code-confined-spaces',
    'Victoria-specific code under OHS Act 2004 / OHS Regulations 2017; do not treat the national model as Victoria law')], ['auJurisdictionNotice']) },
  SG: {
    confined: finding('sgEntryNotice', ['dailyReview', 'permitDisplay'], [source(
      'WSHC · Confined space permit review (7.6)',
      'https://www.tal.sg/wshc/-/media/tal/wshc/resources/publications/technical-advisories/files/cs2.ashx',
      'Daily authorised-manager review, posting and permit validity; advisory does not extend an expired permit')]),
    electrical: finding('sgElectricalNotice', ['licenceScope'], [source(
      'EMA · Engaging Licensed Electrical Workers',
      'https://www.ema.gov.sg/consumer-information/electricity/engaging-licensed-workers',
      'Electrical installation work: valid LEW licence and class/load/voltage scope; separate from marine permit procedure')]),
  },
  US: { confined: finding('usEntryNotice', ['entryAuthorisation', 'permitCloseout', 'permitRecord'], [source(
    'OSHA · 1910.146(e), (f), (j)',
    'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146',
    'General industry: signed entry-supervisor authorisation, task-limited duration, cancellation and at least one-year cancelled-permit retention', 'regulation')]) },
  CA: { confined: finding('caEntryNotice', ['countryProcedure', 'permitRecord'], [source(
    'CCOHS · Confined Space — Program',
    'https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_program.html',
    'General guidance only; permit applicability and document control depend on the actual federal/provincial jurisdiction')]) },
  'CA-AB': { confined: finding('abEntryNotice', ['spaceClass', 'entryAuthorisation', 'permitRecord'], [source(
    'Alberta OHS Code · 47, 56, 58',
    'https://search-ohs-laws.alberta.ca/legislation/occupational-health-and-safety-code/part-5-confined-spaces/',
    'Confined/restricted-space distinction; competent-person permit signature; tending worker; retention one year or two after incident/unplanned event', 'regulation')]) },
  'CA-ON': { confined: finding('onEntryNotice', ['shiftVerification', 'permitRecord', 'employerCoordination', 'assessmentEndorsement', 'planReference', 'trainingEvidence', 'rescueReadiness', 'atmosphericBasis'], [
    source('Ontario · Entry permit, section 10',
      'https://www.ontario.ca/document/guideline-working-confined-spaces/entry-permit',
      'Competent-person verification before each shift; permit signature/entrance posting not separately mandatory. Assessment signature remains required under s6(7)'),
    source('Ontario · Confined space documents',
      'https://www.ontario.ca/document/guideline-working-confined-spaces/documents',
      'Official indexed guidance: non-project longer of one year/two most recent records; construction one year after project completion; programme retained separately'),
    source('Ontario · Coordination document, section 4',
      'https://www.ontario.ca/document/guideline-working-confined-spaces/coordination-document',
      'Multi-employer work in the same space or related work: lead employer/constructor prepares coordination before work; does not transfer general training, PPE or record duties'),
    source('Ontario · O. Reg. 632/05, current e-Laws text',
      'https://www.ontario.ca/laws/regulation/050632',
      'Official public e-Laws API returned state=current, consolidation from 2016-07-01, last amendment 346/15. Sections 4–21 read: coordination, signed assessment, plan, training, shift verification, immediate rescue, atmospheric criteria and retention', 'regulation'),
  ], ['onCoordinationNotice', 'onAssessmentNotice']) },
  'CA-BC': { confined: finding('bcEntryNotice', ['permitTrigger', 'shiftAuthorisation', 'permitRecord'], [source(
    'WorkSafeBC · 9.13–9.16',
    'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-09-confined-spaces',
    'Conditional permit triggers; responsible-supervisor signature on crew/shift/supervisor changes; signed permit kept at least one year', 'regulation')]) },
  'CA-QC': { confined: finding('qcEntryNotice', ['restartReview', 'rescueLeadership', 'applicableFramework', 'jointHazardRecord'], [source(
    'Québec · RSST, 308–309',
    'https://www.legisquebec.gouv.qc.ca/fr/pdf/rc/S-2.1%2C%20R.%2013.pdf',
    'Indexed official consolidation dated 2025-07-15: RSST 308–309, reassessment and rescue leader; current HTML direct access unavailable, CSTC applicability remains separate', 'regulation'), source(
    'Québec · CSTC, 3.21.1–3.21.2',
    'https://www.legisquebec.gouv.qc.ca/fr/pdf/rc/S-2.1%2CR.4.pdf',
    'Indexed official consolidation dated 2025-09-01: construction principal contractor jointly with employer identifies equipment, services, hazards, contaminants and rescue in writing, available on site. Current consolidation not obtained', 'regulation')], ['qcFrameworkNotice']) },
  SA: { height: finding('saScaffoldNotice', ['scaffoldInspection', 'siteProcedure'], [source(
    'HRSD · Guidance Manual on the Use of Scaffolding, p.6',
    'https://www.hrsd.gov.sa/sites/default/files/2026-03/dlyl-astrshady-hwl-astkhdam-alsqalat-anjlyzy.pdf',
    'Ministry guidance: pre-use specialist inspection, daily competent-person checks, access, exclusion zone and rescue. Not evidence of a universal statutory permit or licence; no numerical clearance default')]) },
  RU: { height: ruExtension(), confined: ruExtension(), electrical: ruExtension() },
  DE: { confined: finding('deEntryNotice', ['measurementCompetence'], [source(
    'DGUV · 113-004, 4.3.5.3–4.3.5.5',
    'https://publikationen.dguv.de/widgets/pdf/download/article/915',
    'Fachkunde for clearance measurement; distinguish Freimessen from subsequent continuous monitoring by Sicherungsposten')]) },
  JP: { confined: finding('jpEntryNotice', ['spaceClass', 'trainingEvidence', 'retestTriggers'], [source(
    '厚生労働省 · 酸素欠乏症等防止規則 第11条',
    'https://www.mhlw.go.jp/web/t_doc?dataId=74105000&dataType=0&pageNo=1',
    'First/second-class oxygen-deficiency work: operations-chief course eligibility and before-start/re-entry/abnormality measurement duties', 'regulation')]) },
  FR: { electrical: finding('frElectricalNotice', ['employerAuthorisation'], [source(
    'INRS · Habilitation électrique — FAQ',
    'https://www.inrs.fr/risques/electriques/habilitation-electrique-foire-aux-questions',
    'Employer-issued title with symbols, voltage domain, installation and limitations; training certificate alone is not habilitation')]) },
  IT: { confined: finding('itEntryNotice', ['trainingEvidence'], [source(
    'Ministero del Lavoro · FAQ Accordo SR, 27/03/2026, Q26–28',
    'https://www.lavoro.gov.it/temi-e-priorita-salute-e-sicurezza/focus/faq-accordo-stato-regioni-27032026',
    'Prior confined-space training recognition requires comparison with Part II point 7 of ASR 59/2025; no automatic recognition')]) },
  ES: { electrical: finding('esElectricalNotice', ['voltageRole'], [source(
    'BOE · RD 614/2001, Anexo II A.1',
    'https://boe.es/buscar/act.php?id=BOE-A-2001-11881',
    'Suppression/restoration of voltage: authorised workers; qualified workers for high voltage. Does not authorise live work', 'regulation')]) },
  BR: { height: finding('brHeightNotice', ['routineClassification', 'shiftAuthorisation', 'permitRecord', 'trainingDelivery', 'ladderAssessment', 'transitionEvidence'], [source(
    'MTE · NR-35, 35.3.1(j), 35.5.7–35.5.8.2',
    br + 'normas-regulamentadora/normas-regulamentadoras-vigentes/nr-35-atualizada-2025-1.pdf',
    'PDF includes Portaria 1259/2026: non-routine PT, shift/workday-limited validity, unchanged conditions/crew for revalidation, five-year records unless a specific NR differs', 'regulation'), source(
    'MTE · Portaria 1.259/2026, arts. 1–9',
    'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/sst-portarias/2026-1/portaria-mte-no-1-259-alteracao-do-anexo-iii-da-nr-35.pdf',
    'Effective publication 2026-07-16: in-person training; one-year initial-training transition; ladder-specific risk analysis, SPIQ competence, dated project evidence and staged implementation. No automatic exemption/deadline determination', 'regulation')], ['brHeightTransitionNotice']),
    electrical: finding('brElectricalEditionNotice', ['applicableEdition'], [source(
      'MTE · NR-10, current and forthcoming editions',
      br + 'normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-10-nr-10',
      'Ministry identifies existing edition valid through 2027-05-31 and Portaria 737/2026 edition effective 2027-06-01'), {
      ...source('MTE · Portaria 737/2026, arts. 3 and 5',
        'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/sst-portarias/2026-1/portaria-mte-no-737-nova-nr-10.pdf',
        'Forthcoming edition, not a current 2026 duty. Existing-installation extension applies only to 10.6.4(e), one year after this edition takes effect', 'regulation'),
      effectiveFrom: '2027-06-01',
      transition: { clause: '10.6.4(e)', scope: 'installations existing when Portaria takes effect', effectiveFrom: '2028-06-01' },
    }]),
  },
};

for (const [jurisdiction, findings] of Object.entries(REQUIREMENT_REVIEW_20261005)) {
  Object.assign(BASE_REQUIREMENT_REVIEW[jurisdiction], findings);
}
for (const [jurisdiction, findings] of Object.entries(REQUIREMENT_REVIEW_REMAINING_20261005)) {
  Object.assign(BASE_REQUIREMENT_REVIEW[jurisdiction], findings);
}

// Retain saved field keys while preventing Québec-only RSST/CSTC labels from
// appearing in Ontario or Saudi forms. Their own source limitations still apply.
for (const [jurisdiction, topics] of [['CA-ON', ['height', 'electrical', 'hot']], ['SA', ['confined']]]) {
  for (const topic of topics) {
    const finding = BASE_REQUIREMENT_REVIEW[jurisdiction][topic];
    finding.fieldLabels = { ...finding.fieldLabels, applicableFramework: 'frameworkBasis' };
  }
}

export function requirementReview(jurisdiction, topic) {
  const record = REGIONAL_REQUIREMENT_REVIEW[jurisdiction]?.[topic];
  return record ? structuredClone(record) : null;
}

export const REGIONAL_REQUIREMENT_REVIEW = applyCloseoutReview(applyRuElectricalReview(applyOutstandingTaskReview(applyFinalTaskReview(applyKrEsTaskReview(applyDeFrTaskReview(applyAuSgTaskReview(applyCanadianTaskReview(applyEnglishTaskReview(applyRegionalBatchReview(applyReviewFollowup(BASE_REQUIREMENT_REVIEW)))))))))));
