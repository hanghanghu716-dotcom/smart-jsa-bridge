import { supabase } from '../supabaseClient';
import { templatePayload } from '../utils/projectPersistence';

async function owner(client) {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw error || new Error('AUTH_REQUIRED');
  return user.id;
}
export async function listTemplates(client = supabase) {
  const userId = await owner(client);
  const { data, error } = await client.from('user_layouts').select('id,name,layout_data,created_at,is_default').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function writeTemplate({ id, name, layout, client = supabase }) {
  const userId = await owner(client);
  if (!name?.trim()) throw new Error('NAME_REQUIRED');
  const payload = { name: name.trim(), ...(layout ? { layout_data: templatePayload(layout) } : {}) };
  const query = id ? client.from('user_layouts').update(payload).eq('id', id).eq('user_id', userId)
    : client.from('user_layouts').insert({ ...payload, user_id: userId });
  const { data, error } = await query.select('id,name,layout_data,created_at,is_default').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('TEMPLATE_NOT_FOUND');
  return data;
}
export async function removeTemplate(id, client = supabase) {
  const userId = await owner(client);
  const { data, error } = await client.from('user_layouts').delete().eq('id', id).eq('user_id', userId).select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('TEMPLATE_NOT_FOUND');
}
export async function setDefaultTemplate(id, client = supabase) {
  await owner(client);
  const { error } = await client.rpc('set_default_document_template', { p_layout_id: id || null });
  if (error) throw error;
}
