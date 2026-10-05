import fs from 'node:fs';
import { canonicalForm } from './regional-form-fingerprint.js';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { TASK_SAFETY_LANGUAGES } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { terminologyHash } from './regional-terminology-fingerprint.js';

// Task closure pins complete forms, including the generic permit they extend,
// all ten languages, current-value modes, notices, sources and output renderer.
export function taskFingerprint(id) {
  const [jurisdiction, topic] = id.replace(/^task:/, '').split('.');
  const forms = TASK_SAFETY_LANGUAGES.map(language => canonicalForm(createRegionalTemplate('permit_to_work', {
    jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language), highRiskConstruction: 'yes',
  }, null, { taskTypes: [topic] })));
  return terminologyHash({ forms, renderer: fs.readFileSync('src/components/work/WorkPreview.jsx', 'utf8').replace(/\r\n/g, '\n') });
}
