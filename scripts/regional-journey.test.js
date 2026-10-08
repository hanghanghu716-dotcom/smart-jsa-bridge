import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { WORK_JURISDICTIONS, workContext } from '../src/utils/workJurisdiction.js';
import { journeyContext, journeyDocumentTitle, newJourneyState, TASK_GUIDE_LINKS } from '../src/utils/regionalJourney.js';
import { regionalTemplates } from '../src/utils/regionalWorkTemplates.js';
import { regionalJourneyUi } from '../src/locales/regionalJourneyUi.js';
import { REGIONAL_MAIN_COPY, regionalMainCopy } from '../src/locales/regionalMainCopy.js';
import { GUIDE_CATEGORIES, guideResourceLocale, makeGuide } from '../src/utils/guideContent.js';
import { defaultPaperSize, normalizePaperSize, paperDimensions, paperPreviewWidth, paperPrintStyles } from '../src/utils/paperFormat.js';
import { templateLayout, pickDocumentLayout } from '../src/utils/documentLayout.js';
import { projectPayload, projectEditorState, templatePayload } from '../src/utils/projectPersistence.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';

test('every supported regional entry uses the existing country and native assessment title', () => {
  assert.deepEqual(Object.keys(REGIONAL_MAIN_COPY).sort(), [...SUPPORTED_LANGS].sort());
  for (const locale of SUPPORTED_LANGS) {
    assert.equal(regionalMainCopy(locale), REGIONAL_MAIN_COPY[locale]);
    assert.ok(regionalMainCopy(locale).title && regionalMainCopy(locale).description);
    const context = journeyContext(locale);
    assert.equal(context.jurisdiction, WORK_JURISDICTIONS.find(j => j.locale === locale).id);
    assert.equal(context.documentLocale, locale);
    assert.equal(journeyDocumentTitle(context), regionalTemplates(context).find(t => t.kind === 'risk_assessment').title);
    const ui = regionalJourneyUi(locale);
    assert.equal(Object.keys(ui).length, 13);
    assert.ok(Object.values(ui).every(s => typeof s === 'string' && s.trim()));
    if (!locale.startsWith('en')) assert.notEqual(ui.start, regionalJourneyUi('en-US').start);
  }
});
test('task links lead to real examples in every regional guide', () => {
  for (const locale of SUPPORTED_LANGS) for (const href of Object.values(TASK_GUIDE_LINKS)) {
    const [, category, id] = href.match(/\/guideline\/([^#]+)#(.+)/);
    const resource = JSON.parse(fs.readFileSync(new URL(`../src/locales/${guideResourceLocale(locale)}/${GUIDE_CATEGORIES[category]}.json`, import.meta.url)));
    assert.ok(makeGuide(locale, category, resource).examples.some(e => e.id === id), `${locale}/${category}#${id}`);
  }
});
test('document language never changes the work jurisdiction or default paper', () => {
  for (const country of WORK_JURISDICTIONS) for (const locale of SUPPORTED_LANGS) {
    const context = workContext({ jurisdiction: country.id, documentLocale: locale, activity: 'Inspection' });
    const state = newJourneyState(context);
    assert.equal(state.formData.context.jurisdiction, country.id);
    assert.equal(state.formData.context.documentLocale, locale);
    assert.equal(state.paperSize, defaultPaperSize(country.id));
    assert.equal(state.formData.projectName, 'Inspection');
    assert.equal(state.formData.saveVisibility, 'private');
    assert.deepEqual(state.analysisData, []);
    assert.deepEqual(state.participants, []);
    assert.equal(state.formData.workDate, undefined);
    assert.equal(state.parentId, undefined);
  }
});
test('A4 and Letter preserve exact dimensions for both orientations and browser print', () => {
  assert.deepEqual(paperDimensions('a4'), { width: 297, height: 210 });
  assert.deepEqual(paperDimensions('letter'), { width: 279.4, height: 215.9 });
  assert.deepEqual(paperDimensions('letter', 'portrait'), { width: 215.9, height: 279.4 });
  assert.equal(paperPreviewWidth('a4'), 1080);
  assert.equal(paperPreviewWidth('a4', 'portrait'), 750);
  assert.equal(normalizePaperSize('invalid'), 'a4');
  assert.match(paperPrintStyles(), /@page letter-portrait\{size:Letter portrait/);
  assert.match(paperPrintStyles(), /@page a4-landscape\{size:A4 landscape/);
});
test('paper format survives draft, project and template round trips; legacy stays A4', () => {
  const state = newJourneyState(journeyContext('en-US'));
  const layout = pickDocumentLayout(state);
  assert.equal(layout.paperSize, 'letter');
  const payload = projectPayload({ ...state, layoutData: layout }, 'owner', false);
  const restored = projectEditorState({ ...payload, id: 'test' }, true);
  assert.equal(restored.paperSize, 'letter');
  assert.equal(templateLayout(templatePayload(layout)).paperSize, 'letter');
  assert.equal(templateLayout({}).paperSize, 'a4');
  assert.equal(templateLayout({}, { paperSize: 'letter' }).paperSize, 'letter');
  assert.equal(normalizePaperSize(projectEditorState({ custom_layout: {} }).paperSize), 'a4');
});
test('new work selects country paper without altering a package or past output', () => {
  const record = { id: 'test', name: 'Test', version_name: 'v1', data: { context: journeyContext('en-US'), documents: [], commonDefaults: {} } };
  const before = structuredClone(record), run = startWork(record);
  assert.equal(run.paperSize, 'letter');
  run.paperSize = 'a4';
  assert.deepEqual(record, before);
  assert.equal(startWork(duplicatePackage(record, 'copy', 'v2')).paperSize, 'letter');
  assert.equal(startWork({ ...record, data: { documents: [] } }).paperSize, 'a4');
});
