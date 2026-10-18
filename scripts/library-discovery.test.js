import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { libraryPage, libraryTagLabel } from '../src/utils/libraryPresentation.js';
import { readAllPages } from '../src/services/pagedRead.js';
import { documentLines } from '../src/utils/documentList.js';
import { documentTextHtml } from '../server/document-text.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

test('library pages cover every item and clamp after deletion; built-in labels translate without changing custom tags', () => {
  const rows = Array.from({ length: 37 }, (_, id) => ({ id }));
  assert.deepEqual([1,2,3,4].flatMap(page => libraryPage(rows, page).rows), rows);
  assert.equal(libraryPage(rows.slice(0,24),4).current,2);
  assert.equal(libraryPage([],99).current,1);
  assert.equal(libraryPage([],99).total,0);
  for (const locale of SUPPORTED_LANGS) assert.ok(libraryTagLabel('밸브조작',locale));
  assert.doesNotMatch(libraryTagLabel('밸브조작','en-US'), /[가-힣]/);
  assert.equal(libraryTagLabel('My custom label','en-US'),'My custom label');
});

test('paged metadata does not truncate at an API cap and fails on ignored offsets', async () => {
  const data = Array.from({length:1003},(_,i)=>({id:String(i)}));
  const ranges=[];
  const result=await readAllPages(()=>({range(start,end){ranges.push([start,end]);return Promise.resolve({data:data.slice(start,Math.min(end+1,start+200))});}}));
  assert.equal(result.length,1003);
  assert.equal(ranges.at(-1)[0],1003);
  await assert.rejects(()=>readAllPages(()=>({range(){return Promise.resolve({data:[{id:'same'}]});}})),/INVALID_LIST_PAGINATION/);
  await assert.rejects(()=>readAllPages(()=>({range(){return Promise.resolve({error:new Error('denied')});}})),/denied/);
});

test('document text preserves nested bullets, wrapped continuations, literal stars and escaped content', () => {
  const text='Check isolation\n  - Inspect the valve\n    1. Record the result\n* Authored list item\nTorque = 2 * force';
  const lines=documentLines(text,{bullet:true});
  assert.equal(lines[0].marker,'•');
  assert.equal(lines[1].indent,1);
  assert.equal(lines[2].marker,'1.');
  assert.equal(lines[3].text,'Authored list item');
  assert.equal(lines[4].text,'Torque = 2 * force');
  assert.equal(lines[4].continuation,true);
  const html=documentTextHtml('  - <script>alert(1)</script>\nNext line');
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('padding-inline-start:2.15em'));
  assert.ok(html.includes('Next line'));
});

test('Explore facets count distinct matching documents beyond the page with the same exclusion filters', async () => {
  const server=await createServer({server:{middlewareMode:true},appType:'custom'});
  try {
    const {listPublicTagCounts}=await server.ssrLoadModule('/src/services/publicJsaService.js');
    const rows=Array.from({length:1003},(_,i)=>({id:String(i),tags:i%2?['A']:['A','B','B']}));
    const calls=[];
    const client={from(table){let offset=0;const filters=[];const q={
      select(value){assert.equal(value,'id,tags');return q;},
      eq(...args){filters.push(['eq',...args]);return q;},not(...args){filters.push(['not',...args]);return q;},
      contains(...args){filters.push(['contains',...args]);return q;},ilike(...args){filters.push(['ilike',...args]);return q;},
      order(){return q;},range(start){offset=start;return q;},
      then(resolve,reject){assert.equal(table,'public_jsa_catalog');calls.push(filters);return Promise.resolve({data:rows.slice(offset,offset+200)}).then(resolve,reject);}
    };return q;}};
    const id='10000000-0000-4000-8000-000000000001';
    const counts=await listPublicTagCounts({client,country:'US',author:'operator',tags:['A'],search:'100% valve',blocked:[id,'bad'],hidden:[id]});
    assert.equal(counts.A,1003);assert.equal(counts.B,502);
    for(const filters of calls){
      assert.ok(filters.some(f=>f[1]==='is_public'&&f[2]===true));
      assert.ok(filters.some(f=>f[1]==='public_country'&&f[2]==='US'));
      assert.ok(filters.some(f=>f[1]==='is_operator'&&f[2]===true));
      assert.ok(filters.some(f=>f[0]==='contains'&&f[1]==='tags'));
      assert.equal(filters.filter(f=>f[0]==='not').length,2);
      assert.ok(filters.some(f=>f[0]==='ilike'&&f[2]==='%100\\% valve%'));
    }
  } finally {await server.close();}
});
