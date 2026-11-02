export const JOB_PAGE_SIZE = 12;
export const JOB_STALE_MS = 48 * 3600000;
export function jobQuery(input='') {
  const p=input instanceof URLSearchParams?input:new URLSearchParams(input);
  return {q:(p.get('q')||'').trim().slice(0,120),status:['open','closed','unconfirmed'].includes(p.get('status'))?p.get('status'):'open',page:Math.max(0,Math.min(5000,parseInt(p.get('page'),10)||0))};
}
export function jobSearch(query) {
  const p=new URLSearchParams();
  for(const k of ['q','status','page'])if(query[k])p.set(k,query[k]);
  return p.size?'?'+p:'';
}
// Match the server's query-time status: no cron must run for a deadline to expire.
export function jobStatus(item,now=Date.now()) {
  if(item.withdrawn_at)return 'withdrawn';
  if(item.closed_at||(item.closes_at&&Date.parse(item.closes_at)<=now))return 'closed';
  const checked=Date.parse(item.verified_at);
  return !Number.isFinite(checked)||checked<=now-JOB_STALE_MS?'unconfirmed':'open';
}
export function jobUrl(value,hosts) {
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&hosts.includes(u.hostname)
    &&value.match(/^https:\/\/([^/]+)/)?.[1]===u.hostname&&!/[\u0000-\u0020\\]/.test(value)?u.href:null;}catch{return null;}
}
