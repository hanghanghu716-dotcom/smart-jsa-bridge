import { supabase } from '../supabaseClient';

export const listWorkSteps = async ({ search = '', favoritesOnly = false, limit = 100 } = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('user_work_steps')
    .select('*')
    .eq('user_id', user.id)
    .order('is_favorite', { ascending: false })
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (favoritesOnly) query = query.eq('is_favorite', true);
  if (search.trim()) {
    const escaped = search.trim().replace(/[%_]/g, match => '\\' + match);
    query = query.or(`title.ilike.%${escaped}%,detail.ilike.%${escaped}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const saveWorkStep = async ({
  title,
  detail = '',
  analysisData = {},
  tags = [],
  locale = 'en-US',
  sourceProjectId = null,
  sourceProjectTitle = null,
  sourceStepIndex = null,
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('LOGIN_REQUIRED');

  const payload = {
    user_id: user.id,
    title: title?.trim() || 'Untitled step',
    detail: detail || '',
    analysis_data: analysisData || {},
    tags: Array.isArray(tags) ? tags : [],
    locale,
    source_project_id: sourceProjectId || null,
    source_project_title: sourceProjectTitle || null,
    source_step_index: Number.isInteger(sourceStepIndex) ? sourceStepIndex : null,
    updated_at: new Date().toISOString(),
  };

  const writeQuery = sourceProjectId && Number.isInteger(sourceStepIndex)
    ? supabase
        .from('user_work_steps')
        .upsert(payload, {
          onConflict: 'user_id,source_project_id,source_step_index',
          ignoreDuplicates: false
        })
    : supabase
        .from('user_work_steps')
        .insert(payload);

  const { data, error } = await writeQuery
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveProjectWorkSteps = async (project) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('LOGIN_REQUIRED');
  if (!project?.id || !Array.isArray(project.analysis_data)) return [];

  const rows = project.analysis_data
    .map((step, index) => {
      const title = step?.proc?.stepTitle?.trim();
      if (!title) return null;
      return {
        user_id: user.id,
        title,
        detail: step?.proc?.stepDetail || '',
        analysis_data: {
          ...step,
          proc: {
            stepTitle: title,
            stepDetail: step?.proc?.stepDetail || ''
          },
          risks: Array.isArray(step?.risks) ? step.risks.map(risk => ({ ...risk })) : []
        },
        tags: Array.isArray(project.tags) ? project.tags : [],
        locale: project.form_data?.locale || 'en-US',
        source_project_id: project.id,
        source_project_title: project.title || '',
        source_step_index: index,
        updated_at: new Date().toISOString()
      };
    })
    .filter(Boolean);

  if (!rows.length) return [];

  const { data, error } = await supabase
    .from('user_work_steps')
    .upsert(rows, {
      onConflict: 'user_id,source_project_id,source_step_index',
      ignoreDuplicates: false
    })
    .select();

  if (error) throw error;
  return data || [];
};

export const cloneWorkStep = async (step) => {
  if (!step) return null;

  return saveWorkStep({
    title: step.title ? `${step.title} (Copy)` : 'Untitled step (Copy)',
    detail: step.detail || '',
    analysisData: {
      ...(step.analysis_data || {}),
      risks: Array.isArray(step.analysis_data?.risks)
        ? step.analysis_data.risks.map(risk => ({ ...risk }))
        : []
    },
    tags: Array.isArray(step.tags) ? [...step.tags] : [],
    locale: step.locale || 'en-US',
    sourceProjectId: null,
    sourceProjectTitle: step.source_project_title || '',
    sourceStepIndex: null,
  });
};

export const setWorkStepFavorite = async (step, isFavorite) => {
  if (!step?.id) return null;
  return updateWorkStep(step.id, { is_favorite: Boolean(isFavorite) });
};

export const updateWorkStep = async (id, patch) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('LOGIN_REQUIRED');

  const { data, error } = await supabase
    .from('user_work_steps')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteWorkStep = async (id) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('LOGIN_REQUIRED');

  const { error } = await supabase
    .from('user_work_steps')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const markWorkStepUsed = async (step) => {
  if (!step?.id) return;
  await updateWorkStep(step.id, {
    use_count: Number(step.use_count || 0) + 1,
    last_used_at: new Date().toISOString(),
  });
};


export const listWorkStepVersions = async (workStepId, limit = 20) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !workStepId) return [];

  const { data, error } = await supabase
    .from('user_work_step_versions')
    .select('*')
    .eq('work_step_id', workStepId)
    .eq('user_id', user.id)
    .order('version', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const restoreWorkStepVersion = async (workStepId, versionRow) => {
  if (!workStepId || !versionRow?.snapshot) return null;

  const snapshot = versionRow.snapshot;
  return updateWorkStep(workStepId, {
    title: snapshot.title || 'Untitled step',
    detail: snapshot.detail || '',
    analysis_data: snapshot.analysis_data || {},
    tags: Array.isArray(snapshot.tags) ? snapshot.tags : [],
    locale: snapshot.locale || 'en-US',
    source_project_id: snapshot.source_project_id || null,
    source_step_index: Number.isInteger(snapshot.source_step_index)
      ? snapshot.source_step_index
      : null,
    source_project_title: snapshot.source_project_title || null,
  });
};
