import { XMLParser } from 'fast-xml-parser';
import { jobUrl } from '../src/utils/jobs.js';
import { narailterWindow, parseNarailterPage } from './narailter-jobs.js';

// Called only from the private Edge collector after source approval, never from the browser.
// Bounded discovery, no job-detail crawling, contact data, logos or application handling.
const MAX_BYTES=2*1024*1024;
async function read(response) {
  if(!response.ok)throw Error('source_error');
  const reader=response.body?.getReader();if(!reader)throw Error('source_error');
  const chunks=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES)throw Error('invalid_data');chunks.push(value);}}
  finally{await reader.cancel().catch(()=>{});}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  return new TextDecoder().decode(bytes);
}
const plain=(v,n)=>typeof v==='string'?v.replace(/<[^>]*>/g,'').trim().slice(0,n):'';
const list=v=>Array.isArray(v)?v:v?[v]:[];
export function usajobsDeadline(value){
 const raw=plain(value,160);
 if(!raw)return null;
 // The official API describes this as a last DATE and its examples encode midnight Z.
 // USAJOBS Help specifies 11:59 p.m. Eastern on that date. Respect DST, not server time.
 if(/^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.000)?Z?)?$/.test(raw)){
  const [y,m,d]=raw.slice(0,10).split('-').map(Number),day=new Date(Date.UTC(y,m-1,d));
  if(day.toISOString().slice(0,10)!==raw.slice(0,10))throw Error('invalid_data');
  const target=day.getTime()+86400000,format=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  let guess=target;
  for(let n=0;n<3;n++){const p=Object.fromEntries(format.formatToParts(new Date(guess)).map(v=>[v.type,v.value]));const local=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);guess=target-(local-guess);}
  return new Date(guess).toISOString();
 }
 return /(Z|[+-]\d{2}:\d{2})$/.test(raw)&&Number.isFinite(Date.parse(raw))?new Date(raw).toISOString():null;
}
// Work24 dates are Korean local dates. End of that date is exclusive next midnight KST.
export function work24Deadline(value) {
  const text=plain(value,160),match=text.match(/^(\d{2}|\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\.?$/);
  if(!match)return null;
  let y=Number(match[1]);if(y<100)y+=2000;
  const m=Number(match[2]),d=Number(match[3]),date=new Date(Date.UTC(y,m-1,d));
  if(date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)throw Error('invalid_data');
  return new Date(date.getTime()+15*3600000).toISOString();
}
export function parseWork24(xml) {
  if(xml.length>MAX_BYTES||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('invalid_data');
  const root=new XMLParser({parseTagValue:false,trimValues:true}).parse(xml).wantedRoot;
  if(!root||!/^\d+$/.test(String(root.total)))throw Error('source_error');
  return list(root.wanted).slice(0,100).flatMap(row=>{
    const title=plain(row.title,250),id=plain(row.wantedAuthNo,160);
    if(!/안전|산업위생|보건관리/.test(title))return [];
    if(!/^[A-Za-z0-9_-]+$/.test(id)||!title||row.infoSvc!=='VALIDATION')return [];
    return [{external_id:id,locale:'ko',title,employer:plain(row.company,250),location:plain(row.region,250),
      url:'https://www.work24.go.kr/wk/a/b/1500/empDetailAuthView.do?'+new URLSearchParams({wantedAuthNo:id,infoTypeCd:'VALIDATION',infoTypeGroup:'tb_workinfoworknet'}),
      deadline_text:plain(row.closeDt,160),closes_at:work24Deadline(row.closeDt)}];
  });
}
export function parseUsajobs(data) {
  const root=data?.SearchResult;if(!root||!Array.isArray(root.SearchResultItems))throw Error('source_error');
  return root.SearchResultItems.slice(0,100).flatMap(row=>{
    const d=row.MatchedObjectDescriptor||{},title=plain(d.PositionTitle,250),id=plain(String(row.MatchedObjectId||''),160);
    if(!/safety|industrial hygien|occupational health/i.test(title))return [];
    // The official API emits an explicit default HTTPS port. Normalize only this
    // exact trusted origin; non-default ports and lookalike hosts stay rejected.
    const original=typeof d.PositionURI==='string'?d.PositionURI.replace(/^https:\/\/www\.usajobs\.gov:443\//,'https://www.usajobs.gov/'):d.PositionURI;
    const url=jobUrl(original,['www.usajobs.gov']);if(!id||!title||!url)return [];
    const raw=plain(d.ApplicationCloseDate,160),instant=usajobsDeadline(raw);
    const label=/^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.000)?Z?)?$/.test(raw)?raw.slice(0,10)+' · 11:59 p.m. ET':raw;
    return [{external_id:id,locale:'en-US',url,title,employer:plain(d.OrganizationName,250),location:plain(d.PositionLocationDisplay,250),deadline_text:label,closes_at:instant}];
  });
}
export async function collectJobs(source,env,fetcher=fetch,now=new Date()) {
  const entries=[];
  if(source.id==='work24'&&source.adapter==='work24'){
    const key=env('WORK24_API_KEY');if(!key)throw Error('missing_credentials');
    for(const keyword of ['안전관리','산업위생']){
      const url=new URL('https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do');
      url.search=new URLSearchParams({authKey:key,callTp:'L',returnType:'XML',startPage:'1',display:'100',keyword});
      entries.push(...parseWork24(await read(await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(12000)}))));
    }
  }else if(source.id==='narailter'&&source.adapter==='narailter'){
    const key=env('NARAILTER_API_KEY');if(!key)throw Error('missing_credentials');
    const window=narailterWindow(now);
    let total=0;
    for(let page=1;page<=5;page++){
      const url=new URL('https://apis.data.go.kr/1760000/PblJobService/getList');
      url.search=new URLSearchParams({serviceKey:key,pageNo:String(page),numOfRows:'1000',Pblanc_ty:'',Instt_se:'',Begin_de:window.begin,End_de:window.end,Sort_order:'DESC'});
      const result=parseNarailterPage(await read(await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(12000)})),{...window,page});
      if(page>1&&result.total!==total)throw Error('invalid_data');
      total=result.total;entries.push(...result.items);
      if(page*1000>=total)break;
    }
    if(new Set(entries.map(item=>item.external_id)).size>200)throw Error('invalid_data');
  }else if(source.id==='usajobs'&&source.adapter==='usajobs'){
    const key=env('USAJOBS_API_KEY'),email=env('USAJOBS_API_EMAIL');if(!key||!email)throw Error('missing_credentials');
    for(const title of ['safety','industrial hygien']){
      const url=new URL('https://data.usajobs.gov/api/search');url.search=new URLSearchParams({PositionTitle:title,ResultsPerPage:'50',Page:'1',Fields:'Min',SortField:'opendate',SortDirection:'Desc'});
      entries.push(...parseUsajobs(JSON.parse(await read(await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(12000),headers:{'Authorization-Key':key,'User-Agent':email,Accept:'application/json'}})))));
    }
  }else throw Error('source_error');
  return [...new Map(entries.map(item=>[item.external_id,item])).values()].slice(0,200);
}
