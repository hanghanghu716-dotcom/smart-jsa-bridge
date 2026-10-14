const tables = {
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

window.analysisFixture = { calls: [], failTable: null };
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  from(table) {
    const filters = [];
    const query = {
      select() { return query; },
      eq(key, value) { filters.push(row => row[key] === value); return query; },
      in(key, values) { filters.push(row => values.includes(row[key])); return query; },
      ilike(key, value) { filters.push(row => String(row[key]).toLowerCase().includes(value.replaceAll('%', '').toLowerCase())); return query; },
      limit() { return query; },
      then(resolve, reject) {
        window.analysisFixture.calls.push(table);
        return Promise.resolve({ data: (tables[table] || []).filter(row => filters.every(filter => filter(row))),
          error: window.analysisFixture.failTable === table ? { message: 'Fixture read failure' } : null }).then(resolve, reject);
      },
    };
    return query;
  },
};
