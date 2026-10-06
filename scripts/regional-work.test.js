import test from 'node:test';
import assert from 'node:assert/strict';
import { workContext } from '../src/utils/workJurisdiction.js';
import { createRegionalTemplate, regionalTemplates, regionalContextMismatch, jsaWorkRows } from '../src/utils/regionalWorkTemplates.js';
import { cleanPackage, duplicatePackage, startWork, importJsa, outputReady } from '../src/utils/workPackages.js';
import { publicProjectSnapshot } from '../src/utils/projectPersistence.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { WORK_JURISDICTIONS, WORK_DOCUMENT_LANGUAGES, workContextUi, documentDirection } from '../src/utils/workJurisdiction.js';
import { getWorkPackageUi } from '../src/locales/workPackageUi.js';
import { regionalFieldTranslations, regionalUiTranslations } from '../src/locales/regionalWorkText.js';
import { REGIONAL_CATALOG } from '../src/utils/regionalCatalog.js';

const context = workContext({ jurisdiction: 'SG', documentLocale: 'en-SG', activity: 'Pipe replacement', region: 'Jurong' });
const source = importJsa({ id: 'source', title: 'Source JSA', form_data: { projectName: 'Pipe', equipment: 'Hoist', workDate: 'OLD_DATE', ppe: ['Helmet'], context }, participants: ['OLD_WORKER'], analysis_data: [{ proc: { stepTitle: 'Isolate', stepDetail: 'Identify lines' }, frequency: 0, severity: 3, riskLevel: 0, customFields: { actual: 'OLD_MEASUREMENT' }, risks: [{ factor: 'Pressure', current_measure: 'Isolate supply', recommend_measure: 'Verify isolation', measuredAt: 'OLD_TIME' }] }] });
test('country semantics stay distinct even with the same English document language', () => {
  const titles = country => regionalTemplates({ jurisdiction: country, documentLocale: 'en-US', highRiskConstruction: 'yes' });
  assert.equal(titles('GB').find(t => t.kind === 'method_statement').title, 'Method Statement');
  assert.equal(titles('SG').find(t => t.kind === 'method_statement').title, 'Safe Work Procedure (SWP)');
  assert.equal(titles('AU').find(t => t.kind === 'method_statement').title, 'Safe Work Method Statement (SWMS)');
  assert.equal(titles('GB').find(t => t.kind === 'toolbox_talk').title, 'Toolbox Talk');
  assert.equal(titles('SG').find(t => t.kind === 'toolbox_talk').title, 'Toolbox Meeting');
  assert.equal(regionalTemplates({}).length, 0);
});
test('SWMS requires an explicit applicability answer; permits are opt-in', () => {
  for (const answer of ['no', 'unknown', undefined]) {
    const c = { jurisdiction: 'AU', documentLocale: 'en-AU', highRiskConstruction: answer };
    assert.equal(regionalTemplates(c).find(t => t.kind === 'method_statement').available, false);
    assert.throws(() => createRegionalTemplate('method_statement', c), /UNAVAILABLE/);
  }
  for (const country of ['KR', 'GB', 'AU', 'SG']) assert.equal(regionalTemplates({ jurisdiction: country, documentLocale: 'en-US' }).find(t => t.kind === 'permit_to_work').recommended, false);
});
test('mapping preserves zero scores, equipment and controls, but never personal or measured values', () => {
  assert.equal(jsaWorkRows(source)[0].sourceRisk, '0 / 3 / 0');
  for (const entry of regionalTemplates(context)) {
    const doc = createRegionalTemplate(entry.kind, context, source);
    assert.equal(doc.type, 'form');
    assert.equal(doc.regional.sourceJsaId, 'source');
    assert.ok(JSON.stringify(doc).includes('Isolate supply'));
    assert.doesNotMatch(JSON.stringify(doc), /OLD_/);
    for (const b of doc.blocks) for (const f of b.type === 'field' ? [b.field] : b.columns) {
      if (f.kind !== 'text') { assert.notEqual(f.mode, 'standard'); assert.equal(f.value, ''); }
    }
  }
  assert.match(JSON.stringify(createRegionalTemplate('method_statement', context, source)), /Hoist/);
});
test('context and template revisions survive save, independent copy and output snapshot', () => {
  const doc = createRegionalTemplate('method_statement', context, source);
  const record = { id: 'package', name: 'Pack', version_name: 'Night', data: cleanPackage({ context, documents: [doc] }) };
  const copy = duplicatePackage(record, 'Copy', 'Day');
  copy.data.context.region = 'Changed'; copy.data.documents[0].regional.context.region = 'Changed';
  assert.equal(record.data.context.region, 'Jurong'); assert.equal(doc.regional.context.region, 'Jurong');
  const run = startWork(record);
  assert.deepEqual(run.context, context);
  assert.equal(run.documents[0].regional.version, doc.regional.version);
  assert.equal(run.regionalReviewed, false); assert.equal(outputReady(run), false);
  run.regionalReviewed = true; assert.equal(outputReady(run), true);
  run.context.documentLocale = 'ko'; assert.equal(outputReady(run), false);
  assert.equal(record.data.context.documentLocale, 'en-SG');
});
test('mismatched documents require replacement; excluded forms do not block compatible forms', () => {
  const doc = createRegionalTemplate('inspection', context, source);
  assert.equal(regionalContextMismatch([doc], { ...context, jurisdiction: 'GB' }), true);
  assert.equal(regionalContextMismatch([{ ...doc, enabled: false }], {}), false);
  assert.equal(regionalContextMismatch([{ type: 'form', enabled: true }], {}), false);
});
test('existing generic packages remain usable; publishing does not expose private context', () => {
  const run = startWork({ data: { documents: [{ type: 'form', enabled: true, blocks: [] }] } });
  assert.equal(outputReady(run), true);
  const result = publicProjectSnapshot({ formData: { projectName: 'Public', context: { ...context, region: 'Private site' } }, analysisData: [] });
  assert.equal(result.formData.context, undefined);
});
test('regional documents have distinct structures and Korean or English labels independent of screen', () => {
  for (const jurisdiction of ['KR','GB','AU','SG']) for (const documentLocale of ['ko','en-US']) {
    const c = { jurisdiction, documentLocale, highRiskConstruction: 'yes' };
    for (const entry of regionalTemplates(c)) {
      const doc = createRegionalTemplate(entry.kind, c);
      const keys = doc.blocks.map(b => b.field?.key).filter(Boolean);
      if (entry.kind === 'permit_to_work') assert.ok(keys.includes('validity') && keys.includes('handover'));
      if (entry.kind === 'method_statement') assert.ok(keys.includes('monitoring') && keys.includes('consultation'));
      if (entry.kind === 'method_statement' && jurisdiction === 'AU') assert.ok(keys.includes('hrcw'));
      if (entry.kind === 'risk_assessment') assert.ok(keys.includes('matrix'));
      assert.ok(doc.blocks.length >= 3);
      assert.equal(doc.regional.context.documentLocale, documentLocale);
    }
  }
});
test('every supported route has its own selectable jurisdiction and preserves its document locale', () => {
  assert.deepEqual([...WORK_DOCUMENT_LANGUAGES].sort(), [...SUPPORTED_LANGS].sort());
  assert.deepEqual(WORK_JURISDICTIONS.map(j => j.locale).sort(), [...SUPPORTED_LANGS].sort());
  for (const j of WORK_JURISDICTIONS) {
    const c = workContext({ jurisdiction: j.id, documentLocale: j.locale, highRiskConstruction: 'yes' });
    const definitions = regionalTemplates(c);
    assert.ok(definitions.length >= 4, j.locale);
    for (const entry of definitions) {
      const doc = createRegionalTemplate(entry.kind, c, source);
      const saved = cleanPackage({ context: c, documents: [doc] });
      const run = startWork({ data: saved });
      assert.equal(run.context.documentLocale, j.locale);
      assert.equal(run.documents[0].regional.context.jurisdiction, j.id);
      assert.ok(doc.regional.sources.length > 0);
      assert.equal(doc.title, entry.title);
      assert.doesNotMatch(JSON.stringify(doc), /OLD_/);
      const table = doc.blocks.find(b => b.type === 'table');
      assert.ok(table, j.locale);
      if (REGIONAL_CATALOG[j.id]) assert.ok(doc.blocks.some(b => b.field?.key === 'jurisdictionReview'));
    }
  }
});
test('workspace and context UI are complete in every language without an English-only fallback', () => {
  const uiKeys = Object.keys(getWorkPackageUi('en-US')).sort();
  const contextKeys = Object.keys(workContextUi('en-US')).sort();
  for (const locale of SUPPORTED_LANGS) {
    assert.deepEqual(Object.keys(getWorkPackageUi(locale)).sort(), uiKeys, locale);
    assert.deepEqual(Object.keys(workContextUi(locale)).sort(), contextKeys, locale);
    assert.ok(Object.values(getWorkPackageUi(locale)).every(t => typeof t === 'string' && t.length > 0));
    if (!locale.startsWith('en')) assert.notEqual(getWorkPackageUi(locale).intro, getWorkPackageUi('en-US').intro);
  }
  const keys = Object.keys(regionalFieldTranslations.de).sort();
  for (const lang of Object.keys(regionalUiTranslations)) assert.deepEqual(Object.keys(regionalFieldTranslations[lang]).sort(), keys);
});
test('French-Canadian documents do not inherit French enterprise record names; Canada regions remain independent', () => {
  const qc = createRegionalTemplate('risk_assessment', { jurisdiction: 'CA-QC', documentLocale: 'fr-CA-QC' });
  const fr = createRegionalTemplate('risk_assessment', { jurisdiction: 'FR', documentLocale: 'fr-FR' });
  assert.match(qc.title, /AST/); assert.doesNotMatch(JSON.stringify(qc), /DUERP/);
  assert.ok(fr.blocks.some(b => b.field?.key === 'organisationRecord' && b.field.label.includes('DUERP')));
  for (const id of ['CA','CA-AB','CA-ON','CA-BC','CA-QC']) assert.equal(workContext({ jurisdiction: id }).jurisdiction, id);
});
test('Arabic document direction follows the document, not the interface or work country', () => {
  const doc = createRegionalTemplate('risk_assessment', { jurisdiction: 'DE', documentLocale: 'ar-SA' });
  assert.equal(documentDirection(doc.regional.context.documentLocale), 'rtl');
  assert.equal(documentDirection('en-SG'), 'ltr');
  assert.match(doc.blocks[0].field.label, /[\u0600-\u06ff]/);
});

