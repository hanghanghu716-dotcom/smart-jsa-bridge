import { SUPPORTED_LANGS, getLanguageTag } from '../locales/config.js';

export const PUBLIC_COUNTRIES = ['KR','US','CA','GB','AU','SG','DE','JP','FR','IT','ES','SA','BR','RU'];
export const validCountry = value => PUBLIC_COUNTRIES.includes(value);
export function localeCountry(locale) {
  if (locale === 'ko') return 'KR';
  return SUPPORTED_LANGS.includes(locale) ? locale.split('-')[1] : null;
}
export function documentCountry(context, locale) {
  const country = context?.jurisdiction?.split('-')[0];
  return validCountry(country) ? country : localeCountry(locale);
}
export function exploreCountry(country, locale) {
  return country === 'all' ? null : validCountry(country) ? country : localeCountry(locale);
}
export function countryLabel(country, locale) {
  return validCountry(country) ? new Intl.DisplayNames([getLanguageTag(locale)], { type: 'region' }).of(country) : '—';
}
