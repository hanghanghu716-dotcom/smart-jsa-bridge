// Scoped task-prompt comparisons; no automatic permission or standard approval.
export const DE_FR_TASK_VERSION = '2026-10-06.23';
const source = (title, url, scope, basis = 'official-guidance') => ({ title, url, scope, basis, checkedAt: '2026-10-06' });
const dguv = (number, article, scope) => source(`DGUV · ${number}`, `https://publikationen.dguv.de/widgets/pdf/download/article/${article}`, scope);
const inrs = (title, path, scope) => source(`INRS · ${title}`, `https://www.inrs.fr/${path}`, scope);
export const DE_FR_TASK_REVIEW = {
  'DE.height': { fields: ['planReference', 'trainingEvidence', 'rescueReadiness', 'anchorCheck', 'fallServiceRelease', 'heightAccessCheck'], sources: [
    source('BetrSichV · Anhang 1, 3.1–3.3', 'https://www.gesetze-im-internet.de/betrsichv_2015/anhang_1.html', 'Collective priority, safe access, temporary protection/restoration, weather, scaffolding and ladder conditions. Special scaffold calculations and rope-work design remain separate.', 'regulation'),
    dguv('112-198 · sections 6–10', 1013, 'Risk-based selection/anchors, usable rescue concept, instructions and practical training, pre-use inspection, competent periodic inspection and withdrawal after defects/fall loading. No automatic anchor capacity or clearance calculation.'),
  ] },
  'DE.confined': { fields: ['planReference', 'trainingEvidence', 'rescueReadiness', 'atmosphericBasis', 'entryAuthorisation', 'standbyArrangement', 'restartReview', 'permitCloseout', 'multiEmployerRoles'], note: 'deEntryLifecycleNote', sources: [
    dguv('113-004 · sections 3–6 and permit appendix', 915, 'Avoid entry; appoint supervision, standby and competent clearance testing; signed permit or limited identical-condition instructions, isolation/ventilation/monitoring, restart checks, removal of controls and locally available practised rescue. Special wastewater, ship and surface-treatment rules remain separate.'),
  ] },
  'DE.electrical': { fields: ['deElectricalRelease', 'electricalEligibility', 'isolationVerification', 'restorationRelease', 'isolationHandover', 'countryProcedure'], sources: [
    dguv('203-001 · section 2.1', 284, 'De-energised route: all-source isolation, prevention of re-energisation, tester checks, applicable earthing/barriers, work release by Arbeitsverantwortlicher after Anlagenverantwortlicher approval and completion/readiness handback. Written release is recommended here, not declared universally mandatory. Full VDE standards/live work excluded.'),
  ] },
  'DE.hot': { fields: ['weldingEquipmentCheck', 'hotFireProtection', 'atmosphericBasis', 'containerHistory', 'multiEmployerRoles', 'trainingEvidence', 'restartReview'], sources: [
    dguv('209-011 · sections 7.1–7.3 and permit example', 319, 'Gas welding/cutting: avoid hot work where practicable; residual fire/explosion controls, written welding permission or limited recurring-work instruction, separate during/after-work watch, ventilation, containers and equipment. No universal watch period or confined-entry permission.'),
    dguv('209-010 · fire/explosion and equipment controls', 318, 'Arc-welding hazards, electrical/thermal protection, extraction, equipment and linked permission checks; welding qualification and design approval are separate.'),
  ] },
  'FR.height': { fields: ['anchorCheck', 'trainingEvidence', 'rescueReadiness', 'heightAccessCheck', 'temporaryProtection', 'frHeightRescue'], sources: [
    inrs('Travail en hauteur · réglementation', 'risques/chutes-hauteur/reglementation-travail-hauteur.html', 'Collective prevention/access, fragile surfaces, temporary removal, ladder/rope exceptions, weather and equipment-specific training/inspection. No minimum-height exemption or automatic scaffold/PEMP qualification.'),
    source('Code du travail · R4323-61', 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000018531391', 'When collective protection cannot be implemented: suitable fall-arrest system, no lone work and prompt rescue; employer instructions identify anchor points and use. This record does not design the system.', 'regulation'),
  ] },
  'FR.confined': { fields: ['planReference', 'trainingEvidence', 'atmosphericBasis', 'measurementCompetence', 'standbyArrangement', 'restartReview', 'permitCloseout', 'multiEmployerRoles'], note: 'frEntryMonitoringNote', sources: [
    inrs('Espaces confinés · procédure de travail', 'risques/espaces-confines/procedure-travail-espaces-confines.html', 'Personal authorisation separate from on-site operation permit, calibrated gas testing, isolation, outside communication/supervision and equipment readiness. Link DUERP/prevention plan and rescue arrangements.'),
    inrs('Espaces confinés · prévention', 'risques/espaces-confines/prevenir-risques', 'Entry necessity, cleaning/isolation, risk-based ventilation/testing, individual continuous detectors, dedicated outside attendant without entry, evacuation and separate rescue. CATEC and sector rules are not universalised.'),
  ] },
  'FR.electrical': { fields: ['electricalEligibility', 'isolationSequence', 'isolationVerification', 'isolationHandover', 'restorationRelease', 'countryProcedure', 'trainingEvidence'], note: 'frElectricalBoundaryNote', sources: [
    inrs('Risque électrique · prévention', 'risques/electriques/prevention-risque-electrique.html', 'Work de-energised first: identify sources, isolate, lock, identify installation, verify absence of voltage and applicable earthing; remove/protect proximity to live parts. Full NF C 18-510/18-550 and live-work procedures separate.'),
    inrs('Habilitation électrique · FAQ', 'risques/electriques/habilitation-electrique-foire-aux-questions', 'Employer title, scope, training, instructions and validity; 2025 medical-attestation trigger for applicable live/proximity operations. Evidence is checked through employer procedures, without recording medical diagnoses.'),
    source('Code du travail · R4544-10, effective 2025-10-01', 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051500368', 'Employer-issued task limits, theoretical/practical training and prescription booklet; proximity-to-exposed-live-parts authorisation has a medical-attestation condition. Separate R4544-11 live-work route is not authorised by this form.', 'regulation'),
  ] },
  'FR.hot': { fields: ['permitCoverage', 'dailyReview', 'shiftVerification', 'permitRecord', 'hotFireProtection', 'weldingEquipmentCheck', 'atmosphericBasis', 'trainingEvidence'], note: 'frHotLifecycleNote', sources: [
    inrs('ED 6030 · permit lifecycle and checks, pp. 3–11', 'dam/inrs/CataloguePapier/ED/TI-ED-6030-2.pdf', 'Fixed prepared workstation distinction; named site/contractor roles, joint visit, limited validity, daily/shift/change review, equipment/atmosphere/fire protection and trained watch. Two-hour post-work watch and five-year archive are guide recommendations, not a universal statutory period.'),
  ] },
};
export function applyDeFrTaskReview(records) {
  const result = structuredClone(records);
  for (const [id, review] of Object.entries(DE_FR_TASK_REVIEW)) {
    const [country, topic] = id.split('.'), record = result[country][topic];
    record.fields = [...new Set([...record.fields, ...review.fields])];
    record.additionalNotes = [...new Set([...(record.additionalNotes || []), ...(review.note ? [review.note] : [])])];
    record.sources = [...new Map([...record.sources, ...review.sources].map(s => [s.url, s])).values()];
    record.version = DE_FR_TASK_VERSION;
    record.checkedAt = '2026-10-06';
    record.evidence = 'regional-de-fr-task-review-20261006.md';
    record.remaining = 'Application task-prompt checklist compared within the cited German/French guidance and legal provisions. Full standards, special sectors, site decisions, engineering and statutory authorisations remain separate; see evidence.';
  }
  return result;
}
