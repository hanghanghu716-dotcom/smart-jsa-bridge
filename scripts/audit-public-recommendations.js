import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { AUDIT_TABLES, auditRecommendationSnapshot } from './recommendation-data-audit.js';
import { contentFingerprint } from './case-build-data.js';

// Use only the public anon credential already shipped by this application.
// No service-role keys, user sessions, writes or privileged schema queries.
const client = await fs.readFile('src/supabaseClient.js', 'utf8');
const literal = name => new RegExp(`const\\s+${name}\\s*=\\s*['"]([^'"\\n]+)['"]`).exec(client)?.[1];
const url = literal('supabaseUrl'), key = literal('supabaseAnonKey');
const project = new URL(url);
const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
if (payload.role !== 'anon' || project.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(project.hostname)) {
  throw Error('Expected the application public anon credential and Supabase project.');
}
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const tables = {}, failures = {};
const startedAt = new Date().toISOString();
for (const table of AUDIT_TABLES) {
  const rows = [];
  try {
    for (let page = 0; ; page++) {
      if (page >= 1000) throw Error('Pagination ceiling reached');
      const endpoint = new URL(`/rest/v1/${table}`, project);
      endpoint.searchParams.set('select', '*');
      endpoint.searchParams.set('order', table === 'hazard_measure_mappings' ? 'hazard_translation_id,measure_translation_id'
        : table === 'current_advanced_measure_mappings' ? 'current_measure_translation_id,advanced_measure_translation_id' : 'id');
      const response = await fetch(endpoint, { headers: { ...headers, Range: `${rows.length}-${rows.length + 999}`, Prefer: 'count=exact' }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const batch = await response.json();
      if (!Array.isArray(batch)) throw Error('Expected array');
      rows.push(...batch);
      const total = /\/(\d+)$/.exec(response.headers.get('content-range') || '')?.[1];
      if (total != null && rows.length >= Number(total)) break;
      if (!batch.length) { if (total != null) throw Error('Incomplete pagination'); break; }
    }
    tables[table] = rows;
  } catch (error) { failures[table] = error.message.replace(/https?:\/\/\S+/g, '[endpoint]'); }
}
const snapshot = { meta: { capturedAt: startedAt, complete: Object.keys(failures).length === 0,
  visibility: 'public_anon_RLS_visible_rows_only', consistency: 'sequential_reads_not_transactional' }, tables };
const report = { ...auditRecommendationSnapshot(snapshot), completedAt: new Date().toISOString(), failures,
  project: project.hostname, schemaAuthority: 'PostgREST public schema only; database constraints and RLS require privileged read-only audit' };
try {
  const response = await fetch(new URL('/rest/v1/', project), { headers: { ...headers, Accept: 'application/openapi+json' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  const schema = await response.json();
  report.publicSchema = Object.fromEntries(AUDIT_TABLES.map(table => [table, schema.definitions?.[table] || null]));
} catch (error) { report.schemaReadError = error.message; }
const examples = (maps, sources, targets, sourceId, targetId, sourceText, targetText) => {
  if (![maps, sources, targets].every(Array.isArray)) return null;
  const sourceMap = new Map(sources.map(x => [String(x.id), x])), targetMap = new Map(targets.map(x => [String(x.id), x]));
  const perLocale = {};
  for (const m of maps.filter(m => Number(m.similarity_score) >= .95)) {
    const s = sourceMap.get(String(m[sourceId])), t = targetMap.get(String(m[targetId]));
    if (!s || !t) continue;
    const group = perLocale[s.locale] ||= [];
    if (group.length < 3) group.push({ sourceId: s.id, targetId: t.id, source: s[sourceText], target: t[targetText], targetLocale: t.locale, score: m.similarity_score });
  }
  return perLocale;
};
report.highScoreExamples = {
  hazardToControl: examples(tables.hazard_measure_mappings, tables.Hazards_Translations, tables.Current_Measures_Translations, 'hazard_translation_id', 'measure_translation_id', 'hazard_name', 'measure_text'),
  currentToAdditional: examples(tables.current_advanced_measure_mappings, tables.Current_Measures_Translations, tables.Advanced_Measures_Translations, 'current_measure_translation_id', 'advanced_measure_translation_id', 'measure_text', 'solution_text'),
};
report.caseSources = (tables.case_studies || []).filter(x => ['jsa-compressed-air-filter-element', 'jsa-asphalt-milling', 'jsa-aluminum-actig'].includes(x.post_group_id))
  .map(x => ({ id: x.id, group: x.post_group_id, locale: x.language_code, fingerprint: contentFingerprint(x) }));
report.snapshotDigest = createHash('sha256').update(JSON.stringify(tables)).digest('hex');
await fs.mkdir('artifacts/recommendations', { recursive: true });
await fs.writeFile('artifacts/recommendations/public-data-audit.json', JSON.stringify(report, null, 2));
console.log('RECOMMENDATION_AUDIT_JSON ' + JSON.stringify(report));
