import { supabase } from '../supabaseClient';
import { projectPayload } from '../utils/projectPersistence';

export async function saveProject({ snapshot, mode, targetId, expectedUpdatedAt, tags, parentId, client = supabase }) {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw authError || new Error('AUTH_REQUIRED');
  const payload = projectPayload(snapshot, user.id, mode === 'public', tags, parentId);
  let query;
  if (mode === 'update') {
    if (!targetId || !expectedUpdatedAt) throw new Error('PROJECT_CHANGED');
    query = client.from('jsa_projects').update(payload)
      .eq('id', targetId).eq('author_id', user.id).eq('is_public', false).eq('updated_at', expectedUpdatedAt);
  } else if (mode === 'private' || mode === 'public') {
    query = client.from('jsa_projects').insert(payload);
  } else throw new Error('INVALID_SAVE_MODE');
  const { data, error } = await query.select('id, updated_at, is_public').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('PROJECT_CHANGED');
  return data;
}
