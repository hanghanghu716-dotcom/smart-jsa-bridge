import { rankedAutoTags } from './TagDictionary.js';
import { publicTagLabel } from '../locales/publicTagLabels.js';

const text = value => typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
export function excerptText(value, max = 300) {
  const source = text(value);
  if ([...source].length <= max) return source;
  const head = [...source].slice(0, max).join('');
  const boundary = head.lastIndexOf(' ');
  return (boundary > max * .65 ? head.slice(0, boundary) : head) + '…';
}

// Extract authored text, never invent a failure scenario or a completed check.
export function exploreExcerpt(row) {
  const steps = Array.isArray(row?.analysis_data) ? row.analysis_data : [];
  return excerptText(text(row?.publication_context?.scope)
    || steps.map(step => text(step?.proc?.stepDetail)).find(Boolean)
    || steps.slice(0, 3).map(step => text(step?.proc?.stepTitle)).filter(Boolean).join(' · '));
}

// Labelled quotations from the first documented hazard/control pair. This is
// not a generated summary, a severity ranking or proof of implementation.
export function exploreEvidence(row) {
 const risks=(Array.isArray(row?.analysis_data)?row.analysis_data:[]).flatMap(step=>Array.isArray(step?.risks)?step.risks:[]);
 const risk=risks.find(r=>text(r?.factor));
 if(!risk)return [];
 return [['risk',risk.factor],['controls',risk.current_measure||risk.measure||risk.recommend_measure]]
   .filter(([,value])=>text(value)).map(([key,value])=>({key,text:excerptText(value,170)}));
}

export function exploreCardTags(row, locale, limit = 5) {
  const saved = new Set(Array.isArray(row?.tags) ? row.tags : []);
  const sourceLocale = row?.public_locale || locale;
  return rankedAutoTags(row?.title, row?.analysis_data, {
    locale: sourceLocale, translateTag: tag => publicTagLabel(tag, sourceLocale),
  }).filter(item => saved.has(item.tag)).map(item => ({ ...item, label: publicTagLabel(item.tag, locale) }))
    .filter(item => item.label).slice(0, limit);
}
