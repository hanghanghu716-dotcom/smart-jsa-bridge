import { taskSafetyText } from '../locales/taskSafetyText.js';
import { requirementReview } from './regionalRequirementReview.js';

export const TASK_REVIEW_VERSION = '2026-10-05.5';
export const TASK_TYPES = ['height', 'confined', 'electrical', 'hot'];
// These are evidence-linked prompts, not a decision engine or statutory permit replicas.
// Scope and outstanding checks travel with the saved form and output snapshot.
const ref = (title, url, scope, basis = 'official-guidance') => ({ title, url, scope, basis });
const kr = ref('안전보건규칙 · 추락 / 화재위험 / 전기 / 밀폐공간', 'https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260302&joBrNo=00&joNo=0301&lsiSeq=273603&urlMode=lsInfoP', '2026-03-02 edition; activity-specific articles and exceptions must be selected', 'regulation');
const ca = {
  height: ref('CCOHS · Fall protection plan', 'https://www.ccohs.ca/oshanswers/hsprograms/fall/fall_protection_general.html', 'General Canadian guidance; provincial thresholds differ'),
  confined: ref('CCOHS · Confined space entry', 'https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html', 'General guidance; not a single nationwide permit rule'),
  electrical: ref('CCOHS · Lockout/Tag out', 'https://www.ccohs.ca/oshanswers/hsprograms/lockout.html', 'Hazardous-energy control guidance; electrical qualifications depend on jurisdiction'),
  hot: ref('CCOHS · Welding / Hot work', 'https://www.ccohs.ca/oshanswers/safety_haz/welding/hotwork.html', 'Guidance; referenced fire standards are not universal statutory watch durations'),
};
const sa = ref('HRSD · دليل مخاطر السلامة والصحة المهنية', 'https://www.hrsd.gov.sa/en/node/1171944', 'Ministry guidance; sector, licence and client-specific mandatory conditions not fully verified');
const jp = ref('厚生労働省 · 労働安全衛生規則', 'https://www.mhlw.go.jp/web/t_doc?dataId=74003000&dataType=0', 'Activity-specific electrical, fire and fall prevention provisions', 'regulation');
const brRoot = 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/';
export const TASK_REVIEW_SOURCES = {
  KR: Object.fromEntries(TASK_TYPES.map(t => [t, [kr]])),
  GB: {
    height: [ref('HSE · Work at height', 'https://www.hse.gov.uk/work-at-height/introduction.htm', 'Great Britain; avoid/prevent/minimise, no universal minimum safe height')],
    confined: [ref('HSE · Confined spaces', 'https://www.hse.gov.uk/confinedspace/', 'Great Britain; avoid entry, safe system and planned rescue')],
    electrical: [ref('HSE · HSG85', 'https://www.hse.gov.uk/pubns/books/hsg85.htm', 'Great Britain; safe electrical working practices')],
    hot: [ref('HSE · Welding risks', 'https://www.hse.gov.uk/welding/other-welding-risks.htm', 'Welding and ignition risks; site-specific permit controls')],
  },
  AU: {
    height: [ref('SWA · Managing risk of falls', 'https://www.safeworkaustralia.gov.au/sites/default/files/2022-10/Model%20Code%20of%20Practice%20-%20Managing%20the%20Risk%20of%20Falls%20at%20Workplaces%2021102022_0.pdf', 'Model code; adoption differs by state/territory', 'model-code')],
    confined: [ref('SWA · Confined spaces', 'https://www.safeworkaustralia.gov.au/doc/model-code-practice-confined-spaces', 'Model code; local legislation and entry permit system apply', 'model-code')],
    electrical: [ref('SWA · Managing electrical risks', 'https://www.safeworkaustralia.gov.au/doc/model-code-practice-managing-electrical-risks-workplace', 'Model code; licensing and local adoption must be checked', 'model-code')],
    hot: [ref('SWA · Welding processes', 'https://www.safeworkaustralia.gov.au/system/files/documents/1901/code_of_practice_-_welding_processes_0.pdf', 'Model welding guidance; not a nationwide permit statute', 'model-code')],
  },
  SG: {
    height: [ref('MOM · WAH amendment factsheet', 'https://www.mom.gov.sg/-/media/mom/documents/safety-health/factsheet-on-wahamendmentregulations.pdf', 'PTW: factories, hazardous WAH over 3 m, effective-protection exceptions; general fall duties remain')],
    confined: [ref('WSHC · Technical advisory on confined spaces', 'https://www.tal.sg/wshc/-/media/tal/wshc/resources/publications/technical-advisories/files/cs2.ashx', 'Entry permit, atmosphere assessment, attendant and rescue; statutory procedure remains separate')],
    electrical: [ref('WSHC · Marine industries manual', 'https://www.tal.sg/wshc/-/media/tal/wshc/resources/publications/wsh-guidelines/files/wsh_manual_for_marine_industries.ashx', 'Marine industry guidance, not all-sector electrical licensing rules')],
    hot: [ref('WSHC · Marine industries manual', 'https://www.tal.sg/wshc/-/media/tal/wshc/resources/publications/wsh-guidelines/files/wsh_manual_for_marine_industries.ashx', 'Marine hot-work guidance; do not generalise sector permit duties')],
  },
  CA: Object.fromEntries(TASK_TYPES.map(t => [t, [ca[t]]])),
  'CA-AB': { ...Object.fromEntries(TASK_TYPES.map(t => [t, [ca[t]]])), confined: [ref('Alberta OHS Code · Part 5', 'https://search-ohs-laws.alberta.ca/legislation/occupational-health-and-safety-code/part-5-confined-spaces/', 'Confined/restricted space distinction; s47 entry permit and s56 tending worker', 'regulation')] },
  'CA-ON': { ...Object.fromEntries(TASK_TYPES.map(t => [t, [ca[t]]])), confined: [ca.confined, ref('Ontario · Entry permit', 'https://www.ontario.ca/document/guideline-working-confined-spaces/entry-permit', 'Ontario entry-permit guidance; full page access restricted during this review')] },
  'CA-BC': { ...Object.fromEntries(TASK_TYPES.map(t => [t, [ca[t]]])), confined: [ref('WorkSafeBC · Part 9', 'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-09-confined-spaces', '9.13 permit triggers; 9.15 reauthorisation; standby role depends on atmosphere hazards', 'regulation')] },
  'CA-QC': { ...Object.fromEntries(TASK_TYPES.map(t => [t, [ca[t]]])),
    confined: [ref('CNESST · Espaces clos', 'https://www.cnesst.gouv.qc.ca/fr/prevention-securite/identifier-corriger-risques/liste-informations-prevention/espaces-clos', 'Québec RSST guidance; entry eligibility, safe methods and rescue')],
    electrical: [ref('CNESST · Installations électriques', 'https://www.cnesst.gouv.qc.ca/fr/prevention-securite/identifier-corriger-risques/liste-informations-prevention/travail-sur-installations-electriques', 'Cadenassage and construction electrical safety guidance')],
  },
  US: {
    height: [ref('OSHA · Fall protection', 'https://www.osha.gov/fall-protection', 'General industry/construction/shipyard thresholds and exceptions differ')],
    confined: [ref('OSHA · 29 CFR 1910.146', 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146', 'General industry only; agriculture, construction and shipyards excluded', 'regulation')],
    electrical: [ref('OSHA · 29 CFR 1910.333', 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.333', 'General-industry electrical work; verification by qualified persons', 'regulation')],
    hot: [ref('OSHA · 29 CFR 1910.252', 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.252', 'General-industry welding/cutting; fire-watch conditions and post-work monitoring', 'regulation')],
  },
  DE: {
    height: [ref('DGUV · 112-198', 'https://publikationen.dguv.de/widgets/pdf/download/article/1013', 'Personal fall protection; not a substitute for higher-order prevention')],
    confined: [ref('DGUV · Behälter, Silos und enge Räume', 'https://www.dguv.de/fb-rci/sachgebiete/behaelter/index.jsp', 'DGUV 113-004, Erlaubnisschein and qualified Freimessen roles')],
    electrical: [ref('DGUV · Fünf Sicherheitsregeln', 'https://publikationen.dguv.de/widgets/pdf/download/article/5231', 'Five safety rules and residual energy; installation-specific exceptions')],
    hot: [ref('DGUV · Lichtbogenschweißen 209-010', 'https://publikationen.dguv.de/widgets/pdf/download/article/318', 'Welding permits under fire/explosion hazards and fire-watch controls')],
  },
  JP: { height: [jp], electrical: [jp], hot: [jp], confined: [ref('厚生労働省 · 酸素欠乏症等防止規則', 'https://www.mhlw.go.jp/web/t_doc?dataId=74105000&dataType=0&pageNo=1', 'Oxygen-deficiency work classifications, measurements, operations chief and monitoring', 'regulation')] },
  FR: {
    height: [ref('INRS · Chutes de hauteur', 'https://www.inrs.fr/risques/chutes-hauteur/ce-qu-il-faut-retenir.html', 'Collective prevention before personal fall protection')],
    confined: [ref('INRS · Espaces confinés', 'https://www.inrs.fr/risques/espaces-confines/prevenir-risques', 'Permis de pénétrer, surveillance, isolation and rescue; sector-specific training')],
    electrical: [ref('INRS · Habilitation électrique', 'https://www.inrs.fr/risques/electriques/habilitation-electrique', 'Employer-issued habilitation; training alone is not the authorisation')],
    hot: [ref('INRS · Permis de feu ED 6030', 'https://www.inrs.fr/media.html?refINRS=ED+6030', 'Hot-work permit guidance, not a universal statutory duration')],
  },
  IT: {
    height: [ref('INAIL · Parapetti e reti', 'https://www.inail.it/portale/ricerca-e-tecnologia/it/ambiti-di-ricerca/area-sicurezza-sul-lavoro/cantieristica/parapetti-provvisori-e-reti-di-sicurezza.html?all=true', 'Collective fall protection; task and equipment applicability')],
    confined: [ref('INAIL · Ambienti confinati', 'https://www.inail.it/portale/it/inail-comunica/news/notizia.2021.05.ambienti-confinati-dall-inail-tre-fact-sheet-su-normativa-ricerca-e-formazione.html', 'DPR 177/2011 company qualification and coordinated procedures')],
    electrical: [ref('INAIL · Lavori elettrici in bassa tensione', 'https://www.inail.it/content/dam/inail-hub-site/documenti/2018/07/LavoriElettriciBassaTensione2018.pdf', 'PES/PAV, task authorisation; separate live-work suitability')],
    hot: [ref('INAIL · Sicurezza antincendio nei luoghi di lavoro', 'https://www.inail.it/content/dam/inail-hub-site/documenti/2022/07/Documento%20Tecnico%20Progettazione%20della%20sicurezza%20antincendio%20nei%20luoghi%20di%20lavoro.pdf', 'Workplace fire prevention; pre-work survey and post-work inspection')],
  },
  ES: {
    height: [ref('INSST · NTP 1205', 'https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/37-serie-ntp-numeros-1191-a-1214-ano-2024/ntp-1205-sistemas-de-proteccion-individual-contra-caidas-sistemas-de-retencion-2024', 'Restraint versus fall arrest; collective prevention first')],
    confined: [ref('INSST · Espacios confinados', 'https://www.insst.es/materias/riesgos/seguridad-en-el-trabajo/espacios-confinados', 'Written authorisation, recurso preventivo, entrants and rescue')],
    electrical: [ref('BOE · RD 614/2001', 'https://boe.es/buscar/act.php?id=BOE-A-2001-11881', 'Anexo II: suppression/restoration of voltage; authorised/qualified roles', 'regulation')],
    hot: [ref('INSST · NTP 562', 'https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/16-serie-ntp-numeros-541-a-575-ano-2001/ntp-562-sistema-de-gestion-preventiva-autorizaciones-de-trabajos-especiales.', 'Special-work authorisation guidance; not a prescribed legal form')],
  },
  SA: Object.fromEntries(TASK_TYPES.map(t => [t, [sa]])),
  BR: {
    height: [ref('MTE · NR-35', brRoot + 'normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-35-nr-35', 'Publication hub; 2026 training/ladder provisions are covered by the dated requirement supplement; site transition applicability is not automatically determined')],
    confined: [ref('MTE · NR-33', brRoot + 'arquivos/normas-regulamentadoras/nr-33-atualizada-2022-_retificada.pdf', 'PET, supervisor de entrada, vigia and authorised entrants', 'regulation')],
    electrical: [ref('MTE · NR-10', brRoot + 'arquivos/normas-regulamentadoras/nr-10.pdf', 'Desenergização, qualification, authorisation and re-energisation sequence', 'regulation')],
    hot: [ref('MTE · NR-34', brRoot + 'normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-34-nr-34', 'Shipbuilding/repair/dismantling only; not all-industry hot-work requirements')],
  },
  RU: {
    height: [ref('Минтруд · 782н, исходная публикация', 'https://mintrud.gov.ru/docs/mintrud/orders/1822', 'Original publication; subsequent amendments not fully reconciled', 'historical-publication')],
    confined: [ref('Минтруд · 902н, исходная публикация', 'https://mintrud.gov.ru/docs/mintrud/orders/1810', 'Original publication; subsequent amendments not fully reconciled', 'historical-publication')],
    electrical: [ref('Минтруд · 903н, исходная публикация', 'https://mintrud.gov.ru/docs/mintrud/orders/1816', 'Original publication; subsequent amendments not fully reconciled', 'historical-publication')],
    hot: [ref('МЧС · Огневые работы, контрольный лист', 'https://61.mchs.gov.ru/uploads/resource/2021-12-28/proverochnye-listy_16406795191252316447.pdf', 'Historical inspection checklist; current fire regime/amendments remain to verify', 'historical-publication')],
  },
};

// Native terms from the references stay visible alongside translated field labels.
// No assumed numeric permit threshold, gas limit, validity or competence is prefilled.
export const TASK_LOCAL_TERMS = {
  KR: { confined: '밀폐공간 작업 프로그램 · 산소 및 유해가스 측정 · 감시인', electrical: '정전전로 작업 · 검전 · 잠금·표지', hot: '화재위험작업 · 화재감시자', height: '추락 방지 · 작업발판 · 안전대 부착설비' },
  GB: { confined: 'Safe system of work · emergency arrangements', electrical: 'Safe isolation · competent person', hot: 'Hot-work permit · fire watch', height: 'Avoid / prevent / minimise · collective protection' },
  AU: { confined: 'Confined space entry permit · stand-by person', electrical: 'De-energised electrical work · licensed/competent person', hot: 'Hot work · fire watch', height: 'Fall prevention · SWMS (high risk construction work)' },
  SG: { confined: 'Confined space entry permit · confined space safety assessor · authorised manager · attendant', height: 'Factory / hazardous WAH applicability · WAH safety assessor · authorised manager', electrical: 'Licensed Electrical Worker (LEW) · Electrician / Electrical Technician / Electrical Engineer', hot: 'Marine PTW · safety assessor · ship repair manager' },
  US: { confined: 'Permit-required confined space · authorized entrant · attendant · entry supervisor', electrical: 'Qualified person · de-energization verification', hot: 'Fire watch · post-work monitoring', height: 'General industry / construction / shipyard classification' },
  CA: { confined: 'Entry permit · attendant · jurisdiction-specific procedure', electrical: 'Lockout/Tag out', height: 'Fall protection plan · rescue plan', hot: 'Hot-work permit · fire watch' },
  'CA-AB': { confined: 'Confined / restricted space · entry permit · tending worker', height: 'Fall protection plan · section 140', electrical: 'Control of hazardous energy · personal lock', hot: 'Hot work in hazardous locations · section 169' },
  'CA-ON': { confined: 'Entry permit · attendant · on-site rescue', height: 'Construction projects · rescue procedures · working at heights training', electrical: 'Construction / industrial establishments · lockout verification', hot: 'Fire Code · hot surface applications · container precautions' },
  'CA-BC': { confined: 'Responsible supervisor · standby person · 9.13 permit triggers / 9.15 reauthorisation', height: 'Fall protection plan · section 11.3', electrical: 'Personal lockout · group lockout · qualified worker', hot: 'Welding containers · qualified atmosphere testing' },
  'CA-QC': { confined: 'Espace clos · surveillant · plan de sauvetage', electrical: 'Cadenassage · contrôle des énergies', height: 'Plan de protection contre les chutes · plan de sauvetage', hot: 'Travaux à chaud · surveillance incendie' },
  DE: { confined: 'Erlaubnisschein · Aufsichtführende · Sicherungsposten · Freimessen', electrical: 'Elektrofachkraft · fünf Sicherheitsregeln', hot: 'Schweißerlaubnisschein · Brandposten während der Arbeit · Brandwache nach der Arbeit', height: 'Rückhaltesystem / Auffangsystem · Rettungskonzept' },
  JP: { confined: '酸素欠乏危険作業 / 酸素欠乏・硫化水素危険作業 · 作業主任者 · 監視人', electrical: '停電作業 · 作業指揮者 · 検電 · 短絡接地', hot: '溶接・溶断 · 火気使用', height: '要求性能墜落制止用器具 · 作業床 · 開口部' },
  FR: { confined: 'Autorisation individuelle de travail · permis de pénétrer · surveillant · secours', electrical: 'Habilitation électrique · consignation · vérification d’absence de tension', hot: 'Permis de feu · surveillance après travaux', height: 'Protection collective · retenue / arrêt des chutes' },
  IT: { confined: 'DPR 177/2011 · qualificazione delle imprese · rappresentante del committente', electrical: 'PES / PAV · idoneità ai lavori sotto tensione (se applicabile)', height: 'Lavori in quota · protezione collettiva', hot: 'Lavori a caldo' },
  ES: { confined: 'Autorización de trabajo · recurso preventivo · vigilancia exterior', electrical: 'Trabajador autorizado / cualificado · supresión de la tensión', hot: 'Autorización de trabajos en caliente', height: 'Protección colectiva · sistema de retención / anticaídas' },
  SA: { confined: 'الأماكن المحصورة · مراقب خارجي · خطة الإنقاذ', electrical: 'العزل الكهربائي · القفل ووضع البطاقات', hot: 'الأعمال الساخنة · مراقب الحريق', height: 'العمل على ارتفاع · منع السقوط' },
  BR: { confined: 'PET · supervisor de entrada · vigia · trabalhador autorizado', electrical: 'NR-10 · qualificação / habilitação / capacitação / autorização', hot: 'Trabalho a quente · NR-34 (indústria naval)', height: 'NR-35 · AR · PT (atividade não rotineira)' },
  RU: { confined: 'ОЗП · наряд-допуск · наблюдающий', electrical: 'Группа по электробезопасности · допускающий', hot: 'Огневые работы · наряд-допуск', height: 'Работы на высоте · наряд-допуск' },
};
export function taskLabel(context, topic, locale = context.documentLocale) {
  const key = context.jurisdiction === 'CA-QC' && topic === 'confined' ? 'qcConfined'
    : context.jurisdiction === 'CA-QC' && topic === 'electrical' ? 'qcElectrical' : topic;
  return taskSafetyText(locale, key);
}
export function taskReview(context, topic) {
  if (!TASK_TYPES.includes(topic) || !TASK_REVIEW_SOURCES[context.jurisdiction]) throw Error('WORK_TASK_REVIEW_UNAVAILABLE');
  const jurisdiction = context.jurisdiction;
  const requirements = requirementReview(jurisdiction, topic);
  const sources = [...new Map([
    ...TASK_REVIEW_SOURCES[jurisdiction][topic], ...(requirements?.sources || []),
  ].map(s => [s.url, s])).values()];
  const unresolved = requirements?.partial || jurisdiction === 'RU' || jurisdiction === 'SA' || !sources.length
    || (jurisdiction === 'BR' && topic === 'height') || (jurisdiction === 'CA-QC' && topic === 'confined');
  return {
    topic, jurisdiction, version: TASK_REVIEW_VERSION, checkedAt: '2026-10-03',
    status: unresolved ? 'partial-source-review' : 'scoped-source-review',
    legalApplicability: 'site-and-sector-review-required',
    scopeNotes: [
      ...(jurisdiction === 'US' ? ['usScope'] : []),
      ...(jurisdiction === 'GB' ? ['gbScope'] : []),
      ...(jurisdiction === 'AU' ? ['auScope'] : []),
      ...(jurisdiction.startsWith('CA') ? ['caScope'] : []),
      ...(jurisdiction === 'SG' && topic === 'height' ? ['sgHeightScope'] : []),
      ...((jurisdiction === 'SG' && topic === 'hot') || (jurisdiction === 'BR' && topic === 'hot') ? ['marineScope'] : []),
      ...(topic === 'electrical' ? ['deadScope'] : []),
    ],
    terms: TASK_LOCAL_TERMS[jurisdiction]?.[topic] || TASK_LOCAL_TERMS.CA[topic],
    sources: structuredClone(sources),
    // Keep the original source-review date above. A dated supplement is not
    // evidence that every topic/exception was rechecked on the newer date.
    ...(requirements ? { requirements } : {}),
  };
}

const checks = {
  height: ['avoidHeight', 'fallSystem', 'access', 'weather', 'rescue'],
  confined: ['space', 'entryRoles', 'atmosphere', 'isolation', 'ventilation', 'rescue', 'entryLog'],
  electrical: ['circuit', 'disconnect', 'proveDead', 'earthBarrier', 'restore'],
  hot: ['combustibles', 'fireWatch', 'gasFumes', 'cylinders'],
};
export function taskReviewBlocks(context, topics, { field, table, col, txt }) {
  const selected = TASK_TYPES.filter(t => Array.isArray(topics) && topics.includes(t));
  const reviews = selected.map(t => taskReview(context, t));
  const t = key => taskSafetyText(context.documentLocale, key);
  const blocks = reviews.flatMap(review => {
    const topic = review.topic, title = taskLabel(context, topic);
    const f = (key, kind = 'verification') => field(`${topic}.${key}`, `${title} · ${t(review.requirements?.fieldLabels?.[key] || key)}`, kind);
    const items = [field(`${topic}.notice`, `${title} · ${t('notice')}`, 'text', 'standard',
      [t('scopeNote'), ...review.scopeNotes.map(t), ...(review.status === 'partial-source-review' ? [t('pending')] : []),
        ...(review.requirements ? [review.requirements.noteKey, ...(review.requirements.additionalNotes || [])].map(t) : [])].join('\n')),
      f('applicability'), field(`${topic}.roles`, `${title} · ${t('roles')} — ${review.terms}`, 'worker'), f('competence'),
      ...checks[topic].map(key => f(key, key === 'entryRoles' ? 'worker' : 'verification')),
      ...(review.requirements?.fields || []).map(key => f(key, key === 'entryAuthorisation' ? 'worker' : 'verification')),
      f('stop')];
    if (['confined', 'electrical', 'hot'].includes(topic)) {
      items.push(f('instrument'), table(`${title} · ${t('record')}`, [
        col('item', txt('측정항목·위치', 'Test / location'), 'text', 'runtime'),
        col('criteria', t('criteria'), 'verification', 'runtime'),
        col('reading', txt('실측값·단위', 'Reading / unit'), 'measurement', 'runtime'),
        col('time', txt('측정시각', 'Test time'), 'measuredAt', 'runtime'),
        col('tester', txt('측정자', 'Tester'), 'measuredBy', 'runtime'),
      ], [{}, {}, {}]));
    }
    // Only reference titles are reusable, never pass/fail values or historical measurements.
    if (review.sources.length) items.push(field(`${topic}.references`, `${title} · ${t('references')}`, 'text', 'standard', review.sources.map(s => s.title).join('\n')));
    return items;
  });
  return { blocks, reviews };
}
