export const riskValue = value => (typeof value==='number'||typeof value==='string') && String(value).trim() && Number.isFinite(Number(value)) && Number(value)>=0 ? Number(value) : null;
export function documentStats(row){
 const risks=(row?.analysis_data||[]).flatMap(step=>step.risks||[]);
 return {hazards:risks.filter(r=>r.factor?.trim()).length,controls:risks.reduce((n,r)=>n+Number(Boolean((r.current_measure||r.measure)?.trim()))+Number(Boolean(r.recommend_measure?.trim())),0),categories:[...new Set(risks.map(r=>r.category).filter(Boolean))]};
}
export function exploreQuery(input=''){
 const p=input instanceof URLSearchParams?input:new URLSearchParams(input);
 return {search:(p.get('q')||'').slice(0,200),sort:['latest','popular','views','reused'].includes(p.get('sort'))?p.get('sort'):'latest',tags:[...new Set(p.getAll('tag').filter(t=>t&&t.length<=100))].slice(0,20),page:Math.max(0,Math.min(10000,Number.parseInt(p.get('page'),10)||0))};
}
export function exploreSearch({search='',sort='latest',tags=[],page=0}){
 const p=new URLSearchParams();if(search)p.set('q',search);if(sort!=='latest')p.set('sort',sort);tags.forEach(t=>p.append('tag',t));if(page)p.set('page',String(page));return p.size?'?'+p.toString():'';
}
export function publicHref(item,locale){return `/${item.locale||locale}/public-jsa/${item.id}`;}
export function editorialHref(item,locale){return `/${locale}/${item.kind==='guide'?'guideline':'case-study'}/${encodeURIComponent(item.target)}`;}
