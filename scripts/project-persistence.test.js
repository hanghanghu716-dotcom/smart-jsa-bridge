import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';
import { projectEditorState, projectPayload, templatePayload } from '../src/utils/projectPersistence.js';
import { pickDocumentLayout } from '../src/utils/documentLayout.js';

const snapshot = {
  formData: { projectName: 'Inspection', saveVisibility: 'private', jsaType: '3-step', workDate: '2026-09-30', department: 'Private department', workLocation: 'Private site', managerName: 'Private name', equipment: 'Serial 123', ppe: ['Helmet'], additionalItems: 'Private notes' },
  participants: ['Worker A', 'Worker B'],
  analysisData: [{ id: 0, proc: { stepTitle: 'Inspect', stepDetail: 'Check access', sourceProjectTitle: 'Private source' }, risks: [{ factor: 'Fall', current_measure: 'Barrier' }], frequency: 2, customFields: { USER_name: 'Private name', USER_zero: 0, USER_false: false }, sourceProjectId: 'source' }],
  procedures: [{ stepTitle: 'Inspect', stepDetail: 'Check access', sourceProjectTitle: 'Private source' }],
  layoutData: { docTitle: 'Company JSA', documentNotes: 'Private note', savedOrientation: 'portrait', savedActiveOrder: ['DATA_PHOTO', 'USER_zero'], savedUserColumns: [{ id: 'USER_zero', label: 'Quantity' }], documentBlocks: [{ id: 'JSA_TABLE', enabled: true }], stepPhotos: { 0: 'data:image/png;base64,photo' }, projectSaveContext: { id: 'old', own: true } },
};

test('private document round trip retains full fields, procedures, zero/false values, photos and layout', () => {
  const row = { ...projectPayload(snapshot, 'owner', false), id: 'saved', parent_id: null };
  const opened = projectEditorState(row, true);
  for (const field of ['formData', 'participants', 'analysisData', 'procedures']) assert.deepEqual(opened[field], snapshot[field]);
  assert.deepEqual(opened.stepPhotos, snapshot.layoutData.stepPhotos);
  assert.equal(opened.savedOrientation, 'portrait');
  assert.equal(row.custom_layout.projectSaveContext, undefined);
  assert.equal(opened.existingId, 'saved'); assert.equal(opened.isFork, false);
  assert.equal(opened.projectSaveContext.updatedAt, row.updated_at);
});

test('public copy excludes structured private fields without mutating its private source', () => {
  const before = JSON.stringify(snapshot);
  const row = projectPayload({ ...snapshot, publicationConsent: true }, 'owner', true);
  assert.deepEqual(Object.keys(row.form_data).sort(), ['jsaType', 'ppe', 'projectName']);
  assert.deepEqual(row.participants, []); assert.deepEqual(row.analysis_data[0].customFields, {});
  assert.equal(row.custom_layout.stepPhotos, undefined); assert.equal(row.custom_layout.documentNotes, '');
  assert.equal(row.analysis_data[0].sourceProjectId, undefined);
  assert.deepEqual(row.analysis_data[0].proc, { stepTitle: 'Inspect', stepDetail: 'Check access' });
  assert.deepEqual(row.custom_layout.procedures, [row.analysis_data[0].proc]);
  assert.equal(JSON.stringify(snapshot), before);
});

test('templates exclude per-document photos and save target; null route state is safe', () => {
  const layout = templatePayload(snapshot.layoutData);
  assert.equal(layout.stepPhotos, undefined); assert.equal(layout.projectSaveContext, undefined);
  assert.equal(layout.docTitle, snapshot.layoutData.docTitle);
  assert.deepEqual(pickDocumentLayout(null, null), {});
  assert.equal(pickDocumentLayout(null, snapshot.layoutData).docTitle, 'Company JSA');
});

test('legacy documents and referenced public documents open with correct ownership and procedures', () => {
  const row = { id: 'source', analysis_data: snapshot.analysisData, is_public: true };
  const opened = projectEditorState(row, false);
  assert.equal(opened.existingId, null); assert.equal(opened.parentId, 'source');
  assert.equal(opened.isFork, true); assert.equal(opened.projectSaveContext.own, false);
  assert.deepEqual(opened.procedures, snapshot.analysisData.map(step => step.proc));
});

test('every supported translation dictionary has complete save and template messages', () => {
  const base = JSON.parse(fs.readFileSync('src/locales/en-US/common.json')).saveFlow;
  for (const locale of fs.readdirSync('src/locales', { withFileTypes: true }).filter(item => item.isDirectory())) {
    const file = `src/locales/${locale.name}/common.json`;
    if (!fs.existsSync(file)) continue;
    const messages = JSON.parse(fs.readFileSync(file)).saveFlow;
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(base).sort(), locale.name);
    assert.ok(Object.values(messages).every(value => typeof value === 'string' && value.trim()), locale.name);
  }
});

