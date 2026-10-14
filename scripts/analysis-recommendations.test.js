import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { recommendationContext, normalizeKeywords, localizedHazards, matchesHazardKeywords,
  updateRiskValue, applyControl, formatSimilarity, loadMeasureRecommendations } from '../src/utils/analysisRecommendations.js';

function database(tables, failure = '') {
  const calls = [];
  return { calls, from(table) {
    const filters = [], call = { table, filters }; calls.push(call);
    const query = {
      select() { return query; },
      eq(key, value) { filters.push({ op: 'eq', key, value }); return query; },
      in(key, value) { filters.push({ op: 'in', key, value }); return query; },
      ilike(key, value) { filters.push({ op: 'ilike', key, value }); return query; },
      then(resolve, reject) {
        const data = (tables[table] || []).filter(row => filters.every(f => f.op === 'eq'
          ? String(row[f.key]) === String(f.value) : f.op === 'ilike'
            ? String(row[f.key]).toLowerCase() === f.value.replace(/\\([%_\\])/g, '$1').toLowerCase()
            : f.value.some(value => String(row[f.key]) === String(value))));
        return Promise.resolve({ data, error: table === failure ? new Error('Database unavailable') : null }).then(resolve, reject);
      }
    };
    return query;
  } };
}

function fixture() {
  return {
    Hazards_Translations: [
      { id: 101, hazard_id: 7, locale: 'en-US', hazard_name: 'Pressurized line' },
      { id: 7, hazard_id: 999, locale: 'en-US', hazard_name: 'Noise' },
      { id: 102, hazard_id: 7, locale: 'ko-KR', hazard_name: '압력 배관' },
    ],
    Current_Measures_Translations: [
      { id: 201, measure_id: 9, locale: 'en-US', measure_text: 'Isolate the line' },
      { id: 9, measure_id: 444, locale: 'en-US', measure_text: 'Use ear protection' },
      { id: 202, measure_id: 9, locale: 'ko-KR', measure_text: '배관 차단' },
      { id: 203, measure_id: 88, locale: 'en-US', measure_text: 'Wear a harness' },
    ],
    hazard_measure_mappings: [
      { hazard_translation_id: 101, measure_translation_id: 201, similarity_score: 0.72 },
      { hazard_translation_id: 7, measure_translation_id: 203, similarity_score: 0.999 },
      { hazard_translation_id: 102, measure_translation_id: 202, similarity_score: 0.99 },
    ],
    Advanced_Measures_Translations: [
      { id: 301, advanced_measure_id: 33, locale: 'en-US', solution_text: 'Verify absence of pressure' },
      { id: 302, advanced_measure_id: 44, locale: 'en-US', solution_text: 'Install a guardrail' },
    ],
    current_advanced_measure_mappings: [
      { current_measure_translation_id: 201, advanced_measure_translation_id: 301, similarity_score: 0.8 },
      { current_measure_translation_id: 9, advanced_measure_translation_id: 302, similarity_score: 0.999 },
    ],
  };
}

const risk = { id: 'r1', db_id: 7, factor: 'Pressurized line' };
const context = recommendationContext({}, 'en-US');

