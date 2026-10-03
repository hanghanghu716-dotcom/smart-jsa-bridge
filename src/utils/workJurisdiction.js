import { SUPPORTED_LANGS, LANGUAGE_OPTIONS, normalizeLocale, getLanguageTag } from '../locales/config.js';
import { regionalUiTranslations } from '../locales/regionalWorkText.js';
// Work jurisdiction is independent of the language used to navigate the app.
export const WORK_JURISDICTIONS = [
  { id: 'KR', ko: '한국', en: 'South Korea', locale: 'ko' },
  { id: 'GB', ko: '영국', en: 'United Kingdom', locale: 'en-GB' },
  { id: 'AU', ko: '호주', en: 'Australia', locale: 'en-AU' },
  { id: 'SG', ko: '싱가포르', en: 'Singapore', locale: 'en-SG' },
  { id: 'US', locale: 'en-US' },
  { id: 'CA', locale: 'en-CA' },
  { id: 'CA-AB', country: 'CA', subdivision: 'Alberta', locale: 'en-CA-AB' },
  { id: 'CA-ON', country: 'CA', subdivision: 'Ontario', locale: 'en-CA-ON' },
  { id: 'CA-BC', country: 'CA', subdivision: 'British Columbia', locale: 'en-CA-BC' },
  { id: 'CA-QC', country: 'CA', subdivision: 'Québec', locale: 'fr-CA-QC' },
  { id: 'DE', locale: 'de-DE' }, { id: 'JP', locale: 'ja-JP' }, { id: 'FR', locale: 'fr-FR' },
  { id: 'IT', locale: 'it-IT' }, { id: 'ES', locale: 'es-ES' }, { id: 'SA', locale: 'ar-SA' },
  { id: 'BR', locale: 'pt-BR' }, { id: 'RU', locale: 'ru-RU' },
];
export const WORK_DOCUMENT_LANGUAGES = [...SUPPORTED_LANGS];
export function jurisdictionLabel(j, locale = 'en-US') {
  const name = new Intl.DisplayNames([getLanguageTag(locale)], { type: 'region' }).of(j.country || j.id);
  return [name, j.subdivision].filter(Boolean).join(' — ');
}
export function documentLanguageLabel(code) {
  return LANGUAGE_OPTIONS.find(l => l.code === code)?.label || 'English (Canada)';
}
export function documentDirection(locale) { return locale?.startsWith('ar') ? 'rtl' : 'ltr'; }
export function workContext(value = {}) {
  value = value && typeof value === 'object' ? value : {};
  return {
    schemaVersion: 1,
    jurisdiction: WORK_JURISDICTIONS.some(j => j.id === value.jurisdiction) ? value.jurisdiction : '',
    region: String(value.region || '').slice(0, 100),
    documentLocale: WORK_DOCUMENT_LANGUAGES.includes(normalizeLocale(value.documentLocale)) ? normalizeLocale(value.documentLocale) : '',
    industry: String(value.industry || '').slice(0, 100),
    activity: String(value.activity || '').slice(0, 200),
    highRiskConstruction: ['yes', 'no', 'unknown'].includes(value.highRiskConstruction) ? value.highRiskConstruction : 'unknown',
  };
}
export function sameWorkContext(a, b) {
  return JSON.stringify(workContext(a)) === JSON.stringify(workContext(b));
}
export function workContextUi(locale = 'en-US') {
  const translated = regionalUiTranslations[locale.split('-')[0]];
  if (translated) return translated;
  return locale.startsWith('ko') ? {
    title: '작업 국가와 문서 언어', country: '작업 국가', region: '주·지역', language: '출력 문서 언어',
    unspecified: '선택 안 함 · 기존 범용 양식', chooseLanguage: '문서 언어 선택', industry: '산업', activity: '작업 종류',
    help: '화면 언어와 별도로 저장합니다. 국가나 언어를 바꿔도 이미 추가한 문서는 변경되지 않습니다.',
    highRisk: '호주 고위험 건설작업 해당 여부', yes: '해당', no: '해당하지 않음', unknown: '확인 필요',
    catalog: '국가별 기본 양식', source: '내용을 가져올 JSA', blank: '빈 양식으로 시작', addPack: '기본 서류 묶음 추가',
    draft: '현장 검토용 초안입니다. 주·지역 규정과 현장 절차를 확인해 작성하세요. JSA를 연결하면 작업내용·위험요인·대책만 가져옵니다.',
    swms: 'SWMS는 고위험 건설작업용입니다. 해당 여부를 확인한 뒤 추가하세요. 해당하지 않는 작업은 위험성평가·점검표 등을 선택할 수 있습니다.',
    sources: '작성 참고 출처', review: '가져온 내용을 이번 현장에 맞게 검토했습니다', reviewNeeded: '국가별 문서의 내용 검토를 완료해주세요.',
    mismatch: '묶음 설정과 다른 국가·언어·작업 조건으로 만든 문서가 있습니다. 필요한 문서를 다시 추가하고 기존 문서는 제외하거나 제거해주세요.',
    retained: '이 문서는 생성 당시 국가·언어와 양식 버전을 유지합니다.', version: '양식 버전', empty: '작업 국가와 문서 언어를 선택하면 기본 양식이 표시됩니다.',
  } : {
    title: 'Work jurisdiction and document language', country: 'Work country', region: 'State / region', language: 'Document language',
    unspecified: 'Unspecified · existing generic forms', chooseLanguage: 'Choose document language', industry: 'Industry', activity: 'Work activity',
    help: 'Saved independently of the screen language. Changing these settings does not rewrite documents already added.',
    highRisk: 'Australian high risk construction work', yes: 'Yes', no: 'No', unknown: 'Needs confirmation',
    catalog: 'Regional starter forms', source: 'JSA to reuse', blank: 'Start with blank forms', addPack: 'Add starter document pack',
    draft: 'Drafts for site review. Check state or regional rules and site procedures. A linked JSA supplies only work descriptions, hazards and controls.',
    swms: 'SWMS is for high risk construction work. Confirm applicability before adding it. For other work, select risk assessment and inspection forms as appropriate.',
    sources: 'Reference guidance', review: 'I have reviewed the imported content for this worksite', reviewNeeded: 'Review the regional documents before output.',
    mismatch: 'Some documents were created for different country, language or work settings. Add the appropriate forms and exclude or remove the previous ones.',
    retained: 'This document retains its original jurisdiction, language and template version.', version: 'Template version', empty: 'Choose a work country and document language to see starter forms.',
  };
}
