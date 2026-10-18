export const REGIONAL_CONSENT_KEY='smartjsa_analytics_choice_v2';
const maxAge=180*24*60*60*1000;
let regionPromise;
export function analyticsRegion(fetcher=fetch){
  if(!regionPromise)regionPromise=fetcher('/api/privacy-region',{cache:'no-store',signal:AbortSignal.timeout(5000)})
    .then(async r=>{if(!r.ok)throw Error();const data=await r.json();return data.requiresConsent!==false;}).catch(()=>true);
  return regionPromise;
}
export function analyticsChoice(storage,now=Date.now()){
  try{const value=JSON.parse(storage.getItem(REGIONAL_CONSENT_KEY));
    return value&&['allowed','denied'].includes(value.choice)&&Number.isFinite(value.time)&&value.time<=now&&now-value.time<maxAge?value.choice:null;
  }catch{return null;}
}
export function storeAnalyticsChoice(storage,allow){storage.setItem(REGIONAL_CONSENT_KEY,JSON.stringify({choice:allow?'allowed':'denied',time:Date.now()}));storage.setItem('smartjsa_analytics_opt_out',String(!allow));}
