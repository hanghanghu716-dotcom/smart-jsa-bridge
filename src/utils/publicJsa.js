import { SUPPORTED_LANGS } from '../locales/config.js';
import { publicProjectSnapshot, projectEditorState } from './projectPersistence.js';

export const PUBLIC_JSA_FIELDS = 'id,title,author_id,is_public,public_locale,form_data,analysis_data,custom_layout,tags,created_at,updated_at,scrap_count';
export const validProjectId = id => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const cleanText = value => typeof value === 'string' ? value.trim() : '';

// Public readers never receive private document fields, even for older rows.
export function publicJsaView(row) {
  if (!row || row.is_public !== true) return null;
  const clean = publicProjectSnapshot({ formData: row.form_data || {}, analysisData: Array.isArray(row.analysis_data) ? row.analysis_data.filter(step => step && typeof step === 'object').map(step => ({ ...step, risks: Array.isArray(step.risks) ? step.risks.filter(risk => risk && typeof risk === 'object') : [] })) : [], layoutData: row.custom_layout || {} });
  return { id: row.id, author_id: row.author_id, title: cleanText(row.title), is_public: true,
    public_locale: SUPPORTED_LANGS.includes(row.public_locale) ? row.public_locale : null,
    form_data: clean.formData, analysis_data: clean.analysisData, participants: [],
    custom_layout: { ...clean.layoutData, procedures: clean.procedures },
    tags: Array.isArray(row.tags) ? row.tags.filter(tag => typeof tag === 'string') : [],
    created_at: row.created_at, updated_at: row.updated_at, scrap_count: Number(row.scrap_count) || 0 };
}

export function publicJsaQuality(row) {
  const steps = Array.isArray(row?.analysis_data) ? row.analysis_data : [];
  const complete = steps.filter(step => step && cleanText(step.proc?.stepTitle) && cleanText(step.proc?.stepDetail)
    && Array.isArray(step.risks) && step.risks.some(risk => cleanText(risk?.factor)
      && (cleanText(risk.measure) || cleanText(risk.current_measure) || cleanText(risk.recommend_measure))));
  const distinct = new Set(complete.map(step => cleanText(step.proc.stepTitle).toLowerCase())).size;
  const meaningful = complete.reduce((sum, step) => sum + cleanText(step.proc.stepDetail).length
    + step.risks.reduce((n, risk) => n + ['factor','measure','current_measure','recommend_measure'].reduce((count, field) => count + cleanText(risk[field]).length, 0), 0), 0);
  return { indexable: row?.is_public === true && SUPPORTED_LANGS.includes(row.public_locale)
    && cleanText(row.title).length >= 4 && !/^(untitled(?: jsa)?|제목 없음)$/i.test(cleanText(row.title))
    && complete.length >= 3 && distinct >= 3 && meaningful >= 180,
  steps: steps.length, complete: complete.length };
}

export function publicForkState(row) {
  const safe = publicJsaView(row);
  if (!safe) throw new Error('PUBLIC_JSA_UNAVAILABLE');
  return projectEditorState(safe, false);
}

export function safeReturnPath(value, fallback = '/') {
  // Control characters and backslashes must not become navigation targets.
  // eslint-disable-next-line no-control-regex
  return typeof value === 'string' && /^\/(?!\/)/.test(value) && !/[\\\x00-\x1f]/.test(value) ? value : fallback;
}
