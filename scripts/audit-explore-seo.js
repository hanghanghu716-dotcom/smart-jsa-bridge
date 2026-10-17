import { parse } from 'parse5';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import process from 'node:process';
import { publicJsaQuality } from '../src/utils/publicJsa.js';
import { exploreSearch } from '../src/utils/discovery.js';

// Public GET requests only: no credentials, database writes or indexing requests.
const SITE = 'https://smartjsabridge.com';
const locale = 'ko';
const output = process.argv[2] || 'artifacts/explore-seo.json';
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
function all(node, predicate) {
  return [...(predicate(node) ? [node] : []), ...(node.childNodes || []).flatMap(child => all(child, predicate))];
}
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).filter(n => !['script', 'style'].includes(n.tagName)).map(text).join(' ');
const scriptData = (tree, name) => {
  const script = all(tree, n => n.tagName === 'script').map(n => n.childNodes?.map(c => c.value || '').join('')).find(value => value?.startsWith(`window.${name}=`));
  if (!script) throw new Error(`Missing ${name} server data`);
  return JSON.parse(script.slice(`window.${name}=`.length).replace(/;\s*$/, ''));
};
async function get(route, userAgent) {
  const url = new URL(route, SITE);
  if (url.origin !== SITE) throw new Error('Unexpected external URL');
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: userAgent ? { 'User-Agent': userAgent } : {} });
      if (response.status >= 500 && attempt < 2) { await response.body?.cancel(); continue; }
      return { status: response.status, contentType: response.headers.get('content-type'), xRobots: response.headers.get('x-robots-tag'), body: await response.text() };
    } catch (error) { lastError = error; }
  }
  throw lastError;
}
function metadata(response) {
  const tree = parse(response.body);
  const meta = name => all(tree, n => n.tagName === 'meta' && attr(n, 'name')?.toLowerCase() === name).map(n => attr(n, 'content'));
  return { tree, status: response.status, xRobots: response.xRobots,
    titles: all(tree, n => n.tagName === 'title').map(text), descriptions: meta('description'), robots: meta('robots'),
    canonical: all(tree, n => n.tagName === 'link' && attr(n, 'rel') === 'canonical').map(n => attr(n, 'href')),
    h1: all(tree, n => n.tagName === 'h1').map(text),
    bodyCharacters: text(all(tree, n => n.tagName === 'main')[0] || {}).replace(/\s/g, '').length };
}
function robotsGroups(body) {
  const groups = []; let current;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim(); const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).toLowerCase(), value = line.slice(colon + 1).trim();
    if (key === 'user-agent') {
      if (!current || current.rules.length) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
    } else if (current && ['allow', 'disallow'].includes(key) && value) current.rules.push({ allow: key === 'allow', path: value });
  }
  return groups;
}
function allowed(groups, agent, pathname) {
  const score = group => Math.max(-1, ...group.agents.map(a => a === '*' ? 0 : agent.toLowerCase().includes(a) ? a.length : -1));
  const best = Math.max(-1, ...groups.map(score));
  const matching = groups.filter(g => score(g) === best).flatMap(g => g.rules).filter(rule => {
    const escaped = rule.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$');
    return new RegExp('^' + escaped).test(pathname);
  }).sort((a, b) => b.path.replace(/\*/g, '').length - a.path.replace(/\*/g, '').length || Number(b.allow) - Number(a.allow));
  return !matching.length || matching[0].allow;
}
const locations = xml => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
const findings = [];
function checks(meta, expected, label) {
  const issues = [];
  if (meta.status !== 200) issues.push(`HTTP ${meta.status}`);
  if (meta.titles.length !== 1 || !meta.titles[0]?.trim()) issues.push('Missing/duplicate title');
  if (meta.descriptions.length !== 1 || !meta.descriptions[0]?.trim()) issues.push('Missing/duplicate description');
  if (meta.canonical.length !== 1 || meta.canonical[0] !== expected) issues.push('Canonical mismatch');
  if (meta.robots.length !== 1 || !/^index,\s*follow$/i.test(meta.robots[0])) issues.push('Not explicitly index,follow');
  if (/noindex|none/i.test(meta.xRobots || '')) issues.push('X-Robots-Tag excludes indexing');
  if (meta.h1.length !== 1 || meta.bodyCharacters < 180) issues.push('Missing/short server-rendered body');
  for (const issue of issues) findings.push({ url: expected, label, issue });
  return issues;
}
const report = { checkedAt: new Date().toISOString(), scope: `${SITE}/${locale}/explore`, note: 'Technical crawl eligibility only; does not establish Google/Bing/Naver index membership.', findings };
try {
  const [robots, index, publicMap, staticMap, feed] = await Promise.all(['/robots.txt', '/sitemap.xml', '/sitemap-public.xml', '/sitemap-static.xml', '/ko/feed.xml'].map(route => get(route)));
  report.endpoints = { robots: robots.status, sitemapIndex: index.status, publicSitemap: publicMap.status, staticSitemap: staticMap.status, rss: feed.status };
  for (const [name, status] of Object.entries(report.endpoints)) if (status !== 200) findings.push({ issue: `${name}: HTTP ${status}` });
  const groups = robotsGroups(robots.body), sitemap = new Set(locations(publicMap.body));
  report.publicSitemapUrls = sitemap.size;
  report.sitemapIndexContainsPublic = locations(index.body).includes(`${SITE}/sitemap-public.xml`);
  report.staticSitemapContainsExplore = locations(staticMap.body).includes(report.scope);
  report.robotsSitemapDeclared = robots.body.includes(`Sitemap: ${SITE}/sitemap.xml`);
  if (!report.sitemapIndexContainsPublic || !report.staticSitemapContainsExplore || !report.robotsSitemapDeclared) findings.push({ issue: 'Missing sitemap discovery link' });
  const documents = new Map(); report.listPages = [];
  let expectedTotal;
  for (let page = 0; page < 100; page++) {
    const route = `/${locale}/explore${exploreSearch({ page })}`;
    const response = await get(route), meta = metadata(response), data = scriptData(meta.tree, '__PUBLIC_EXPLORE__');
    if (page === 0) expectedTotal = data.total;
    const issues = checks(meta, SITE + route, 'list');
    report.listPages.push({ url: SITE + route, rows: data.rows.length, total: data.total, issues });
    const hrefs = new Set(all(meta.tree, n => n.tagName === 'a').map(n => attr(n, 'href')));
    for (const row of data.rows) {
      const url = `${SITE}/${row.public_locale}/public-jsa/${row.id}`;
      if (!hrefs.has(`/${locale}/public-jsa/${row.id}`)) findings.push({ url, issue: 'Missing HTML detail link' });
      documents.set(row.id, { row, url });
    }
    if (!data.hasMore) break;
    if (!hrefs.has(`/${locale}/explore${exploreSearch({ page: page + 1 })}`)) findings.push({ issue: `Missing next-page HTML link from ${route}` });
  }
  report.expectedTotal = expectedTotal; report.discoveredDocuments = documents.size; report.documents = [];
  if (documents.size !== expectedTotal) findings.push({ issue: 'Pagination did not expose all listed documents' });
  const agents = ['Googlebot', 'bingbot', 'Yeti'];
  for (const { row, url } of documents.values()) {
    const response = await get(url), meta = metadata(response), quality = publicJsaQuality(row), issues = checks(meta, url, 'document');
    const inSitemap = sitemap.has(url), inRss = feed.body.includes(url);
    const robotAccess = Object.fromEntries(agents.map(agent => [agent, allowed(groups, agent, new URL(url).pathname)]));
    if (!inSitemap) findings.push({ url, issue: 'Missing from public sitemap' });
    if (Object.values(robotAccess).some(value => !value)) findings.push({ url, issue: 'Blocked by robots.txt' });
    report.documents.push({ url, title: meta.h1[0], status: meta.status, canonical: meta.canonical, robots: meta.robots, xRobots: meta.xRobots, bodyCharacters: meta.bodyCharacters, inSitemap, inRss, robotAccess, quality, issues });
    console.log(JSON.stringify({ url, status: meta.status, robots: meta.robots, inSitemap, inRss, issues }));
  }
  report.userAgentChecks = [];
  for (const agent of agents) for (const url of [report.scope, report.documents[0]?.url].filter(Boolean)) {
    const response = await get(url, agent), meta = metadata(response), issues = checks(meta, url, agent);
    report.userAgentChecks.push({ agent, url, status: response.status, robotsAllowed: allowed(groups, agent, new URL(url).pathname), issues });
  }
  report.summary = { documents: report.documents.length, eligible: report.documents.filter(d => !d.issues.length && d.inSitemap && Object.values(d.robotAccess).every(Boolean)).length,
    rssDocuments: report.documents.filter(d => d.inRss).length, findings: findings.length };
} catch (error) { findings.push({ issue: error.message }); report.failure = error.message; }
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log('SEO_AUDIT_SUMMARY ' + JSON.stringify({ ...report.summary, failure: report.failure, findings }));
if (findings.length) process.exitCode = 1;
