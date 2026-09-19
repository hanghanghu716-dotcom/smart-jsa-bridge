// Province codes are application identifiers, not Intl/hreflang language tags.
export const CANADIAN_PROVINCES = [
  { code: 'en-CA-AB', label: 'English (Canada — Alberta, AB)' },
  { code: 'en-CA-ON', label: 'English (Canada — Ontario, ON)' },
  { code: 'en-CA-BC', label: 'English (Canada — British Columbia, BC)' },
  { code: 'fr-CA-QC', label: 'Français (Canada — Québec, QC)' },
];
export const LANGUAGE_OPTIONS = [
  { code: 'en-US', label: 'English (US)' },
  ...CANADIAN_PROVINCES,
  { code: 'en-AU', label: 'English (Australia)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'es-ES', label: 'Español' },
  { code: 'ar-SA', label: 'العربية' },
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'ko', label: '한국어' },
];
// Keep generic Canada URLs and existing content available without choosing a province for users.
export const SUPPORTED_LANGS = [...LANGUAGE_OPTIONS.map(({ code }) => code), 'en-CA'];
export const isCanadianProvince = code => CANADIAN_PROVINCES.some(province => province.code === code);
export const normalizeLocale = code => ['en-CA-QC', 'fr-CA'].includes(code) ? 'fr-CA-QC' : code;
export const getLanguageTag = code => normalizeLocale(code) === 'fr-CA-QC' ? 'fr-CA' : (isCanadianProvince(code) ? 'en-CA' : code);
// Provincial hazard/measure datasets have not been supplied yet.
// Reuse existing French hazard/measure translations until a Quebec dataset is provided.
export const getDataLocale = code => normalizeLocale(code) === 'fr-CA-QC' ? 'fr-FR' : getLanguageTag(code);
export const getTranslationFallbacks = code => normalizeLocale(code) === 'fr-CA-QC'
  ? ['fr-FR'] : (isCanadianProvince(code) ? ['en-CA', 'en-US'] : ['en-US']);
export const getSeoLocale = code => code === 'fr-CA' ? 'fr-CA-QC' : code;
export const SEO_LANGUAGES = ['en-US', 'en-CA', 'fr-CA', 'en-AU', 'en-GB', 'de-DE', 'ja-JP', 'fr-FR', 'it-IT', 'es-ES', 'ar-SA', 'pt-BR', 'ru-RU', 'ko'];
export const hasLanguagePrefix = path => SUPPORTED_LANGS.includes(normalizeLocale(path.split(/[/?#]/)[1]));
export function detectLanguage(browserLanguage = '') {
  if (browserLanguage.toLowerCase() === 'fr-ca') return 'fr-CA-QC';
  if (browserLanguage.toLowerCase() === 'en-ca-qc') return 'fr-CA-QC';
  return SUPPORTED_LANGS.find(code => code.toLowerCase() === browserLanguage.toLowerCase())
    || SUPPORTED_LANGS.filter(code => !isCanadianProvince(code)).find(code => code.split('-')[0] === browserLanguage.split('-')[0].toLowerCase())
    || 'en-US';
}
export const getCaseLanguages = code => normalizeLocale(code) === 'fr-CA-QC'
  ? ['fr-CA-QC', 'fr-CA'] : (isCanadianProvince(code) ? [code, 'en-CA'] : [code]);
// Prefer a province-specific article to the common Canadian article for the same group.
export function selectLocalizedCases(rows, code) {
  const selected = new Map();
  for (const row of rows) {
    const key = row.post_group_id || row.id;
    if (!selected.has(key) || row.language_code === code) selected.set(key, row);
  }
  return [...selected.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
