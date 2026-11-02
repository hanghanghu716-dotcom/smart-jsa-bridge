import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNarailter, parseNarailterPage, narailterWindow } from '../server/narailter-jobs.js';
import { collectJobs } from '../server/job-feeds.js';

const item = '<item><idx>123</idx><title>산업안전관리자 채용</title><insttname>기관</insttname><regdate>20261102</regdate><enddate>20261103</enddate><areacode>999</areacode><contents>DO NOT COPY</contents><contact>PRIVATE</contact></item>';
const response = (rows = item, total = 1, page = 1) => `<response><header><resultCode>00</resultCode></header><body><totalCount>${total}</totalCount><pageNo>${page}</pageNo><numOfRows>1000</numOfRows><items>${rows}</items></body></response>`;

test('Narailter keeps only approved list fields and uses Korean closing dates', () => {
  const [row] = parseNarailter(response());
  assert.equal(row.closes_at, '2026-11-03T15:00:00.000Z');
  assert.equal(row.locale, 'ko');
  assert.equal(row.location, ''); // Do not guess a name from an undocumented code.
  assert.equal(new URL(row.url).searchParams.get('empmnsn'), '123');
  assert.ok(!JSON.stringify(row).includes('PRIVATE'));
  assert.ok(!JSON.stringify(row).includes('DO NOT COPY'));
  for (const title of ['행정직 채용', '안전관리자 최종합격자 공고', '안전관리자 채용 취소']) {
    assert.deepEqual(parseNarailter(response(item.replace('산업안전관리자 채용', title))), []);
  }
  assert.deepEqual(parseNarailter(response(item.replace('20261103', ''))), []);
  assert.deepEqual(parseNarailter(response(item.replace('<idx>123</idx>', '<idx>1&amp;url=evil</idx>'))), []);
  assert.throws(() => parseNarailter(response(item.replace('20261103', '20260230'))), /invalid_data/);
  assert.deepEqual(parseNarailter(response(item.replace('산업안전관리자 채용', '한국식품안전관리인증원 원장 모집').replace('<insttname>기관', '<insttname>한국식품안전관리인증원'))), []);
  assert.deepEqual(parseNarailter(response(item.replace('산업안전관리자 채용', '[안전보건공단] 홍보부장 채용').replace('<insttname>기관', '<insttname>한국산업안전보건공단'))), []);
  assert.deepEqual(parseNarailter(response(item.replace('산업안전관리자 채용', '식생활안전관리원 연구원 채용').replace('<insttname>기관', '<insttname>재단법인식생활안전관리원'))), []);
});

test('Narailter rejects errors, malformed XML and inconsistent positive counts', () => {
  assert.deepEqual(parseNarailter(response('', 0)), []);
  assert.throws(() => parseNarailter(response('', 4)), /invalid_data/);
  assert.throws(() => parseNarailter(response().replace('>00<', '>30<')), /source_error/);
  assert.throws(() => parseNarailter('<OpenAPI_ServiceResponse><error>PRIVATE</error></OpenAPI_ServiceResponse>'), /source_error/);
  assert.throws(() => parseNarailter('<!DOCTYPE x>' + response()), /invalid_data/);
  assert.throws(() => parseNarailter(response().replace('</response>', '')), /invalid_data/);
});

test('Narailter collection is bounded, deduplicated and requires a private key', async () => {
  let calls = 0;
  const source = { id: 'narailter', adapter: 'narailter' };
  await assert.rejects(collectJobs(source, () => '', () => { calls++; }), /missing_credentials/);
  assert.equal(calls, 0);
  const rows = await collectJobs(source, name => { assert.equal(name, 'NARAILTER_API_KEY'); return 'test+key/='; }, async (url, options) => {
    calls++;
    assert.equal(url.origin, 'https://apis.data.go.kr');
    assert.equal(url.pathname, '/1760000/PblJobService/getList');
    assert.equal(url.searchParams.get('numOfRows'), '1000');
    assert.equal(url.searchParams.get('serviceKey'), 'test+key/=');
    assert.equal(url.searchParams.get('Begin_de'), '2026-10-04');
    assert.equal(url.searchParams.get('End_de'), '2026-11-03');
    assert.equal(url.searchParams.has('Kwrd'), false); // Live API ignores this filter.
    assert.equal(options.redirect, 'error');
    return new Response(response(calls===1?item.repeat(1000):item,1001,calls));
  }, new Date('2026-11-02T16:00:00Z'));
  assert.equal(calls, 2);
  assert.equal(rows.length, 1);
  assert.ok(!JSON.stringify(rows).includes('test+key'));
});

test('Narailter rejects ignored date filters, truncated pages and oversized scans', async () => {
  const window = narailterWindow(new Date('2026-11-02T16:00:00Z'));
  assert.deepEqual(window, {begin:'2026-10-04',end:'2026-11-03'});
  assert.throws(() => parseNarailterPage(response(item.replace('20261102','20080718')), {...window,page:1}), /invalid_data/);
  assert.throws(() => parseNarailterPage(response(item, 1001), {...window,page:1}), /invalid_data/);
  assert.throws(() => parseNarailterPage(response(item, 5001), {...window,page:1}), /invalid_data/);
  assert.throws(() => parseNarailterPage(response(item, 1, 2), {...window,page:1}), /invalid_data/);
  let calls=0;
  await assert.rejects(collectJobs({id:'narailter',adapter:'narailter'},()=> 'test-key', async()=> {
    calls++;
    return new Response(response(item.repeat(1000),5001));
  }, new Date('2026-11-03T00:00:00Z')), /invalid_data/);
  assert.equal(calls,1);
});
