import { supabase } from '../supabaseClient';
import { getCaseLanguages, selectLocalizedCases } from '../locales/config';
export async function discoveryLinks(id=null,kind=null,target=null){const {data,error}=await supabase.rpc('discovery_links',{p_id:id,p_kind:kind,p_target:target});if(error)throw error;return data;}
export async function discoveryAdmin(action,id=null,payload={}){const {data,error}=await supabase.rpc('discovery_admin',{p_action:action,p_id:id,p_payload:payload});if(error)throw error;return data;}
export async function editorialTitles(links,locale){
 const ids=[...new Set(links.filter(l=>l.kind==='case').map(l=>l.target))];if(!ids.length)return links;
 const {data,error}=await supabase.from('case_studies').select('post_group_id,title,language_code').in('post_group_id',ids).in('language_code',getCaseLanguages(locale));if(error)throw error;
 const cases=selectLocalizedCases(data||[],locale);
 return links.filter(l=>l.kind==='guide'||cases.some(c=>c.post_group_id===l.target)).map(l=>({...l,title:cases.find(c=>c.post_group_id===l.target)?.title}));
}
