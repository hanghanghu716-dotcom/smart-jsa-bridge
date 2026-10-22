import { readPublic } from '../server/public-content.js';
import { readProjectEnv } from '../server/supabase-config.js';
import { purchaseCountry, selectOffers, selectPpeGuideOffers, fingerprint } from '../server/commerce/engine.js';
import { readCommerceSnapshot } from '../server/commerce/source.js';
import { loadCatalog } from '../server/commerce/catalog.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

export function createCommerceHandler({ env = readProjectEnv(), reader = readPublic, catalogReader = loadCatalog, now = Date.now } = {}) {
  return async (req,res) => {
    res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');
    res.setHeader('CDN-Cache-Control','no-store');res.setHeader('Vercel-CDN-Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex');
    const send=(status,value)=>{res.statusCode=status;res.end(JSON.stringify(value));};
    if(req.method!=='GET'){res.setHeader('Allow','GET');return send(405,{error:'METHOD_NOT_ALLOWED'});}
    if(env.JSA_COMMERCE_ENABLED!=='true')return send(200,{status:'disabled',items:[]});
    const {kind,id,locale,marketLocale=locale}=req.query||{};
    const country=SUPPORTED_LANGS.includes(marketLocale)?purchaseCountry(marketLocale):null;
    if(!['case','ugc','guide'].includes(kind)||typeof id!=='string'||!id||id.length>300||/[\/\\\x00-\x1f]/.test(id)
      ||(kind==='guide'&&id!=='protectiveequipment')
      || !SUPPORTED_LANGS.includes(locale)||!country || (kind==='ugc'&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))return send(400,{error:'INVALID_REQUEST'});
    try {
      if(kind==='guide'){
        const catalog=await catalogReader({env});
        const items=selectPpeGuideOffers({catalog,country,locale,now:now()});
        return send(200,{status:items.length?'ready':'empty',country,items});
      }
      // Public key + existing public view. Never accept a client-supplied document body,
      // use a service-role key, or reuse a stale publication decision.
      const snapshot=await readCommerceSnapshot(kind,id,locale,reader);
      if(!snapshot)return send(404,{status:'unavailable',items:[]});
      const catalog=await catalogReader({env});
      const items=selectOffers({snapshot,catalog,country,now:now()});
      return send(200,{status:items.length?'ready':'empty',country,contentRevision:fingerprint(snapshot),items});
    }catch{return send(503,{status:'unavailable',items:[]});}
  };
}
export default createCommerceHandler();
