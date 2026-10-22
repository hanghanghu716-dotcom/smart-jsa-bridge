import test from 'node:test';
import assert from 'node:assert/strict';
import { createExploreHandler, renderExploreHtml } from '../api/explore.js';
import { exploreQuery, exploreSearch } from '../src/utils/discovery.js';
import { EXPLORE_VIEWS, explorePageSize, changeExploreView } from '../src/utils/exploreView.js';
import { exploreIndexable, indexableExploreLocales } from '../src/utils/exploreIndexing.js';
import { getExploreViewUi } from '../src/locales/exploreViewUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

const shell = '<html><head></head><body><div id="root"></div></body></html>';
const row = {
  id: '10000000-0000-4000-8000-000000000001', title: 'Valve isolation procedure',
  is_public: true, public_country: 'US', public_locale: 'en-US', assessment: { checked: true },
  reuse_license: 'community-v1', created_at: '2026-10-01T00:00:00Z', published_at: '2026-10-01T00:00:00Z',
  analysis_data: Array.from({ length: 3 }, (_, i) => ({
    proc: { stepTitle: 'Isolation step ' + i, stepDetail: 'Confirm the equipment identification, isolation boundary and work area before proceeding.' },
    risks: [{ factor: 'Unexpected energy release during maintenance.', measure: 'Isolate the supply and verify the absence of stored energy.' }],
  })),
};
const response = () => ({ setHeader() {}, end(body) { this.body = body; } });
const bootstrap = html => JSON.parse(html.match(/window\.__PUBLIC_EXPLORE__=(.*?);<\/script>/s)[1]);

test('view URLs round-trip and ignore arbitrary page sizes or unrecognized modes', () => {
  for (const [view, size] of Object.entries(EXPLORE_VIEWS)) {
    const query = exploreQuery('?view=' + view + '&country=KR&author=operator&q=valve&tag=gas&sort=views&page=3');
    assert.deepEqual(exploreQuery(exploreSearch(query)), query);
    assert.equal(explorePageSize(query.view), size);
  }
  for (const view of ['unknown', '__proto__', 'constructor', '9999']) {
    assert.equal(explorePageSize(view), 12);
    assert.equal(exploreQuery('?view=' + view + '&pageSize=9999').view, undefined);
  }
});

test('switching view retains filters and the first visible result within the destination page', () => {
  for (const before of Object.keys(EXPLORE_VIEWS)) for (const after of Object.keys(EXPLORE_VIEWS)) {
    const current = { ...exploreQuery('?q=valve&tag=gas&country=US&author=operator&sort=reused&page=7'), view: before };
    const next = changeExploreView(current, after), first = current.page * explorePageSize(before);
    assert.equal(next.search, current.search); assert.deepEqual(next.tags, current.tags);
    assert.equal(next.country, current.country); assert.equal(next.author, current.author); assert.equal(next.sort, current.sort);
    assert.ok(next.page * explorePageSize(after) <= first);
    assert.ok((next.page + 1) * explorePageSize(after) > first);
  }
});

test('server traversal returns every result exactly once in each view and keeps filters at the database', async () => {
  const records = Array.from({ length: 97 }, (_, i) => ({ ...row, id: '10000000-0000-4000-8000-' + String(i).padStart(12, '0') }));
  for (const [view, size] of Object.entries(EXPLORE_VIEWS)) {
    const seen = [];
    const handler = createExploreHandler({ readShell: async () => shell, fetcher: async value => {
      const p = new URL(value).searchParams, start = Number(p.get('offset'));
      if(p.get('select')==='id')assert.equal(p.get('limit'), String(size));
      else {assert.equal(p.get('offset'),null);assert.ok(p.get('id').slice(4,-1).split(',').length<=10);}
      assert.equal(p.get('public_country'), 'eq.US'); assert.equal(p.get('is_operator'), 'eq.true');
      if(p.get('select')==='id')assert.equal(p.get('order'), 'view_count.desc,id.asc'); assert.equal(p.get('tags'), 'cs.{"gas"}');
      const data = p.get('select')==='id'?records.slice(start, start + size):records.filter(row=>p.get('id').slice(4,-1).split(',').includes(row.id)).reverse();
      return Response.json(data, { headers: { 'content-range': `${start}-${start + data.length - 1}/97` } });
    } });
    for (let page = 0; page < Math.ceil(records.length / size); page++) {
      const res = response();
      await handler({ query: { lng: 'en-US', view, page: String(page), country: 'US', author: 'operator', sort: 'views', tag: 'gas' } }, res);
      assert.equal(res.statusCode, 200);
      const data = bootstrap(res.body);
      assert.equal(data.rows.length, Math.min(size, records.length - page * size));
      assert.equal(data.hasMore, (page + 1) * size < 97);
      seen.push(...data.rows.map(item => item.id));
    }
    assert.deepEqual(seen, records.map(item => item.id));
  }
});

test('10,000 results have bounded HTML pagination and the correct final page in all views', () => {
  for (const [view, size] of Object.entries(EXPLORE_VIEWS)) {
    const html = renderExploreHtml(shell, { rows: [row], total: 10000 }, 'en-US', exploreQuery('?view=' + view));
    assert.ok(html.includes('page=' + (Math.ceil(10000 / size) - 1)));
    assert.ok((html.match(/list-pagination-number"/g) || []).length <= 15);
    assert.equal((html.match(/data-explore-view=/g) || []).length, 3);
  }
});

test('view HTML preserves readable documents, escapes titles and excludes duplicate layout URLs from indexing', () => {
  for (const view of Object.keys(EXPLORE_VIEWS)) {
    const query = exploreQuery('?view=' + view);
    const html = renderExploreHtml(shell, { rows: [{ ...row, title: '<img src=x onerror=alert(1)>' }], total: 1 }, 'en-US', query);
    assert.doesNotMatch(html, /<img src=x/);
    assert.match(html, /href="\/en-US\/public-jsa\//);
    assert.equal(exploreIndexable([row], query), view === 'large');
    assert.match(html, view === 'large' ? /content="index,follow"/ : /content="noindex,follow"/);
    if (view === 'details') assert.match(html, /<th scope="col">Document<\/th>/);
    else assert.match(html, new RegExp('explore-view-' + view));
  }
  const first12 = Array.from({ length: 12 }, (_, i) => ({ ...row, assessment: { checked: false }, id: String(i), published_at: '2026-10-02T00:00:00Z' }));
  assert.ok(!indexableExploreLocales([...first12, row]).includes('en-US'));
});

test('view labels are present for every supported locale', () => {
  for (const locale of SUPPORTED_LANGS) for (const label of Object.values(getExploreViewUi(locale))) assert.ok(label.trim(), locale);
});
