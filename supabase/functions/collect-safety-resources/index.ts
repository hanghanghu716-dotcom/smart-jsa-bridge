import { collectResourceBatch } from '../../../src/utils/resourceCollection.js';
// The invocation credential can only collect allowlisted metadata into a private queue.
// Platform service credentials remain inside the Edge runtime, never in Vercel or GitHub.
Deno.serve(async req => {
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const token=req.headers.get('x-resource-token')||'';
 if(!/^[a-f0-9-]{72,80}$/.test(token))return new Response('Unauthorized',{status:401});
 const rpc=async(action:string,source='',items:unknown[]=[],status='')=>{
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const r=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/rpc/resource_collect',{
   method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},
   body:JSON.stringify({p_action:action,p_token:token,p_source:source,p_items:items,p_status:status}),signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error('COLLECTION_DENIED');return r.json();
 };
 let sources;
 try{sources=await rpc('claim');}catch{return new Response('Unauthorized',{status:401});}
 const results=await collectResourceBatch(sources,(id:string,items:unknown[],status:string)=>rpc('commit',id,items,status));
 return Response.json({sources:results},{headers:{'Cache-Control':'no-store'}});
});
