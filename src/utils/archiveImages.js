import { caseThumbnail } from './caseThumbnail.js';

export function caseImageKey(row) {
 return row.id + ':' + (row.content_updated_at || row.created_at || '');
}

// Read bodies only for visible cards: three per request, two reads at once.
// Only extracted image URLs leave this helper.
export async function loadArchiveImages(rows, readGroup) {
 if (rows.length > 12) throw Error('ARCHIVE_IMAGE_LIMIT');
 const targets=rows.filter(row=>typeof row.id==='string' && /^[A-Za-z0-9_-]+$/.test(row.id));
 const groups=[];
 for(let i=0;i<targets.length;i+=3)groups.push(targets.slice(i,i+3).map(row=>row.id));
 const images=new Map();let next=0,failed=false;
 await Promise.all(Array.from({length:Math.min(2,groups.length)},async()=>{
  try {
   while(!failed && next<groups.length){
    let pending=groups[next++];
    while(pending.length){
     const data=await readGroup(pending);
     if(!Array.isArray(data)||data.some(row=>!pending.includes(row.id)))throw Error('INVALID_ARCHIVE_IMAGE_BATCH');
     if(!data.length)break;
     for(const row of data)images.set(row.id,caseThumbnail(row.content_md));
     const returned=new Set(data.map(row=>row.id));
     pending=pending.filter(id=>!returned.has(id));
    }
   }
  }catch(error){failed=true;throw error;}
 }));
 return targets.map(row=>({id:row.id,key:caseImageKey(row),thumbnail:images.get(row.id)||''}));
}
