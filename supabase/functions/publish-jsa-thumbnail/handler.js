import { allowedWorkflow, objectPath, webpSize } from './policy.js';
export function createHandler({ authenticate, publicRow, upload, save }) {
  const reply = (status, value) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
  return async request => {
    if (request.method !== 'POST') return reply(405, { error: 'METHOD_NOT_ALLOWED' });
    try {
      const claims = await authenticate(request);
      if (!allowedWorkflow(claims)) return reply(403, { error: 'WORKFLOW_NOT_ALLOWED' });
    } catch { return reply(401, { error: 'AUTH_REQUIRED' }); }
    const params = new URL(request.url).searchParams, id = params.get('id'), revision = params.get('revision');
    const path = objectPath(id, revision);
    if (!path || request.headers.get('content-type') !== 'image/webp') return reply(400, { error: 'INVALID_IMAGE' });
    if (Number(request.headers.get('content-length')) > 204800) return reply(413, { error: 'IMAGE_TOO_LARGE' });
    try {
      const chunks = []; let length = 0;
      for await (const chunk of request.body || []) {
        length += chunk.length;
        if (length > 204800) return reply(413, { error: 'IMAGE_TOO_LARGE' });
        chunks.push(chunk);
      }
      const bytes = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const dimensions = webpSize(bytes);
      if (!dimensions) return reply(400, { error: 'INVALID_IMAGE' });
      const current = async () => {
        const row = await publicRow(id);
        return row?.is_public === true && row.revision === revision
          && row.assessment?.checked === true && row.assessment?.review !== 'rejected';
      };
      // Public reads use anon RLS, even though this worker has narrowly scoped write access.
      if (!await current()) return reply(409, { error: 'PUBLIC_REVISION_CHANGED' });
      await upload(path, bytes);
      if (!await current()) return reply(409, { error: 'PUBLIC_REVISION_CHANGED' });
      await save({ project_id: id, revision, renderer: 'risk-v1', ...dimensions });
      return reply(200, { id, revision, ...dimensions });
    } catch { return reply(503, { error: 'PUBLISH_RETRY_REQUIRED' }); }
  };
}
