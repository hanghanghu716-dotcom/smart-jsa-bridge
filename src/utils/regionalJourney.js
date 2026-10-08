import { WORK_JURISDICTIONS, workContext } from './workJurisdiction.js';
import { normalizeLocale } from '../locales/config.js';
import { REGIONAL_CATALOG } from './regionalCatalog.js';
import { defaultPaperSize, normalizePaperSize } from './paperFormat.js';
import { DEFAULT_BLOCKS } from './documentLayout.js';
import { regionalText } from '../locales/regionalWorkText.js';

export function journeyContext(locale, activity = '') {
  const jurisdiction = WORK_JURISDICTIONS.find(j => j.locale === normalizeLocale(locale)) || WORK_JURISDICTIONS.find(j => j.id === 'US');
  return workContext({ jurisdiction: jurisdiction.id, documentLocale: jurisdiction.locale, activity });
}
// Reuse the existing regional catalogue; do not present RAMS/SWMS as a generic JSA.
export function journeyDocumentTitle(context) {
  const profile = REGIONAL_CATALOG[context.jurisdiction];
  const localTitle = profile?.titles.risk_assessment
    || ({ KR: '위험성평가', GB: 'Risk Assessment', AU: 'Risk Assessment', SG: 'Risk Assessment (RA)' })[context.jurisdiction]
    || 'Job Safety Analysis (JSA)';
  const localLanguage = profile?.language || (context.jurisdiction === 'KR' ? 'ko' : 'en');
  return context.documentLocale?.split('-')[0] === localLanguage ? localTitle
    : `${regionalText(context.documentLocale, 'Risk Assessment', '위험성평가')} · ${localTitle}`;
}
export function newJourneyState(value, paperSize = defaultPaperSize(value?.jurisdiction)) {
  const context = workContext(value);
  return {
    formData: { projectName: context.activity, context, saveVisibility: 'private', ppe: [], permits: [] },
    participants: [], procedures: [], analysisData: [],
    docTitle: journeyDocumentTitle(context), paperSize: normalizePaperSize(paperSize),
    documentBlocks: DEFAULT_BLOCKS.map(block => ({ ...block })),
    savedOrientation: 'landscape',
  };
}
export const TASK_GUIDE_LINKS = {
  '01': '/guideline/common#COMMON-01', '02': '/guideline/common#COMMON-02',
  '03': '/guideline/common#COMMON-03', '04': '/guideline/common#COMMON-05',
  '05': '/guideline/common#COMMON-07', '06': '/guideline/common#COMMON-06',
  '07': '/guideline/general#GEN-01', '08': '/guideline/common#COMMON-04',
  '09': '/guideline/chemical#CHEM-02',
};
