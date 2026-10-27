import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { detectLanguage, normalizeLocale, getLanguageTag, getDataLocale, getCaseLanguages, LANGUAGE_OPTIONS } from '../src/locales/config.js';
import { workContext, WORK_JURISDICTIONS, REGIONAL_FORM_JURISDICTIONS } from '../src/utils/workJurisdiction.js';
import { regionalTemplates, createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { journeyContext, newJourneyState } from '../src/utils/regionalJourney.js';
import { buildSitemap } from './sitemap-data.js';
import { staticRoutes } from './static-routes.js';
import { renderCaseHtml, createCaseHandler } from '../api/case-study.js';
import { renderIndexHtml } from '../api/content-index.js';
import { buildFeed } from '../api/content-feed.js';
import { readKnowledgeCoverage } from './recommendation-coverage.js';
import { GUIDE_CATEGORIES, makeGuide, guideVersion } from '../src/utils/guideContent.js';

import { getCohortNote } from '../src/locales/discoveryUi.js';
import { getSearchConsoleUi } from '../src/locales/searchConsoleUi.js';

const read = (locale, file) => JSON.parse(fs.readFileSync(new URL(`../src/locales/${locale}/${file}`, import.meta.url)));
const leaves = (value, prefix = '', result = {}) => {
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) leaves(child, prefix + '.' + key, result);
  else result[prefix] = value;
  return result;
};
const tokens = text => [...String(text).matchAll(/\{\{[^}]+\}\}|\{\w+\}/g)].map(m => m[0]).sort();
const markup = text => [...String(text).matchAll(/<\/?[a-z][^>]*>/gi)].map(m => m[0]).sort();

test('Romanian resources preserve every nonempty English namespace, leaf, interpolation and HTML token', () => {
  const files = fs.readdirSync('src/locales/en-US').filter(file => file.endsWith('.json') && fs.statSync('src/locales/en-US/' + file).size);
  assert.equal(files.length, 27);
  assert.notEqual(getCohortNote('ro-RO'), getCohortNote('en-US'));
  assert.notEqual(getSearchConsoleUi('ro-RO').help, getSearchConsoleUi('en-US').help);
  for (const file of files) {
    const en = leaves(read('en-US', file)), ro = leaves(read('ro-RO', file));
    for (const [key, value] of Object.entries(en)) {
      assert.ok(key in ro, `${file}${key}`);
      assert.equal(typeof ro[key], typeof value, `${file}${key} type`);
      assert.deepEqual(tokens(ro[key]), tokens(value), `${file}${key} tokens`);
      assert.deepEqual(markup(ro[key]), markup(value), `${file}${key} markup`);
      if (typeof value === 'string' && value.trim()) assert.ok(ro[key].trim(), `${file}${key} empty`);
    }
    assert.doesNotMatch(JSON.stringify(Object.values(ro)), /[가-힣]|\uFFFD|\\\\n/u, file);
  }
});

test('Romanian selection, browser language and data requests retain Romania identity', () => {
  for (const code of ['ro', 'ro-RO', 'ro-ro', 'RO']) { assert.equal(detectLanguage(code), 'ro-RO'); assert.equal(normalizeLocale(code), 'ro-RO'); }
  assert.ok(LANGUAGE_OPTIONS.some(row => row.code === 'ro-RO' && row.label === 'Română (România)'));
  assert.equal(getLanguageTag('ro-RO'), 'ro-RO'); assert.equal(getDataLocale('ro-RO'), 'ro-RO');
  assert.deepEqual(getCaseLanguages('ro-RO'), ['ro-RO']);
  assert.equal(WORK_JURISDICTIONS.find(row => row.id === 'RO').locale, 'ro-RO');
  const context = journeyContext('ro-RO'); assert.equal(context.jurisdiction, 'RO');
  const state = newJourneyState(context); assert.deepEqual(state.analysisData, []); assert.equal(state.formData.context.documentLocale, 'ro-RO');
});

