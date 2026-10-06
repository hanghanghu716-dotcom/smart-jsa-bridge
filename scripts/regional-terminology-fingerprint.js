import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { regionalFieldTranslations } from '../src/locales/regionalWorkText.js';
import { TASK_SAFETY_LANGUAGES, TASK_SAFETY_TEXT } from '../src/locales/taskSafetyText.js';
import { regionalTemplates, createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { taskReview, TASK_TYPES } from '../src/utils/regionalTaskReview.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';

const producerPaths = ['src/utils/regionalWorkTemplates.js', 'src/utils/regionalTaskReview.js', 'src/components/work/WorkPreview.jsx'];
// Include actual inline Korean callers, not an assumed Korean translation of
// the English dictionary key. Multiple live Korean variants are all pinned.
export function baseTerminologyText(key, sources = producerPaths.map(path => fs.readFileSync(path, 'utf8'))) {
  if (!regionalFieldTranslations.de[key]) return null;
  const korean = new Set();
  const add = (en, ko) => { if (en === key && /[가-힣]/.test(ko)) korean.add(ko); };
  for (const source of sources) {
    for (const match of source.matchAll(/\btxt\('([^']*)',\s*'([^']*)'\)/g)) add(match[2], match[1]);
    for (const match of source.matchAll(/\['([^']*)',\s*'([^']*)'\]/g)) add(match[2], match[1]);
    for (const match of source.matchAll(/'([^']*)':\s*'([^']*)'/g)) add(match[1], match[2]);
    for (const match of source.matchAll(/\bregionalText\(documentLocale,\s*'([^']*)',\s*'([^']*)'\)/g)) add(match[1], match[2]);
  }
  if (!korean.size) return null; // Retired dictionary entries are not live ten-language closures.
  return Object.fromEntries(TASK_SAFETY_LANGUAGES.map(language => [language,
    language === 'ko' ? [...korean].sort() : language === 'en' ? key : regionalFieldTranslations[language][key],
  ]));
}
export function terminologyText(id) {
  if (id.startsWith('native:')) {
    const [jurisdiction, topic] = id.slice(7).split('.');
    if (!TASK_TYPES.includes(topic)) return null;
    // Pin both the retained native terms and their actual translated label in
    // every document language. A string-presence test is not semantic review.
    return Object.fromEntries(TASK_SAFETY_LANGUAGES.map(language => {
      const context = { jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(locale => locale.split('-')[0] === language) };
      const doc = createRegionalTemplate('permit_to_work', context, null, { taskTypes: [topic] });
      return [language, {
        terms: taskReview(context, topic).terms,
        label: doc.blocks.find(block => block.field?.key === `${topic}.roles`)?.field.label,
      }];
    }));
  }
  if (id.startsWith('task:')) return TASK_SAFETY_TEXT[id.slice(5)];
  if (id.startsWith('base:')) return baseTerminologyText(id.slice(5));
  if (id.startsWith('title:')) {
    const [jurisdiction, kind] = id.slice(6).split('.');
    const titles = TASK_SAFETY_LANGUAGES.map(language => {
      const documentLocale = WORK_DOCUMENT_LANGUAGES.find(locale => locale.split('-')[0] === language);
      const title = regionalTemplates({ jurisdiction, documentLocale, highRiskConstruction: 'yes' }).find(form => form.kind === kind)?.title;
      return [language, title];
    });
    return titles.every(([, title]) => title) ? Object.fromEntries(titles) : null;
  }
  return null;
}
export const terminologyHash = text => createHash('sha256').update(JSON.stringify(text)).digest('hex');
