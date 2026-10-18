import test from 'node:test';
import assert from 'node:assert/strict';
import { procedureRows, projectProcedureDocument, draftProcedureDocument } from '../src/utils/procedureDocument.js';
import { getProcedureDocumentUi } from '../src/locales/procedureDocumentUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
const proc = { stepTitle: 'Inspect', stepDetail: 'First line\nSecond line', sourceProjectId: 'private-id' };
const row = { is_public: true, title: 'Work', public_locale: 'en-US', form_data: { projectName: 'Work', workLocation: 'Private location', workDate: '2026-10-18' },
  custom_layout: { paperSize: 'letter', procedures: [{ stepTitle: 'Private draft', stepDetail: 'Not published' }] }, analysis_data: [{ proc }] };
test('procedure output preserves order, multiline text and partial steps, but strips metadata and empty rows', () => {
  assert.deepEqual(procedureRows([null, {}, proc, { stepDetail: 'Detail only' }, { stepTitle: 42 }]), [
    { stepTitle: 'Inspect', stepDetail: 'First line\nSecond line' }, { stepTitle: '', stepDetail: 'Detail only' }]);
});
test('public procedure uses only published steps and never private layout procedures or location', () => {
  const before = JSON.stringify(row), doc = projectProcedureDocument(row);
  assert.equal(doc.procedures[0].stepTitle, 'Inspect');
  assert.equal(doc.formData.workLocation, undefined); assert.equal(doc.formData.workDate, undefined);
  assert.equal(doc.locale, 'en-US'); assert.equal(doc.paperSize, 'letter');
  assert.equal(JSON.stringify(row), before);
  assert.equal(projectProcedureDocument({ ...row, is_public: false }), null);
  assert.equal(projectProcedureDocument(null), null);
});
test('owned procedures retain private details and draft edits take priority over stale analysis', () => {
  assert.equal(projectProcedureDocument(row, true).formData.workLocation, 'Private location');
  assert.equal(projectProcedureDocument(row, true).procedures[0].stepTitle, 'Private draft');
  const draft = { procedures: [{ stepTitle: 'Latest edit' }], analysis_data: row.analysis_data, form_data: row.form_data };
  assert.equal(draftProcedureDocument(draft).procedures[0].stepTitle, 'Latest edit');
  assert.deepEqual(draftProcedureDocument({ ...draft, procedures: [] }).procedures, []);
  assert.equal(draftProcedureDocument({ analysis_data: row.analysis_data }).procedures[0].stepTitle, 'Inspect');
});
test('procedure viewer and PDF controls cover every supported locale', () => {
  for (const locale of SUPPORTED_LANGS) assert.ok(Object.values(getProcedureDocumentUi(locale)).every(text => typeof text === 'string' && text.length), locale);
});
