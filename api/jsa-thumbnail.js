import { Buffer } from 'node:buffer';
import { getPublicSupabaseConfig } from '../server/supabase-config.js';
import { sendContent } from '../server/public-content.js';
import { THUMBNAIL_BUCKET, THUMBNAIL_MAX_BYTES, thumbnailObjectPath } from '../src/utils/publicThumbnail.js';

export function createJsaThumbnailHandler({ fetcher = fetch, config = getPublicSupabaseConfig() } = {}) {
  return async function handler(req, res) {
    const params = new URL(req.url || '/', 'http://localhost').searchParams;
    const id = req.query?.id ?? params.get('id'), revision = req.query?.revision ?? params.get('revision');
    const path = thumbnailObjectPath(id, revision);
    const fail = status => sendContent(req, res, '', { status, type: 'text/plain' });
    if (!['GET','HEAD'].includes(req.method || 'GET')) { res.setHeader('Allow','GET, HEAD'); return fail(405); }
    if (!path) return fail(404);
    try {
      // An anonymous request to the private bucket enforces current visibility.
      // Do not use service credentials, signed URLs or the /object/public route.
      const response = await fetcher(config.url + '/storage/v1/object/authenticated/' + THUMBNAIL_BUCKET + '/' + path, {
        headers: { apikey: config.key, ...(config.key.startsWith('eyJ') ? { Authorization: 'Bearer ' + config.key } : {}) },
        cache: 'no-store', signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return fail([400,401,403,404].includes(response.status) ? 404 : 503);
      if (Number(response.headers.get('content-length')) > THUMBNAIL_MAX_BYTES) { await response.body?.cancel(); return fail(502); }
      const chunks = []; let bytes = 0;
      for await (const chunk of response.body) {
        bytes += chunk.byteLength;
        if (bytes > THUMBNAIL_MAX_BYTES) throw new Error('THUMBNAIL_TOO_LARGE');
        chunks.push(Buffer.from(chunk));
      }
      const image = Buffer.concat(chunks);
      if (image.length < 12 || image.toString('ascii',0,4) !== 'RIFF' || image.toString('ascii',8,12) !== 'WEBP') return fail(502);
      // ETag/304 is evaluated only after RLS has confirmed current publication.
      return sendContent(req, res, image, { type: 'image/webp' });
    } catch { return fail(503); }
  };
}
export default createJsaThumbnailHandler();
