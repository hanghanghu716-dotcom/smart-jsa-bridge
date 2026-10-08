import { documentCountry } from './publicCountry.js';
import { pickDocumentLayout } from './documentLayout.js';

export function getSaveVisibility(formData, context) {
  if (formData?.saveVisibility === 'public' || formData?.saveVisibility === 'private') return formData.saveVisibility;
  return context?.own && context?.isPublic ? 'public' : 'private';
}

export function projectEditorState(project, own = false) {
  const layout = project.custom_layout || {};
  return {
    ...pickDocumentLayout(layout),
    formData: { ...project.form_data, ...(project.public_country && !project.form_data?.context ? { context: { jurisdiction: project.public_country, documentLocale: project.public_locale || '' } } : {}), saveVisibility: own && project.is_public ? 'public' : 'private' }, participants: project.participants || [],
    analysisData: project.analysis_data || [],
    procedures: layout.procedures || (project.analysis_data || []).map(step => step.proc).filter(Boolean),
    existingId: own ? project.id : null, id: own ? project.id : null,
    parentId: own ? project.parent_id : project.id,
    isFork: !own, originalAnalysisData: !own ? project.analysis_data : null,
    projectSaveContext: { id: project.id, updatedAt: project.updated_at, isPublic: project.is_public, own, parentId: project.parent_id || null, originalAnalysisData: own ? null : project.analysis_data },
  };
}

export function publicProjectSnapshot(snapshot) {
  const form = snapshot.formData || {};
  const allowed = ['projectName', 'jsaType', 'workType', 'weather', 'hasNewWorker', 'ppe', 'permits'];
  const formData = Object.fromEntries(allowed.filter(key => key in form).map(key => [key, form[key]]));
  const layoutData = { ...pickDocumentLayout(snapshot.layoutData), documentNotes: '' };
  delete layoutData.stepPhotos;
  delete layoutData.projectSaveContext;
  const analysisData = (snapshot.analysisData || []).filter(step => step && typeof step === 'object').map(step => {
    const clean = { ...step, customFields: {} };
    delete clean.sourceProjectId; delete clean.sourceProjectTitle; delete clean.sourceStepIndex;
    if (step.proc) {
      clean.proc = { stepTitle: step.proc.stepTitle || '', stepDetail: step.proc.stepDetail || '' };
    }
    return clean;
  });
  return { formData, participants: [], analysisData, procedures: analysisData.map(step => step.proc).filter(Boolean), layoutData };
}

export function projectPayload(snapshot, userId, isPublic, tags = [], parentId = null) {
  if (isPublic && snapshot.publicationConsent !== true) throw new Error('PUBLICATION_CONSENT_REQUIRED');
  const data = isPublic ? publicProjectSnapshot(snapshot) : snapshot;
  const layout = { ...pickDocumentLayout(data.layoutData), procedures: data.procedures || [] };
  delete layout.projectSaveContext;
  return {
    author_id: userId, user_id: userId, title: data.formData.projectName,
    ...(isPublic ? { reuse_license: 'community-v1', publication_context: snapshot.publicationContext || {} } : {}),
    project_name: data.formData.projectName, is_public: isPublic,
    ...(isPublic ? { public_locale: snapshot.locale || null, public_country: documentCountry(snapshot.formData?.context, snapshot.locale) } : {}),
    form_data: isPublic ? data.formData : { ...data.formData, saveVisibility: 'private' }, participants: data.participants || [],
    analysis_data: data.analysisData || [], custom_layout: layout,
    tags, auto_tags: tags, parent_id: parentId,
    updated_at: new Date().toISOString(),
  };
}

export function templatePayload(layout) {
  const result = pickDocumentLayout(layout);
  delete result.stepPhotos; delete result.projectSaveContext;
  return result;
}
