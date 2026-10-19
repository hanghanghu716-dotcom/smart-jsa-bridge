import { readAllPages } from './pagedRead.js';

async function readRows(query) {
  const { data, error } = await query;
  if (error) throw error;
  if (!Array.isArray(data)) throw Error('INVALID_LIST_RESULT');
  return data;
}

// Each library section owns its failure. A moderation or draft read must not
// prevent successfully loaded documents from being opened for editing.
export async function readLibrary(client, userId) {
  const reads = {
    categories: () => readRows(client.from('user_jsa_categories').select('*').eq('user_id', userId).order('created_at', { ascending: true })),
    favorites: () => readAllPages(() => client.from('user_favorites').select('id,project_id,category_id').eq('user_id', userId).order('id')),
    authored: () => readAllPages(() => client.from('jsa_projects').select('id,category_id,created_at').eq('author_id', userId).order('created_at', { ascending: false }).order('id')),
    reports: () => readRows(client.from('user_reports').select('*, jsa_projects(title)').eq('reporter_id', userId)),
    // blocked_user_id references auth.users, not profiles. Do not embed private
    // profiles or weaken profile permissions to obtain a display name.
    blocks: () => readRows(client.from('user_blocks').select('id,blocked_user_id,created_at').eq('blocker_id', userId)),
    projectBlocks: () => readRows(client.from('user_project_blocks').select('*, jsa_projects(title)').eq('user_id', userId)),
    layouts: () => readAllPages(() => client.from('user_layouts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).order('id')),
    drafts: () => readAllPages(() => client.from('user_jsa_drafts').select('*').eq('user_id', userId).eq('is_archived', false).order('updated_at', { ascending: false }).order('id')),
    workSteps: () => readAllPages(() => client.from('user_work_steps').select('*').eq('user_id', userId).order('is_favorite', { ascending: false }).order('last_used_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).order('id')),
  };
  const keys = Object.keys(reads);
  const results = await Promise.allSettled(keys.map(key => Promise.resolve().then(reads[key])));
  const data = {}, errors = {};
  results.forEach((result, index) => {
    const key = keys[index];
    data[key] = result.status === 'fulfilled' ? result.value : [];
    if (result.status === 'rejected') errors[key] = true;
  });
  return { data, errors };
}
