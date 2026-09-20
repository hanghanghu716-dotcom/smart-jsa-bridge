import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanSummary, dictionarySearchFilter, parseKeywords, serializeStructuredData } from '../src/utils/content.js';
import { buildSitemap, loadCaseRows } from './sitemap-data.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { getSiteUi } from '../src/locales/siteUi.js';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('keyword notes are excluded while useful summaries and source values stay intact', () => {
  for (const suffix of [' Target Keywords: scaffold, safety', ' [Keywords: scaffold]', ' <keyword> Target Keywords: scaffold']) {
    const input = 'A practical scaffold guide.' + suffix;
    assert.equal(cleanSummary(input), 'A practical scaffold guide.');
    assert.ok(input.endsWith(suffix));
  }
  assert.equal(cleanSummary('Work with keywords in a document.'), 'Work with keywords in a document.');
});

test('dictionary search quotes punctuation and escapes wildcard characters', () => {
  assert.equal(dictionarySearchFilter('crane'), ['hazard_name', 'measure_text', 'solution_text'].map(key => key + '.ilike."%crane%"').join(','));
  const filter = dictionarySearchFilter('x",locale.eq.ko),_%*\\');
  assert.ok(filter.includes('x\\",locale.eq.ko),\\_\\%\\*\\\\'));
  assert.equal(parseKeywords('{"oops":1}').length, 1);
  assert.deepEqual(parseKeywords('["PPE"," PPE ",null,2]'), ['PPE']);
  assert.deepEqual(parseKeywords('[bad'), []);
});

test('JSON-LD accepts objects or serialized objects, rejects invalid JSON and escapes script boundaries', () => {
  const value = { '@type': 'Article', name: '</script><script>bad()</script>' };
  for (const input of [value, JSON.stringify(value)]) {
    const output = serializeStructuredData(input);
    assert.deepEqual(JSON.parse(output), value);
    assert.ok(!output.includes('</script>'));
  }
  assert.equal(serializeStructuredData('invalid'), null);
  assert.equal(serializeStructuredData('"just a string"'), null);
});

test('sitemap emits unique real language variants with safe URLs', () => {
  const row = { post_group_id: 'pipes & tanks', language_code: 'ko' };
  const xml = buildSitemap([row, row, { ...row, language_code: 'en-US' }]);
  assert.equal(xml.match(/<loc>https:\/\/smartjsabridge.com\/ko\/case-study\/pipes%20%26%20tanks<\/loc>/g).length, 1);
  assert.ok(xml.includes('/en-US/case-study/pipes%20%26%20tanks'));
  assert.ok(!xml.includes('/de-DE/case-study/'));
  for (const locale of SUPPORTED_LANGS) {
    assert.ok(xml.includes('<loc>https://smartjsabridge.com/' + locale + '/archive</loc>'));
    for (const value of Object.values(getSiteUi(locale))) assert.ok(value);
  }
});

test('sitemap paginates past 1,000 records and propagates DB failures', async () => {
  const pages = [];
  const client = { from: () => ({
    select() { return this; }, order() { return this; },
    async range(from, to) {
      pages.push([from, to]);
      return { data: Array.from({ length: from === 0 ? 1000 : 2 }, (_, i) => ({ post_group_id: String(from + i), language_code: 'ko' })) };
    },
  }) };
  assert.equal((await loadCaseRows(client)).length, 1002);
  assert.deepEqual(pages, [[0, 999], [1000, 1999]]);
  const errorClient = { from: () => ({
    select() { return this; }, order() { return this; },
    async range() { return { error: new Error('offline') }; },
  }) };
  await assert.rejects(loadCaseRows(errorClient), /offline/);
});

test('MobileGuard renders each page once and allows mobile archive access', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: MobileGuard } = await server.ssrLoadModule('/src/MobileGuard.jsx');
    for (const path of ['/en-US', '/ko/privacy', '/ar-SA/case-study/demo', '/en-US/archive', '/en-US/analysis']) {
      const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] },
        React.createElement(MobileGuard, null, React.createElement('main', { 'data-page-marker': 'one' }, 'content'))));
      assert.equal((html.match(/data-page-marker/g) || []).length, 1, path);
      if (path.endsWith('/archive')) assert.ok(!html.includes('PC 전용'));
    }
  } finally { await server.close(); }
});
