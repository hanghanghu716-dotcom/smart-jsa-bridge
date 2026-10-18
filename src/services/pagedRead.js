// The API can cap a response below the requested size. Advance by actual rows
// and stop only at an empty page, rather than silently truncating a library.
export async function readAllPages(makeQuery, { signal, batchSize = 500 } = {}) {
  const rows = [];
  const seen = new Set();
  for (;;) {
    signal?.throwIfAborted();
    let query = makeQuery().range(rows.length, rows.length + batchSize - 1);
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error('INVALID_LIST_RESULT');
    if (!data.length) return rows;
    for (const row of data) {
      if (typeof row.id !== 'string' || seen.has(row.id)) throw new Error('INVALID_LIST_PAGINATION');
      seen.add(row.id);
    }
    rows.push(...data);
  }
}

