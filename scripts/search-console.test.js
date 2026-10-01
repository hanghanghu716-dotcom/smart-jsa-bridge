import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { syncRange, googleToken, fetchGoogle, googleRows, bingDay, bingRows, jsonRequest, runSync, DISCOVERY_FILTER } from './lib/search-console.js';
import { getSearchConsoleUi } from '../src/locales/searchConsoleUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

const response = data => ({ ok: true, json: async () => data });
test('backfill and daily intervals use Pacific dates across a UTC month boundary', () => {
 assert.deepEqual(syncRange(new Date('2026-10-01T00:30:00Z'), true), { start: '2025-10-01', end: '2026-09-27' });
 const range = syncRange(new Date('2026-10-01T00:30:00Z'));
 assert.equal((Date.parse(range.end) - Date.parse(range.start)) / 86400000, 44);
});
test('service account JWT is signed and restricted to readonly Search Console', async () => {
 const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
 const credentials = { type: 'service_account', client_email: 'test@example.invalid', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }), token_uri: 'https://evil.invalid/' };
 await googleToken(credentials, async (url, options) => {
  assert.equal(url, 'https://oauth2.googleapis.com/token');
  const assertion = new URLSearchParams(options.body).get('assertion');
  const [header, payload, signature] = assertion.split('.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url'));
  assert.equal(claims.scope, 'https://www.googleapis.com/auth/webmasters.readonly');
  assert.equal(claims.exp - claims.iat, 3600);
  assert.ok(createVerify('RSA-SHA256').update(`${header}.${payload}`).verify(publicKey, signature, 'base64url'));
  return response({ access_token: 'fake-token' });
 });
});
test('Google collects separate site and library totals without query/page dimension truncation', async () => {
 const bodies = [];
 const rows = await fetchGoogle({ token: 'token', property: 'sc-domain:smartjsabridge.com', range: { start: '2026-09-01', end: '2026-09-20' } }, async (url, options) => {
  assert.match(url, /sc-domain%3Asmartjsabridge.com/); bodies.push(JSON.parse(options.body));
  return response({ rows: [{ keys: ['2026-09-10'], clicks: 2, impressions: 10 }] });
 });
 assert.deepEqual(rows.map(r => r.scope), ['site', 'discovery']);
 assert.deepEqual(bodies[0].dimensions, ['date']); assert.equal(bodies[0].dataState, 'final');
 assert.equal(bodies[0].dimensionFilterGroups, undefined);
 const pattern = new RegExp(DISCOVERY_FILTER);
 for (const path of ['/ko/explore', '/en-CA-AB/explore?page=2', '/ko/public-jsa/01234567-abcd-1234-1234-abcdef123456']) assert.ok(pattern.test('https://smartjsabridge.com' + path));
 for (const url of ['https://evil.com/ko/explore', 'https://smartjsabridge.com/ko/community?url=/ko/explore', 'https://smartjsabridge.com/ko/explore-bad']) assert.equal(pattern.test(url), false);
});
test('Google rejects invalid, duplicate and out of range rows; missing rows are not invented', () => {
 const range = { start: '2026-09-01', end: '2026-09-30' };
 assert.deepEqual(googleRows({}, 'site', range), []);
 for (const row of [{ keys: ['2026-02-30'], clicks: 1, impressions: 2 }, { keys: ['2026-09-01'], clicks: -1, impressions: 2 }, { keys: ['2026-10-01'], clicks: 1, impressions: 2 }]) assert.throws(() => googleRows({ rows: [row] }, 'site', range));
 const row = { keys: ['2026-09-01'], clicks: 1, impressions: 2 };
 assert.throws(() => googleRows({ rows: [row, row] }, 'site', range));
});
test('Bing retains provider date and all-vertical counts', () => {
 assert.equal(bingDay('/Date(1316156400000-0700)/'), '2011-09-16');
 assert.equal(bingDay('/Date(0-0700)/'), '1969-12-31');
 assert.equal(bingDay('2026-09-01T00:00:00-07:00'), '2026-09-01');
 assert.deepEqual(bingRows({ d: [{ Date: '2026-09-01', Clicks: 0, Impressions: 2 }] }), [{ day: '2026-09-01', scope: 'site', clicks: 0, impressions: 2 }]);
 assert.throws(() => bingRows({ ErrorCode: 1 }));
});
test('network and provider errors never expose URL secrets or response bodies', async () => {
 for (const fetcher of [async () => { throw Error('SECRET'); }, async () => ({ ok: false, status: 403, text: async () => 'SECRET' })]) {
  await assert.rejects(jsonRequest('https://example.invalid/?apikey=SECRET', {}, fetcher), error => !error.message.includes('SECRET'));
 }
});
test('provider failure records status without replacing data; other provider can succeed', async () => {
 const saved = [], logs = [];
 const results = await runSync({ env: { SUPABASE_URL: 'https://aajvezmhyrdawxxbulqz.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', SEARCH_METRICS_INGEST_TOKEN: 'a'.repeat(64), GOOGLE_SERVICE_ACCOUNT_JSON: 'bad-json', GOOGLE_SEARCH_CONSOLE_PROPERTY: 'sc-domain:smartjsabridge.com', BING_WEBMASTER_API_KEY: 'SECRET' }, now: new Date('2026-10-01'), report: value => logs.push(value), fetcher: async (url, options) => {
  if (String(url).includes('/rest/')) { assert.ok(url.endsWith('/rpc/ingest_search_metrics_token')); assert.equal(options.headers.Authorization, undefined); assert.equal(options.headers.apikey, 'sb_publishable_test'); assert.equal(JSON.parse(options.body).p_token, 'a'.repeat(64)); saved.push(JSON.parse(options.body).p_payload); return response({ ok: true }); }
  return response({ d: [{ Date: '2026-09-01', Clicks: 4, Impressions: 20 }] });
 } });
 assert.deepEqual(results, [{ provider: 'google', ok: false }, { provider: 'bing', ok: true }]);
 assert.equal(saved[0].status, 'error'); assert.equal(saved[0].rows, undefined);
 assert.equal(saved[1].rows[0].clicks, 4); assert.ok(logs.every(message => !message.includes('SECRET')));
});
test('unconfigured providers fail clearly, and unexpected database hosts are rejected', async () => {
 await assert.rejects(runSync({ env: { SUPABASE_URL: 'https://evil.invalid', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', SEARCH_METRICS_INGEST_TOKEN: 'a'.repeat(64) } }), /CONFIG_ERROR/);
 await assert.rejects(runSync({ env: { SUPABASE_URL: 'https://aajvezmhyrdawxxbulqz.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', SEARCH_METRICS_INGEST_TOKEN: 'a'.repeat(64) } }), /NOT_CONFIGURED/);
});
test('search integrations have complete labels across supported locales', () => {
 for (const locale of SUPPORTED_LANGS) for (const [key, value] of Object.entries(getSearchConsoleUi(locale))) assert.ok(value?.trim(), `${locale}:${key}`);
});

test('database admin credentials cannot substitute for scoped ingestion credentials', async () => {
 await assert.rejects(runSync({ env: { SUPABASE_URL: 'https://aajvezmhyrdawxxbulqz.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'admin-secret' } }), /CONFIG_ERROR/);
});
