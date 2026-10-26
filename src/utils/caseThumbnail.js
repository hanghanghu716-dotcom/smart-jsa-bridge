import { DEFAULT_PUBLIC_SUPABASE } from '../config/supabase.js';
export function safeCaseImage(value) {
 try {
  const url=new URL(value,'https://smartjsabridge.com');
  if(url.protocol!=='https:'||url.username||url.password)return '';
  if(url.origin==='https://smartjsabridge.com'&&/^\/(images|assets)\//.test(url.pathname))return url.href;
  if(url.origin===DEFAULT_PUBLIC_SUPABASE.url&&url.pathname.startsWith('/storage/v1/object/public/'))return url.href;
 } catch { /* Invalid or external image */ }
 return '';
}
export function caseThumbnail(content) {
 if(typeof content!=='string')return '';
 const images=[...content.matchAll(/<img\b[^>]*?\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gi)].map(match=>match[2]);
 images.push(...[...content.matchAll(/!\[[^\]]*\]\((https:\/\/[^\s)]+)(?:\s+[^)]*)?\)/g)].map(match=>match[1]));
 return images.map(value=>safeCaseImage(value.replace(/&amp;/g,'&'))).find(Boolean)||'';
}
export async function loadHomeCaseThumbnails(client, rows) {
 const featured=rows.slice(0,3), ids=featured.map(row=>row.id).filter(Boolean);
 if(!ids.length)return rows;
 const {data,error}=await client.from('case_studies').select('id,content_md').in('id',ids).limit(3).abortSignal(AbortSignal.timeout(8000));
 if(error)return rows;
 const images=new Map((data||[]).map(row=>[row.id,caseThumbnail(row.content_md)]));
 return rows.map(row=>({...row,thumbnail:images.get(row.id)||row.thumbnail||''}));
}
