import { validCountry } from '../utils/publicCountry.js';
import { supabase } from '../supabaseClient';
import { PUBLIC_JSA_FIELDS, publicJsaView, validProjectId, publicSortColumn } from '../utils/publicJsa.js';

export async function getPublicJsa(id, client = supabase) {
  if (!validProjectId(id)) return null;
  const { data, error } = await client.from('public_jsa_catalog').select(PUBLIC_JSA_FIELDS).eq('id', id).eq('is_public', true).maybeSingle();
  if (error) throw error;
  return publicJsaView(data);
}
export async function listPublicJsa({ search = '', tags = [], sort = 'latest', page = 0, country = null, author = null, blocked = [], hidden = [], client = supabase } = {}) {
  let query = client.from('public_jsa_catalog').select(PUBLIC_JSA_FIELDS, { count: 'exact' }).eq('is_public', true);
  if (author === 'operator') query = query.eq('is_operator', true);
  if (validCountry(country)) query = query.eq('public_country', country);
  const excludedAuthors = blocked.filter(validProjectId), excludedProjects = hidden.filter(validProjectId);
  if (excludedAuthors.length) query = query.not('author_id', 'in', '(' + excludedAuthors.join(',') + ')');
  if (excludedProjects.length) query = query.not('id', 'in', '(' + excludedProjects.join(',') + ')');
  if (search.trim()) query = query.ilike('title', '%' + search.trim().replace(/[\\%_]/g, '\\$&') + '%');
  if (tags.length) query = query.contains('tags', tags);
  query = query.order(publicSortColumn(sort), { ascending: false }).order('id', { ascending: true });
  const { data, error, count } = await query.range(page * 24, page * 24 + 23);
  if (error) throw error;
  return { rows: (data || []).map(publicJsaView).filter(Boolean), total: count || 0, hasMore: (page + 1) * 24 < count };
}
export async function scrapPublicJsa(id, client = supabase) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('AUTH_REQUIRED');
  if (!await getPublicJsa(id, client)) throw new Error('PUBLIC_JSA_UNAVAILABLE');
  const { error } = await client.from('user_favorites').upsert({ user_id: user.id, project_id: id }, { onConflict: 'user_id,project_id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function listDocumentVariants(row, client = supabase) {
  if (!validProjectId(row?.document_group_id) || !validProjectId(row?.author_id)) return [];
  const { data, error } = await client.from('public_jsa_catalog')
    .select(PUBLIC_JSA_FIELDS).eq('is_public', true)
    .eq('document_group_id', row.document_group_id).eq('author_id', row.author_id);
  if (error) throw error;
  const order = { handover: 0, technical: 1, basic: 2 };
  return (data || []).map(publicJsaView).filter(Boolean).sort((a,b) => (order[a.document_variant] ?? 3) - (order[b.document_variant] ?? 3));
}
