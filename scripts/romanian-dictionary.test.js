import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { romanianDictionaryFilter, romanianDictionarySource } from '../src/utils/dictionaryGroups.js';
const index=JSON.parse(readFileSync(new URL('../src/data/romanian-dictionary-sources.json',import.meta.url)));
test('Romanian search matches accent-free tokens without breaking quoted PostgREST searches',()=>{
  assert.match(romanianDictionaryFilter('cădere înălțime'), /keywords\.cs\.\{"cadere","inaltime"\}/);
  assert.match(romanianDictionaryFilter('inaltime'), /keywords\.cs\.\{"inaltime"\}/);
  assert.ok(!romanianDictionaryFilter('"},locale.eq.ko-KR').includes('keywords.cs.{"},'));
});
test('all 1592 stage groups link to their source case and out-of-scope IDs do not',()=>{
  assert.equal(index.articles.length,199);
  assert.equal(new Set(index.articles.map(x=>x.url)).size,199);
  for(let i=0;i<1592;i++){
    const source=romanianDictionarySource(index.firstId+i,index);
    assert.equal(source,index.articles[Math.floor(i/8)]);
    const url=new URL(source.url);
    assert.equal(url.origin,'https://smartjsabridge.com');
    assert.match(url.pathname,/^\/ro-RO\/case-study\/[^/]+$/);
    assert.equal(url.search+url.hash,'');
  }
  for(const id of [1,index.firstId-1,index.firstId+1592,1.2,'oops'])assert.equal(romanianDictionarySource(id,index),null);
});
