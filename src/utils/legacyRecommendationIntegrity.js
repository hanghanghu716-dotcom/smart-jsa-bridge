// Validate legacy identity chains before displaying a recommendation or reusable control.
// Existence is not a relevance review: scores and semantic-review status stay unchanged.
const kinds = {
  hazard: { table: 'Hazards', fields: 'id' },
  current: { table: 'Current_Measures', fields: 'id,hazard_id', parent: 'hazard', key: 'hazard_id' },
  advanced: { table: 'Advanced_Measures', fields: 'id,measure_id', parent: 'current', key: 'measure_id' },
};
const validId = value => typeof value === 'string'
  ? /^[1-9]\d*$/.test(value) : Number.isSafeInteger(value) && value > 0;
const batchSize = 100;

export function legacyIdentityValidator(client) {
  // Request-local only: a later lookup must recheck a changed or removed master.
  const caches = new Map();
  return async function validate(kind, values) {
    const spec = kinds[kind];
    if (!spec) throw new Error('Unknown recommendation identity kind');
    if (!caches.has(kind)) caches.set(kind, new Map());
    const cache = caches.get(kind);
    const ids = [...new Set(values.filter(validId).map(String))];
    const missing = ids.filter(id => !cache.has(id));
    for (let start = 0; start < missing.length; start += batchSize) {
      const batch = missing.slice(start, start + batchSize);
      const result = await client.from(spec.table).select(spec.fields, { count: 'exact' }).in('id', batch);
      if (result.error) throw result.error;
      // A server row cap must never hide a duplicate and make an ambiguous ID look unique.
      if (!Array.isArray(result.data) || !Number.isSafeInteger(result.count) || result.count !== result.data.length) {
        throw new Error('Incomplete recommendation identity lookup');
      }
      const grouped = new Map();
      for (const row of result.data) {
        const id = String(row.id);
        if (!batch.includes(id)) throw new Error('Unexpected recommendation identity');
        const matches = grouped.get(id) || [];
        matches.push(row);
        grouped.set(id, matches);
      }
      const unique = [...grouped.values()].filter(group => group.length === 1).map(group => group[0]);
      const parents = spec.parent ? await validate(spec.parent, unique.map(row => row[spec.key])) : null;
      for (const id of batch) {
        const group = grouped.get(id);
        const row = group?.length === 1 ? group[0] : null;
        cache.set(id, row && (!parents || parents.has(String(row[spec.key]))) ? row : null);
      }
    }
    return new Set(ids.filter(id => cache.get(id)));
  };
}

export async function translationsWithValidIdentity(validate, kind, translations, parentKey) {
  const valid = await validate(kind, translations.map(row => row[parentKey]));
  return translations.filter(row => valid.has(String(row[parentKey])));
}
