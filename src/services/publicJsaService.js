import { supabase } from '../supabaseClient';
import { PUBLIC_JSA_FIELDS, publicJsaView, validProjectId } from '../utils/publicJsa.js';

export async function getPublicJsa(id, client = supabase) {
  if (!validProjectId(id)) return null;
  const { data, error } = await client.from('jsa_projects').select(PUBLIC_JSA_FIELDS).eq('id', id).eq('is_public', true).maybeSingle();
  if (error) throw error;
  return publicJsaView(data);
}
export async function listPublicJsa({ search = '', tags = [], sort = 'latest', page = 0, client = supabase } = {}) {
  let query = client.from('jsa_projects').select(PUBLIC_JSA_FIELDS).eq('is_public', true);
  if (search.trim()) query = query.ilike('title', '%' + search.trim().replace(/[\\%_]/g, '\\$&') + '%');
  if (tags.length) query = query.contains('tags', tags);
  query = query.order(sort === 'popular' ? 'scrap_count' : 'created_at', { ascending: false }).order('id', { ascending: true });
  const { data, error } = await query.range(page * 24, page * 24 + 23);
  if (error) throw error;
  return { rows: (data || []).map(publicJsaView).filter(Boolean), hasMore: data?.length === 24 };
}
export async function scrapPublicJsa(id, client = supabase) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('AUTH_REQUIRED');
  if (!await getPublicJsa(id, client)) throw new Error('PUBLIC_JSA_UNAVAILABLE');
  const { error } = await client.from('user_favorites').upsert({ user_id: user.id, project_id: id }, { onConflict: 'user_id,project_id', ignoreDuplicates: true });
  if (error) throw error;
}
