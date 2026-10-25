import { validCountry } from '../utils/publicCountry.js';
import { explorePageSize } from '../utils/exploreView.js';
import { supabase } from '../supabaseClient';
import { PUBLIC_JSA_FIELDS, publicJsaView, validProjectId, publicSortColumn } from '../utils/publicJsa.js';
import { readPublicCatalogPage } from '../utils/publicCatalogPage.js';
import { readAllPages } from './pagedRead.js';

export async function publicExclusions(client = supabase) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { blocked: [], hidden: [] };
  const [users, projects] = await Promise.all([
    client.from('user_blocks').select('blocked_user_id').eq('blocker_id', user.id),
    client.from('user_project_blocks').select('project_id').eq('user_id', user.id),
  ]);
  if (users.error || projects.error) throw users.error || projects.error;
  return { blocked: (users.data || []).map(item => item.blocked_user_id), hidden: (projects.data || []).map(item => item.project_id) };
}

function publicFilters(query, { search = '', tags = [], country, author, blocked = [], hidden = [] }) {
  query = query.eq('is_public', true);
  if (author === 'operator') query = query.eq('is_operator', true);
  if (validCountry(country)) query = query.eq('public_country', country);
  const authors = blocked.filter(validProjectId), projects = hidden.filter(validProjectId);
  if (authors.length) query = query.not('author_id', 'in', '(' + authors.join(',') + ')');
  if (projects.length) query = query.not('id', 'in', '(' + projects.join(',') + ')');
  if (search.trim()) query = query.ilike('title', '%' + search.trim().replace(/[\\%_]/g, '\\$&') + '%');
  if (tags.length) query = query.contains('tags', tags);
  return query;
}

export async function listPublicTagCounts({ client = supabase, signal, ...filters } = {}) {
  // Fetch only tag metadata, not document bodies, and never count the current
  // visible page as if it were the entire filtered catalog.
  const rows = await readAllPages(() => publicFilters(client.from('public_jsa_catalog').select('id,tags'), filters)
    .order('id', { ascending: true }), { signal });
  const counts = Object.create(null);
  for (const row of rows) for (const tag of new Set(Array.isArray(row.tags) ? row.tags.filter(tag => typeof tag === 'string') : [])) {
    counts[tag] = (counts[tag] || 0) + 1;
  }
  return counts;
}

export async function getPublicJsa(id, client = supabase) {
  if (!validProjectId(id)) return null;
  const { data, error } = await client.from('public_jsa_catalog').select(PUBLIC_JSA_FIELDS).eq('id', id).eq('is_public', true).maybeSingle();
  if (error) throw error;
  return publicJsaView(data);
}
export async function listPublicJsa({ search = '', tags = [], sort = 'latest', page = 0, view, country = null, author = null, blocked = [], hidden = [], client = supabase } = {}) {
  const pageSize = explorePageSize(view);
  const filters = { search, tags, country, author, blocked, hidden };
  const result = await readPublicCatalogPage({
    page, pageSize,
    readPage: () => publicFilters(client.from('public_jsa_catalog').select('id', { count: 'exact' }), filters)
      .order(publicSortColumn(sort), { ascending: false }).order('id', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1),
    readBatch: ids => publicFilters(client.from('public_jsa_catalog').select(PUBLIC_JSA_FIELDS), filters)
      .in('id', ids),
  });
  return { ...result, rows: result.rows.map(publicJsaView).filter(Boolean) };
}
export async function scrapPublicJsa(id, client = supabase) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('AUTH_REQUIRED');
  if (!await getPublicJsa(id, client)) throw new Error('PUBLIC_JSA_UNAVAILABLE');
  const { error } = await client.from('user_favorites').upsert({ user_id: user.id, project_id: id }, { onConflict: 'user_id,project_id', ignoreDuplicates: true });
  if (error) throw error;
}
