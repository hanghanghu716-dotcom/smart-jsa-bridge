// Clean visible summaries without modifying the source articles.
export function cleanSummary(value = '') {
  return String(value)
    .split(/(?:<keyword\b[^>]*>|\[\s*(?:Target\s+)?Keywords?\s*:|\bTarget\s+Keywords?\s*:)/i)[0]
    .replace(/\s+/g, ' ').trim();
}

// Quote PostgREST values so punctuation cannot introduce another OR clause.
export function dictionarySearchFilter(term) {
  const escaped = String(term).trim().replace(/[\\%_*]/g, '\\$&').replace(/"/g, '\\"');
  const value = '"%' + escaped + '%"';
  // keywords is a text[] in the database; ILIKE only accepts text columns.
  return ['hazard_name', 'measure_text', 'solution_text']
    .map(column => column + '.ilike.' + value).join(',');
}

export function parseKeywords(value) {
  if (typeof value === 'string') {
    try { value = value.trim().startsWith('[') ? JSON.parse(value) : value.split(','); }
    catch { return []; }
  }
  return Array.isArray(value)
    ? [...new Set(value.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean))]
    : [];
}

export function serializeStructuredData(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object') return null;
    return JSON.stringify(parsed).replace(/</g, '\\u003c');
  } catch { return null; }
}