test('observed high-score mismatches are withheld without altering unrelated scores or user text', async () => {
  const audit = JSON.parse((await import('node:fs')).readFileSync(new URL('../docs/recommendation-audit-20261014.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
  const examples = audit.highScoreExamples.currentToAdditional['ru-RU'];
  const selected = { factor: 'Test hazard', current_measure: examples[0].source, current_measure_confirmed: true };
  const tables = {
    Hazards_Translations: [{ id: 99999, locale: 'ru-RU', hazard_name: selected.factor }],
    hazard_measure_mappings: [{ hazard_translation_id: 99999, measure_translation_id: 8156, similarity_score: .7 }],
    Current_Measures_Translations: [{ id: 8156, locale: 'ru-RU', measure_text: selected.current_measure }],
    current_advanced_measure_mappings: examples.map(x => ({ current_measure_translation_id: x.sourceId, advanced_measure_translation_id: x.targetId, similarity_score: x.score })),
    Advanced_Measures_Translations: examples.map(x => ({ id: x.targetId, locale: 'ru-RU', solution_text: x.target })),
  };
  assert.deepEqual(await loadMeasureRecommendations(database(tables), { risk: selected, type: 'advanced', context: recommendationContext({}, 'ru-RU') }), []);
  assert.equal(selected.current_measure, examples[0].source);
  const [item] = await loadMeasureRecommendations(database(fixture()), { risk, context });
  assert.equal(item.similarity_score, .72);
  const applied = applyControl(risk, item, { type: 'current', jsaType: '3-step' });
  assert.equal(applied.current_recommendation.score, .72);
  assert.equal(applied.current_recommendation.evidence.mappingVersion, 'legacy-unversioned');
  assert.equal(updateRiskValue(applied, 'factor', 'Edited').current_recommendation, null);
});

test('manual edits rematch only a unique exact hazard/control in the document language', async () => {
  const db = database(fixture());
  const edited = { factor: 'pressurized line', current_measure: 'Isolate the line' };
  const result = await loadMeasureRecommendations(db, { risk: edited, type: 'advanced', context });
  assert.equal(result[0].display, 'Verify absence of pressure');
  assert.equal(result[0].evidence.sourceType, 'legacy_mapping');
  assert.equal(result[0].evidence.regionReviewed, false);
  const ambiguous = fixture();
  ambiguous.Hazards_Translations.push({ id: 500, locale: 'en-US', hazard_name: 'Pressurized line' });
  assert.deepEqual(await loadMeasureRecommendations(database(ambiguous), { risk: edited, context }), []);
  assert.deepEqual(await loadMeasureRecommendations(db, { risk: { factor: '%', current_measure: 'Isolate the line' }, context }), []);
});

test('master/translation ID collisions and foreign-language maxima cannot change the selected control or percentage', async () => {
  const db = database(fixture());
  const result = await loadMeasureRecommendations(db, { risk, context });
  assert.deepEqual(result.map(row => [row.display, row.measure_db_id, row.reference.id, row.similarity_score]),
    [['Isolate the line', 9, 201, 0.72]]);
  assert.equal(result[0].score_kind, 'text_similarity');
  assert.equal(result[0].review_status, 'unverified_legacy');
  assert.ok(db.calls.filter(c => c.table.endsWith('_Translations')).every(c => c.filters.some(f => f.key === 'locale' && f.value === 'en-US')));
});

test('a mapping target cannot fall back to a coincident master ID', async () => {
  const data = fixture();
  data.hazard_measure_mappings = [{ hazard_translation_id: 101, measure_translation_id: 33, similarity_score: 0.99 }];
  data.Current_Measures_Translations.push({ id: 444, measure_id: 33, locale: 'en-US', measure_text: 'Unrelated master ID' });
  assert.deepEqual(await loadMeasureRecommendations(database(data), { risk, context }), []);
});

test('orphan translations retain an explicit translation reference without disguising it as a master ID', async () => {
  const data = fixture();
  data.Hazards_Translations[0].hazard_id = null;
  const hazard = localizedHazards(data.Hazards_Translations)[0];
  assert.equal(hazard.db_id, null);
  const result = await loadMeasureRecommendations(database(data), { risk: { ...hazard, factor: hazard.risk_factor }, context });
  assert.equal(result[0].reference.id, 201);
});

test('advanced lookup verifies the original hazard and selected current control before following its translation ID', async () => {
  const selected = { ...risk, current_measure: 'Isolate the line', current_measure_db_id: 9 };
  const result = await loadMeasureRecommendations(database(fixture()), { risk: selected, type: 'advanced', context });
  assert.deepEqual(result.map(row => [row.display, row.similarity_score]), [['Verify absence of pressure', 0.8]]);
  assert.deepEqual(await loadMeasureRecommendations(database(fixture()), { risk: { ...selected, factor: 'Noise' }, type: 'advanced', context }), []);
  assert.deepEqual(await loadMeasureRecommendations(database(fixture()), { risk: { ...selected, current_measure: 'Wear a harness', current_measure_db_id: 88 }, type: 'advanced', context }), []);
});

test('input editing invalidates links but preserves user control text', () => {
  const previous = { ...risk, hazard_reference: { kind: 'translation', id: 101 }, current_measure: 'My control',
    current_measure_db_id: 9, current_measure_reference: { id: 201 }, recommend_measure: 'My additional control',
    advanced_measure_db_id: 33, advanced_measure_reference: { id: 301 }, recommendation_score: 0.99 };
  const edited = updateRiskValue(previous, 'factor', 'Different hazard');
  for (const key of ['db_id', 'hazard_reference', 'current_measure_db_id', 'current_measure_reference', 'advanced_measure_db_id', 'advanced_measure_reference', 'recommendation_score']) assert.equal(edited[key], null);
  assert.equal(edited.current_measure, 'My control');
  assert.equal(edited.recommend_measure, 'My additional control');
  assert.equal(edited.recommendation_review_required, true);
  assert.equal(previous.db_id, 7);
  const currentEdit = updateRiskValue(previous, 'current_measure', 'Changed control');
  assert.equal(currentEdit.db_id, 7);
  assert.equal(currentEdit.advanced_measure_db_id, null);
});

test('selecting a different control with identical wording also invalidates old advanced linkage', () => {
  const previous = { ...risk, current_measure: 'Isolate', current_measure_db_id: 1,
    current_measure_reference: { kind: 'translation', id: 11, locale: 'en-US' }, recommend_measure: 'Old recommendation', advanced_measure_db_id: 22 };
  const selected = applyControl(previous, { display: 'Isolate', measure_db_id: 2,
    reference: { kind: 'translation', id: 12, locale: 'en-US' } }, { type: 'current', jsaType: '3-step' });
  assert.equal(selected.current_measure_db_id, 2);
  assert.equal(selected.advanced_measure_db_id, null);
  assert.equal(selected.recommend_measure, 'Old recommendation');
  assert.equal(selected.current_measure_confirmed, false);
});

test('ambiguous duplicate scores and invalid scores are omitted instead of maximized or rescaled', async () => {
  const data = fixture();
  data.hazard_measure_mappings.push({ hazard_translation_id: 101, measure_translation_id: 201, similarity_score: 0.99 });
  assert.deepEqual(await loadMeasureRecommendations(database(data), { risk, context }), []);
  for (const score of [null, '', -0.1, 1.01, 'bad']) {
    data.hazard_measure_mappings = [{ hazard_translation_id: 101, measure_translation_id: 201, similarity_score: score }];
    assert.deepEqual(await loadMeasureRecommendations(database(data), { risk, context }), []);
  }
});

test('query failures are not reported as a valid empty dataset', async () => {
  await assert.rejects(loadMeasureRecommendations(database(fixture(), 'hazard_measure_mappings'), { risk, context }), /unavailable/);
});

test('document language drives data selection while work jurisdiction remains independent', () => {
  assert.deepEqual(recommendationContext({ context: { documentLocale: 'ja-JP', jurisdiction: 'SG' } }, 'ko'),
    { documentLocale: 'ja-JP', dataLocale: 'ja-JP', jurisdiction: 'SG', sharedLanguage: false });
  assert.equal(recommendationContext({}, 'en-SG').dataLocale, 'en-US');
  assert.equal(recommendationContext({}, 'fr-CA-QC').sharedLanguage, true);
  for (const locale of SUPPORTED_LANGS) assert.doesNotThrow(() => formatSimilarity(0.725, locale));
  assert.equal(formatSimilarity(0, 'en-US'), '0.0%');
  assert.match(formatSimilarity(0.725, 'de-DE'), /72,5/);
  assert.equal(formatSimilarity(null, 'ko'), null);
});

test('translated JSON keywords support phrases and non-Latin text without inheriting Korean master keywords', () => {
  assert.deepEqual(normalizeKeywords('[" WELDING ","welding",null]'), ['welding']);
  assert.deepEqual(normalizeKeywords('invalid JSON'), []);
  assert.equal(matchesHazardKeywords({ keywords: '["hot work"]' }, 'Prepare hot work permit'), true);
  assert.equal(matchesHazardKeywords({ keywords: ['gas'] }, 'Vegas office'), false);
  assert.equal(matchesHazardKeywords({ keywords: ['溶接'] }, '配管溶接作業'), true);
  assert.equal(matchesHazardKeywords({ keywords: ['라인차단'] }, '라인 차단 작업'), true);
  assert.equal(matchesHazardKeywords({ keywords: ['сварка'] }, 'сварка трубы'), true);
  assert.equal(matchesHazardKeywords({ keywords: ['لحام'] }, 'أعمال لحام الأنابيب'), true);
  const item = localizedHazards([{ id: 1, hazard_id: 2, hazard_name: 'Welding', locale: 'en-US', category: null, keywords: '["welding"]' }])[0];
  assert.deepEqual(item.keywords, ['welding']);
  assert.equal(item.category, '');
});
