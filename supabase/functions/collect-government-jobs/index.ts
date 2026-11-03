import { collectJobs } from '../../../server/job-feeds.js';
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const token=req.headers.get('x-resource-token')||'';
 if(!/^[a-f0-9-]{72,80}$/.test(token))return new Response('Unauthorized',{status:401});
 const rpc=async(action:string,source='',items:unknown[]=[],status='')=>{
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const r=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/rpc/job_catalog_collect',{
   method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},
   body:JSON.stringify({p_action:action,p_token:token,p_source:source,p_items:items,p_status:status}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('COLLECTION_DENIED');return r.json();
 };
 let sources;try{sources=await rpc('claim');}catch{return new Response('Unauthorized',{status:401});}
 // DB atomically claims at most six reviewed sources; each has a fixed request budget.
 // Independent sources run concurrently so one slow provider cannot starve another.
 const results=await Promise.all(sources.slice(0,6).map(async source=>{
  try{const items=await collectJobs(source,(name:string)=>Deno.env.get(name));
   return {source:source.id,...await rpc('commit',source.id,items,items.length?'ok':'empty')};
  }catch(error){
   // Never log request URLs: Korean APIs carry credentials in query strings.
   const status=['missing_credentials','invalid_data'].includes(error?.message)?error.message:'source_error';
   try{await rpc('commit',source.id,[],status);}catch{/* No write; preserve existing data. */}
   return {source:source.id,status};
  }
 }));
 return Response.json({sources:results},{headers:{'Cache-Control':'no-store'}});
});
