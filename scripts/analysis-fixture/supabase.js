import { recommendationContext } from '../../src/utils/analysisRecommendations';
import { fixtureText } from './text';
import { fixtureCasePost } from './casePost';
const locale = new URLSearchParams(location.search).get('locale') || 'en-US';
const { dataLocale } = recommendationContext({}, locale);
const words = fixtureText[locale.split('-')[0]];
const tables = {
  Hazards: [{ id: 7 }],
  Current_Measures: [{ id: 9, hazard_id: 7 }, { id: 33, hazard_id: 7 }],
  Advanced_Measures: [{ id: 44, measure_id: 9 }],
  case_studies: [fixtureCasePost(locale)],
  Hazards_Translations: [{ id: 101, hazard_id: 7, locale: 'en-US', hazard_name: 'Pressurized line', category: 'Isolation', keywords: '["pressure"]' },
    { id: 102, hazard_id: 7, locale: 'ko-KR', hazard_name: '압력 배관', keywords: '["압력"]' }],
  Current_Measures_Translations: [{ id: 201, measure_id: 9, locale: 'en-US', measure_text: 'Isolate the line' },
    { id: 202, measure_id: 9, locale: 'ko-KR', measure_text: '배관 차단' },
    { id: 203, measure_id: 33, locale: 'en-US', measure_text: 'Unrelated high score' }],
  hazard_measure_mappings: [{ hazard_translation_id: 101, measure_translation_id: 201, similarity_score: 0.72 },
    { hazard_translation_id: 102, measure_translation_id: 202, similarity_score: 0.99 },
    { hazard_translation_id: 7, measure_translation_id: 203, similarity_score: 0.999 }],
  Advanced_Measures_Translations: [{ id: 301, advanced_measure_id: 44, locale: 'en-US', solution_text: 'Verify absence of pressure' }],
  current_advanced_measure_mappings: [{ current_measure_translation_id: 201, advanced_measure_translation_id: 301, similarity_score: 0.8 }],
};
tables.Hazards_Translations[0] = { id: 101, hazard_id: 7, locale: dataLocale, hazard_name: words[0], keywords: JSON.stringify([words[0]]), category: 'Isolation' };
tables.Hazards_Translations[1].locale = 'foreign-fixture';
tables.Current_Measures_Translations[0] = { id: 201, measure_id: 9, locale: dataLocale, measure_text: words[1] };
tables.Current_Measures_Translations[1].locale = 'foreign-fixture';
tables.Current_Measures_Translations[2].locale = dataLocale;
tables.Advanced_Measures_Translations[0] = { id: 301, advanced_measure_id: 44, locale: dataLocale, solution_text: words[2] };

// Higher scores with broken identities must never displace the valid 72%/80% controls.
tables.Current_Measures.push({ id: 66, hazard_id: 7 }, { id: 66, hazard_id: null }, { id: 67, hazard_id: 999999 });
tables.Current_Measures_Translations.push(...[999999, 66, 67].map((id, i) => ({
  id: 210 + i, measure_id: id, locale: dataLocale, measure_text: 'Broken identity fixture',
})));
tables.hazard_measure_mappings.push(...[210, 211, 212].map(id => ({
  hazard_translation_id: 101, measure_translation_id: id, similarity_score: .999,
})));
tables.Advanced_Measures.push({ id: 77, measure_id: 9 }, { id: 77, measure_id: null }, { id: 78, measure_id: 67 });
tables.Advanced_Measures_Translations.push(...[999999, 77, 78].map((id, i) => ({
  id: 310 + i, advanced_measure_id: id, locale: dataLocale, solution_text: 'Broken identity fixture',
})));
tables.current_advanced_measure_mappings.push(...[310, 311, 312].map(id => ({
  current_measure_translation_id: 201, advanced_measure_translation_id: id, similarity_score: .999,
})));

window.analysisFixture = { calls: [], failTable: null, reviseCase: () => { tables.case_studies[0].content_md += ' CHANGED'; } };
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  from(table) {
    const filters = [];
    let offset = 0, cap = Infinity, sortKey;
    const query = {
      select() { return query; },
      eq(key, value) { filters.push(row => row[key] === value); return query; },
      in(key, values) { filters.push(row => values.some(value => String(value) === String(row[key]))); return query; },
      ilike(key, value) { filters.push(row => String(row[key]).toLowerCase().includes(value.replaceAll('%', '').toLowerCase())); return query; },
      limit(value) { cap = value; return query; },
      order(key) { sortKey = key; return query; },
      range(start, end) { offset = start; cap = end - start + 1; return query; },
      then(resolve, reject) {
        window.analysisFixture.calls.push(table);
        const data = (tables[table] || []).filter(row => filters.every(filter => filter(row)));
        if (sortKey) data.sort((a, b) => Number(a[sortKey]) - Number(b[sortKey]));
        return Promise.resolve({ data: data.slice(offset, offset + cap), count: data.length,
          error: window.analysisFixture.failTable === table ? { message: 'Fixture read failure' } : null }).then(resolve, reject);
      },
    };
    return query;
  },
};
