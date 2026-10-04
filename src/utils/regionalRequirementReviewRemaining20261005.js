// Remaining 37 combinations. A supplement records only its cited scope.
// partial/remaining prevent guidance or inaccessible consolidations becoming legal approval.
const source = (title, url, scope, basis = 'official-guidance') => ({ title, url, scope, basis, checkedAt: '2026-10-05' });
const finding = (noteKey, fields, sources, remaining) => ({
  checkedAt: '2026-10-05', status: 'source-backed-prompts', noteKey, additionalNotes: [], fields,
  sources: Array.isArray(sources) ? sources : [sources],
  ...(remaining ? { partial: true, remaining } : {}),
});
const ab = 'https://search-ohs-laws.alberta.ca/legislation/occupational-health-and-safety-code/';
const bc = 'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/';
const br = 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/';
const sa = source('NCOSH · Regulation on the Organization of Work in High-Risk Occupations, arts. 9, 15–19',
  'https://www.ncosh.gov.sa/media/if1lxppg/rowhro-25-en.pdf',
  'Occupational classification/training/practice permits, distinct from a site PTW. Article 19: commencement 180 days after Gazette publication; publication date and implementing mechanisms not reconciled.', 'regulation-publication');
const saWelding = source('HRSD · Industrial hazards guide, welding section (p. 8)',
  'https://www.hrsd.gov.sa/sites/default/files/2026-03/dlyl-astrshady--dlyl-almkhatr-alsna-yt-almt-lqt-balslamt-walsht-almhnyt--wkyfyt-alt-aml-m-ha-anjlyzy.pdf',
  'Welding guidance: cable condition, competent equipment connection, combustible removal and ventilation. Not an all-sector electrical isolation code or statutory hot-work permit procedure.');
const saRemaining = 'Gazette publication/commencement and implementation of occupational permits, plus sector-specific PTW rules, remain unverified.';

