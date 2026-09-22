import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { SUPPORTED_LANGS, getCaseLanguages, selectLocalizedCases } from '../src/locales/config.js';
import { cleanSummary } from '../src/utils/content.js';

export const caseRoute = row => `/${row.language_code}/case-study/${encodeURIComponent(row.post_group_id)}`;
const fields = ['id', 'post_group_id', 'language_code', 'title', 'meta_title', 'meta_description',
  'content_md', 'schema_markup', 'pdf_download_url', 'pdf_list'];

export function contentFingerprint(post) {
  return createHash('sha256').update(JSON.stringify(fields.map(key => post[key] ?? null))).digest('hex');
}

export function buildCaseManifest(rows) {
  const ids = new Set();
  const routes = new Map();
  for (const row of rows) {
    if (!row.id || ids.has(row.id)) throw new Error('Missing or duplicated source ID.');
    ids.add(row.id);
    if (!SUPPORTED_LANGS.includes(row.language_code) || !row.post_group_id || typeof row.content_md !== 'string') {
      throw new Error(`Invalid case-study source row: ${row.id}`);
    }
    routes.set(caseRoute(row), row);
  }
  return [...routes.keys()].sort().map(route => {
    const sample = routes.get(route);
    const candidates = rows.filter(row => row.post_group_id === sample.post_group_id
      && getCaseLanguages(sample.language_code).includes(row.language_code));
    const selected = selectLocalizedCases(candidates, sample.language_code)[0];
    return { route, id: selected.id, fingerprint: contentFingerprint(selected),
      description: cleanSummary(String(selected.meta_description || '').replace(/<[^>]*>/g, ' ')),
      title: selected.meta_title || `${selected.title} | Smart JSA Bridge` };
  });
}

export function extractCaseSnapshot(html) {
  const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    if (/\bid\s*=\s*(?:"jsa-case-bootstrap"|'jsa-case-bootstrap'|jsa-case-bootstrap(?=\s|$))/i.test(match[1])) {
      return JSON.parse(match[2]);
    }
  }
  throw new Error('Article snapshot missing from initial HTML.');
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));
}

const decodeHtml = value => value.replace(/&(?:amp|quot|apos|lt|gt|#39|#x27);/g, entity => ({
  '&amp;': '&', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&#x27;': "'", '&lt;': '<', '&gt;': '>',
}[entity]));

// react-snap's HTML minifier collapses HTML whitespace inside <title>.
// Compare its rendered meaning while keeping the original article hash exact.
const normalizeTitle = value => value.replace(/[\t\n\f\r ]+/g, ' ').trim();

export function verifyCaseHtml(html, expected) {
  const snapshot = extractCaseSnapshot(html);
  if (snapshot.path !== expected.route || snapshot.post?.id !== expected.id
    || contentFingerprint(snapshot.post) !== expected.fingerprint) {
    throw new Error(`Outdated or mismatched article: ${expected.route}`);
  }
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const descriptions = [...head.matchAll(/<meta\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)].map(match => attributes(match[0]))
    .filter(attrs => attrs.name === 'description');
  if (descriptions.length !== 1 || decodeHtml(descriptions[0].content || '') !== expected.description) {
    throw new Error(`Missing, duplicated or stale meta description: ${expected.route}`);
  }
  const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if (titles.length !== 1 || normalizeTitle(decodeHtml(titles[0][1])) !== normalizeTitle(expected.title)) {
    throw new Error(`Missing, duplicated or stale title: ${expected.route}`);
  }
  const canonical = [...head.matchAll(/<link\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)].map(match => attributes(match[0]))
    .filter(attrs => attrs.rel === 'canonical');
  if (canonical.length !== 1 || decodeHtml(canonical[0].href || '') !== `https://smartjsabridge.com${expected.route}`) {
    throw new Error(`Missing or mismatched canonical: ${expected.route}`);
  }
  if (!html.includes(`data-case-study-id="${expected.id}"`)
    && !html.includes(`data-case-study-id=${expected.id}`)) {
    throw new Error(`Rendered article missing: ${expected.route}`);
  }
  return true;
}

export function verifyBuiltCases(manifest, outputDirectory = 'dist') {
  for (const expected of manifest) {
    // react-snap writes encoded route paths under its output directory.
    const filename = `${outputDirectory}${expected.route}/index.html`;
    verifyCaseHtml(fs.readFileSync(filename, 'utf8'), expected);
  }
  return manifest.length;
}
