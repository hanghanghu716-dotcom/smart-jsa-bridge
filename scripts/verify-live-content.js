import assert from 'node:assert/strict';
import { parse } from 'parse5';

// Run against a deployed preview before promotion, and production after release.
const base = (process.argv[2] || 'https://smartjsabridge.com').replace(/\/$/, '');
async function get(route, status = 200) {
  const response = await fetch(base + route, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, status, `${route}: unexpected status`);
  const body = await response.text();
  return { response, body };
}
function all(node, predicate, out = []) {
  if (predicate(node)) out.push(node);
  for (const child of node.childNodes || []) all(child, predicate, out);
  return out;
}
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const index = await get('/sitemap.xml');
assert.match(index.body, /<sitemapindex/);
for (const kind of ['static', 'cases']) assert.ok(index.body.includes(`/sitemap-${kind}.xml`));
const cases = await get('/sitemap-cases.xml');
assert.match(cases.response.headers.get('content-type'), /xml/);
const paths = [...cases.body.matchAll(/<loc>https:\/\/smartjsabridge\.com([^<]+)<\/loc>/g)].map(match => match[1].replace(/&amp;/g, '&'));
assert.ok(paths.length > 0, 'Case sitemap is empty');
// One article per available locale also checks that dynamic routes beat the SPA fallback.
const samples = new Map();
for (const route of paths) if (!samples.has(route.split('/')[1])) samples.set(route.split('/')[1], route);
for (const [locale, route] of samples) {
  const { body } = await get(route);
  const tree = parse(body);
  const scripts = all(tree, n => n.tagName === 'script' && attr(n, 'id') === 'jsa-case-bootstrap');
  assert.equal(scripts.length, 1, `${route}: missing live article`);
  const snapshot = JSON.parse(scripts[0].childNodes[0].value);
  assert.equal(snapshot.path, route);
  assert.ok(snapshot.post.content_md?.trim());
  const canonicals = all(tree, n => n.tagName === 'link' && attr(n, 'rel') === 'canonical');
  assert.equal(canonicals.length, 1);
  assert.equal(attr(canonicals[0], 'href'), 'https://smartjsabridge.com' + route);
  const archive = await get(`/${locale}/archive`);
  assert.match(archive.body, /window\.__CASE_LIST__=/, `${locale}: stale archive`);
  const home = await get(`/${locale}`);
  assert.match(home.body, /window\.__CASE_LIST__=/, `${locale}: stale home`);
  const slash = await get(`/${locale}/`, 308);
  assert.equal(new URL(slash.response.headers.get('location'),base).pathname,`/${locale}`);
}
assert.match((await get('/en-US/feed.xml')).body, /<rss /);
const publicMap = (await get('/sitemap-public.xml')).body;
assert.match(publicMap, /<urlset/);
assert.equal(index.body.includes('/sitemap-public.xml'), publicMap.includes('<url>'), 'Empty public sitemap must not be advertised');
// Verify crawlable public procedure and JHA content after every release.
const publicPaths=[...publicMap.matchAll(/<loc>https:\/\/smartjsabridge\.com([^<]+)<\/loc>/g)].map(match=>match[1]);
for(const route of publicPaths.slice(0,3)) {
  const {body}=await get(route),tree=parse(body);
  assert.equal(all(tree,n=>n.tagName==='h1').length,1,route+': one document title');
  assert.equal(all(tree,n=>n.tagName==='section'&&attr(n,'aria-labelledby')==='procedure-preview-title').length,1,route+': initial procedure HTML');
  assert.equal(all(tree,n=>n.tagName==='script'&&attr(n,'type')==='application/ld+json').length,1,route+': document metadata');
  assert.ok(!all(tree,n=>n.tagName==='meta'&&attr(n,'name')==='robots').some(n=>attr(n,'content').includes('noindex')),route+': indexable public URL');
}
await get('/ko/case-study/nonexistent-live-content-verification', 404);
console.log(`Verified live sitemap, RSS, ${samples.size} locale article/home/archive groups, and missing-article 404.`);
