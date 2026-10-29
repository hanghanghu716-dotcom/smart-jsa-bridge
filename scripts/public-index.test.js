import { setImmediate } from 'node:timers';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readPublicIndex } from '../server/public-index.js';
import { createContentFeedHandler } from '../api/content-feed.js';

const makeRows = count => Array.from({length:count}, (_,i) => ({
  id: '10000000-0000-4000-8000-' + String(i+1).padStart(12,'0'),
  title:'Public document '+i,is_public:true,public_locale:'ko',reuse_license:'community-v1',
  assessment:{checked:true},index_facts:{titles:['Preparation','Work','Finish'],meaningful:200},
}));
function upstream(rows, { cap = 1000, withdrawn = [], failBatch = -1 } = {}) {
  const calls=[];
  const fetcher=async url=>{
    const p=new URL(url).searchParams;
    const last=p.get('id')?.slice(3);
    const scoped=p.get('and')?.match(/^\(id\.in\.\(([^)]+)\)\)$/)?.[1].split(',');
    calls.push({select:p.get('select'),scoped,last});
    if(p.get('select')!=='id'){
      assert.ok(scoped?.length>0&&scoped.length<=10,'Expensive assessments must be constrained before sorting');
      if(scoped.includes(rows[failBatch]?.id))return new Response('',{status:500});
    }
    let selected=rows.filter(row=>(!last||row.id>last)&&(!scoped||scoped.includes(row.id)));
    if(scoped)selected=selected.filter(row=>!withdrawn.includes(row.id));
    return Response.json(selected.slice(0,Math.min(cap,Number(p.get('limit')))).map(row=>p.get('select')==='id'?{id:row.id}:row));
  };
  return {fetcher,calls};
}
test('index batching preserves all documents under small upstream page caps',async()=>{
  const rows=makeRows(23),{fetcher}=upstream(rows,{cap:3});
  assert.deepEqual(await readPublicIndex(fetcher),rows);
});
test('sitemap index stops assessment reads after finding an eligible public document',async()=>{
  const rows=makeRows(23),{fetcher,calls}=upstream(rows);
  const result=await readPublicIndex(fetcher,{firstIndexable:true});
  assert.equal(result.length,10);
  assert.ok(calls.filter(c=>c.scoped).every(c=>c.scoped.every(id=>rows.slice(0,10).some(row=>row.id===id))));
});
test('eligibility checks continue past rejected or duplicate batches',async()=>{
  const rows=makeRows(23).map((r,i)=>i<10?{...r,assessment:{checked:true,duplicate_of:r.id}}:r);
  const {fetcher}=upstream(rows);
  assert.equal((await readPublicIndex(fetcher,{firstIndexable:true})).length,20);
});
test('withdrawn IDs are not restored from the earlier enumeration',async()=>{
  const rows=makeRows(23),withdrawn=[rows[0].id,rows[15].id],{fetcher}=upstream(rows,{withdrawn});
  assert.deepEqual(await readPublicIndex(fetcher),rows.filter(r=>!withdrawn.includes(r.id)));
});
test('a failed assessment batch fails the sitemap instead of publishing a partial list',async()=>{
  const {fetcher}=upstream(makeRows(23),{failBatch:15});
  const res={setHeader(){},end(body){this.body=body;}};
  await createContentFeedHandler({fetcher})({query:{kind:'public'}},res);
  assert.equal(res.statusCode,503);
});
test('invalid IDs cannot enter an assessment filter',async()=>{
  const {fetcher}=upstream([{id:'bad-filter'}]);
  await assert.rejects(readPublicIndex(fetcher),/INVALID_PUBLIC_INDEX_ID/);
});

test('full indexes overlap at most two bounded batches and preserve deterministic output order',async()=>{
  const rows=makeRows(71),base=upstream(rows,{cap:3});let active=0,peak=0;
  const fetcher=async url=>{const detail=new URL(url).searchParams.get('select')!=='id';
    if(detail){active++;peak=Math.max(peak,active);await new Promise(resolve=>setImmediate(resolve));}
    try{return await base.fetcher(url);}finally{if(detail)active--;}
  };
  assert.deepEqual(await readPublicIndex(fetcher),rows);assert.equal(peak,2);assert.equal(active,0);
});

test('statement timeouts split expensive groups without omitting documents',async()=>{
  const rows=makeRows(23),base=upstream(rows,{cap:1});let retries=0;
  const fetcher=async url=>{
    const group=new URL(url).searchParams.get('and');
    if(group&&group.split(',').length>2){retries++;return Response.json({code:'57014'},{status:500});}
    return base.fetcher(url);
  };
  assert.deepEqual(await readPublicIndex(fetcher),rows);assert.ok(retries>0);
  const probe=await readPublicIndex(fetcher,{firstIndexable:true});assert.ok(probe.length>0&&probe.length<=2);
});

test('persistent single-document timeouts still fail closed',async()=>{
  const base=upstream(makeRows(3));let attempts=0;
  const fetcher=async url=>{
    if(new URL(url).searchParams.get('and')){attempts++;return Response.json({code:'57014'},{status:500});}
    return base.fetcher(url);
  };
  await assert.rejects(readPublicIndex(fetcher),e=>e.code==='57014');assert.equal(attempts,3);
});
