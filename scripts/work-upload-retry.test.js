import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('drawing and PDF retries verify existing bytes and preserve one immutable record', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  let client, originalAuth, originalFrom, originalStorage;
  try {
    ({ supabase: client } = await server.ssrLoadModule('/src/supabaseClient.js'));
    const { uploadDrawing, archiveWorkOutput } = await server.ssrLoadModule('/src/services/workPackageService.js');
    originalAuth = client.auth.getUser; originalFrom = client.from; originalStorage = client.storage.from;
    client.auth.getUser = async () => ({ data: { user: { id: 'owner' } } });
    const files = new Map(), records = new Map();
    let metadataFailure = true, lostResponse = false, uploadError = null, writes = 0, downloads = 0;
    client.storage.from = () => ({
      upload: async (path, blob, options) => {
        assert.equal(options.upsert, false);
        if (uploadError) return { error: uploadError };
        if (files.has(path)) return { error: { statusCode: '400', code: 'ResourceAlreadyExists', message: 'Asset Already Exists' } };
        files.set(path, blob); return { error: null };
      },
      download: async path => { downloads++; return { data: files.get(path), error: null }; },
    });
    client.from = table => {
      let payload, id, hash;
      const query = {
        insert: value => { writes++; payload = value; return query; },
        select: () => query,
        eq: (key, value) => { if (key === 'id') id = value; if (key === 'sha256') hash = value; return query; },
        single: async () => {
          if (metadataFailure) return { error: new Error('METADATA_OFFLINE') };
          const key = table + ':' + payload.id;
          if (records.has(key)) return { error: new Error('DUPLICATE_ROW') };
          records.set(key, payload);
          return lostResponse ? { error: new Error('RESPONSE_LOST') } : { data: payload };
        },
        maybeSingle: async () => {
          const row = records.get(table + ':' + id);
          return { data: row?.sha256 === hash ? row : null };
        },
      };
      return query;
    };
    const file = new Blob(['same drawing bytes'], { type: 'image/png' });
    const meta = { name: 'QA drawing', number: 'T1', revision: '1' };
    await assert.rejects(uploadDrawing(file, meta, 1), /METADATA_OFFLINE/);
    assert.equal(files.size, 1); assert.equal(records.size, 0);
    metadataFailure = false;
    const drawing = await uploadDrawing(file, meta, 1);
    assert.equal(files.size, 1); assert.equal(records.size, 1); assert.equal(downloads, 1);
    assert.equal((await uploadDrawing(file, meta, 1)).id, drawing.id);
    assert.equal(records.size, 1);

    const run = { packageId: 'package', packageName: 'QA', version: '1', documents: [], common: { workDate: '2026-10-08' } };
    const pdf = new Blob(['%PDF-1.7 original'], { type: 'application/pdf' });
    metadataFailure = true;
    await assert.rejects(archiveWorkOutput('output', run, pdf, []), /METADATA_OFFLINE/);
    metadataFailure = false; lostResponse = true;
    const output = await archiveWorkOutput('output', run, pdf, []);
    assert.equal(output.id, 'output'); assert.equal(records.size, 2); assert.equal(files.size, 2);
    assert.equal((await archiveWorkOutput('output', run, pdf, [])).id, 'output');
    assert.equal(records.size, 2);
    const beforeMismatch = writes;
    await assert.rejects(archiveWorkOutput('output', run, new Blob(['%PDF-1.7 changed!'], { type: 'application/pdf' }), []), /WORK_UPLOAD_MISMATCH/);
    assert.equal(writes, beforeMismatch);
    assert.equal(await files.get('owner/outputs/output/output.pdf').text(), '%PDF-1.7 original');
    for (const statusCode of ['403', '500']) {
      uploadError = { statusCode, message: 'STORAGE_UNAVAILABLE' };
      await assert.rejects(uploadDrawing(new Blob(['new'], { type: 'image/png' }), meta, 1), error => error === uploadError);
      assert.equal(writes, beforeMismatch);
    }
  } finally {
    if (client) { client.auth.getUser = originalAuth; client.from = originalFrom; client.storage.from = originalStorage; }
    await server.close();
  }
});
