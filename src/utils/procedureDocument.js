import { publicJsaView } from './publicJsa.js';

export function procedureRows(value) {
  return (Array.isArray(value) ? value : []).filter(row => row && typeof row === 'object').map(row => ({
    stepTitle: typeof row.stepTitle === 'string' ? row.stepTitle.trim() : '',
    stepDetail: typeof row.stepDetail === 'string' ? row.stepDetail.trim() : '',
  })).filter(row => row.stepTitle || row.stepDetail);
}

export function projectProcedureDocument(project, own = false) {
  const row = own ? project : publicJsaView(project);
  if (!row) return null;
  return { title: row.title || '', formData: row.form_data || {},
    locale: row.form_data?.context?.documentLocale || row.public_locale,
    paperSize: row.custom_layout?.paperSize,
    procedures: procedureRows(own && Array.isArray(row.custom_layout?.procedures)
      ? row.custom_layout.procedures : row.analysis_data?.map(step => step?.proc)),
  };
}

export function draftProcedureDocument(draft) {
  return { title: draft.title || '', formData: draft.form_data || {},
    locale: draft.form_data?.context?.documentLocale, paperSize: draft.layout_data?.paperSize,
    procedures: procedureRows(Array.isArray(draft.procedures) ? draft.procedures : draft.analysis_data?.map(step => step?.proc)),
  };
}
