import test from 'node:test';
import assert from 'node:assert/strict';
import { readHomeSummary, homeSummaryCards, homePageCursor, homeAfterFilter, HOME_SUMMARY_FIELDS, HOME_LEGACY_FIELDS } from '../src/utils/homeSummary.js';
import { thumbnailObjectPath, storedThumbnail, THUMBNAIL_MAX_BYTES } from '../src/utils/publicThumbnail.js';
import { createJsaThumbnailHandler } from '../api/jsa-thumbnail.js';
import { publishThumbnail, pendingThumbnails } from '../src/services/thumbnailPublishingService.js';
import { renderHomePublic } from '../server/home-public.js';

const id = n => '10000000-0000-4000-8000-' + String(n).padStart(12,'0');
const revision = 'a'.repeat(32), changed = 'b'.repeat(32), ownerId = id(50);
const item = { id: id(1), revision };
const row = n => ({ id: id(n), title: 'Task ' + n, is_public: true, author_id: ownerId, public_country: 'KR', public_locale: 'ko',
  revision, assessment: { revision, review: 'approved' }, excerpt: 'Public scope', step_count: 4,
  publication_context: { scope: 'Public scope' }, form_data: { managerName: 'PRIVATE_MANAGER' },
  custom_layout: { documentNotes: 'PRIVATE_NOTES' }, analysis_data: [{ proc: { stepTitle: 'Isolation', stepDetail: 'Check isolation' }, risks: [] }] });
const image = { blob: new Blob(['RIFFtestWEBP'], { type: 'image/webp' }), width: 720, height: 509 };
const res = () => ({ headers: {}, setHeader(k,v) { this.headers[k] = v; }, end(body) { this.body = body; } });

test('home requests metadata only, collapses groups and stops once six cards are available', async () => {
  const records = [row(1), {...row(2),document_group_id:id(99)}, {...row(3),document_group_id:id(99)}, {...row(4),assessment:{review:'rejected'}},
    ...Array.from({length:8},(_,i)=>row(i+5))];
  let calls = 0;
  const result = await readHomeSummary('ko', async ({ fields, offset, limit }) => {
    calls++; assert.equal(fields, HOME_SUMMARY_FIELDS); assert.equal(limit,3);
    assert.doesNotMatch(fields,/form_data|analysis_data|custom_layout/);
    return records.slice(offset,offset+3);
  });
  assert.equal(calls,3);
  assert.deepEqual(result.cards.map(c=>c.id),[1,2,5,6,7,8].map(id));
  assert.doesNotMatch(JSON.stringify(result),/PRIVATE_|form_data|analysis_data|custom_layout|assessment/);
});

test('only a missing migration triggers a lightweight old-schema fallback; permission/network errors propagate', async () => {
  let calls = 0;
  const result = await readHomeSummary('ko', async ({ table, fields, offset }) => {
    calls++;
    if (table === 'public_jsa_cards') throw { code: 'PGRST205' };
    assert.equal(fields,HOME_LEGACY_FIELDS); assert.doesNotMatch(fields,/form_data|analysis_data|custom_layout/);
    return offset ? [] : [{...row(1),step_count:undefined}];
  });
  assert.equal(calls,3); assert.equal(result.cards[0].steps,null); assert.equal(result.cards[0].thumbnail,null);
  for (const code of ['42501','FETCH_FAILED']) {
    let count=0;
    await assert.rejects(readHomeSummary('ko',async()=>{count++;throw {code};}),error=>error.code===code);
    assert.equal(count,1);
  }
});

test('home aborts stale reads, bounds sparse results, and rejects repeated pagination', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(readHomeSummary('ko',()=>assert.fail('must not read'),controller.signal),{name:'AbortError'});
  let count=0;
  await readHomeSummary('ko',async({offset,limit})=>{count++;return Array.from({length:limit},(_,n)=>({...row(offset+n+1),assessment:{review:'rejected'}}));});
  assert.equal(count,40);
  await assert.rejects(readHomeSummary('ko',async()=>[row(1)]),/HOME_PAGINATION_STALLED/);
});

