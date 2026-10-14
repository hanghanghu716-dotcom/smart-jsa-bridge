import { getDataLocale, getLanguageTag, normalizeLocale, SUPPORTED_LANGS } from '../locales/config.js';

const normalized = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();
const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const presentId = value => typeof value === 'string' ? value.trim().length > 0 : Number.isSafeInteger(value) && value > 0;

export function recommendationContext(formData = {}, screenLocale = 'en-US') {
  const requested = normalizeLocale(formData?.context?.documentLocale || screenLocale);
  const documentLocale = SUPPORTED_LANGS.includes(requested) ? requested : requested === 'ko-KR' ? 'ko' : 'en-US';
  const dataLocale = getDataLocale(documentLocale) === 'ko' ? 'ko-KR' : getDataLocale(documentLocale);
  return { documentLocale, dataLocale, jurisdiction: formData?.context?.jurisdiction || '',
    sharedLanguage: dataLocale !== (documentLocale === 'ko' ? 'ko-KR' : documentLocale) };
}

export function normalizeKeywords(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return []; }
  }
  return Array.isArray(value) ? [...new Set(value.filter(v => typeof v === 'string').map(normalized).filter(Boolean))] : [];
}

export function localizedHazards(rows = []) {
  return rows.filter(row => presentId(row.id) && typeof row.hazard_name === 'string' && row.hazard_name.trim())
    .map(row => ({ id: row.hazard_id ?? `translation:${row.id}`, db_id: row.hazard_id ?? null,
      hazard_reference: { id: row.id, masterId: row.hazard_id ?? null, locale: row.locale, kind: 'translation' },
      risk_factor: row.hazard_name, category: row.category || '', keywords: normalizeKeywords(row.keywords), source: 'master' }));
}

export function matchesHazardKeywords(item, text) {
  const haystack = normalized(text);
  return normalizeKeywords(item.keywords).some(keyword => {
    if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(keyword)) {
      return haystack.replace(/\s/gu, '').includes(keyword.replace(/\s/gu, ''));
    }
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'u').test(haystack);
  });
}

export function updateRiskValue(risk, field, value) {
  if (risk[field] === value) return risk;
  const next = { ...risk, [field]: value };
  if (field === 'factor') {
    Object.assign(next, { db_id: null, hazard_reference: null, current_measure_db_id: null,
      current_measure_reference: null, advanced_measure_db_id: null, advanced_measure_reference: null,
      measure_reference: null, current_measure_confirmed: false, recommendation_score: null,
      recommendation_review_required: Boolean(risk.measure || risk.current_measure || risk.recommend_measure) });
  } else if (field === 'current_measure') {
    Object.assign(next, { current_measure_db_id: null, current_measure_reference: null,
      advanced_measure_db_id: null, advanced_measure_reference: null, current_measure_confirmed: false,
      recommendation_score: null, recommendation_review_required: Boolean(risk.recommend_measure) });
  } else if (field === 'recommend_measure' || field === 'measure') {
    Object.assign(next, { advanced_measure_db_id: null, advanced_measure_reference: null,
      measure_reference: null, recommendation_score: null });
  }
  return next;
}

export function applyControl(risk, item, { type, jsaType }) {
  const field = jsaType === '2-step' ? 'measure' : type === 'current' ? 'current_measure' : 'recommend_measure';
  const next = updateRiskValue(risk, field, item.display);
  if (field === 'current_measure') return { ...next, current_measure_db_id: item.measure_db_id ?? null,
    current_measure_reference: item.reference, current_measure_confirmed: false,
    advanced_measure_db_id: null, advanced_measure_reference: null, recommendation_score: null,
    recommendation_review_required: Boolean(risk.recommend_measure) };
  return { ...next, [field === 'measure' ? 'measure_reference' : 'advanced_measure_reference']: item.reference,
    ...(field === 'recommend_measure' ? { advanced_measure_db_id: item.advanced_db_id ?? null } : {}) };
}

