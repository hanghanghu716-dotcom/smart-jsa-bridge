import { supabase } from '../supabaseClient';
export async function loadJobs(locale,query){
 const {data,error}=await supabase.rpc('job_catalog',{p_locale:locale,p_query:query.q,p_status:query.status,p_page:query.page});
 if(error)throw error;return data;
}
export async function adminJobs(action='list',id='',data={}){
 const {data:result,error}=await supabase.rpc('job_catalog_admin',{p_action:action,p_id:id,p_data:data});
 if(error)throw error;return result;
}
