import { PUBLIC_INDEX_FIELDS, publicIndexQuality, validProjectId } from '../src/utils/publicJsa.js';
import { readAllPublic } from './public-content.js';

// The security-barrier projection evaluates assessment before an outer LIMIT.
// Enumerate cheap IDs first, then constrain evaluation inside each small batch.
export async function readPublicIndex(fetcher = fetch, { firstIndexable = false } = {}) {
  const signal = AbortSignal.timeout(20000);
  const boundedFetch = (url, options) => fetcher(url, { ...options, signal });
  const ids = await readAllPublic('public_jsa_index', { select: 'id', is_public: 'eq.true' }, boundedFetch);
  if (ids.some(row => !validProjectId(row.id))) throw Error('INVALID_PUBLIC_INDEX_ID');
  const result = [];
  // Independent bounded batches share one deadline. Keep the existence probe
  // sequential so it still stops after the first eligible batch.
  const batchSize = firstIndexable ? 10 : 5;
  const windowSize = 10;
  for (let offset = 0; offset < ids.length; offset += windowSize) {
    signal.throwIfAborted();
    const batches = [];
    for (let start = offset; start < Math.min(ids.length, offset + windowSize); start += batchSize) batches.push(ids.slice(start, start + batchSize).map(row => row.id));
    const rows = (await Promise.all(batches.map(async batch => {
      // Keep the ID constraint in AND so keyset pagination never overwrites it.
      const records = await readAllPublic('public_jsa_index', {
        select: PUBLIC_INDEX_FIELDS, is_public: 'eq.true',
        and: '(id.in.(' + batch.join(',') + '))',
      }, boundedFetch, { pageSize: batchSize });
      if (records.some(row => !batch.includes(row.id))) throw Error('INVALID_PUBLIC_INDEX_BATCH');
      return records;
    }))).flat();
    result.push(...rows);
    if (firstIndexable && rows.some(row => publicIndexQuality(row).indexable)) break;
  }
  return result;
}
