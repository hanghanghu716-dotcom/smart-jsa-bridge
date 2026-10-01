import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCaseManifest, verifyCaseHtml, contentFingerprint } from './case-build-data.js';
import { selectLocalizedCases } from '../src/locales/config.js';
import {
  readAllCaseStudies, buildSubmitData, saveCaseStudy, removePdfFromForm, findUnsupportedProfessionalReviewClaims,
} from '../src/pages/caseStudyAdminTools.js';

function fakeReadClient(rows, { cap = Infinity, secondCount, failAt, emptyAt, overlapAt } = {}) {
  let countCalls = 0;
  return { from(table) {
    assert.equal(table, 'case_studies');
    return { select(_columns, opts) {
      if (opts?.head) {
        countCalls++;
        return Promise.resolve({ count: countCalls > 1 && secondCount !== undefined ? secondCount : rows.length, error: null });
      }
      return { order(column, sort) {
        assert.equal(column, 'id'); assert.equal(sort.ascending, true);
        return { async range(start, end) {
          if (start === failAt) return { error: new Error('network failure'), data: null };
          if (start === emptyAt) return { data: [], error: null };
          if (start === overlapAt) start--;
          return { data: rows.slice(start, Math.min(end + 1, start + cap)), error: null };
        } };
      } };
    } };
  } };
}
const records = n => Array.from({ length: n }, (_, i) => ({
  id: i + 1, post_group_id: 'same-group', language_code: 'ko',
  content_md: '<p style="margin:48px 0 20px 0">안전\n검토</p>',
  pdf_list: [{ name: '원문.pdf', url: 'https://example.test/원문.pdf' }],
}));

test('exports all 640 IDs and preserves nested fields, Unicode and duplicate group/language pairs', async () => {
  const input = records(640);
  const result = await readAllCaseStudies(fakeReadClient(input));
  assert.deepEqual(JSON.parse(JSON.stringify(result)), input);
});
test('exports beyond 1000 and handles a server cap smaller than requested pages without skipping rows', async () => {
  const input = records(1205);
  assert.deepEqual(await readAllCaseStudies(fakeReadClient(input, { cap: 37 })), input);
});
test('fails closed on a partial page error, an early empty response, or overlapping IDs', async () => {
  for (const options of [{ failAt: 100 }, { emptyAt: 100 }, { overlapAt: 100 }]) {
    await assert.rejects(readAllCaseStudies(fakeReadClient(records(640), options)));
  }
});
test('refuses an export whose accessible row count changed during collection', async () => {
  await assert.rejects(readAllCaseStudies(fakeReadClient(records(640), { secondCount: 641 })), /게시물 수/);
});
test('permits an empty authorized dataset without making up a count', async () => {
  assert.deepEqual(await readAllCaseStudies(fakeReadClient([])), []);
});

function fakeWriteClient({ data = [{ id: 'original-id' }], error = null } = {}) {
  const calls = [];
  const query = {
    eq(column, value) { calls.push(['eq', column, value]); return query; },
    async select(columns) { calls.push(['select', columns]); return { data, error }; },
  };
  return { calls, from() { return {
    insert(payload) { calls.push(['insert', payload]); return query; },
    update(payload) { calls.push(['update', payload]); return query; },
  }; } };
}
test('editing updates only the existing ID and never inserts', async () => {
  const c = fakeWriteClient();
  await saveCaseStudy(c, 'original-id', { content_md: '개정' });
  assert.equal(c.calls[0][0], 'update');
  assert.deepEqual(c.calls[1], ['eq', 'id', 'original-id']);
  assert(!c.calls.some(x => x[0] === 'insert'));
});
test('does not report success for an update with no returned row or with a database error', async () => {
  await assert.rejects(saveCaseStudy(fakeWriteClient({ data: [] }), 'original-id', {}), /확인하지 못/);
  await assert.rejects(saveCaseStudy(fakeWriteClient({ error: new Error('RLS denied') }), 'original-id', {}), /RLS denied/);
});
test('preserves body markup and ID whitespace while validating JSON before writing', () => {
  const form = { title: '제목', post_group_id: ' original ', meta_description: '요약', schema_markup: '{"@type":"FAQPage"}', pdf_list: [] };
  const body = records(1)[0].content_md;
  const output = buildSubmitData(form, body);
  assert.equal(output.content_md, body);
  assert.equal(output.post_group_id, form.post_group_id);
  assert.deepEqual(output.schema_markup, { '@type': 'FAQPage' });
  assert.throws(() => buildSubmitData({ ...form, schema_markup: '{bad}' }, body), /JSON/);
});

test('flags unsupported professional-review claims but allows explicit no-review disclosures', () => {
  assert.equal(findUnsupportedProfessionalReviewClaims('Reviewed and verified by CMIOSH and IRATA Level 3 experts.').length, 1);
  assert.equal(findUnsupportedProfessionalReviewClaims('본 자료는 건설안전기술사의 검토를 받았습니다.').length, 1);
  assert.equal(findUnsupportedProfessionalReviewClaims('This content has not been professionally reviewed by a CMIOSH practitioner.').length, 0);
  assert.equal(findUnsupportedProfessionalReviewClaims('전문가 검토를 받지 않은 교육용 초안입니다.').length, 0);
  const form = { title: '제목', post_group_id: 'id', meta_description: '요약', schema_markup: '', pdf_list: [] };
  assert.throws(() => buildSubmitData(form, 'Verified by a Professional Engineer.'), /전문가 검토/);
});

