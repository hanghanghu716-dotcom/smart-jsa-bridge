import assert from 'node:assert/strict';
import { getPublicSupabaseConfig } from '../server/supabase-config.js';

const base = (process.argv[2] || 'https://smartjsabridge.com').replace(/\/$/, '');
const request = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
const region = await request(base + '/api/privacy-region');
assert.equal(region.status, 200, 'Regional privacy endpoint must be deployed');
assert.match(region.headers.get('cache-control') || '', /no-store/);
assert.equal(typeof (await region.json()).requiresConsent, 'boolean');
const page = await request(base + '/ko/community');
assert.equal(page.status, 200);
assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
assert.equal(page.headers.get('x-frame-options'), 'SAMEORIGIN');
assert.match(page.headers.get('content-security-policy') || '', /frame-ancestors 'self'/);

const gateway = body => request(base + '/api/public-gateway', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
assert.equal((await gateway({ action: 'case_view', payload: null })).status, 400);
// A nonexistent receipt proves the deployed server key can reach the limited
// database gateway without creating a view count or submitting a real ticket.
const missing = await gateway({ action: 'support_status', payload: {
  id: '00000000-0000-0000-0000-000000000000', receipt: '0'.repeat(64),
} });
assert.equal(missing.status, 404, 'Production gateway key/migration must be connected');
assert.deepEqual(await missing.json(), { error: 'NOT_FOUND' });

const config = getPublicSupabaseConfig();
const direct = (resource, body) => request(config.url + '/rest/v1/' + resource, {
  method: body ? 'POST' : 'GET', headers: { apikey: config.key, 'Content-Type': 'application/json' },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
for (const [resource, body] of [
  ['rpc/record_case_study_view', { p_case_id: '00000000-0000-0000-0000-000000000000' }],
  ['profile_preferences?select=user_id&limit=1', null],
]) {
  assert.ok([401, 403].includes((await direct(resource, body)).status), 'Anonymous private/write access must be rejected');
}
console.log('Verified production security headers, regional privacy, limited gateway and anonymous access boundaries. No views or support tickets created.');
