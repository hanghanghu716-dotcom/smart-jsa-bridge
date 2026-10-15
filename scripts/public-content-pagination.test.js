import test from 'node:test';
import assert from 'node:assert/strict';
import { readAllPublic } from '../server/public-content.js';

test('small body pages traverse every row without imposing an item limit', async () => {
  const records = Array.from({ length: 1078 }, (_, i) => ({ id: String(i).padStart(5, '0'), content_md: 'Complete article ' + i }));
  let calls = 0;
  const result = await readAllPublic('case_studies', { select: 'id,content_md', language_code: 'eq.ko' }, async value => {
    const url = new URL(value), params = url.searchParams;
    assert.equal(params.get('limit'), '25');
    assert.equal(params.get('order'), 'id.asc');
    assert.equal(params.get('language_code'), 'eq.ko');
    const last = params.get('id')?.slice(3);
    calls++;
    return Response.json(records.filter(row => !last || row.id > last).slice(0, Number(params.get('limit'))));
  }, { pageSize: 25 });
  assert.deepEqual(result, records);
  assert.equal(calls, 45);
});

test('a server page cap below the requested size does not truncate the feed', async () => {
  const records = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const result = await readAllPublic('case_studies', { select: 'id' }, async value => {
    const last = new URL(value).searchParams.get('id')?.slice(3);
    return Response.json(records.filter(row => !last || row.id > last).slice(0, 1));
  }, { pageSize: 25 });
  assert.deepEqual(result, records);
});

test('a failed later page rejects the whole read instead of publishing a partial feed', async () => {
  await assert.rejects(readAllPublic('case_studies', { select: 'id,content_md' }, async value =>
    new URL(value).searchParams.has('id') ? new Response('', { status: 503 }) : Response.json([{ id: 'a' }]),
  { pageSize: 25 }), /PUBLIC_CONTENT_READ_FAILED/);
});

test('lightweight callers retain the original page size; invalid sizes never make a request', async () => {
  await readAllPublic('case_studies', { select: 'id' }, async value => {
    assert.equal(new URL(value).searchParams.get('limit'), '1000');
    return Response.json([]);
  });
  for (const pageSize of [0, -1, 1.5, 1001, NaN]) {
    await assert.rejects(readAllPublic('case_studies', {}, () => { throw Error('must not fetch'); }, { pageSize }), /INVALID_PUBLIC_PAGE_SIZE/);
  }
});
