import { validProjectId } from './publicJsa.js';

// Count and order the cheap ID projection before evaluating assessment or bodies.
// Both callers reapply their filters to every bounded detail request.
export async function readPublicCatalogPage({ page, pageSize, readPage, readBatch }) {
  const { data: ids, count, error } = await readPage();
  if (error) throw error;
  if (!Array.isArray(ids) || !Number.isSafeInteger(count) || count < 0
      || ids.length > pageSize || ids.some(row => !validProjectId(row?.id))
      || new Set(ids.map(row => row.id)).size !== ids.length) throw Error('INVALID_CATALOG_PAGE');
  const found = new Map();
  for (let offset = 0; offset < ids.length; offset += 10) {
    let pending = ids.slice(offset, offset + 10).map(row => row.id);
    // Also tolerate an upstream row cap below ten without silently losing rows.
    while (pending.length) {
      const { data, error: batchError } = await readBatch(pending);
      if (batchError) throw batchError;
      if (!Array.isArray(data) || data.some(row => !pending.includes(row?.id))
          || new Set(data.map(row => row.id)).size !== data.length) throw Error('INVALID_CATALOG_BATCH');
      if (!data.length) break; // Withdrawn or newly excluded by the same filters.
      for (const row of data) if (row.is_public === true) found.set(row.id, row);
      const returned = new Set(data.map(row => row.id));
      pending = pending.filter(id => !returned.has(id));
    }
  }
  return { rows: ids.map(row => found.get(row.id)).filter(Boolean),
    total: count, hasMore: (page + 1) * pageSize < count };
}