export const REQUIREMENT_REVIEW_REMAINING_20261005 = {
  AU: {
    height: finding('auHeightDetail', ['stateCodeBasis', 'planReference', 'fallProtectionBasis'], source(
      'Safe Work Australia · Working at heights', 'https://www.safeworkaustralia.gov.au/safety-topic/hazards/working-heights',
      'Model framework: ground/solid construction, prevention, positioning, arrest hierarchy; SWMS for high-risk construction fall risk over 2 m. This is not a safe exemption below 2 m; local adoption must be checked.')),
    electrical: finding('auElectricalDetail', ['stateCodeBasis', 'isolationSequence', 'restorationRelease'], source(
      'Safe Work Australia · Managing electrical risks, model code (2018), sections 4–5',
      'https://www.safeworkaustralia.gov.au/system/files/documents/1810/model-cop-managing-electrical-risks-in-the-workplace.pdf',
      'Isolation, testing before touch and safe restoration for covered electrical work. Model code adoption, licensing and excluded installations require local confirmation.')),
    hot: finding('auHotDetail', ['stateCodeBasis', 'hotAuthorisation', 'containerHistory'], source(
      'Safe Work Australia · Welding processes, model code (2019), section 3.4',
      'https://www.safeworkaustralia.gov.au/system/files/documents/1901/code_of_practice_-_welding_processes_0.pdf',
      'Fire/explosion controls and hot-work permit procedure guidance; a confined-space entry permit is a separate requirement when applicable. Model code, not a nationwide all-welding permit mandate.')),
  },
  SG: {
    hot: finding('sgMarineHotDetail', ['hotAuthorisation', 'dailyReview', 'permitRecord', 'multiEmployerRoles'], source(
      'WSHC · WSH Manual for Marine Industries, sections 5.4–5.11',
      'https://www.tal.sg/wshc/-/media/tal/wshc/resources/publications/wsh-guidelines/files/wsh_manual_for_marine_industries.ashx',
      'Marine PTW: safety assessor evaluation, ship repair manager approval, incompatible-work coordination, daily review and controlled permit records. Older manual clause numbers are not asserted as current legislation.'),
    'Current Shipbuilding and Ship-repair Regulations consolidation was inaccessible; reconcile amended numbering and approval conditions before closing legal review.'),
  },
  CA: {
    height: finding('caHeightDetail', ['planReference', 'anchorCheck', 'rescueReadiness'], source(
      'CCOHS · Fall protection plan', 'https://www.ccohs.ca/oshanswers/hsprograms/fall/fall_protection_general.html',
      'General guidance on site-specific plan, anchorage, clearance and rescue; provincial/federal legal triggers are not determined.')),
    electrical: finding('caEnergyDetail', ['countryProcedure', 'isolationHandover'], source(
      'CCOHS · Lockout/Tag out', 'https://www.ccohs.ca/oshanswers/hsprograms/lockout.html',
      'Equipment-specific hazardous-energy control and verification, including stored/non-electrical energy; not an electrical licence or nationwide statute.')),
    hot: finding('caHotDetail', ['hotAuthorisation', 'watchCloseout'], source(
      'CCOHS · Welding – Hot Work', 'https://www.ccohs.ca/oshanswers/safety_haz/welding/hotwork.html',
      'Program/permit and watcher guidance: at least 60 minutes afterward, potentially longer. Guidance is not a uniform provincial legal duration; no automatic expiry.')),
  },
  'CA-AB': {
    height: finding('abHeightDetail', ['fallPlanTrigger', 'planReference', 'rescueReadiness'], source(
      'Alberta OHS Code · Part 9, sections 139–140', ab + 'part-9-fall-protection/',
      'Section 140 written plan trigger: possible fall of 3 m or more without guardrails. Plan includes systems, anchors, clearance and rescue. Plan trigger is not the complete protection trigger.', 'regulation')),
    electrical: finding('abEnergyDetail', ['countryProcedure', 'personalLockRegister'], source(
      'Alberta OHS Code · Part 15, sections 212–214', ab + 'part-15-managing-the-control-of-hazardous-energy/',
      'Energy isolation/equivalent effective control, worker verification of inoperative/safe equipment, identifiable personal locks and accessible identification list. Operating-equipment exceptions not automatically approved.', 'regulation')),
    hot: finding('abHotDetail', ['hotPermitTrigger', 'hotAuthorisation', 'retestTriggers'], source(
      'Alberta OHS Code · Part 10, section 169', ab + 'part-10-fire-and-explosion-hazards/',
      'Hot work in hazardous locations: conditional permit, atmospheric testing type/frequency and safe method. Not a permit mandate for every welding job; no safe gas threshold prefilled.', 'regulation')),
  },
  'CA-BC': {
    height: finding('bcHeightDetail', ['fallPlanTrigger', 'planReference'], source(
      'WorkSafeBC · OHS Regulation 11.2–11.3', bc + 'part-11-fall-protection',
      'Written plan for possible fall of 7.5 m or more without permanent guardrails, or alternative procedures under 11.2(5). Distinct from the lower fall-protection trigger.', 'regulation')),
    electrical: finding('bcEnergyDetail', ['personalLockRegister', 'restorationRelease'], source(
      'WorkSafeBC · OHS Regulation 10.7–10.9', bc + 'part-10-de-energization-and-lockout',
      'Personal lock/key control; absent-owner removal requires responsible supervisor/manager procedure and notification. Group lockout uses two qualified workers for independent verification.', 'regulation')),
    hot: finding('bcHotDetail', ['containerHistory', 'retestTriggers', 'weldingEquipmentCheck'], source(
      'WorkSafeBC · OHS Regulation 12.116, 12.119–12.120', bc + 'part-12-tools-machinery-and-equipment',
      'Container cleaning and qualified atmosphere testing with subsequent tests at suitable intervals; equipment defects, leaks/contamination and flashback prevention.', 'regulation')),
  },
  'CA-ON': {
    height: finding('onHeightDetail', ['applicableFramework', 'trainingEvidence', 'rescueReadiness'], source(
      'Ontario · O. Reg. 213/91, sections 26–26.3', 'https://www.ontario.ca/laws/regulation/910213',
      'Current official API consolidation effective 2026-04-20: construction hierarchy, written rescue before fall arrest/net, equipment training and records; distinct from approved working-at-heights training.', 'regulation')),
    electrical: finding('onEnergyDetail', ['applicableFramework', 'countryProcedure', 'isolationHandover'], [source(
      'Ontario · O. Reg. 213/91, section 190', 'https://www.ontario.ca/laws/regulation/910213',
      'Construction: power isolation, lock/tag, discharge, worker verification and multiple-worker communication. Current official API consolidation effective 2026-04-20.', 'regulation'), source(
      'Ontario · Reg. 851, sections 42–42.2', 'https://www.ontario.ca/laws/regulation/900851',
      'Industrial establishments: separate isolation/verification exceptions and utility scope. Do not transfer construction exceptions; live work remains outside this form. Current official API consolidation effective 2022-07-01.', 'regulation')]),
    hot: finding('onHotDetail', ['applicableFramework', 'containerHistory', 'hotAreaCheck'], source(
      'Ontario · O. Reg. 213/07, Fire Code section 5.17', 'https://www.ontario.ca/laws/regulation/070213',
      'Current official API consolidation effective 2026-01-01: building fire precautions, combustible separation/protection, container cleaning/testing or engineering measures; no hot work on totally enclosed containers. Not an all-sector written PTW mandate.', 'regulation')),
  },
  'CA-QC': {
    height: finding('qcHeightDetail', ['applicableFramework', 'anchorCheck', 'rescueReadiness'], source(
      'CNESST · Harnais et liaison d’arrêt de chute',
      'https://www.cnesst.gouv.qc.ca/fr/prevention-securite/identifier-corriger-risques/liste-informations-prevention/harnais-liaison-darret-chute',
      'Quebec guidance: harness/linkage/anchorage and rescue procedure; confirm applicable RSST or construction CSTC framework.')),
    electrical: finding('qcEnergyDetail', ['applicableFramework', 'countryProcedure', 'trainingEvidence'], source(
      'CNESST · Travail sur les installations électriques',
      'https://www.cnesst.gouv.qc.ca/fr/prevention-securite/identifier-corriger-risques/liste-informations-prevention/travail-sur-installations-electriques',
      'Construction/renovation coordination, de-energisation and cadenassage, personal-key control, procedures/materials/training. French habilitation is not imported.')),
    hot: finding('qcHotDetail', ['applicableFramework', 'containerHistory', 'watchCloseout'], source(
      'CCHST · Soudage – Travail à chaud', 'https://www.cchst.ca/oshanswers/safety_haz/welding/hotwork.html',
      'Canadian general guidance in French only; not evidence of current Quebec RSST/CSTC or adopted fire-code clauses.'),
    'Current Quebec RSST PDF retrieval failed; historical 2023 consolidation is not used as current law. Quebec-specific hot-work/fire-code clause review remains open.'),
  },
  DE: {
    height: finding('deHeightDetail', ['fallProtectionBasis', 'temporaryProtection', 'ladderConditions'], source(
      'BetrSichV · Anhang 1, section 3.1', 'https://www.gesetze-im-internet.de/betrsichv_2015/anhang_1.html',
      'Collective priority, conditional ladder/rope use, safe access/evacuation, compensatory protection before temporary removal and restoration afterward.', 'regulation')),
    electrical: finding('deEnergyDetail', ['isolationSequence', 'trainingEvidence'], source(
      'BGHM · Arbeiten an elektrischen Anlagen und Betriebsmitteln',
      'https://www.bghm.de/arbeitsschuetzer/themen/elektrotechnik/arbeiten-an-elektrischer-anlagen-und-betriebsmitteln',
      'Five safety rules and Elektrofachkraft responsibility; instructed persons under oversight. Voltage/installation exceptions not automatically applied.')),
    hot: finding('deHotDetail', ['hotAuthorisation', 'watchCloseout'], source(
      'DGUV Information 209-011 · section 7.2, pp. 38–39', 'https://publikationen.dguv.de/widgets/pdf/download/article/319',
      'Written welding authorization/site coordination; Brandposten during work versus Brandwache afterward. Repeated identical conditions may use an operating instruction; no uniform 30-minute default.')),
  },
  FR: {
    height: finding('frHeightDetail', ['fallProtectionBasis', 'ladderConditions'], source(
      'INRS · Équipements d’accès en hauteur', 'https://www.inrs.fr/risques/chutes-hauteur/equipements-acces-hauteur.html',
      'Ladders normally access equipment; workstation exceptions for technical impossibility of collective protection or low-risk, short, non-repetitive tasks.')),
    confined: finding('frConfinedDetail', ['personTaskAuthorisation', 'entryAuthorisation', 'rescueReadiness'], source(
      'INRS · Espaces confinés – Prévenir les risques', 'https://www.inrs.fr/risques/espaces-confines/prevenir-risques.html',
      'Employer personal autorisation de travail distinguished from operation-specific permis de pénétrer; outside surveillance, atmosphere/isolation and rescue arrangements. No universal CATEC mandate inferred.')),
    hot: finding('frHotDetail', ['hotAuthorisation', 'watchCloseout', 'multiEmployerRoles'], source(
      'INRS · ED 6030, Le permis de feu (2019)', 'https://www.inrs.fr/dam/inrs/CataloguePapier/ED/TI-ED-6030-2.pdf',
      'Permis de feu guidance: site/contractor coordination, validity and changed conditions, post-work surveillance (two hours in guide). Not a universal statutory duration.')),
  },
  IT: {
    height: finding('itHeightDetail', ['fallProtectionBasis', 'temporaryProtection', 'fragileSurface'], source(
      'Ministero del Lavoro · Interpello 6/2019, art. 111',
      'https://www.lavoro.gov.it/documenti-e-norme/interpelli/Documents/Interpello-Dlgs-81-08-n-6-2019.pdf',
      'Official interpretation of articles 111/148: collective priority, compensatory protection and restoration, and specific roof/fragile-surface duties. Does not establish the complete current consolidated D.Lgs. 81/2008 text.'),
    'Normattiva current consolidation could not be retrieved; later height-protection amendments and current article wording remain to reconcile.'),
    electrical: finding('itEnergyDetail', ['applicableEdition', 'trainingEvidence', 'pesPavRecognition'], [source(
      'INAIL · Lavori elettrici in bassa tensione (2018)',
      'https://www.inail.it/content/dam/inail-hub-site/documenti/2018/07/LavoriElettriciBassaTensione2018.pdf',
      'PES/PAV competence and employer attribution, separate live-work suitability. Historical technical edition, not confirmation of the latest CEI text.'), source(
      'CEI · CEI 11-27, 2025-10 catalogue and revision summary', 'https://mycatalogo.ceinorme.it/cei/item/0000025437?sso=y',
      'Publisher confirms valid from 2025-11, replaces 2021-09; changed professional roles, supervision definitions, distances and emergency/arc-flash annexes. Only public catalogue/summary reviewed, not purchased full text.', 'publisher-summary')],
    'CEI 11-27:2025 edition existence and revision topics verified; paid full text and applicable corrigenda not compared with INAIL 2018. No automatic qualification from a training certificate.'),
    hot: finding('itHotDetail', ['hotAuthorisation', 'watchCloseout'], source(
      'INAIL · Rischio incendi ed esplosioni in stabilimenti PIR (2022)',
      'https://www.inail.it/content/dam/inail-hub-site/documenti/2022/07/FactSheetRischi%20estate.pdf',
      'Major-accident establishment guidance: work permits in operating plants and final contractor/shift-leader checks for residual ignition. Not a nationwide all-sector hot-work mandate.')),
  },
  ES: {
    height: finding('esHeightDetail', ['fallProtectionBasis', 'temporaryProtection', 'ladderConditions'], source(
      'BOE · RD 1215/1997, anexo II 4.1', 'https://www.boe.es/buscar/act.php?id=BOE-A-1997-17824',
      'Collective priority, conditional ladder/rope routes, access/evacuation and compensatory measures before temporary removal of protection.', 'regulation')),
    confined: finding('esConfinedDetail', ['preventivePresence', 'entryAuthorisation', 'rescueReadiness'], source(
      'INSST · Espacios confinados', 'https://www.insst.es/materias/riesgos/seguridad-en-el-trabajo/espacios-confinados',
      'Written work authorization, recurso preventivo presence and external surveillance/rescue roles; do not automatically combine those roles.')),
    hot: finding('esHotDetail', ['permitCoverage', 'hotAuthorisation', 'countryProcedure'], source(
      'INSST · NTP 562 (2001)',
      'https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/16-serie-ntp-numeros-541-a-575-ano-2001/ntp-562-sistema-de-gestion-preventiva-autorizaciones-de-trabajos-especiales.',
      'Special-work authorization system guidance and example forms. A 2001 technical note is not a current universal statutory permit template.')),
  },
  SA: {
    confined: finding('saOccupationDetail', ['applicableFramework', 'occupationPermitBasis', 'siteProcedure'], sa, saRemaining),
    electrical: finding('saElectricalDetail', ['occupationPermitBasis', 'weldingEquipmentCheck', 'countryProcedure'], [sa, saWelding], saRemaining),
    hot: finding('saHotDetail', ['occupationPermitBasis', 'weldingEquipmentCheck', 'siteProcedure'], [sa, saWelding], saRemaining),
  },
  BR: {
    confined: finding('brPetDetail', ['permitCloseout', 'permitRecord', 'restartReview', 'permitCoverage'], source(
      'MTE · NR-33, sections 33.5.5–33.5.12.1', br + 'nr-33-atualizada-2022-_retificada.pdf',
      'PET per entry, five-year records, closure triggers and shift validity; extension only with all specified conditions, capped at 24 hours including extensions. Continuous vigia/atmosphere and entry checks are not replaced by renewal.', 'regulation')),
    hot: finding('brHotDetail', ['permitRecord', 'restartReview', 'hotAuthorisation', 'watchCloseout'], source(
      'MTE · NR-34, sections 34.4 and 34.5', br + 'nr-34-atualizada-2022.pdf',
      'Naval industry only: PT/record lifecycle, APR/PT for non-designated areas, trained observer when determined by APR, completion ignition inspection; five-year records. Not all-industry requirements.', 'regulation')),
  },
  RU: {
    hot: finding('ruHotDetail', ['applicableEdition', 'hotAuthorisation', 'watchCloseout'], source(
      'МЧС · Огневые работы, official regional notice (2026)', 'https://87.mchs.gov.ru/deyatelnost/press-centr/novosti/5804257',
      'Temporary hot-work authorization and post-work watch in a 2026 notice. Notice says two hours, unlike older four-hour material; current consolidated fire-regime clause must be reconciled.', 'official-notice'),
    'Current consolidated fire-regime amendments and sector exceptions remain unresolved; no automatic duration or expiry from historical checklists or this notice.'),
  },
};
