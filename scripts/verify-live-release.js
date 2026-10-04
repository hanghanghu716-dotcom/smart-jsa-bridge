import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { GUIDE_CATEGORIES } from '../src/utils/guideContent.js';

export function checkManifest(actual, expected) {
  const count = SUPPORTED_LANGS.length * Object.keys(GUIDE_CATEGORIES).length;
  if (!Array.isArray(actual) || actual.length !== count || new Set(actual.map(g => g.route)).size !== count) throw Error('LIVE_MANIFEST_INCOMPLETE');
  for (const locale of SUPPORTED_LANGS) for (const category of Object.keys(GUIDE_CATEGORIES)) {
    const item = actual.find(g => g.route === `/${locale}/guideline/${category}`);
    if (!item || item.locale !== locale || !new RegExp(`^/assets/guides/${locale}/${category}-[0-9-]+\\.pdf$`).test(item.pdf) || !/^[a-f0-9]{64}$/.test(item.sha256)) throw Error('LIVE_MANIFEST_INVALID');
  }
  if (expected && (expected.length !== actual.length || expected.some(g => !actual.some(a => a.route === g.route && a.pdf === g.pdf && a.sha256 === g.sha256)))) throw Error('LIVE_RELEASE_NOT_CURRENT');
}
export async function verifyLiveRelease({ base = 'https://smartjsabridge.com', expected, fetcher = fetch } = {}) {
  const get = async path => {
    const r = await fetcher(base + path, { signal: AbortSignal.timeout(30000), redirect: 'error', headers: { 'Cache-Control': 'no-cache' } });
    if (!r.ok) throw Error(`HTTP_${r.status}: ${path}`);
    return r;
  };
  const manifest = await (await get('/assets/guides/manifest.json')).json();
  checkManifest(manifest, expected);
  const failures = [], queue = [...manifest]; let verified = 0;
  await Promise.all(Array.from({length:4}, async () => {
    while (queue.length) {
      const g = queue.shift();
      try {
        const html = await (await get(g.route)).text();
        if (!html.includes('id="guide-document"') || !html.includes(`data-guide-locale="${g.locale}"`) || !html.includes(g.pdf) || !html.includes('application/ld+json')) throw Error('INITIAL_HTML_MISSING');
        const response = await get(g.pdf), pdf = Buffer.from(await response.arrayBuffer());
        if (!response.headers.get('content-type')?.includes('application/pdf') || pdf.subarray(0,5).toString() !== '%PDF-' || createHash('sha256').update(pdf).digest('hex') !== g.sha256) throw Error('PDF_MISMATCH');
        verified++;
      } catch (error) { failures.push({route:g.route,error:error.message}); }
    }
  }));
  try {
    const r = await get('/ko/explore'), html = await r.text();
    if (!html.includes('window.__PUBLIC_EXPLORE__=') || !r.headers.get('cache-control')?.includes('no-store')) throw Error('EXPLORE_DELIVERY');
    for (const route of ['/ko/work-packages','/ko/business','/ko/library']) await get(route);
  } catch (error) { failures.push({route:'entry routes',error:error.message}); }
  return { checkedAt:new Date().toISOString(),verified,total:manifest.length,failures };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2], expected = path ? JSON.parse(fs.readFileSync(path,'utf8')) : undefined;
  const result = await verifyLiveRelease({expected});
  console.log(JSON.stringify(result,null,2));
  if (result.failures.length) process.exitCode = 1;
}
