import { dictionarySearchFilter, parseKeywords } from './content.js';
import { CONTEXT_DICTIONARIES, scopeDictionary, contextDictionaryFilter } from './contextDictionary.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const key = value => text(value).replace(/\s+/g, ' ');

export function romanianDictionaryFilter(search) {
  const tokens = [...new Set(String(search).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])];
  return dictionarySearchFilter(search) + (tokens.length ? ',keywords.cs.{' + tokens.map(token => JSON.stringify(token)).join(',') + '}' : '');
}

export function romanianDictionarySource(id, index) {
  const offset = Number(id) - index.firstId;
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= index.articles.length * index.stepsPerArticle) return null;
  return index.articles[Math.floor(offset / index.stepsPerArticle)];
}

// Group only within a hazard and its measure: never cross-link unrelated solutions.
export function groupDictionaryRows(rows) {
  const hazards = new Map();
  for (const row of rows) {
    if (row.hazard_id == null) continue;
    if (!hazards.has(row.hazard_id)) hazards.set(row.hazard_id, {
      id: row.hazard_id, name: text(row.hazard_name), category: text(row.category), measures: new Map(), keywords: new Set(),
    });
    const hazard = hazards.get(row.hazard_id);
    const measureKey = key(row.measure_text);
    if (!hazard.measures.has(measureKey)) hazard.measures.set(measureKey, { text: text(row.measure_text), solutions: new Map() });
    const measure = hazard.measures.get(measureKey);
    if (key(row.solution_text)) measure.solutions.set(key(row.solution_text), text(row.solution_text));
    for (const keyword of parseKeywords(row.keywords)) hazard.keywords.add(keyword);
  }
  return [...hazards.values()].map(hazard => ({ ...hazard,
    keywords: [...hazard.keywords],
    measures: [...hazard.measures.values()].map(measure => ({ ...measure, solutions: [...measure.solutions.values()] })),
  }));
}

// Existing view only; no new database function or migration is required.
// Keyset pagination skips repeated combinations after their hazard ID was found.
export async function findDictionaryHazards(client, { locale, category = '', search = '', signal }) {
  const ids = [];
  let last;
  while (true) {
    let query = scopeDictionary(client.from('factor_dictionary_view').select('hazard_id').eq('locale', locale), locale);
    if (category) query = query.eq('category', category);
    if (search) query = query.or(locale === 'ro-RO' ? romanianDictionaryFilter(search) : CONTEXT_DICTIONARIES[locale] ? contextDictionaryFilter(search) : dictionarySearchFilter(search));
    if (last !== undefined) query = query.gt('hazard_id', last);
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query.order('hazard_id', { ascending: true }).range(0, 499);
    if (error) throw error;
    if (signal?.aborted) throw new Error('ABORTED');
    if (!data?.length) return ids;
    const batch = [...new Set(data.map(row => row.hazard_id).filter(id => id != null))];
    if (!batch.length || batch.at(-1) === last) throw new Error('DICTIONARY_INDEX_INCOMPLETE');
    ids.push(...batch); last = batch.at(-1);
  }
}

export async function readDictionaryGroups(client, { locale, ids, signal }) {
  if (!ids.length) return [];
  const scope = CONTEXT_DICTIONARIES[locale];
  if (scope && ids.some(id => id < scope.firstId || id > scope.lastId)) throw new Error('DICTIONARY_SCOPE_MISMATCH');
  const rows = [];
  let total;
  do {
    let query = client.from('factor_dictionary_view').select('*', { count: 'exact' })
      .eq('locale', locale).in('hazard_id', ids)
      .order('hazard_id', { ascending: true }).order('measure_text', { ascending: true }).order('solution_text', { ascending: true });
    if (signal) query = query.abortSignal(signal);
    const { data, count, error } = await query.range(rows.length, rows.length + 499);
    if (error) throw error;
    if (signal?.aborted) throw new Error('ABORTED');
    if (!Number.isInteger(count) || count < 0 || (total !== undefined && total !== count)) throw new Error('DICTIONARY_CHANGED');
    total = count;
    if (!data?.length && rows.length < total) throw new Error('DICTIONARY_INCOMPLETE');
    rows.push(...(data || []));
  } while (rows.length < total);
  const grouped = groupDictionaryRows(rows);
  if (grouped.length !== ids.length) throw new Error('DICTIONARY_CHANGED');
  return grouped;
}