test('removing the linked PDF updates the legacy URL without deleting storage objects', () => {
  const form = { pdf_list: [{ url: 'a' }, { url: 'b' }], pdf_download_url: 'b' };
  assert.deepEqual(removePdfFromForm(form, 1), { pdf_list: [{ url: 'a' }], pdf_download_url: 'a' });
  assert.deepEqual(removePdfFromForm({ pdf_list: [{ url: 'b' }], pdf_download_url: 'b' }, 0), { pdf_list: [], pdf_download_url: '' });
});

const article = { id: 'id-ko', post_group_id: 'pipe & tank', language_code: 'ko',
  title: '제목', meta_title: '제목 | Smart JSA Bridge', meta_description: '최신 요약',
  content_md: '<h2 style="margin-top:48px">최신 본문</h2>', pdf_list: [{ name: 'A.pdf', url: 'https://example.test/a.pdf' }],
  created_at: '2026-09-22T00:00:00Z', schema_markup: { '@type': 'FAQPage', mainEntity: [] } };
const mockArticleHtml = (post, route, description = post.meta_description) => `<!doctype html><html><head>
<title>${post.meta_title}</title><meta name="description" content="${description}">
<link rel="canonical" href="https://smartjsabridge.com${route}"></head><body>
<div data-case-study-id="${post.id}">${post.content_md}</div>
<script id="jsa-case-bootstrap" type="application/json">${JSON.stringify({ path: route, post, availableLocales: ['ko'] }).replace(/</g, '\\u003c')}</script>
</body></html>`;

test('manifest keeps encoded existing URLs and selects the newest duplicate deterministically', () => {
  const old = { ...article, id: 'old-id', created_at: '2026-09-20T00:00:00Z' };
  const a = buildCaseManifest([old, article]);
  const b = buildCaseManifest([article, old]);
  assert.deepEqual(a, b);
  assert.equal(a[0].route, '/ko/case-study/pipe%20%26%20tank');
  assert.equal(a[0].id, 'id-ko');
});

test('province-specific content takes priority over a newer common Canada record', () => {
  const specific = { ...article, id: 'province', language_code: 'en-CA-ON', created_at: '2026-09-01T00:00:00Z' };
  const shared = { ...article, id: 'shared', language_code: 'en-CA', created_at: '2026-09-22T00:00:00Z' };
  assert.equal(selectLocalizedCases([shared, specific], 'en-CA-ON')[0].id, 'province');
  assert.equal(selectLocalizedCases([specific, shared], 'en-CA-ON')[0].id, 'province');
});

test('initial HTML must match the full article, PDF links, metadata and canonical before deployment', () => {
  const expected = buildCaseManifest([article])[0];
  const html = mockArticleHtml(article, expected.route);
  assert.equal(verifyCaseHtml(html, expected), true);
  assert.throws(() => verifyCaseHtml(mockArticleHtml(article, expected.route, '이전 요약'), expected), /description/);
  const changed = { ...article, content_md: '이전 본문' };
  assert.throws(() => verifyCaseHtml(mockArticleHtml(changed, expected.route), expected), /Outdated/);
  assert.throws(() => verifyCaseHtml(html.replace('</head>', '<meta name="description" content="중복"></head>'), expected), /duplicated/);
  assert.throws(() => verifyCaseHtml(html.replace('jsa-case-bootstrap', 'missing-snapshot'), expected), /missing/);
  assert.notEqual(contentFingerprint(article), contentFingerprint({ ...article, pdf_list: [] }));
});

test('title verification accepts HTML whitespace minification but rejects a different title', () => {
  const post = { ...article, meta_title: 'شبكات السلامة  EN 1263\n| Smart JSA Bridge' };
  const expected = buildCaseManifest([post])[0];
  const html = mockArticleHtml(post, expected.route);
  const minified = html.replace(`<title>${post.meta_title}</title>`, '<title>شبكات السلامة EN 1263 | Smart JSA Bridge</title>');
  assert.equal(verifyCaseHtml(minified, expected), true);
  assert.throws(() => verifyCaseHtml(minified.replace('<title>شبكات السلامة', '<title>Outdated'), expected), /title/);
});

test('metadata attributes can contain greater-than signs before the name attribute', () => {
  const post = { ...article, meta_description: 'mezcla (>150°C)' };
  const expected = buildCaseManifest([post])[0];
  const html = mockArticleHtml(post, expected.route)
    .replace('<meta name="description" content="mezcla (>150°C)">', '<meta content="mezcla (>150°C)" name="description">');
  assert.equal(verifyCaseHtml(html, expected), true);
  assert.throws(() => verifyCaseHtml(html.replace('content="mezcla (>150°C)"', 'content="outdated"'), expected), /description/);
});
