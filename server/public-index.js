import { PUBLIC_INDEX_FIELDS, publicIndexQuality, validProjectId } from '../src/utils/publicJsa.js';
import { readAllPublic, readPublic } from './public-content.js';

// The security-barrier projection evaluates assessment before an outer LIMIT.
// Enumerate cheap IDs first, then constrain evaluation inside each small batch.
export async function readPublicIndex(fetcher = fetch, { firstIndexable = false } = {}) {
  const signal = AbortSignal.timeout(20000);
  const boundedFetch = (url, options) => fetcher(url, { ...options, signal });
  const ids = await readAllPublic('public_jsa_index', { select: 'id', is_public: 'eq.true' }, boundedFetch);
  if (ids.some(row => !validProjectId(row.id))) throw Error('INVALID_PUBLIC_INDEX_ID');
  const result = [];
  async function readBatch(batch) {
    try {
      // Keep the ID constraint in AND so keyset pagination never overwrites it.
      const records = [];
      let last = '';
      while (records.length < batch.length) {
        signal.throwIfAborted();
        const page = await readPublic('public_jsa_index', {
          select: PUBLIC_INDEX_FIELDS, is_public: 'eq.true', order: 'id.asc', limit: String(batch.length),
          and: '(id.in.(' + batch.join(',') + '))', ...(last ? {id:'gt.'+last} : {}),
        }, boundedFetch);
        if (!page.length) break;
        if (page.some(row => !batch.includes(row.id) || row.id <= last) || new Set(page.map(row=>row.id)).size !== page.length) throw Error('INVALID_PUBLIC_INDEX_BATCH');
        records.push(...page);last=page.at(-1).id;
        // The complete ID set is already known. Avoid re-evaluating expensive
        // assessments for an extra empty page after the final ID was returned.
        if (last === batch.at(-1)) break;
      }
      return records;
    } catch (error) {
      // Large assessments can exceed Postgres's statement deadline even in a
      // small batch. Split only that failure, retaining the shared time budget.
      if (error.code !== '57014' || batch.length < 2) throw error;
      signal.throwIfAborted();
      const middle = Math.ceil(batch.length / 2);
      const first = await readBatch(batch.slice(0, middle));
      if (firstIndexable && first.some(row => publicIndexQuality(row).indexable)) return first;
      return [...first, ...await readBatch(batch.slice(middle))];
    }
  }
  // Independent bounded batches share one deadline. Keep the existence probe
  // sequential so it still stops after the first eligible batch.
  const batchSize = firstIndexable ? 10 : 5;
  const windowSize = 10;
  for (let offset = 0; offset < ids.length; offset += windowSize) {
    signal.throwIfAborted();
    const batches = [];
    for (let start = offset; start < Math.min(ids.length, offset + windowSize); start += batchSize) batches.push(ids.slice(start, start + batchSize).map(row => row.id));
    const rows = (await Promise.all(batches.map(readBatch))).flat();
    result.push(...rows);
    if (firstIndexable && rows.some(row => publicIndexQuality(row).indexable)) break;
  }
  return result;
}
