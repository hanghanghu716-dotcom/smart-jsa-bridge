import { supabase } from '../supabaseClient';
import { publicJsaView } from '../utils/publicJsa';

export async function exploreModeration(action, id = null, payload = {}, client = supabase) {
  const { data, error } = await client.rpc('explore_moderation', { p_action: action, p_id: id, p_payload: payload });
  if (error) throw error;
  return data;
}
export async function moderatedDocument(id) {
  const data = await exploreModeration('document', id);
  return { ...publicJsaView(data.document), restricted: data.restricted };
}
