import test from 'node:test';
import assert from 'node:assert/strict';
import { caseImageKey, loadArchiveImages } from '../src/utils/archiveImages.js';
import { archiveQuery, archiveResults } from '../src/utils/archiveDiscovery.js';
import { createContentIndexHandler, renderIndexHtml } from '../api/content-index.js';
const prefix='https://aajvezmhyrdawxxbulqz.supabase.co/storage/v1/object/public/blog-images/';
const rows=Array.from({length:30},(_,i)=>({id:'10000000-0000-4000-8000-'+String(i).padStart(12,'0'),post_group_id:'case-'+i,language_code:'ko',title:'Case '+i,created_at:new Date(Date.UTC(2026,0,30-i)).toISOString(),content_updated_at:'2026-10-28T00:00:00Z',pdf_download_url:'https://smartjsabridge.com/case.pdf'}));
const shell='<html><head></head><body><section data-live-case-list="archive"></section></body></html>';
const response=()=>({setHeader(){},end(body){this.body=body;}});
test('visible image reads stay bounded and finish capped responses without returning article bodies',async()=>{
 const selected=rows.slice(0,12),seen=[],all=new Map(selected.map(row=>[row.id,row]));let active=0,peak=0;
 const result=await loadArchiveImages(selected,async ids=>{
  assert.ok(ids.length<=3);active++;peak=Math.max(peak,active);
  await new Promise(resolve=>setTimeout(resolve,2));active--;
  const id=ids[0];seen.push(id);assert.ok(all.has(id));
  return [{id,content_md:'<img src="'+prefix+id+'.webp">BODY_ONLY_SENTINEL'}];
 });
 assert.equal(result.length,12);assert.equal(new Set(seen).size,12);assert.equal(peak,2);
 assert.ok(result.every(row=>row.thumbnail===prefix+row.id+'.webp'));
 assert.doesNotMatch(JSON.stringify(result),/content_md|BODY_ONLY_SENTINEL/);
 assert.notEqual(caseImageKey(rows[0]),caseImageKey({...rows[0],content_updated_at:'2026-10-29'}));
 await assert.rejects(loadArchiveImages(rows,async()=>[]),/ARCHIVE_IMAGE_LIMIT/);
});
test('withdrawn images stay empty and wrong IDs or read failures never attach another article image',async()=>{
 const empty=await loadArchiveImages(rows.slice(0,1),async()=>[]);
 assert.equal(empty[0].thumbnail,'');
 await assert.rejects(loadArchiveImages(rows.slice(0,1),async()=>[{id:rows[2].id,content_md:'<img src="'+prefix+'wrong.webp">'}]),/INVALID_ARCHIVE_IMAGE_BATCH/);
 await assert.rejects(loadArchiveImages(rows.slice(0,1),async()=>{throw Error('offline');}),/offline/);
});
test('initial archive HTML loads images only for the selected page and has one preview per card',async()=>{
 const selected=archiveResults(rows,archiveQuery('?page=2'),'ko').rows,requested=[];
 const handler=createContentIndexHandler({readTemplate:async()=>shell,fetcher:async input=>{
  const query=new URL(input).searchParams;
  if(query.get('select')==='id,content_md'){
   const ids=query.get('id').slice(4,-1).split(',');requested.push(...ids);assert.ok(ids.length<=3);
   return Response.json(ids.map(id=>({id,content_md:'<img src="'+prefix+id+'.webp">BODY_ONLY_SENTINEL'})));
  }
  return Response.json(query.get('id')?.startsWith('gt.')?[]:rows);
 }});
 const res=response();await handler({query:{kind:'archive',lng:'ko',page:'2'},headers:{}},res);
 assert.equal(res.statusCode,200);assert.deepEqual(requested.sort(),selected.map(row=>row.id).sort());
 assert.equal((res.body.match(/class="archive-card-image"/g)||[]).length,12);
 for(const row of selected)assert.ok(res.body.includes('src="'+prefix+row.id+'.webp"'));
 assert.doesNotMatch(res.body,/document-paper|archive-thumbnail|document-preview-badge|<canvas|<iframe|BODY_ONLY_SENTINEL|content_md/);
});
test('missing or unsafe article images never reintroduce PDF or text thumbnails',()=>{
 const html=renderIndexHtml(shell,[{...rows[0],thumbnail:'https://tracker.example/a.png'}],'ko','archive');
 assert.doesNotMatch(html,/class="archive-card-image"|document-paper|archive-thumbnail|document-preview-badge|<canvas|<iframe/);
 assert.match(html,/Case 0/);
});
