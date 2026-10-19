import test from 'node:test';
import assert from 'node:assert/strict';
import { readLibrary } from '../src/services/libraryReadService.js';

const userId = '10000000-0000-4000-8000-000000000001';
function fixture(failures = {}) {
  const calls = [];
  return { calls, from(table) {
    let select, offset = 0;
    const filters = [];
    const query = {
      select(value) { select = value; return query; },
      eq(...args) { filters.push(args); return query; },
      order() { return query; },
      range(start) { offset = start; return query; },
      then(resolve, reject) {
        calls.push({ table, select, filters, offset });
        if (table === 'user_blocks') assert.equal(select, 'id,blocked_user_id,created_at');
        const owner = table === 'jsa_projects' ? 'author_id' : table === 'user_reports' ? 'reporter_id' : table === 'user_blocks' ? 'blocker_id' : 'user_id';
        assert.ok(filters.some(([key, value]) => key === owner && value === userId));
        if (failures[table] === 'network') return Promise.reject(Error('offline')).then(resolve, reject);
        if (failures[table]) return Promise.resolve({ data: null, error: { code: failures[table] } }).then(resolve, reject);
        return Promise.resolve({ data: offset ? [] : [{ id: table + '-1' }], error: null }).then(resolve, reject);
      },
    };
    return query;
  } };
}

test('library reads owner-scoped blocks without a nonexistent private-profile relationship', async () => {
  const client = fixture();
  const result = await readLibrary(client, userId);
  assert.deepEqual(result.errors, {});
  assert.equal(result.data.authored.length, 1);
  assert.equal(result.data.blocks.length, 1);
  assert.equal(Object.keys(result.data).length, 9);
});

test('moderation, draft and layout failures do not discard successfully loaded documents', async () => {
  const result = await readLibrary(fixture({ user_blocks: 'PGRST200', user_jsa_drafts: 'network', user_layouts: '42501' }), userId);
  assert.deepEqual(result.errors, { blocks: true, layouts: true, drafts: true });
  assert.equal(result.data.authored.length, 1);
  assert.equal(result.data.favorites.length, 1);
  assert.equal(result.data.workSteps.length, 1);
  assert.deepEqual(result.data.blocks, []);
});

test('document failures remain explicit, and a successful retry clears failure state', async () => {
  const failed = await readLibrary(fixture({ jsa_projects: 'network' }), userId);
  assert.deepEqual(failed.errors, { authored: true });
  assert.equal(failed.data.favorites.length, 1);
  assert.equal(failed.data.drafts.length, 1);
  const recovered = await readLibrary(fixture(), userId);
  assert.deepEqual(recovered.errors, {});
  assert.equal(recovered.data.authored.length, 1);
});
