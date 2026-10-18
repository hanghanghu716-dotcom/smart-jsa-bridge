import test from 'node:test';
import assert from 'node:assert/strict';
import { extractAutoTagsFromJSA, DIMENSIONAL_KEYWORD_MAP } from '../src/utils/TagDictionary.js';
import { exploreCardTags, exploreExcerpt } from '../src/utils/explorePresentation.js';
import { publicTagLabel } from '../src/locales/publicTagLabels.js';
import { getExploreQualityUi } from '../src/locales/exploreQualityUi.js';
import { publicationTextWarnings } from '../src/utils/publicationTextQuality.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { renderExploreHtml } from '../api/explore.js';
import { exploreQuery } from '../src/utils/discovery.js';
import { translationPayload, translatePublicRows } from '../src/services/browserTranslation.js';

const options = locale => ({ locale, translateTag: tag => publicTagLabel(tag, locale) });
const woodworking = {
  id: '10000000-0000-4000-8000-000000000001', is_public: true,
  title: 'Pine Workbench Leg Glue-Up and Mortise Preparation', public_locale: 'en-US', public_country: 'US',
  form_data: {}, publication_context: { scope: 'Six steps for pine workbench legs. Excludes sawing, finishing and load certification.' },
  analysis_data: [
    { proc: { stepTitle: 'Prepare timber and clamp the joint', stepDetail: 'Inspect metal inclusions and pipe clamps before the operation.' },
      risks: [{ factor: 'Sharp edges and pinch points can injure hands.', current_measure: 'Cut away from the body. Do not lift by clamps. Check the pipe clamp capacity.' }] },
    { proc: { stepTitle: 'Glue and inspect the mortise', stepDetail: 'Check adhesive bonding and curing before assembly.' },
      risks: [{ factor: 'Adhesive splashes may injure eyes.', recommend_measure: 'Wear safety glasses and chemical resistant gloves.' }] },
  ],
  tags: ['철강/제강','자동차제조','배관설치','밸브조작','촉매교체','승강기작업','내장/목공','왕복동/끼임위험','날카로운모서리','보호구(보안경)','보호구(안전장갑)'],
};
test('woodworking terms do not infer unrelated industries, valves, lifts or earthing', () => {
  const tags = extractAutoTagsFromJSA(woodworking.title, woodworking.analysis_data, options('en-US'));
  for (const invalid of ['철강/제강','자동차제조','배관설치','밸브조작','촉매교체','승강기작업','준비(접지확인)','기계분해/조립']) assert.ok(!tags.includes(invalid), invalid);
  for (const valid of ['내장/목공','왕복동/끼임위험','보호구(보안경)']) assert.ok(tags.includes(valid), valid);
});
test('precise tasks still match while control-only references and JSON metadata do not classify the job', () => {
  for (const [title, tag] of [['Valve operation','밸브조작'], ['Catalyst replacement','촉매교체'], ['Elevator maintenance','승강기작업'], ['철강 제강 작업','철강/제강']]) {
    assert.ok(extractAutoTagsFromJSA(title, [], options(title.includes('작업') ? 'ko' : 'en-US')).includes(tag), tag);
  }
  const tags = extractAutoTagsFromJSA('Workshop inspection', [{ proc: { stepTitle: 'Check clamps' }, risks: [{ factor: 'Dust exposure', measure: 'Do not enter the elevator. Keep clear of catalyst replacement and valve operation.' }], tags: ['철강/제강'], sourceProjectId: 'co' }], options('en-US'));
  for (const invalid of ['승강기작업','촉매교체','밸브조작','전리방사선','독성가스(일산화탄소)']) assert.ok(!tags.includes(invalid), invalid);
});
test('card tags require stored IDs and content evidence, rank task matches first and never mutate data', () => {
  const before = structuredClone(woodworking);
  const tags = exploreCardTags(woodworking, 'en-US');
  assert.equal(tags[0].tag, '내장/목공');
  assert.ok(tags.length <= 5);
  assert.ok(tags.every(item => !/[가-힣]/.test(item.label)));
  assert.ok(!tags.some(item => item.tag === '자동차제조'));
  assert.deepEqual(exploreCardTags({ ...woodworking, tags: ['unknown', '자동차제조'] }, 'en-US'), []);
  assert.deepEqual(woodworking, before);
});
test('every supported locale resolves taxonomy labels and publishing warnings without raw ID fallback', () => {
  for (const locale of SUPPORTED_LANGS) {
    for (const tag of Object.keys(DIMENSIONAL_KEYWORD_MAP)) {
      const label = publicTagLabel(tag, locale);
      assert.ok(label, locale + ': ' + tag);
      if (locale !== 'ko') assert.doesNotMatch(label, /[가-힣]/u);
    }
    for (const value of Object.values(getExploreQualityUi(locale))) assert.ok(value?.trim(), locale);
    assert.equal(publicTagLabel('untranslated-storage-key', locale), '');
  }
});
test('server HTML and browser presentation share localized, bounded tags and the same authored excerpt', () => {
  const original = structuredClone(woodworking);
  const html = renderExploreHtml('<html><head></head><body><div id="root"></div></body></html>', { rows: [woodworking], total: 1 }, 'en-US', exploreQuery());
  const body = html.split('<script>window.__PUBLIC_EXPLORE__=')[0];
  for (const item of exploreCardTags(woodworking, 'en-US')) assert.ok(body.includes('#' + item.label));
  assert.doesNotMatch(body, /자동차제조|밸브조작|철강\/제강/);
  assert.equal((body.match(/data-explore-tag/g) || []).length, exploreCardTags(woodworking, 'en-US').length);
  assert.ok(body.includes(exploreExcerpt(woodworking)));
  assert.match(body, /lang="en-US" dir="auto"/);
  assert.deepEqual(woodworking, original);
  const unsafe = renderExploreHtml('<html><head></head><body><div id="root"></div></body></html>', { rows: [{ ...woodworking, publication_context: { scope: '<img src=x onerror=alert(1)>' } }], total: 1 }, 'en-US', exploreQuery());
  assert.doesNotMatch(unsafe, /<img src=x/);
});
test('excerpts use existing text, stay bounded and do not invent absent content', () => {
  assert.equal(exploreExcerpt(woodworking), woodworking.publication_context.scope);
  assert.equal(exploreExcerpt({ analysis_data: [{ proc: { stepTitle: 'Inspect', stepDetail: 'Source instructions.' } }] }), 'Source instructions.');
  assert.equal(exploreExcerpt({ analysis_data: [{ proc: { stepTitle: 'Inspect' } }] }), 'Inspect');
  assert.equal(exploreExcerpt({}), '');
  assert.ok([...exploreExcerpt({ publication_context: { scope: 'Long example '.repeat(200) } })].length <= 301);
});
test('publishing warnings identify field and step without rewriting original or rejecting mixed languages', () => {
  const data = { title: 'Wind turbine', analysisData: [{ proc: { stepTitle: 'ㅂReinstate interfaces', stepDetail: '한국어 설명 and English terms' }, risks: [{ factor: 'Bad � character' }] }], context: {} };
  const before = structuredClone(data);
  const warnings = publicationTextWarnings(data);
  assert.equal(warnings.length, 2);
  assert.equal(warnings[0].step, 1);
  assert.equal(warnings[0].field, 'stepTitle');
  assert.equal(warnings[1].risk, 1);
  assert.deepEqual(data, before);
  assert.deepEqual(publicationTextWarnings({ title: 'LOTO 에너지 차단 작업', analysisData: [] }), []);
});
test('browser-only list translation translates excerpts without adding private fields or changing stored data', async () => {
  const source = { ...woodworking, public_locale: 'ko', title: '목공 작업', publication_context: { scope: '목재 다리 접착 작업' }, secret: 'private', participants: ['private person'] };
  const before = structuredClone(source), calls = [];
  const payload = translationPayload([source]);
  assert.equal(payload[0].cardExcerpt, source.publication_context.scope);
  assert.equal(payload[0].secret, undefined);
  assert.equal(payload[0].analysis_data, undefined);
  const api = { create: async () => ({ translate: async value => { calls.push(value); return 'Translated ' + value; }, destroy() {} }) };
  const [result] = await translatePublicRows(payload, 'en-US', { api });
  assert.equal(result.cardExcerpt, 'Translated ' + source.publication_context.scope);
  assert.equal(result.id, source.id);
  assert.ok(calls.includes(source.title));
  assert.deepEqual(source, before);
});
