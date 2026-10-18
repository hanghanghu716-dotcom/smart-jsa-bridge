import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { parse, parseFragment } from 'parse5';
import { buildFeed, createContentFeedHandler } from '../api/content-feed.js';
import { feedXml } from '../server/feed-content.js';

const doc = {
  id: '12345678-1234-4234-8234-123456789012', title: '공개 점검 작업 & 대책', is_public: true,
  public_locale: 'ko', reuse_license: 'community-v1', assessment: { checked: true },
  publication_context: { scope: '공개 적용 조건', region: '공개 지역', limitations: '공개 제한', sources: '공개 참고 자료' },
  analysis_data: Array.from({ length: 3 }, (_, i) => ({
    proc: { stepTitle: `단계 ${i + 1}`, stepDetail: `상세 작업 설명 ${i + 1} `.repeat(8) }, frequency: 2, severity: 3, riskLevel: 6,
    risks: [{ factor: `위험요인 ${i + 1}`, category: '분류', current_measure: `현재 대책 ${i + 1}`, recommend_measure: `권고 대책 ${i + 1}` }],
    customFields: { private: 'PRIVATE_CUSTOM' }, sourceProjectTitle: 'PRIVATE_ORIGIN',
  })), form_data: { siteAddress: 'PRIVATE_ADDRESS', participants: 'PRIVATE_PERSON' }, participants: [{ name: 'PRIVATE_NAME' }],
  custom_layout: { documentNotes: 'PRIVATE_NOTE', stepPhotos: ['PRIVATE_PHOTO'] }, published_at: '2026-10-14T00:00:00Z',
};
const post = { id: 'a', post_group_id: 'full-body', language_code: 'ko', title: '사례 본문', meta_description: '간단한 요약',
  content_md: '## 본문 시작\n\n|항목|설명|\n|---|---|\n|표 본문|내용|\n\n[관련 자료](/ko/explore)\n\n마지막 본문', created_at: '2026-10-13T00:00:00Z' };
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...(node.childNodes || []).flatMap(n => all(n, predicate))];
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const descriptions = xml => all(parse(xml), n => n.tagName === 'item').map(item => text(all(item, n => n.tagName === 'description')[0]));

test('RSS carries every public step, detail, hazard, measure and publication context without private fields', () => {
  const xml = buildFeed([], [doc], 'ko');
  const html = descriptions(xml)[0];
  for (let i = 1; i <= 3; i++) for (const value of [`단계 ${i}`, `상세 작업 설명 ${i}`, `위험요인 ${i}`, `현재 대책 ${i}`, `권고 대책 ${i}`]) assert.ok(html.includes(value), value);
  for (const value of Object.values(doc.publication_context)) assert.ok(html.includes(value));
  assert.doesNotMatch(xml, /PRIVATE_/);
  assert.match(html, /가능성: 2/); assert.match(html, /위험도: 6/);
});

test('case feeds include sanitized full Markdown tables and absolute links, not just meta descriptions', () => {
  const xml = buildFeed([{ ...post, content_md: post.content_md + '\n<script>EVIL_SCRIPT()</script><img src="x" onerror="EVIL_EVENT()"><a href="javascript:EVIL_LINK()">link</a>' }], [], 'ko');
  const html = descriptions(xml)[0], tree = parseFragment(html);
  assert.match(html, /본문 시작/); assert.match(html, /마지막 본문/); assert.match(html, /<table>/);
  assert.match(html, /href="https:\/\/smartjsabridge.com\/ko\/explore"/);
  assert.equal(all(tree, n => n.tagName === 'script').length, 0);
  assert.doesNotMatch(html, /onerror=|javascript:|EVIL_SCRIPT/);
});

test('full-content feeds retain public, quality and original-language exclusions', () => {
  const excluded = [{ ...doc, is_public: false }, { ...doc, title: 'TEST_document' }, { ...doc, assessment: { checked: true, review: 'rejected' } },
    { ...doc, assessment: { checked: true, duplicate_of: doc.id } }, { ...doc, public_locale: 'en-US' }, { ...doc, reuse_license: null }];
  assert.equal(descriptions(buildFeed([post, { ...post, id: 'b', post_group_id: 'empty', content_md: '' }], excluded, 'ko')).length, 1);
  assert.equal(descriptions(buildFeed([], excluded, 'ko')).length, 0);
  assert.equal(descriptions(buildFeed([post], [doc], 'en-US')).length, 0);
});

test('special characters cannot break XML or become executable public-document HTML', () => {
  const hostile = structuredClone(doc);
  hostile.analysis_data[0].risks[0].factor = 'A & B <script>literal</script> ]]> 😀';
  const xml = buildFeed([], [hostile], 'ko'), html = descriptions(xml)[0], tree = parseFragment(html);
  assert.ok(text(tree).includes(hostile.analysis_data[0].risks[0].factor));
  assert.equal(all(tree, n => n.tagName === 'script').length, 0);
  assert.equal(feedXml('a\u0000\u000b\ufffe\ud800b & 😀'), 'a�b &amp; 😀');
});

test('RSS handler requests full article text and removes withdrawn documents immediately', async () => {
  let documents = [doc]; const selected = [];
  const handler = createContentFeedHandler({ fetcher: async value => {
    const url = new URL(value); selected.push(url.searchParams.get('select'));
    if (url.pathname.endsWith('/case_studies')) {assert.equal(url.searchParams.get('limit'), '50');assert.match(url.searchParams.get('order'),/^content_updated_at.desc/);}
    return Response.json(url.searchParams.has('id') ? [] : url.pathname.endsWith('/case_studies') ? [post] : documents);
  } });
  const call = async () => { const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = body; } }; await handler({ query: { kind: 'rss', lng: 'ko' }, headers: {} }, res); return res; };
  let res = await call(); assert.equal(res.statusCode, 200); assert.match(res.headers['Content-Type'], /rss\+xml/);
  assert.equal(res.headers['Cache-Control'], 'private, no-store'); assert.equal(descriptions(res.body).length, 2);
  assert.ok(selected.some(value => value?.includes('content_md')));
  documents = []; res = await call(); assert.equal(descriptions(res.body).length, 1); assert.doesNotMatch(res.body, /권고 대책/);
});

test('RSS limits byte size by omitting whole oversized articles instead of truncating bodies', () => {
  const huge = { ...post, id: 'huge', post_group_id: 'oversized', content_md: '한'.repeat(3_200_000), created_at: '2026-10-14T01:00:00Z' };
  const xml = buildFeed([huge, post], [], 'ko');
  assert.ok(Buffer.byteLength(xml) < 4_000_000); assert.equal(descriptions(xml).length, 1);
  assert.match(xml, /마지막 본문/); assert.doesNotMatch(xml, /\/case-study\/oversized/);
});

test('RSS includes only the latest 50 complete articles; the sitemap retains discovery of older content', () => {
  const rows = Array.from({ length: 125 }, (_, i) => ({ ...post, id: `post-${i}`, post_group_id: `article-${i}` }));
  assert.equal(descriptions(buildFeed(rows, [], 'ko')).length, 50);
});
