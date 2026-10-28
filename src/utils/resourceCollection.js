import { parse } from 'parse5';
import { collectResourceFeed, feedUrlAllowed } from './resourceFeed.js';

const AGENT = 'SmartJSABridge-ResourceReader';
const HEADERS = { 'User-Agent': `${AGENT}/1.0 (+https://smartjsabridge.com/en-US/about)` };
export const reviewPlaceholder = source => `${source.name} — link awaiting review`.slice(0,250);

// All endpoints and path scopes come from the private, code-reviewed registry.
// No article crawling, PDFs, images, copied descriptions or automatic translation.
export function itemInScope(url, config) {
 const u=new URL(url);
 return (!config.item_prefixes?.length||config.item_prefixes.some(p=>u.pathname.startsWith(p)))
  && (!config.item_contains||u.pathname.includes(config.item_contains))
  && (!config.min_segments||u.pathname.split('/').filter(Boolean).length>=config.min_segments);
}

export function parseResourceLinks(html, source) {
 if(typeof html!=='string'||html.length>1024*1024)throw Error('SOURCE_TOO_LARGE');
 const config=source.collection, rows=[],seen=new Set();let inSection=!config.section_start;
 const nodes=[parse(html)];
 while(nodes.length&&rows.length<40){
  const node=nodes.pop();
  const anchor=node.attrs?.find(a=>a.name==='id'||a.name==='name')?.value;
  if(config.section_start&&anchor===config.section_start)inSection=true;
  if(config.section_end&&anchor===config.section_end)inSection=false;
  if(node.nodeName==='a'){
   const raw=node.attrs?.find(a=>a.name==='href')?.value;
   if(inSection&&raw&&!raw.startsWith('#')){
    let url;
    try{url=feedUrlAllowed(new URL(raw,config.url).href,source.domains);}catch{/* non-URL */}
    if(url&&url!==config.url&&!seen.has(url)&&itemInScope(url,config)){
     seen.add(url);rows.push({url,title:reviewPlaceholder(source),source_date:null});
    }
   }
  }
  // DOM text is deliberately never read or retained.
  if(node.childNodes)for(let n=node.childNodes.length-1;n>=0;n--)nodes.push(node.childNodes[n]);
 }
 return rows;
}

export function robotsAllows(text, url, agent=AGENT) {
 const groups=[];let group=null,rulesStarted=false;
 for(const line of text.split(/\r?\n/)){
  const match=line.replace(/#.*/,'').trim().match(/^([\w-]+)\s*:\s*(.*)$/);if(!match)continue;
  const key=match[1].toLowerCase(),value=match[2].trim();
  if(key==='user-agent'){
   if(!group||rulesStarted){group={agents:[],rules:[]};groups.push(group);rulesStarted=false;}
   group.agents.push(value.toLowerCase());
  }else if(group&&['allow','disallow'].includes(key)){
   rulesStarted=true;if(value)group.rules.push({allow:key==='allow',path:value});
  }
 }
 const score=g=>Math.max(0,...g.agents.filter(a=>a!=='*'&&agent.toLowerCase().startsWith(a)).map(a=>a.length));
 const longest=Math.max(0,...groups.map(score));
 const chosen=longest?groups.filter(g=>score(g)===longest):groups.filter(g=>g.agents.includes('*'));
 const target=new URL(url),path=target.pathname+target.search;
 let best=null;
 for(const {rules} of chosen)for(const rule of rules){
  const end=rule.path.endsWith('$'),pattern=(end?rule.path.slice(0,-1):rule.path)
   .split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');
  if(new RegExp('^'+pattern+(end?'$':'')).test(path)){
   const score=rule.path.replace(/[*$]/g,'').length;
   if(!best||score>best.score||(score===best.score&&rule.allow))best={...rule,score};
  }
 }
 return best?.allow??true;
}

async function boundedText(response, limit) {
 const reader=response.body?.getReader();if(!reader)throw Error('SOURCE_EMPTY');
 const chunks=[];let size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;
  if(size>limit)throw Error('SOURCE_TOO_LARGE');chunks.push(value);
 }}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 return new TextDecoder().decode(bytes);
}

export async function collectResourceSource(source, fetcher=fetch) {
 const c=source.collection;
 if(!c?.enabled||!['feed','feed-links','links'].includes(c.mode)||Date.parse(c.review_until)<=Date.now()
  ||!Number.isFinite(Date.parse(c.review_until))||!feedUrlAllowed(c.url,source.domains))throw Error('SOURCE_DISABLED');
 const robotsUrl=c.robots_url||new URL('/robots.txt',c.url).href;
 if(!feedUrlAllowed(robotsUrl,source.domains)||new URL(robotsUrl).origin!==new URL(c.url).origin)throw Error('INVALID_ROBOTS_SOURCE');
 const get=(url,accept)=>fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{...HEADERS,Accept:accept}});
 const robots=await get(robotsUrl,'text/plain');
 if(robots.status!==404){
  if(!robots.ok||!/text\/(?:plain|x-robots)/i.test(robots.headers.get('content-type')||''))throw Error('ROBOTS_UNAVAILABLE');
  if(!robotsAllows(await boundedText(robots,65536),c.url))throw Error('ROBOTS_DISALLOWED');
 }
 if(c.mode==='links'){
  const r=await get(c.url,'text/html');
  if(!r.ok||!/text\/html/i.test(r.headers.get('content-type')||''))throw Error('SOURCE_UNAVAILABLE_'+r.status);
  return parseResourceLinks(await boundedText(r,1024*1024),source);
 }
 const rows=(await collectResourceFeed({...source,feed_url:c.url},fetcher)).filter(r=>itemInScope(r.url,c));
 return c.mode==='feed-links'?rows.map(r=>({...r,title:reviewPlaceholder(source)})):rows;
}

// Bound the complete run to fit the free Edge runtime. One failed country must
// not prevent others from reaching the review queue.
export async function collectResourceBatch(sources, commit, fetcher=fetch) {
 const results=new Array(sources.length);let next=0;
 const deadline=Date.now()+95000;
 await Promise.all(Array.from({length:Math.min(4,sources.length)},async()=>{
  while(next<sources.length){
   const i=next++,source=sources[i];
   try{
    if(Date.now()>deadline)throw Error('RUN_DEADLINE');
    const items=await collectResourceSource(source,fetcher);
    const result=await commit(source.id,items,items.length?'ok':'empty');
    results[i]={source:source.id,discovered:items.length,inserted:result.inserted??0};
   }catch(error){
    const message=error instanceof Error?error.message:'';
    const status=/^(SOURCE_|FEED_|ROBOTS_|INVALID_|UNSAFE_|RUN_)[A-Z0-9_]+$/.test(message)?message:
     error?.name==='TimeoutError'?'SOURCE_TIMEOUT':'COLLECTION_FAILED';
    try{await commit(source.id,[],status);}catch{/* Next scheduled run can retry. */}
    results[i]={source:source.id,error:status};
   }
  }
 }));
 return results;
}
