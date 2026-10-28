import { XMLParser } from 'fast-xml-parser';
export function feedUrlAllowed(value, domains){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&domains.includes(u.hostname) && value.match(/^https:\/\/([^/]+)/)?.[1] === u.hostname&&!/[\u0000-\u0020\\]/.test(value)?u.href.split('#')[0]:null;}catch{return null;}
}
export function parseResourceFeed(xml,source){
 if(typeof xml!=='string'||xml.length>1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('UNSAFE_FEED');
 const parsed=new XMLParser({ignoreAttributes:false,processEntities:true,trimValues:true,parseTagValue:false}).parse(xml);
 const entries=parsed.rss?.channel?.item||parsed.feed?.entry||parsed['rdf:RDF']?.item||[];
 const rows=Array.isArray(entries)?entries:[entries],seen=new Set();
 return rows.slice(0,40).flatMap(row=>{
  const raw=typeof row.link==='string'?row.link:Array.isArray(row.link)?row.link.find(x=>!x['@_rel']||x['@_rel']==='alternate')?.['@_href']:row.link?.['@_href'];
  // Some official feeds still emit HTTP links. Store the same approved host as
  // HTTPS; this does not fetch the destination or follow an external redirect.
  const url=feedUrlAllowed(typeof raw==='string'?raw.replace(/^http:\/\//,'https://'):raw,source.domains);
  const title=(typeof row.title==='string'?row.title:row.title?.['#text']||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,250);
  if(!url||!title||seen.has(url))return [];seen.add(url);
  let dateText=row.pubDate||row.pubdate||row.published||row.updated||row['dc:date']||'';
  if(source.collection?.date_format==='dmy')dateText=dateText.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/,'$3-$2-$1');
  const date=Date.parse(dateText);
  return [{url,title,source_date:Number.isFinite(date)?new Date(date).toISOString().slice(0,10):null}];
 });
}
export async function collectResourceFeed(source,fetcher=fetch){
 if(!feedUrlAllowed(source.feed_url,source.domains))throw Error('INVALID_SOURCE');
 const r=await fetcher(source.feed_url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'application/rss+xml, application/atom+xml, application/xml, text/xml','User-Agent':'SmartJSABridge-ResourceReader/1.0 (+https://smartjsabridge.com/en-US/about)'}});
 if(!r.ok||!/(?:xml|rss|atom)/i.test(r.headers.get('content-type')||''))throw Error('FEED_UNAVAILABLE_'+r.status);
 const reader=r.body.getReader(),chunks=[];let size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1024*1024)throw Error('FEED_TOO_LARGE');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 const declaration=new TextDecoder().decode(bytes.slice(0,200));
 const encoding=declaration.match(/encoding=["']([^"']+)/i)?.[1]||'utf-8';
 return parseResourceFeed(new TextDecoder(encoding).decode(bytes),source);
}