export function formatSimilarity(score, locale) {
  if (score === '' || score == null || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 1) return null;
  return new Intl.NumberFormat(getLanguageTag(locale) || 'en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(score));
}

async function rows(query) {
  const result = await query;
  if (result.error) throw result.error;
  return result.data || [];
}

async function hazardTranslation(client, risk, locale) {
  let query = client.from('Hazards_Translations').select('id,hazard_id,hazard_name,locale').eq('locale', locale);
  const ref = risk.hazard_reference;
  if (ref?.kind === 'translation' && ref.locale === locale && presentId(ref.id)) query = query.eq('id', ref.id);
  else if (presentId(risk.db_id)) query = query.eq('hazard_id', risk.db_id);
  else return null;
  // Older drafts may contain ambiguous IDs. Never reinterpret a master ID as a translation ID.
  const found = (await rows(query)).filter(row => normalized(row.hazard_name) === normalized(risk.factor));
  return found.length === 1 ? found[0] : null;
}

function scoredCandidates(mappings, translations, { target, master, text, locale, type }) {
  const grouped = new Map();
  for (const map of mappings) {
    const value = map.similarity_score;
    if (value === '' || value == null || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1) continue;
    const key = String(map[target]);
    const scores = grouped.get(key) || new Set();
    scores.add(Number(value)); grouped.set(key, scores);
  }
  return translations.filter(row => row.locale === locale && typeof row[text] === 'string' && row[text].trim())
    .filter(row => grouped.get(String(row.id))?.size === 1)
    .map(row => ({ display: row[text], similarity_score: [...grouped.get(String(row.id))][0],
      ...(type === 'current' ? { measure_db_id: row[master] ?? null } : { advanced_db_id: row[master] ?? null }),
      reference: { kind: 'translation', id: row.id, masterId: row[master] ?? null, locale },
      score_kind: 'text_similarity', review_status: 'unverified_legacy' }))
    .sort((a, b) => b.similarity_score - a.similarity_score);
}

export async function loadMeasureRecommendations(client, { risk, type = 'current', context }) {
  const locale = context.dataLocale;
  const hazard = await hazardTranslation(client, risk, locale);
  if (!hazard) return [];
  const mappings = await rows(client.from('hazard_measure_mappings')
    .select('measure_translation_id,similarity_score').eq('hazard_translation_id', hazard.id));
  const ids = [...new Set(mappings.map(row => row.measure_translation_id).filter(presentId))];
  if (!ids.length) return [];
  const translations = await rows(client.from('Current_Measures_Translations')
    .select('id,measure_id,measure_text,locale').in('id', ids).eq('locale', locale));
  const current = scoredCandidates(mappings, translations,
    { target: 'measure_translation_id', master: 'measure_id', text: 'measure_text', locale, type: 'current' });
  if (type === 'current') return current;

  // Supplementary controls must remain linked to this hazard and the actual selected control.
  // This verifies linkage, not semantic relevance; legacy scores remain labelled text similarity.
  const selected = current.filter(item => normalized(item.display) === normalized(risk.current_measure))
    .filter(item => risk.current_measure_reference?.kind === 'translation'
      ? risk.current_measure_reference.locale === locale && sameId(item.reference.id, risk.current_measure_reference.id)
      : sameId(item.measure_db_id, risk.current_measure_db_id));
  if (selected.length !== 1) return [];
  const advancedMappings = await rows(client.from('current_advanced_measure_mappings')
    .select('advanced_measure_translation_id,similarity_score').eq('current_measure_translation_id', selected[0].reference.id));
  const advancedIds = [...new Set(advancedMappings.map(row => row.advanced_measure_translation_id).filter(presentId))];
  if (!advancedIds.length) return [];
  const advanced = await rows(client.from('Advanced_Measures_Translations')
    .select('id,advanced_measure_id,solution_text,locale').in('id', advancedIds).eq('locale', locale));
  return scoredCandidates(advancedMappings, advanced,
    { target: 'advanced_measure_translation_id', master: 'advanced_measure_id', text: 'solution_text', locale, type: 'advanced' });
}

export async function searchMeasureTranslations(client, { term, type, locale }) {
  const current = type === 'current', master = current ? 'measure_id' : 'advanced_measure_id';
  const text = current ? 'measure_text' : 'solution_text';
  let query = client.from(current ? 'Current_Measures_Translations' : 'Advanced_Measures_Translations')
    .select(`id,${master},${text},locale`).eq('locale', locale);
  const tokens = String(term || '').trim().split(/\s+/u).filter(Boolean);
  if (!tokens.length) return [];
  for (const token of tokens) query = query.ilike(text, `%${token.replace(/[\\%_]/g, '\\$&')}%`);
  return (await rows(query.limit(30))).map(row => ({ display: row[text],
    ...(current ? { measure_db_id: row[master] ?? null } : { advanced_db_id: row[master] ?? null }),
    reference: { kind: 'translation', id: row.id, masterId: row[master] ?? null, locale } }));
}
