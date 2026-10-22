import test from 'node:test';
import assert from 'node:assert/strict';
import { readPublicCatalogPage } from '../src/utils/publicCatalogPage.js';
import { createExploreHandler } from '../api/explore.js';
const id = n => '10000000-0000-4000-8000-' + String(n).padStart(12,'0');
const rows = Array.from({length:24},(_,n)=>({id:id(n),is_public:true,title:'Document '+n}));
const readPage = async()=>({data:rows.map(({id})=>({id})),count:73});
test('catalog limits assessment to ten IDs, preserves page order and exact total under smaller upstream caps',async()=>{
 const calls=[];
 const result=await readPublicCatalogPage({page:1,pageSize:24,readPage,readBatch:async ids=>{
  calls.push(ids);assert.ok(ids.length<=10);
  return {data:rows.filter(row=>ids.includes(row.id)).reverse().slice(0,3)};
 }});
 assert.deepEqual(result.rows,rows);assert.equal(result.total,73);assert.equal(result.hasMore,true);
 assert.ok(calls.length>3);
});
test('catalog never resurrects withdrawn rows and does not disguise a later batch failure as a partial page',async()=>{
 const result=await readPublicCatalogPage({page:3,pageSize:24,readPage,readBatch:async ids=>({data:rows.filter(row=>ids.includes(row.id)&&row.id!==id(4)).map(row=>row.id===id(5)?{...row,is_public:false}:row)})});
 assert.deepEqual(result.rows,rows.filter(row=>![id(4),id(5)].includes(row.id)));
 assert.equal(result.total,73);assert.equal(result.hasMore,false);
 let calls=0;
 await assert.rejects(readPublicCatalogPage({page:0,pageSize:24,readPage,readBatch:async ids=>{
  if(++calls===2)return {error:Error('timeout')};
  return {data:rows.filter(row=>ids.includes(row.id))};
 }}),/timeout/);
});
test('catalog rejects malformed IDs, duplicate IDs, invalid counts and out-of-batch details',async()=>{
 for(const value of [{data:[{id:'bad'}],count:1},{data:[rows[0],rows[0]],count:2},{data:[],count:NaN},{data:null,count:0}]){
  await assert.rejects(readPublicCatalogPage({page:0,pageSize:24,readPage:async()=>value,readBatch:()=>assert.fail('must not read details')}),/INVALID_CATALOG_PAGE/);
 }
 for(const data of [[rows[0],rows[0]],[{id:id(99)}],{}]){
  await assert.rejects(readPublicCatalogPage({page:0,pageSize:24,readPage,readBatch:async()=>({data})}),/INVALID_CATALOG_BATCH/);
 }
});
test('empty pages keep their exact total without reading any document body',async()=>{
 const result=await readPublicCatalogPage({page:8,pageSize:12,readPage:async()=>({data:[],count:73}),readBatch:()=>assert.fail('empty page')});
 assert.deepEqual(result,{rows:[],total:73,hasMore:false});
});
test('server ID page alone requests exact count; details recheck all filters and withdrawals',async()=>{
 const calls=[],shell='<html><head></head><body><div id="root"></div></body></html>';
 const handler=createExploreHandler({readShell:async()=>shell,fetcher:async(url,options)=>{
  const p=new URL(url).searchParams;calls.push(p);
  assert.equal(p.get('is_public'),'eq.true');assert.equal(p.get('is_operator'),'eq.true');
  assert.equal(p.get('public_country'),'eq.US');assert.equal(p.get('tags'),'cs.{"gas"}');
  assert.equal(p.get('title'),'ilike.%valve%');
  if(p.get('select')==='id'){
   assert.equal(options.headers.Prefer,'count=exact');assert.equal(p.get('offset'),'12');
   assert.equal(p.get('order'),'view_count.desc,id.asc');
   return Response.json(rows.slice(0,12).map(({id})=>({id})),{headers:{'content-range':'12-23/73'}});
  }
  assert.equal(options.headers.Prefer,undefined);assert.equal(p.get('offset'),null);
  const ids=p.get('id').slice(4,-1).split(',');assert.ok(ids.length<=10);
  return Response.json(rows.filter(row=>ids.includes(row.id)&&row.id!==id(4)).reverse());
 }});
 const res={setHeader(){},end(body){this.body=body;}};
 await handler({query:{lng:'en-US',author:'operator',country:'US',sort:'views',q:'valve',tag:'gas',page:'1'}},res);
 assert.equal(res.statusCode,200);
 const result=JSON.parse(res.body.match(/window\.__PUBLIC_EXPLORE__=(.*?);<\/script>/s)[1]);
 assert.deepEqual(result.rows.map(row=>row.id),rows.slice(0,12).filter(row=>row.id!==id(4)).map(row=>row.id));
 assert.equal(result.total,73);assert.equal(result.hasMore,true);assert.ok(calls.length>=3);
});
test('server fails closed when a later detail batch remains unavailable',async()=>{
 let details=0;
 const handler=createExploreHandler({readShell:async()=>'<html><head></head><body><div id="root"></div></body></html>',fetcher:async url=>{
  const p=new URL(url).searchParams;
  if(p.get('select')==='id')return Response.json(rows.slice(0,12),{headers:{'content-range':'0-11/24'}});
  if(++details>1)return new Response('timeout',{status:503});
  return Response.json(rows.slice(0,10));
 }});
 const res={setHeader(){},end(body){this.body=body;}};
 await handler({query:{lng:'en-US'}},res);
 assert.equal(res.statusCode,503);assert.match(res.body,/noindex/);assert.doesNotMatch(res.body,/Document 0/);
});
