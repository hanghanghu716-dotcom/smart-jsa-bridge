import fs from 'node:fs';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { TASK_SAFETY_LANGUAGES } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { terminologyHash } from './regional-terminology-fingerprint.js';

// Pin the complete generated form and renderer, including non-reviewed-language
// fallback, value modes, reference scope and table data. Random IDs are irrelevant.
export function canonicalForm(doc) {
  const columns = new Map(doc.blocks.flatMap(b => (b.columns || []).map(c => [c.id, c.key])));
  const walk = value => Array.isArray(value) ? value.map(walk)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value)
      .filter(([key]) => key !== 'id').map(([key, child]) => [columns.get(key) || key, walk(child)])) : value;
  return walk(doc);
}
export function formFingerprint(id) {
  const [jurisdiction, kind] = id.replace(/^form:/, '').split('.');
  const forms = TASK_SAFETY_LANGUAGES.map(language => canonicalForm(createRegionalTemplate(kind, {
    jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language), highRiskConstruction: 'yes',
  })));
  return terminologyHash({ forms, renderer: fs.readFileSync('src/components/work/WorkPreview.jsx', 'utf8').replace(/\r\n/g, '\n') });
}
