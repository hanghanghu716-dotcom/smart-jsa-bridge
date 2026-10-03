import { supabase } from '../supabaseClient';
export async function authorAction(action,id=null,payload={},client=supabase) {
 const {data,error}=await client.rpc('author_action',{p_action:action,p_id:id,p_payload:payload});
 if(error)throw error;
 return data;
}
