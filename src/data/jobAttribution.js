// Display alongside every reused listing, including the homepage and initial HTML.
// Source text is not translated; these notes describe our selection of metadata.
export const JOB_ATTRIBUTION = {
  usajobssg: {
    credit:'Source: USAJOBS · U.S. federal agencies',
    note:'Selected listing fields. Standing recruitment notices may not represent a current vacancy or guarantee placement in Singapore. U.S. citizenship or other hiring restrictions may apply; check the original announcement. Smart JSA Bridge is not operated, sponsored or endorsed by OPM.',
    license:'USAJOBS public-data terms', url:'https://developer.usajobs.gov/apirequest/index',
  },
  mhlwjobs: {
    credit:'出典：厚生労働省ホームページ（各公募の原文リンク）',
    note:'厚生労働省の安全・化学物質関連の公募を選び、Smart JSA Bridgeが掲載項目を抽出・整理しています。全国の求人一覧ではありません。応募資格・必着時刻は原文をご確認ください。政府による推奨を意味しません。',
    license:'PDL1.0・利用条件', url:'https://www.mhlw.go.jp/chosakuken/index.html',
  },
  qldsmartjobs: {
    credit:'© The State of Queensland · Smart jobs and careers',
    note:'Queensland public-sector roles only. Selected listing fields; no government endorsement.',
    license:'CC BY 4.0', url:'https://creativecommons.org/licenses/by/4.0/',
  },
  jcyljobs: {
    credit:'Junta de Castilla y León · Datos abiertos',
    note:'Convocatorias de Castilla y León. Selección de campos; no es un listado nacional. Sin respaldo oficial.',
    license:'CC BY 4.0', url:'https://creativecommons.org/licenses/by/4.0/deed.es',
  },
  trudvsem: {
    credit:'Роструд · «Работа России»',
    note:'Выборка открытых вакансий по охране труда. Без официального одобрения. Срок подачи уточняйте в первоисточнике.',
    license:'Условия использования открытых данных', url:'https://trudvsem.ru/opendata/datasets',
  },
};
export const jobAttribution = id => Object.hasOwn(JOB_ATTRIBUTION,id || '') ? JOB_ATTRIBUTION[id] : null;
export const jobCoverage = locale => locale==='en-SG'
  ? 'Coverage: safety-related U.S. federal agency announcements that list a Singapore work location. This is a limited source, not Singapore government or nationwide recruitment. Standing recruitment notices may not represent a current vacancy or guarantee placement in Singapore. U.S. citizenship or other hiring restrictions may apply; check the original announcement.'
  : '';
