import { supabase } from '../supabaseClient';
export async function communityAction(action,id=null,payload={},client=supabase) {
 const {data,error}=await client.rpc('community_action',{p_action:action,p_id:id,p_payload:payload});
 if(error)throw error;return data;
}
export async function myCommunityData(client=supabase) {
 const {data:{user}}=await client.auth.getUser();if(!user)return null;
 const [status,requests,notices,projects]=await Promise.all([communityAction('status',null,{},client),client.from('community_requests').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),client.from('community_notices').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),client.from('jsa_projects').select('id,title,publication_context,reuse_license').eq('author_id',user.id).eq('is_public',true).is('reuse_license',null)]);
 if(requests.error||notices.error||projects.error)throw requests.error||notices.error||projects.error;
 return {user,status,requests:requests.data,notices:notices.data,projects:projects.data};
}
