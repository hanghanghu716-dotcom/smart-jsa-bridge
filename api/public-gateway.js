import { createHmac, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { getPublicSupabaseConfig, readProjectEnv } from '../server/supabase-config.js';

export function dailyNetworkActor(ip, key, day = new Date().toISOString().slice(0,10)) {
  if (!isIP(ip)) throw Error('NETWORK_UNAVAILABLE');
  const hex=createHmac('sha256',key).update(`${day}:${ip}`).digest('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
export function createGateway({fetcher=fetch,env=readProjectEnv(),config=getPublicSupabaseConfig()}={}) {
  return async(req,res)=>{
    res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
    const send=(status,value)=>{res.statusCode=status;res.end(JSON.stringify(value));};
    if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:'METHOD_NOT_ALLOWED'});}
    // Vercel overwrites this header. Never fall back to client X-Forwarded-For.
    const ip=req.headers['x-vercel-forwarded-for'], key=env.JSA_PUBLIC_GATEWAY_KEY;
    if(env.VERCEL!=='1'||typeof ip!=='string'||!isIP(ip)||typeof key!=='string'||key.length<40)return send(503,{error:'UNAVAILABLE'});
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(415,{error:'INVALID_REQUEST'});
    const body=req.body;
    if(!body||typeof body!=='object'||Array.isArray(body)||Buffer.byteLength(JSON.stringify(body))>20000)return send(400,{error:'INVALID_REQUEST'});
    const {action,payload={}}=body;
    if(!['case_view','jsa_view','support_create','support_status'].includes(action))return send(400,{error:'INVALID_REQUEST'});
    if(!payload||typeof payload!=='object'||Array.isArray(payload))return send(400,{error:'INVALID_REQUEST'});
    if(action!=='support_create'&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id||''))return send(400,{error:'INVALID_REQUEST'});
    if(action==='support_status'&&!/^[a-f0-9]{64}$/.test(payload.receipt||''))return send(400,{error:'INVALID_REQUEST'});
    if(payload.website)return send(400,{error:'INVALID_REQUEST'});
    const receipt=action==='support_create'?randomBytes(32).toString('hex'):null;
    try{
      const response=await fetcher(`${config.url}/rest/v1/rpc/public_gateway`,{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({p_key:key,p_actor:dailyNetworkActor(ip,key),p_action:action,p_payload:receipt?{...payload,receipt}:payload}),signal:AbortSignal.timeout(8000)});
      if(!response.ok)return send(503,{error:'UNAVAILABLE'});
      const result=await response.json();
      if(result?.error)return send(result.error==='RATE_LIMIT'?429:404,{error:result.error});
      return send(200,receipt?{...result,receipt}:result);
    }catch{return send(503,{error:'UNAVAILABLE'});}
  };
}
export default createGateway();