test('Romanian UI never invents reviewed regional starter forms or recommendation knowledge', async () => {
  assert.ok(!REGIONAL_FORM_JURISDICTIONS.some(row => row.id === 'RO'));
  for (const context of [{ jurisdiction: 'RO', documentLocale: 'ro-RO' }, { jurisdiction: 'RO', documentLocale: 'en-US' }, { jurisdiction: 'US', documentLocale: 'ro-RO' }]) {
    assert.deepEqual(regionalTemplates(context), []);
    assert.throws(() => createRegionalTemplate('risk_assessment', context), /UNAVAILABLE/);
    assert.equal(workContext(context).jurisdiction, context.jurisdiction);
  }
  const row = (await readKnowledgeCoverage()).coverage.find(row => row.locale === 'ro-RO');
  assert.equal(row.tasks.length,3);
  assert.ok(row.tasks.every(task => task.guidanceUnits === 1 && task.draftUnits === 1));
  assert.ok(row.tasks.every(task => task.publicationEligible === 0 && task.requiresLocalSourceReview));
});

const post = { id: 'SYNTHETIC-RO', post_group_id: 'SYNTHETIC-RO-TEST', language_code: 'ro-RO', title: 'Verificarea unei conducte', meta_description: 'Exemplu sintetic pentru testarea interfeței.', content_md: '## Exemplu sintetic\n\nMaterial de test, fără aprobare tehnică.\n\n| Etapă | Măsură |\n|---|---|\n| Pregătire | Verificare |', created_at: '2026-10-15T00:00:00Z', pdf_list: [{ name: 'Document de test', url: 'https://example.com/synthetic-ro.pdf' }] };
const shell = '<!doctype html><html><head></head><body><div id="root"></div></body></html>';
test('Romanian initial article, archive, feed and sitemap use exact Romanian content and canonical links', () => {
  const html = renderCaseHtml(shell, post, 'ro-RO', ['ro-RO']);
  assert.match(html, /lang="ro-RO"/); assert.match(html, /hreflang="ro-RO"/);
  assert.match(html, /Studii de caz/); assert.match(html, /synthetic-ro\.pdf/); assert.match(html, /<table>/);
  const archive = renderIndexHtml('<html><head></head><body><div data-live-case-list="archive"></div></body></html>', [post], 'ro-RO', 'archive');
  assert.match(archive, /15\.10\.2026/); assert.match(archive, /1 materiale/); assert.doesNotMatch(archive, /document-paper|document-preview-badge/);
  const feed = buildFeed([post], [], 'ro-RO'); assert.match(feed, /<language>ro-RO<\/language>/); assert.match(feed, /Studii de caz recente/); assert.match(feed, /Exemplu sintetic/);
  const sitemap = buildSitemap([post]); assert.match(sitemap, /\/ro-RO\/case-study\/SYNTHETIC-RO-TEST/);
  assert.ok(staticRoutes([]).includes('/ro-RO/archive'));
});

test('missing Romanian case content returns 404 instead of borrowing another language', async () => {
  const response = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = body; } };
  await createCaseHandler({ fetcher: async url => Response.json(new URL(url).searchParams.has('id') ? [] : [{ ...post, language_code: 'en-US' }]), readShell: async () => shell })({ query: { lng: 'ro-RO', slug: post.post_group_id } }, response);
  assert.equal(response.statusCode, 404);
});

test('all six Romanian guides share their HTML/PDF edition and only Romanian scope references', () => {
  assert.equal(guideVersion('ro-RO'), '2026-10-15'); assert.equal(guideVersion('en-US'), '2026-10-03');
  for (const [category, resource] of Object.entries(GUIDE_CATEGORIES)) {
    const guide = makeGuide('ro-RO', category, read('ro-RO', resource + '.json'));
    assert.match(guide.pdfUrl, /\/ro-RO\/.*-2026-10-15\.pdf$/);
    assert.deepEqual(guide.documents, []);
    assert.ok(guide.sources.every(source => /legislatie\.just\.ro|inspectiamuncii\.ro/.test(source.url)));
  }
});

