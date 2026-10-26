import { createRemoteJWKSet, jwtVerify } from 'npm:jose@6.1.0';
import { createHandler } from './handler.js';
import { AUDIENCE } from './policy.js';

const issuer = 'https://token.actions.githubusercontent.com';
const keys = createRemoteJWKSet(new URL(issuer + '/.well-known/jwks'));
const url = Deno.env.get('SUPABASE_URL')!;
const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers = (key: string) => ({ apikey: key, Authorization: 'Bearer ' + key });
const fetchOk = async (path: string, init: RequestInit) => {
  const response = await fetch(url + path, { ...init, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('UPSTREAM_' + response.status);
  return response;
};

Deno.serve(createHandler({
  authenticate: async (request: Request) => {
    const token = (request.headers.get('authorization') || '').replace(/^Bearer /, '');
    const { payload } = await jwtVerify(token, keys, { issuer, audience: AUDIENCE,
      algorithms: ['RS256'], maxTokenAge: '10m', requiredClaims: ['exp', 'iat', 'sub'] });
    return payload;
  },
  publicRow: async (id: string) => {
    const query = new URLSearchParams({ select: 'id,is_public,revision,assessment', id: 'eq.' + id, is_public: 'eq.true', limit: '1' });
    const response = await fetchOk('/rest/v1/public_jsa_cards?' + query, { headers: headers(anon) });
    return (await response.json())[0] || null;
  },
  upload: async (path: string, bytes: Uint8Array) => {
    const response = await fetch(url + '/storage/v1/object/jsa-thumbnails/' + path, {
      method: 'POST', headers: { ...headers(service), 'Content-Type': 'image/webp', 'Cache-Control': 'max-age=0', 'x-upsert': 'false' },
      body: bytes, signal: AbortSignal.timeout(15000),
    });
    if (response.ok) { await response.arrayBuffer(); return; }
    const error = await response.json().catch(() => ({}));
    if (response.status !== 409 && String(error.statusCode) !== '409' && error.error !== 'Duplicate') throw new Error('UPLOAD_FAILED');
  },
  save: async (asset: Record<string, unknown>) => {
    const response = await fetchOk('/rest/v1/jsa_thumbnail_assets?on_conflict=project_id', {
      method: 'POST', headers: { ...headers(service), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(asset),
    });
    await response.arrayBuffer();
  },
}));
