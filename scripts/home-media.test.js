import test from 'node:test';
import assert from 'node:assert/strict';
import {caseThumbnail,loadHomeCaseThumbnails} from '../src/utils/caseThumbnail.js';
import {reportFirstPageHeight} from '../src/utils/reportFirstPage.js';
import {queueRiskThumbnail,cachedRiskThumbnail} from '../src/utils/riskThumbnailQueue.js';
import {renderIndexHtml} from '../api/content-index.js';
const image='https://aajvezmhyrdawxxbulqz.supabase.co/storage/v1/object/public/blog-images/work.webp';
test('guide thumbnail uses an actual safe article image and skips tracking or executable URLs',()=>{
 assert.equal(caseThumbnail('<img src="https://tracking.example/a.gif"><img src="'+image+'">'),image);
 assert.equal(caseThumbnail('![Work]('+image+')'),image);
 assert.equal(caseThumbnail('<img src="javascript:alert(1)">'),'');
});
test('home image hydration fetches only the three displayed bodies and never returns full article content',async()=>{
 const rows=Array.from({length:199},(_,i)=>({id:String(i),title:'Case '+i}));let requested;
 const client={from:()=>{const query={select:value=>{assert.equal(value,'id,content_md');return query;},in:(_key,ids)=>{requested=ids;return query;},limit:n=>{assert.equal(n,3);return query;},abortSignal:async()=>({data:[{id:'0',content_md:'<img src="'+image+'">PRIVATE_BODY'}]})};return query;}};
 const result=await loadHomeCaseThumbnails(client,rows);assert.deepEqual(requested,['0','1','2']);assert.equal(result[0].thumbnail,image);assert.doesNotMatch(JSON.stringify(result),/PRIVATE_BODY|content_md/);
});
test('live home shows the article image without taking a PDF or external image as its thumbnail',()=>{
 const shell='<html><head></head><body><div data-live-case-list="home"></div></body></html>';
 const html=renderIndexHtml(shell,[{id:'1',post_group_id:'task',language_code:'ko',title:'Task',thumbnail:image}],'ko','home');assert.ok(html.includes('class="home-case-image"'));assert.ok(html.includes(image));
});
test('first-page risk PDF capture ends at a body row, preserving headers with the first row',()=>{
 const table={getBoundingClientRect:()=>({height:1600}),rows:[]};
 const make=(bottom,header=false)=>({tagName:'TR',closest:selector=>selector==='thead'?(header?{}:null):table,getBoundingClientRect:()=>({bottom})});
 table.rows=[make(60,true),make(330),make(680),make(1000)];
 const paper={getBoundingClientRect:()=>({top:0,width:1050,height:1700}),querySelectorAll:()=>table.rows};
 assert.equal(reportFirstPageHeight(paper),681);
});
test('risk thumbnail cache prevents repeated capture and an aborted card never starts a capture',async()=>{
 let captures=0;const capture=async()=>{captures++;return 'data:image/webp;base64,test';};
 const active=new AbortController(), stopped=new AbortController();stopped.abort();
 assert.equal(await queueRiskThumbnail('stopped',capture,stopped.signal),'');
 await queueRiskThumbnail('risk-test',capture,active.signal);await queueRiskThumbnail('risk-test',capture,active.signal);assert.equal(captures,1);assert.ok(cachedRiskThumbnail('risk-test'));
});