test('reviewed assessments retain evidence but never reuse dated reviews, consultation or approvals', () => {
  for (const j of WORK_JURISDICTIONS) {
    const doc = createRegionalTemplate('risk_assessment', { jurisdiction: j.id, documentLocale: j.locale }, source);
    const fields = Object.fromEntries(doc.blocks.filter(b => b.field).map(b => [b.field.key, b.field]));
    for (const key of ['assessmentDate','reviewPlan','consultationRecord','controlReview']) {
      assert.equal(fields[key].mode, 'runtime', `${j.id}: ${key}`);
      assert.equal(fields[key].value, '');
      fields[key].value = 'PAST_SITE_RECORD';
    }
    const saved = cleanPackage({ context: doc.regional.context, documents: [doc] });
    const run = startWork({ data: saved });
    assert.doesNotMatch(JSON.stringify(run), /PAST_SITE_RECORD/);
    assert.equal(run.documents[0].regional.review.status, 'official-source-desk-review');
    assert.equal(run.documents[0].regional.version, ['SA', 'RU'].includes(j.id) ? '2026-10-06.19' : ['KR', 'CA-ON'].includes(j.id) ? '2026-10-05.17' : ['IT', 'BR', 'CA-QC'].includes(j.id) ? '2026-10-05.16' : ['FR', 'ES'].includes(j.id) ? '2026-10-05.15' : ['CA-AB', 'CA-BC', 'DE'].includes(j.id) ? '2026-10-05.14' : ['AU', 'JP'].includes(j.id) ? '2026-10-05.10' : j.id === 'SG' ? '2026-10-05.9' : '2026-10-05.8');
    assert.ok(run.documents[0].regional.sources.some(s => s.basis));
  }
});

