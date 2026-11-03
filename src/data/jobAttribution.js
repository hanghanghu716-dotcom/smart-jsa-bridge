// Display alongside every reused listing, including the homepage and initial HTML.
// Source text is not translated; these notes describe our selection of metadata.
export const JOB_ATTRIBUTION = {
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
