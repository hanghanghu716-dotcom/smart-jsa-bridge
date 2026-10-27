import { supabase } from '../supabaseClient';
import { searchResources } from '../utils/resourceSearch.js';
export async function resourceCall(name, args) {
  const {data,error} = await supabase.rpc(name,args); if(error)throw error; return data;
}
export const loadResources = (locale,query,following=false) => resourceCall('resource_hub',{p_locale:locale,p_query:query.q,p_kind:query.kind,p_topic:query.topic,p_page:query.page,p_following:following});
export const followResources = (action='list',locale='',topic='') => resourceCall('resource_follows',{p_action:action,p_locale:locale,p_topic:topic});
export const adminResources = (action,id='',data={}) => resourceCall('resource_admin',{p_action:action,p_id:id,p_data:data});
export function loadResourceSearch(locale,query) {
  return searchResources(locale,query,async(table,p)=>{
    let request=supabase.from(table).select(p.select);
    for(const [key,value]of Object.entries(p)) {
      if(['select','order','limit','offset'].includes(key))continue;
      if(value.startsWith('eq.'))request=request.eq(key,value.slice(3));
      if(value.startsWith('ilike.'))request=request.ilike(key,value.slice(6));
      if(value.startsWith('in.'))request=request.in(key,value.slice(4,-1).split(','));
    }
    for(const order of p.order.split(',')){const [key,direction]=order.split('.');request=request.order(key,{ascending:direction==='asc',nullsFirst:false});}
    const {data,error}=await request.range(Number(p.offset),Number(p.offset)+Number(p.limit)-1);if(error)throw error;return data;
  },()=>loadResources(locale,query));
}
