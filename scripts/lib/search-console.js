import { createSign } from 'node:crypto';
import { Buffer } from 'node:buffer';

const DAY = 86400000;
export const DISCOVERY_FILTER = '^https://smartjsabridge\\.com/[A-Za-z-]+/(explore(/)?([?].*)?$|public-jsa/[0-9a-fA-F-]+(/)?([?].*)?$)';
export class SyncError extends Error {
  constructor(code) { super(code); this.code = code; }
}
export function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new SyncError('INVALID_RESPONSE');
  return value;
}
export function syncRange(now = new Date(), backfill = false) {
  // Search Console reports dates in Pacific Time, not the dashboard's UTC cohort time.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const end = new Date(Date.parse(today) - 3 * DAY);
  const start = backfill ? new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1)) : new Date(end.getTime() - 44 * DAY);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
export async function jsonRequest(url, options = {}, fetcher = fetch) {
  // Neither response bodies nor URLs (Bing includes its API key) may reach logs.
  let response;
  try { response = await fetcher(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(30000) }); }
  catch { throw new SyncError('NETWORK_ERROR'); }
  if (!response.ok) throw new SyncError([401, 403].includes(response.status) ? 'AUTH_ERROR' : response.status === 429 ? 'RATE_LIMIT' : 'PROVIDER_ERROR');
  try { return await response.json(); } catch { throw new SyncError('INVALID_RESPONSE'); }
}
export async function googleToken(credentials, fetcher = fetch, now = Date.now()) {
  if (credentials?.type !== 'service_account' || !credentials.client_email || !credentials.private_key) throw new SyncError('CONFIG_ERROR');
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const issued = Math.floor(now / 1000);
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: credentials.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: issued, exp: issued + 3600 })}`;
  let signature;
  try { signature = createSign('RSA-SHA256').update(unsigned).sign(credentials.private_key, 'base64url'); }
  catch { throw new SyncError('CONFIG_ERROR'); }
  const token = await jsonRequest('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }).toString() }, fetcher);
  if (typeof token.access_token !== 'string' || !token.access_token) throw new SyncError('INVALID_RESPONSE');
  return token.access_token;
}
function count(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1e12) throw new SyncError('INVALID_RESPONSE');
  return value;
}
export function googleRows(data, scope, range) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.error || (data.rows !== undefined && !Array.isArray(data.rows))) throw new SyncError('INVALID_RESPONSE');
  const seen = new Set();
  return (data.rows || []).map(row => {
    const day = dateOnly(row.keys?.[0]);
    if (day < range.start || day > range.end || seen.has(day)) throw new SyncError('INVALID_RESPONSE');
    seen.add(day);
    return { day, scope, clicks: count(row.clicks), impressions: count(row.impressions) };
  });
}
export async function fetchGoogle({ token, property, range }, fetcher = fetch) {
  if (!['sc-domain:smartjsabridge.com', 'https://smartjsabridge.com/'].includes(property)) throw new SyncError('CONFIG_ERROR');
  const rows = [];
  for (const scope of ['site', 'discovery']) {
    const body = { startDate: range.start, endDate: range.end, dimensions: ['date'], type: 'web', dataState: 'final', aggregationType: 'auto', rowLimit: 1000 };
    if (scope === 'discovery') body.dimensionFilterGroups = [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'includingRegex', expression: DISCOVERY_FILTER }] }];
    const data = await jsonRequest(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, fetcher);
    rows.push(...googleRows(data, scope, range));
  }
  return rows;
}
export function bingDay(value) {
  if (typeof value !== 'string') throw new SyncError('INVALID_RESPONSE');
  const match = /^\/Date\((-?\d+)([+-]\d{4})?\)\/$/.exec(value);
  if (!match) return dateOnly(value.slice(0, 10));
  const zone = match[2];
  const offset = zone ? (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(3))) * (zone[0] === '-' ? -1 : 1) : 0;
  const time = new Date(Number(match[1]) + offset * 60000);
  if (!Number.isFinite(time.getTime())) throw new SyncError('INVALID_RESPONSE');
  return time.toISOString().slice(0, 10);
}
export function bingRows(data) {
  if (!Array.isArray(data?.d)) throw new SyncError('INVALID_RESPONSE');
  const seen = new Set();
  return data.d.map(row => {
    const day = bingDay(row.Date);
    if (seen.has(day)) throw new SyncError('INVALID_RESPONSE');
    seen.add(day);
    return { day, scope: 'site', clicks: count(row.Clicks), impressions: count(row.Impressions) };
  });
}
export async function fetchBing({ apiKey, property }, fetcher = fetch) {
  if (property !== 'https://smartjsabridge.com/' || !apiKey) throw new SyncError('CONFIG_ERROR');
  const url = new URL('https://ssl.bing.com/webmaster/api.svc/json/GetRankAndTrafficStats');
  url.search = new URLSearchParams({ siteUrl: property, apikey: apiKey }).toString();
  return bingRows(await jsonRequest(url, {}, fetcher));
}
export async function runSync({ env, backfill = false, fetcher = fetch, now = new Date(), report = () => {} }) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  const token = env.SEARCH_METRICS_INGEST_TOKEN;
  if (url !== 'https://aajvezmhyrdawxxbulqz.supabase.co' || !key?.startsWith('sb_publishable_') || !/^[0-9a-f]{64}$/.test(token || '')) throw new SyncError('CONFIG_ERROR');
  const save = payload => jsonRequest(`${url}/rest/v1/rpc/ingest_search_metrics_token`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_token: token, p_payload: payload }) }, fetcher);
  const results = [];
  for (const provider of ['google', 'bing']) {
    const enabled = provider === 'google' ? Boolean(env.GOOGLE_SERVICE_ACCOUNT_JSON) : Boolean(env.BING_WEBMASTER_API_KEY);
    if (!enabled) { report(`${provider}: NOT_CONFIGURED`); continue; }
    const property = provider === 'google' ? env.GOOGLE_SEARCH_CONSOLE_PROPERTY : (env.BING_SITE_URL || 'https://smartjsabridge.com/');
    try {
      const range = syncRange(now, backfill);
      let rows;
      if (provider === 'google') {
        let credentials;
        try { credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON); } catch { throw new SyncError('CONFIG_ERROR'); }
        const token = await googleToken(credentials, fetcher, now.getTime());
        rows = await fetchGoogle({ token, property, range }, fetcher);
      } else rows = (await fetchBing({ apiKey: env.BING_WEBMASTER_API_KEY, property }, fetcher)).filter(r => r.day >= range.start && r.day <= range.end);
      await save({ provider, property, status: 'success', start: range.start, end: range.end, rows });
      results.push({ provider, ok: true });
      report(`${provider}: SUCCESS (${rows.length} daily records)`);
    } catch (error) {
      const code = error instanceof SyncError ? error.code : 'CONFIG_ERROR';
      try { await save({ provider, property, status: 'error', code }); } catch { /* runner exit still reports failure */ }
      results.push({ provider, ok: false });
      report(`${provider}: ${code}`);
    }
  }
  if (!results.length) throw new SyncError('NOT_CONFIGURED');
  return results;
}
