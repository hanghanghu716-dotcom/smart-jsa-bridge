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
  for (let offset = 0; offset < ids.length; offset += 10) {
    signal.throwIfAborted();
    const batch = ids.slice(offset, offset + 10).map(row => row.id);
    // Keep the ID constraint in AND so keyset pagination never overwrites it.
    const rows = await readAllPublic('public_jsa_index', {
      select: PUBLIC_INDEX_FIELDS, is_public: 'eq.true',
      and: '(id.in.(' + batch.join(',') + '))',
    }, boundedFetch, { pageSize: 10 });
    if (rows.some(row => !batch.includes(row.id))) throw Error('INVALID_PUBLIC_INDEX_BATCH');
    result.push(...rows);
    if (firstIndexable && rows.some(row => publicIndexQuality(row).indexable)) break;
  }
  return result;
}
