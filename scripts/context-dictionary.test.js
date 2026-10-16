import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONTEXT_DICTIONARIES, scopeDictionary, contextDictionaryFilter, contextDictionarySource, contextDictionaryUi } from '../src/utils/contextDictionary.js';
import { findDictionaryHazards, readDictionaryGroups } from '../src/utils/dictionaryGroups.js';
const index=JSON.parse(readFileSync(new URL('../src/data/context-dictionary-sources.json',import.meta.url)));
test('597 source cases and every stage stay inside their own locale and source revision',()=>{
  for(const [locale,scope] of Object.entries(CONTEXT_DICTIONARIES)){
    assert.equal(index[locale].articles.length,199);
    assert.equal(new Set(index[locale].articles.map(a=>a.id)).size,199);
    assert.equal(new Set(index[locale].articles.map(a=>a.url)).size,199);
    for(let id=scope.firstId;id<=scope.lastId;id++){
      const a=contextDictionarySource(locale,id,index);assert.ok(a);
      assert.ok(a.url.startsWith('https://smartjsabridge.com/'+locale+'/case-study/'));
      assert.match(a.body_sha256,/^[a-f0-9]{64}$/);
    }
    for(const id of [1003,scope.firstId-1,scope.lastId+1,1.5,'invalid'])assert.equal(contextDictionarySource(locale,id,index),null);
    assert.match(contextDictionaryUi(locale).reference,/AI/);
  }
});
test('dictionary search excludes preserved legacy rows and never falls back from Singapore to US',async()=>{
  const calls=[];const q={};for(const op of ['select','eq','gte','lte','gt','order','or'])q[op]=(...args)=>{calls.push([op,...args]);return q;};q.range=async()=>({data:[]});
  const client={from:()=>q};await findDictionaryHazards(client,{locale:'en-SG',search:'CRANE lift'});
  assert.ok(calls.some(x=>x[0]==='eq'&&x[1]==='locale'&&x[2]==='en-SG'));
  assert.ok(calls.some(x=>x[0]==='gte'&&x[2]===1200001));assert.ok(calls.some(x=>x[0]==='lte'&&x[2]===1201592));
  await assert.rejects(readDictionaryGroups(client,{locale:'en-SG',ids:[1100001]}),/SCOPE_MISMATCH/);
  const original={};assert.equal(scopeDictionary(original,'ko-KR'),original);
});
test('Japanese width normalization and English multiword search preserve query escaping',()=>{
  assert.ok(contextDictionaryFilter('ＣＲＡＮＥ lift').includes('keywords.cs.{"crane","lift"}'));
  assert.ok(contextDictionaryFilter('墜落').includes('墜落'));
  assert.ok(!contextDictionaryFilter('"},locale.eq.ko-KR').includes('keywords.cs.{"},'));
});
