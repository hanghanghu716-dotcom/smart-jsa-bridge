// Source-scoped prompts, not a statutory permit or automatic work approval.
export const KR_ES_TASK_VERSION = '2026-10-06.24';
const source = (title, url, scope, basis = 'regulation') => ({ title, url, scope, basis, checkedAt: '2026-10-06' });
const preventive = source('RD 39/1997 · artículo 22 bis', 'https://www.boe.es/buscar/act.php?id=BOE-A-1997-1853', 'Preventive-resource presence for specified risks, including especially serious falls and confined spaces; assessment, planning, monitoring, corrective action and employer coordination. Not a universal height threshold or interchangeable rescue role.');
export const KR_ES_TASK_REVIEW = {
  'KR.height': { fields: ['heightAccessCheck', 'temporaryProtection', 'fallServiceRelease'], sources: [
    source('안전보건규칙 · 제42–46조', 'https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029039573', 'Collective protection, conditional portable-ladder use, openings/fragile roofs, anchors and pre-use checks, safe access. Ladder and height conditions are not a general low-height exemption; structural design remains separate.'),
  ] },
  'KR.confined': { fields: ['planReference', 'measurementCompetence', 'trainingEvidence', 'atmosphericBasis', 'standbyArrangement', 'rescueReadiness', 'restartReview', 'permitRecord', 'krAtmosphereRecord'], note: 'krEntryRestartNote', sources: [
    source('안전보건규칙 · 제619–626·639–643조', 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=154679', 'Entry programme and posted work information; trained/equipped measurement before start and restart, recorded assessment retained three years, ventilation, outside attendant/contact, evacuation and protected rescue. Article 626 exemptions require their own conditions and do not exempt 619-2.'),
    source('고용노동부 · 2025-12-01 개정 시행 안내', 'https://moel.go.kr/news/enews/report/enewsView.do?news_seq=18669', 'Corroborates effective December 2025 measurement-equipment provision, three-year records, immediate 119 reporting and understanding/training checks where the consolidated link header is inconsistent.', 'official-guidance'),
  ] },
  'KR.electrical': { fields: ['isolationVerification', 'isolationHandover', 'countryProcedure'], note: 'krElectricalReturnNote', sources: [
    source('안전보건규칙 · 제318–320조', 'https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029038625', 'Eligible electrical workers; all-source isolation, locks AND tags, discharge/test/conditional earthing, pre-work checks and ordered restoration with installer removing own lock/tag. Live-work routes and exceptions are not granted by this form.'),
  ] },
  'KR.hot': { fields: ['containerHistory', 'hotFireProtection', 'trainingEvidence', 'atmosphericBasis', 'restartReview'], sources: [
    source('안전보건규칙 · 제239–245조', 'https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=75618', 'Residual fire/explosion risk, container cleaning, work preparation and posted information, ventilation without oxygen, conditional fire-watch appointment/equipment and final ember removal. No universal post-work watch duration or automatic recurring-work exception.'),
  ] },
  'ES.height': { fields: ['heightAccessCheck', 'anchorCheck', 'trainingEvidence', 'scaffoldInspection', 'planReference', 'rescueReadiness', 'preventivePresence'], sources: [
    source('RD 1215/1997 · anexo II, 4.1–4.4', 'https://www.boe.es/buscar/act.php?id=BOE-A-1997-17824', 'Collective protection/access, conditional ladder/rope routes, weather, scaffold plan/competence and inspections, rope-work supervision and immediate rescue. Engineering, calculations and conditional alternate qualifications are separate.'), preventive,
  ] },
  'ES.confined': { fields: ['planReference', 'trainingEvidence', 'atmosphericBasis', 'measurementCompetence', 'standbyArrangement', 'multiEmployerRoles', 'restartReview', 'permitRecord'], note: 'esEntryRolesNote', sources: [
    preventive,
    source('INSST · Espacios confinados', 'https://www.insst.es/materias/riesgos/seguridad-en-el-trabajo/espacios-confinados', 'Entry necessity, individual authorisation, operation permission, controlled access, preventive presence and rescue arrangements.', 'official-guidance'),
    source('INSST · Guía de lugares de trabajo, apéndice 1 (2015)', 'https://www.insst.es/documents/94886/203536/Gu%C3%ADa%2Bt%C3%A9cnica%2Bpara%2Bla%2Bevaluaci%C3%B3n%2By%2Bprevenci%C3%B3n%2Bde%2Blos%2Briesgos%2Brelativos%2Ba%2Bla%2Butilizaci%C3%B3n%2Bde%2Blugares%2Bde%2Btrabajo.pdf/deac8eb9-e242-48c4-a634-4cf88927fff7', 'Printed pp. 57–59: individual work assessment, entry permit, isolation/testing/ventilation, outside monitoring, trained personnel and planned rescue; refresh training/permission after relevant changes. Numerical examples are not automatic acceptance criteria.', 'official-guidance'),
  ] },
  'ES.electrical': { fields: ['electricalEligibility', 'isolationSequence', 'isolationVerification', 'restorationRelease', 'isolationHandover', 'countryProcedure'], note: 'esElectricalReturnNote', sources: [
    source('RD 614/2001 · artículo 4 y anexo II A', 'https://www.boe.es/buscar/act.php?id=BOE-A-2001-11881', 'De-energised work sequence, authorised workers (qualified for high voltage), all-source isolation, test/earthing/proximity protections and restoration. Treat installation as live from withdrawal of the first safety measure; special annex II B and live-work methods remain separate.'),
  ] },
  'ES.hot': { fields: ['trainingEvidence', 'hotFireProtection', 'containerHistory', 'atmosphericBasis', 'permitRecord', 'restartReview', 'multiEmployerRoles'], note: 'esPermitLifecycleNote', sources: [
    source('INSST · NTP 562, autorizaciones de trabajos especiales', 'https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/16-serie-ntp-numeros-541-a-575-ano-2001/ntp-562-sistema-de-gestion-preventiva-autorizaciones-de-trabajos-especiales.', 'Guide permit roles, joint checks, preparation/cleaning/isolation/fire controls, competent workers, shift-limited validity, changed-condition renewal, stop/notification and return/archive. The guide is not a universal statutory hot-work permit requirement.', 'official-guidance'),
  ] },
};
export function applyKrEsTaskReview(records) {
  const result = structuredClone(records);
  for (const [id, review] of Object.entries(KR_ES_TASK_REVIEW)) {
    const [country, topic] = id.split('.'), record = result[country][topic];
    record.fields = [...new Set([...record.fields, ...review.fields])];
    record.additionalNotes = [...new Set([...(record.additionalNotes || []), ...(review.note ? [review.note] : [])])];
    record.sources = [...new Map([...record.sources, ...review.sources].map(s => [s.url, s])).values()];
    record.version = KR_ES_TASK_VERSION;
    record.checkedAt = '2026-10-06';
    record.evidence = 'regional-kr-es-task-review-20261006.md';
    record.remaining = 'Application task-prompt checklist compared within cited Korean/Spanish sources. Full technical standards, specialist sectors, competence, site measurements, engineering and statutory authorisations remain separate; see evidence.';
  }
  return result;
}