test('current revisions render saved images; stale or malformed paths never render', () => {
  const current={...row(1),thumbnail_revision:revision,thumbnail_width:720,thumbnail_height:509};
  assert.ok(storedThumbnail(current).src.includes(revision));
  assert.ok(storedThumbnail({...current,revision:undefined}).src.includes(revision));
  assert.equal(storedThumbnail({...current,revision:changed}),null);
  assert.equal(thumbnailObjectPath('../private',revision),null);
  assert.equal(thumbnailObjectPath(id(1),'../../private'),null);
  const cards=homeSummaryCards([current],'ko'), html=renderHomePublic({cards},'ko');
  assert.match(html,/api\/jsa-thumbnail/);assert.match(html,/loading="lazy"/);assert.match(html,/decoding="async"/);
  assert.doesNotMatch(html,/PRIVATE_|canvas|iframe|\.pdf/);
});

test('image endpoint revalidates publication before returning 304 and refuses withdrawn content', async () => {
  let visible=true, calls=0;
  const handler=createJsaThumbnailHandler({config:{url:'https://project.example',key:'sb_publishable_test'},fetcher:async(url,options)=>{
    calls++;assert.match(url,/\/object\/authenticated\/jsa-thumbnails\//);assert.equal(options.cache,'no-store');
    assert.equal(options.headers.apikey,'sb_publishable_test'); assert.ok(!options.headers.Authorization);
    return visible ? new Response('RIFFtestWEBPpayload') : new Response('',{status:403});
  }});
  const request={method:'GET',query:item,headers:{}};
  let response=res();await handler(request,response);
  assert.equal(response.statusCode,200);assert.equal(response.headers['Content-Type'],'image/webp');
  assert.equal(response.headers['Cache-Control'],'public, max-age=0, must-revalidate');
  const tag=response.headers.ETag; response=res();await handler({...request,headers:{'if-none-match':tag}},response);
  assert.equal(response.statusCode,304);assert.equal(calls,2);
  visible=false;response=res();await handler({...request,headers:{'if-none-match':tag}},response);
  assert.equal(response.statusCode,404);assert.equal(response.headers['Cache-Control'],'private, no-store');assert.equal(calls,3);
});

test('image endpoint bounds response bytes and rejects invalid paths, formats and methods', async () => {
  const config={url:'https://project.example',key:'sb_publishable_test'};
  let called=false;
  const handler=createJsaThumbnailHandler({config,fetcher:async()=>{called=true;return new Response('html');}});
  for (const query of [{id:'../x',revision}, {id:id(1),revision:'invalid'}, {id:[id(1)],revision}]) {
    const response=res();await handler({method:'GET',query},response);assert.equal(response.statusCode,404);
  }
  assert.equal(called,false);
  let response=res();await handler({method:'POST',query:item},response);assert.equal(response.statusCode,405);
  response=res();await handler({method:'GET',query:item},response);assert.equal(response.statusCode,502);
  response=res();await createJsaThumbnailHandler({config,fetcher:async()=>new Response('small',{headers:{'content-length':String(THUMBNAIL_MAX_BYTES+1)}})})({method:'GET',query:item},response);
  assert.equal(response.statusCode,502);
  response=res();await createJsaThumbnailHandler({config,fetcher:async()=>new Response(new Uint8Array(THUMBNAIL_MAX_BYTES+1))})({method:'GET',query:item},response);
  assert.equal(response.statusCode,503);
});

function clientFixture({ document = row(1), previous = null, uploadError = null, writeError = null } = {}) {
  const calls=[],writes=[],uploads=[],removes=[];
  const client={storage:{from(bucket){assert.equal(bucket,'jsa-thumbnails');return{
    async upload(path,blob,options){uploads.push({path,blob,options});return{error:uploadError};},
    async remove(paths){removes.push(paths);return{error:null};},
  };}},from(table){
    const query={};
    for(const name of ['select','eq','is','order','limit','abortSignal'])query[name]=(...args)=>{calls.push({table,name,args});return query;};
    query.maybeSingle=async()=>({data:table==='public_jsa_catalog'?document:previous,error:null});
    query.upsert=async(payload)=>{writes.push(payload);return{error:writeError};};
    query.then=resolve=>resolve({data:[item],error:null});
    return query;
  }};
  return {client,calls,writes,uploads,removes};
}

test('publication sanitizes private fields and uploads a bounded immutable current-revision WebP once', async () => {
  const fixture=clientFixture({previous:{revision:changed}});let rendered=0;
  assert.equal(await publishThumbnail({client:fixture.client,ownerId,item,render:async row=>{
    rendered++;assert.doesNotMatch(JSON.stringify(row),/PRIVATE_/);return image;
  }}),true);
  assert.equal(rendered,1);assert.equal(fixture.uploads[0].path,thumbnailObjectPath(item.id,revision));
  assert.equal(fixture.uploads[0].options.upsert,false);
  assert.equal(fixture.writes[0].revision,revision);assert.equal(fixture.writes[0].renderer,'risk-v1');
  assert.deepEqual(fixture.removes,[[thumbnailObjectPath(item.id,changed)]]);
});

test('private, foreign, withdrawn or changed revisions do not render or upload; existing images are reused', async () => {
  for(const document of [null,{...row(1),is_public:false},{...row(1),author_id:id(51)},{...row(1),assessment:{revision:changed}},{...row(1),assessment:{revision,review:'rejected'}}]){
    const fixture=clientFixture({document});
    assert.equal(await publishThumbnail({client:fixture.client,ownerId,item,render:()=>assert.fail('must not capture')}),false);
    assert.equal(fixture.uploads.length,0);assert.equal(fixture.writes.length,0);
  }
  const fixture=clientFixture({previous:{revision}});
  assert.equal(await publishThumbnail({client:fixture.client,ownerId,item,render:()=>assert.fail('already exists')}),true);
  assert.equal(fixture.uploads.length,0);
});

test('upload failures and concurrent revision rejection never claim a saved thumbnail or remove the old image', async () => {
  let fixture=clientFixture({uploadError:{message:'offline'}});
  await assert.rejects(publishThumbnail({client:fixture.client,ownerId,item,render:async()=>image}),error=>error.message==='offline');
  assert.equal(fixture.writes.length,0);
  fixture=clientFixture({previous:{revision:changed},writeError:{code:'42501'}});
  await assert.rejects(publishThumbnail({client:fixture.client,ownerId,item,render:async()=>image}),error=>error.code==='42501');
  assert.equal(fixture.removes.length,0);
  fixture=clientFixture({uploadError:{statusCode:409}});
  assert.equal(await publishThumbnail({client:fixture.client,ownerId,item,render:async()=>image}),true);
});

test('publisher only queues the signed-in owner and rejects oversize images/cancelled captures', async () => {
  const fixture=clientFixture(), signal=new AbortController().signal;
  await pendingThumbnails(fixture.client,ownerId,signal);
  assert.ok(fixture.calls.some(c=>c.name==='eq' && c.args[0]==='author_id' && c.args[1]===ownerId));
  assert.ok(fixture.calls.some(c=>c.name==='is' && c.args[0]==='thumbnail_revision' && c.args[1]===null));
  await assert.rejects(publishThumbnail({client:fixture.client,ownerId,item,render:async()=>({...image,blob:new Blob([new Uint8Array(THUMBNAIL_MAX_BYTES+1)],{type:'image/webp'})})}),/INVALID_THUMBNAIL/);
  const controller=new AbortController();
  await assert.rejects(publishThumbnail({client:fixture.client,ownerId,item,signal:controller.signal,render:async()=>{controller.abort();return image;}}),{name:'AbortError'});
  assert.equal(fixture.uploads.length,0);
});


test('home cursor preserves timestamp precision, handles null dates and rejects filter injection', async () => {
  const timestamp='2026-10-26T10:00:00.123456+00:00';
  const cursor=homePageCursor({...row(3),published_at:timestamp});
  assert.deepEqual(cursor,{id:id(3),publishedAt:timestamp});
  assert.ok(homeAfterFilter(cursor).includes('published_at.eq.'+timestamp));
  assert.equal(homeAfterFilter(homePageCursor({...row(3),published_at:null})),'and(published_at.is.null,id.gt.'+id(3)+')');
  assert.equal(homeAfterFilter({id:id(3),publishedAt:'2026-10-26),is_public.eq.false'}),null);
  assert.equal(homeAfterFilter({id:'invalid',publishedAt:timestamp}),null);
  const records=Array.from({length:6},(_,n)=>({...row(n+1),published_at:timestamp}));let calls=0;
  const result=await readHomeSummary('ko',async ({after,limit})=>{
    calls++;assert.equal(limit,3);
    if(calls===2)assert.deepEqual(after,cursor);
    return records.filter(row=>!after||row.id>after.id).slice(0,limit);
  });
  assert.equal(calls,2);assert.equal(result.cards.length,6);
});
