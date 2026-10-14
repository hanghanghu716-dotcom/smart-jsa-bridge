import fs from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import process from 'node:process';
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
const masters = ['Hazards', 'Current_Measures', 'Advanced_Measures'];
for (const table of [...AUDIT_TABLES, ...masters]) {
  const rows = [];
  try {
    for (let page = 0; ; page++) {
      if (page >= 1000) throw Error('Pagination ceiling reached');
      const endpoint = new URL(`/rest/v1/${table}`, project);
      endpoint.searchParams.set('select', masters.includes(table) ? 'id' : table === 'case_studies' ? 'id,post_group_id,language_code,title,created_at' : '*');
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
report.schemaInspection = 'Use the separate authorized read-only management audit; public schema discovery previously returned 401 and is not retried by this row audit.';
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
try {
  const endpoint = new URL('/rest/v1/case_studies', project);
  endpoint.searchParams.set('select', 'id,post_group_id,language_code,title,meta_title,meta_description,content_md,schema_markup,pdf_download_url,pdf_list');
  endpoint.searchParams.set('post_group_id', 'in.(jsa-compressed-air-filter-element,jsa-asphalt-milling,jsa-aluminum-actig)');
  endpoint.searchParams.set('language_code', 'eq.en-US');
  const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  const cases = await response.json();
  report.caseSources = cases.map(x => ({ id: x.id, group: x.post_group_id, locale: x.language_code, fingerprint: contentFingerprint(x) }));
} catch (error) { report.caseSourceReadError = error.message; }
report.translationLocales = Object.fromEntries(['Hazards_Translations', 'Current_Measures_Translations', 'Advanced_Measures_Translations'].map(table => {
  const rows = tables[table];
  const master = table === 'Hazards_Translations' ? 'hazard_id' : table === 'Current_Measures_Translations' ? 'measure_id' : 'advanced_measure_id';
  return [table, rows ? Object.fromEntries([...new Set(rows.map(x => x.locale))].map(locale => {
    const local = rows.filter(x => x.locale === locale);
    return [locale, { rows: local.length, missingMaster: local.filter(x => x[master] == null).length,
      missingKeywords: table === 'Hazards_Translations' ? local.filter(x => !x.keywords || JSON.stringify(x.keywords) === '[]').length : null }];
  })) : null];
}));
report.mappingLocales = Object.fromEntries([['hazard_measure_mappings', 'Hazards_Translations', 'hazard_translation_id'],
  ['current_advanced_measure_mappings', 'Current_Measures_Translations', 'current_measure_translation_id']].map(([table, source, sourceId]) => {
  if (!tables[table] || !tables[source]) return [table, null];
  const locales = new Map(tables[source].map(x => [String(x.id), x.locale]));
  const groups = {};
  for (const row of tables[table]) (groups[locales.get(String(row[sourceId])) || 'unknown'] ||= []).push(Number(row.similarity_score));
  return [table, Object.fromEntries(Object.entries(groups).map(([locale, scores]) => {
    scores.sort((a, b) => a - b);
    return [locale, { rows: scores.length, highScore: scores.filter(x => x >= .95).length, min: scores[0], max: scores.at(-1), median: scores[Math.floor(scores.length / 2)] }];
  }))];
}));
report.snapshotDigest = createHash('sha256').update(JSON.stringify(tables)).digest('hex');
report.masterReferences = Object.fromEntries(masters.map((table, i) => {
  const translation = [tables.Hazards_Translations, tables.Current_Measures_Translations, tables.Advanced_Measures_Translations][i];
  const key = ['hazard_id', 'measure_id', 'advanced_measure_id'][i];
  const ids = new Set((tables[table] || []).map(row => String(row.id)));
  const unresolved = tables[table] && translation ? translation.filter(row => row[key] != null && !ids.has(String(row[key]))) : null;
  return [table, { rows: tables[table]?.length ?? null, missingReferencedMaster: tables[table] && translation
    ? unresolved.length : null,
    interpretation: 'Absent from public RLS-visible master rows; privileged visibility must distinguish hidden rows from genuine orphans.',
    missingMasterIds: unresolved ? [...new Set(unresolved.map(row => row[key]))] : null,
    affectedLocales: unresolved ? Object.fromEntries([...new Set(unresolved.map(row => row.locale))].map(locale => [locale, unresolved.filter(row => row.locale === locale).length])) : null,
    // Examples are a bounded review aid; all rows above were scanned and counted.
    examples: unresolved?.slice(0, 5).map(row => ({ translationId: row.id, masterId: row[key], locale: row.locale,
      text: row.hazard_name || row.measure_text || row.solution_text })) ?? null }];
}));
const allowedLocales = new Set(report.coverage.map(row => row.dataLocale));
report.invalidTranslationLocales = Object.fromEntries(['Hazards_Translations', 'Current_Measures_Translations', 'Advanced_Measures_Translations']
  .map(table => [table, tables[table]?.filter(row => !allowedLocales.has(row.locale)).map(row => ({ id: row.id, locale: row.locale,
    masterId: row.hazard_id ?? row.measure_id ?? row.advanced_measure_id, text: row.hazard_name || row.measure_text || row.solution_text })) ?? null]));
report.duplicateMappingKinds = Object.fromEntries([
  ['hazard_measure_mappings', 'hazard_translation_id', 'measure_translation_id'],
  ['current_advanced_measure_mappings', 'current_measure_translation_id', 'advanced_measure_translation_id'],
].map(([table, source, target]) => {
  if (!tables[table]) return [table, null];
  const pairs = new Map();
  for (const row of tables[table]) {
    const key = `${row[source]}:${row[target]}`, values = pairs.get(key) || [];
    values.push(row.similarity_score); pairs.set(key, values);
  }
  const duplicate = [...pairs.values()].filter(x => x.length > 1);
  return [table, { identicalScorePairs: duplicate.filter(x => new Set(x).size === 1).length,
    conflictingScorePairs: duplicate.filter(x => new Set(x).size > 1).length, extraRows: duplicate.reduce((n, x) => n + x.length - 1, 0) }];
}));
await fs.mkdir('artifacts/recommendations', { recursive: true });
await fs.writeFile('artifacts/recommendations/public-data-audit.json', JSON.stringify(report, null, 2));
console.log('RECOMMENDATION_AUDIT_JSON ' + JSON.stringify(report));
if (!report.snapshotComplete) {
  console.error('Public DB audit incomplete; failed reads are unknown, not zero rows. See public-data-audit.json.');
  process.exitCode = 1;
}
