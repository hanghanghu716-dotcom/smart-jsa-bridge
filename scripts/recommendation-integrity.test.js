import test from 'node:test';
import assert from 'node:assert/strict';
import { legacyIdentityValidator } from '../src/utils/legacyRecommendationIntegrity.js';

test('a capped identity response cannot disguise a duplicate as a unique master', async () => {
  for (const result of [{ data: [{ id: 7 }], count: 2 }, { data: [{ id: 7 }], count: null }]) {
    const client = { from: () => ({ select: () => ({ in: async () => result }) }) };
    await assert.rejects(legacyIdentityValidator(client)('hazard', [7]), /Incomplete/);
  }
});

test('identity checks batch large candidate lists and reuse ancestors only within the request', async () => {
  const calls = [];
  const client = { from: table => ({ select: (fields, options) => ({ in: async (key, ids) => {
    calls.push({ table, ids });
    assert.equal(options.count, 'exact');
    const data = ids.map(id => table === 'Current_Measures' ? { id, hazard_id: 7 } : { id });
    return { data, count: data.length };
  } }) }) };
  const validate = legacyIdentityValidator(client);
  const ids = Array.from({ length: 205 }, (_, i) => i + 1);
  assert.equal((await validate('current', ids)).size, 205);
  assert.equal(calls.filter(call => call.table === 'Current_Measures').length, 3);
  assert.equal(calls.filter(call => call.table === 'Hazards').length, 1);
  assert.ok(calls.every(call => call.ids.length <= 100));
  assert.equal((await validate('current', [1, null, '', 0, -1, 'invalid', 1.5])).size, 1);
  assert.equal(calls.length, 4);
});

test('even identical duplicate masters remain ambiguous until a separate data correction', async () => {
  const client = { from: () => ({ select: () => ({ in: async () => ({ data: [{ id: 7 }, { id: 7 }], count: 2 }) }) }) };
  assert.deepEqual([...await legacyIdentityValidator(client)('hazard', [7])], []);
});