test('country review fields do not confuse enterprise documents or apply SG intervals elsewhere', () => {
  const form = jurisdiction => createRegionalTemplate('risk_assessment', { jurisdiction, documentLocale: 'en-US' });
  const fields = jurisdiction => Object.fromEntries(form(jurisdiction).blocks.filter(b => b.field).map(b => [b.field.key, b.field.label]));
  assert.match(fields('SG').reviewPlan, /3 years/);
  for (const j of WORK_JURISDICTIONS.filter(j => j.id !== 'SG')) assert.doesNotMatch(fields(j.id).reviewPlan, /3 years/);
  assert.match(fields('IT').organisationRecord, /DVR$/);
  assert.match(fields('IT').interferenceRecord, /DUVRI/);
  assert.ok(fields('CA-QC').preventionProgramme);
  assert.doesNotMatch(JSON.stringify(form('CA-QC')), /DUERP/);
  assert.ok(fields('KR').assessmentBasis);
  assert.ok(fields('JP').riskPriority);
});

test('permit roles and lifecycle stay separate and unsigned in every profile', () => {
  for (const j of WORK_JURISDICTIONS) {
    const doc = createRegionalTemplate('permit_to_work', { jurisdiction: j.id, documentLocale: j.locale });
    const fields = Object.fromEntries(doc.blocks.filter(b => b.field).map(b => [b.field.key, b.field]));
    for (const key of ['applicant','siteVerifier','issue','acceptance','handover']) {
      assert.equal(fields[key].mode, 'blank', `${j.id}: ${key}`);
      assert.equal(fields[key].value, '');
    }
    assert.equal(fields.permitProcedure.mode, 'runtime');
    assert.equal(fields.suspension.mode, 'runtime');
  }
});

test('new review fields have native labels, and source-score reference semantics stay unchanged', () => {
  for (const j of WORK_JURISDICTIONS.filter(j => !j.locale.startsWith('en'))) {
    const doc = createRegionalTemplate('risk_assessment', { jurisdiction: j.id, documentLocale: j.locale }, source);
    const english = createRegionalTemplate('risk_assessment', { jurisdiction: j.id, documentLocale: 'en-US' }, source);
    for (const key of ['assessmentDate','reviewPlan','consultationRecord','controlReview']) {
      assert.notEqual(doc.blocks.find(b => b.field?.key === key).field.label, english.blocks.find(b => b.field?.key === key).field.label);
    }
    const riskColumn = doc.blocks.find(b => b.type === 'table').columns.find(c => c.key === 'sourceRisk');
    assert.equal(riskColumn.mode, 'standard');
    assert.equal(doc.blocks.find(b => b.type === 'table').columns.find(c => c.key === 'residual').mode, 'runtime');
  }
});