function mockClient(result = { data: { id: 'saved', updated_at: 'revision2', is_public: false }, error: null }, user = { id: 'owner' }) {
  const calls = [];
  const query = {};
  for (const method of ['insert', 'update', 'delete', 'select', 'eq', 'order']) query[method] = (...args) => { calls.push([method, ...args]); return query; };
  query.maybeSingle = async () => result;
  query.then = resolve => Promise.resolve(result).then(resolve);
  return { calls, auth: { getUser: async () => ({ data: { user } }) }, from: table => { calls.push(['from', table]); return query; }, rpc: async (...args) => { calls.push(['rpc', ...args]); return result; } };
}

test('an in-flight save for the previous draft cannot replace the new draft revision', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  const previousWindow = globalThis.window, previousStorage = globalThis.sessionStorage;
  let client, previousGetUser, previousRpc;
  try {
    const { supabase } = await server.ssrLoadModule('/src/supabaseClient.js');
    client = supabase; previousGetUser = client.auth.getUser; previousRpc = client.rpc;
    const drafts = await server.ssrLoadModule('/src/services/jsaDraftService.js');
    const memory = new Map();
    globalThis.window = {};
    globalThis.sessionStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
    client.auth.getUser = async () => ({ data: { user: { id: 'owner' } } });
    let releaseSave, notifyStarted;
    const started = new Promise(resolve => { notifyStarted = resolve; });
    client.rpc = () => { notifyStarted(); return new Promise(resolve => { releaseSave = resolve; }); };
    drafts.setActiveDraftId('old', 4);
    const pending = drafts.saveDraftSnapshot({ draftId: 'old', formData: snapshot.formData });
    await started;
    drafts.setActiveDraftId('new', 1);
    releaseSave({ data: [{ version: 5 }], error: null });
    assert.equal((await pending).version, 5);
    assert.equal(drafts.getExistingActiveDraftId(), 'new');
    assert.equal(drafts.getActiveDraftVersion(), 1);
  } finally {
    if (client) { client.auth.getUser = previousGetUser; client.rpc = previousRpc; }
    globalThis.window = previousWindow; globalThis.sessionStorage = previousStorage;
    await server.close();
  }
});

test('save services enforce ownership/revision, explicit insert modes and failed-write handling', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { saveProject } = await server.ssrLoadModule('/src/services/projectPersistenceService.js');
    const { writeTemplate, removeTemplate, setDefaultTemplate } = await server.ssrLoadModule('/src/services/documentTemplateService.js');
    const client = mockClient();
    await saveProject({ snapshot, mode: 'update', targetId: 'existing', expectedUpdatedAt: 'revision1', client });
    assert.deepEqual(client.calls.filter(call => call[0] === 'eq'), [['eq', 'id', 'existing'], ['eq', 'author_id', 'owner'], ['eq', 'is_public', false], ['eq', 'updated_at', 'revision1']]);
    assert.ok(!client.calls.some(call => call[0] === 'insert'));
    for (const mode of ['private', 'public']) {
      const insert = mockClient(); await saveProject({ snapshot: { ...snapshot, publicationConsent: true }, mode, client: insert });
      assert.equal(insert.calls.find(call => call[0] === 'insert')[1].is_public, mode === 'public');
    }
    for (const consent of [undefined, false, 'true']) {
      const blocked = mockClient();
      await assert.rejects(saveProject({ snapshot: { ...snapshot, publicationConsent: consent }, mode: 'public', client: blocked }), /PUBLICATION_CONSENT_REQUIRED/);
      assert.equal(blocked.calls.length, 0);
    }
    assert.equal(projectPayload({ ...snapshot, publicationConsent: true }, 'owner', true).reuse_license, 'community-v1');
    await assert.rejects(saveProject({ snapshot, mode: 'update', targetId: 'existing', client }), /PROJECT_CHANGED/);
    await assert.rejects(saveProject({ snapshot, mode: 'update', targetId: 'existing', expectedUpdatedAt: 'stale', client: mockClient({ data: null }) }), /PROJECT_CHANGED/);
    await assert.rejects(saveProject({ snapshot, mode: 'private', client: mockClient(undefined, null) }), /AUTH_REQUIRED/);
    await assert.rejects(saveProject({ snapshot, mode: 'private', client: mockClient({ error: new Error('offline') }) }), /offline/);
    await assert.rejects(saveProject({ snapshot, mode: 'unknown', client }), /INVALID_SAVE_MODE/);
    const rename = mockClient(); await writeTemplate({ id: 'template', name: ' Renamed ', client: rename });
    assert.deepEqual(rename.calls.find(call => call[0] === 'update')[1], { name: 'Renamed' });
    assert.ok(rename.calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'owner'));
    const update = mockClient(); await writeTemplate({ id: 'template', name: 'New layout', layout: snapshot.layoutData, client: update });
    assert.equal(update.calls.find(call => call[0] === 'update')[1].layout_data.stepPhotos, undefined);
    await assert.rejects(removeTemplate('missing', mockClient({ data: null })), /TEMPLATE_NOT_FOUND/);
    const defaults = mockClient(); await setDefaultTemplate(null, defaults);
    assert.deepEqual(defaults.calls[0], ['rpc', 'set_default_document_template', { p_layout_id: null }]);
  } finally { await server.close(); }
});
