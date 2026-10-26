import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { getPublicSupabaseConfig } from './supabase-config.js';
export const SITE = 'https://smartjsabridge.com';
const { url, key: KEY } = getPublicSupabaseConfig();
const DB = `${url}/rest/v1/`;
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const jsonScript = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
export { casePath } from '../src/utils/caseRouting.js';
export async function readPublic(table, params, fetcher = fetch, { signal } = {}) {
  const response = await fetcher(DB + table + '?' + new URLSearchParams(params), {
    headers: { apikey: KEY }, cache: 'no-store', signal: signal || AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw Object.assign(new Error('PUBLIC_CONTENT_READ_FAILED'), { code: detail.code, status: response.status });
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('INVALID_PUBLIC_CONTENT');
  return rows;
}
// Keyset pagination also works when PostgREST caps results below our requested size.
export async function readAllPublic(table, params, fetcher = fetch, { pageSize = 1000, maxRows = 50000, maxBytes = 32_000_000, timeoutMs = 12000 } = {}) {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 1000) throw new Error('INVALID_PUBLIC_PAGE_SIZE');
  const all = [];
  const signal = AbortSignal.timeout(timeoutMs);
  let bytes = 0;
  let last = '';
  // Bound actual rows and elapsed time, not a guessed number of pages: the
  // database can return fewer rows than the requested page size.
  while (all.length <= maxRows) {
    signal.throwIfAborted();
    const rows = await readPublic(table, { ...params, order: 'id.asc', limit: String(pageSize), ...(last ? { id: 'gt.' + last } : {}) }, fetcher, { signal });
    if (!rows.length) return all;
    const next = rows.at(-1).id;
    if (typeof next !== 'string' || next <= last) throw new Error('INVALID_PUBLIC_PAGINATION');
    bytes += Buffer.byteLength(JSON.stringify(rows));
    if (all.length + rows.length > maxRows || bytes > maxBytes) throw new Error('PUBLIC_CONTENT_LIMIT');
    all.push(...rows); last = next;
  }
  throw new Error('PUBLIC_CONTENT_LIMIT');
}
export const CASE_SUMMARY_FIELDS = 'id,post_group_id,language_code,title,meta_description,created_at,content_updated_at';
export function sendContent(req, res, body, { status = 200, type = 'text/html; charset=utf-8', privateContent = false } = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  // Always revalidate against the database. In particular, never serve withdrawn content stale.
  res.setHeader('Cache-Control', privateContent || status !== 200 ? 'private, no-store' : 'public, max-age=0, must-revalidate');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (status !== 200) res.setHeader('X-Robots-Tag', 'noindex');
  const etag = '"' + createHash('sha256').update(body).digest('hex') + '"';
  if (status === 200 && !privateContent) {
    res.setHeader('ETag', etag);
    if ((req.headers?.['if-none-match'] || '').split(',').some(value => value.trim().replace(/^W\//, '') === etag)) {
      res.statusCode = 304; res.end(); return;
    }
  }
  res.end(req.method === 'HEAD' ? '' : body);
}
export function sendUnavailable(req, res) {
  res.setHeader('Retry-After', '60');
  sendContent(req, res, '<!doctype html><html><head><meta name="robots" content="noindex"></head><body>Temporarily unavailable</body></html>', { status: 503 });
}
