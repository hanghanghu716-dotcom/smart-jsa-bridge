import { LANGUAGE_OPTIONS, SUPPORTED_LANGS, getLanguageTag } from '../locales/config.js';
import { casePath } from './caseRouting.js';

const labels = { ko:'다른 언어로 읽기', en:'Read in another language', de:'In einer anderen Sprache lesen', ja:'他の言語で読む', fr:'Lire dans une autre langue', it:'Leggi in un’altra lingua', es:'Leer en otro idioma', ar:'القراءة بلغة أخرى', pt:'Ler em outro idioma', ru:'Читать на другом языке', ro:'Citiți în altă limbă' };
export const caseLanguageLabel = locale => labels[locale?.split('-')[0]] || labels.en;
export function caseLanguageOptions(locales, slug) {
  const actual = new Set((locales || []).filter(code => SUPPORTED_LANGS.includes(code)));
  return [...LANGUAGE_OPTIONS, { code:'en-CA', label:'English (Canada)' }]
    .filter(option => actual.has(option.code))
    .map(option => ({ ...option, href:casePath(option.code,slug), lang:getLanguageTag(option.code) }));
}
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
// Initial HTML and React use the same real sibling records, never inferred fallbacks.
export function renderCaseLanguages(locales, locale, slug) {
  const options = caseLanguageOptions(locales, slug);
  if (options.length < 2) return '';
  const selected = options.find(option => option.code === locale);
  return '<details class="case-language-switch"><summary><span aria-hidden="true">◎</span> '+escape(caseLanguageLabel(locale))+' · <span lang="'+escape(getLanguageTag(locale))+'">'+escape(selected?.label || locale)+'</span></summary><nav aria-label="'+escape(caseLanguageLabel(locale))+'">'+options.map(option => '<a href="'+escape(option.href)+'" lang="'+escape(option.lang)+'" hreflang="'+escape(option.lang)+'"'+(option.code===locale?' aria-current="page"':'')+'>'+escape(option.label)+'</a>').join('')+'</nav></details>';
}
