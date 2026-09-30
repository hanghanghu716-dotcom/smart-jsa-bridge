import { pickDocumentLayout } from './documentLayout.js';

export function projectEditorState(project, own = false) {
  const layout = project.custom_layout || {};
  return {
    ...pickDocumentLayout(layout),
    formData: project.form_data || {}, participants: project.participants || [],
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
  const analysisData = (snapshot.analysisData || []).map(step => {
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
  const data = isPublic ? publicProjectSnapshot(snapshot) : snapshot;
  const layout = { ...pickDocumentLayout(data.layoutData), procedures: data.procedures || [] };
  delete layout.projectSaveContext;
  return {
    author_id: userId, user_id: userId, title: data.formData.projectName,
    project_name: data.formData.projectName, is_public: isPublic,
    form_data: data.formData, participants: data.participants || [],
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
