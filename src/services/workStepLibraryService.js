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

  const { data, error } = await supabase
    .from('user_work_steps')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
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
