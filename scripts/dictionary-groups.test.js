import test from 'node:test';
import assert from 'node:assert/strict';
import { groupDictionaryRows, findDictionaryHazards, readDictionaryGroups } from '../src/utils/dictionaryGroups.js';
import { getDictionaryGroupUi } from '../src/locales/dictionaryGroupUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

const rows = [
 { hazard_id:1, hazard_name:'Fall', measure_text:'Barrier', solution_text:'Inspect barrier', keywords:['height'] },
 { hazard_id:1, hazard_name:'Fall', measure_text:'Barrier', solution_text:'Inspect barrier', keywords:['height','edge'] },
 { hazard_id:1, hazard_name:'Fall', measure_text:'Barrier', solution_text:'Repair gaps' },
 { hazard_id:1, hazard_name:'Fall', measure_text:'Harness', solution_text:'Check anchor' },
 { hazard_id:2, hazard_name:'Fall', measure_text:'Barrier', solution_text:'Other site' },
];
test('hazard/measure hierarchy removes duplicate combinations without mixing controls or hazard IDs',()=>{
 const groups=groupDictionaryRows(rows);
 assert.equal(groups.length,2);assert.equal(groups[0].measures.length,2);
 assert.deepEqual(groups[0].measures[0].solutions,['Inspect barrier','Repair gaps']);
 assert.deepEqual(groups[0].measures[1].solutions,['Check anchor']);
 assert.deepEqual(groups[0].keywords,['height','edge']);
 assert.deepEqual(groups[1].measures[0].solutions,['Other site']);
 assert.equal(groupDictionaryRows([{hazard_id:3,measure_text:null,solution_text:null}])[0].measures[0].text,'');
});
function clientFor(source,{cap=2,fail=false,countChange=false,empty=false}={}){
 const calls=[];let reads=0;
 return {calls,from(table){assert.equal(table,'factor_dictionary_view');const state={};const q={};
  for(const op of ['select','eq','gt','in','or','order','abortSignal'])q[op]=(...args)=>{calls.push([op,...args]);if(op==='gt')state.after=args[1];if(op==='in')state.ids=args[1];return q;};
  q.range=async(start,end)=>{
   if(fail)return {error:Error('offline')};
   const selected=source.filter(r=>(state.after===undefined||r.hazard_id>state.after)&&(!state.ids||state.ids.includes(r.hazard_id)));
   return {data:empty?[]:selected.slice(start,Math.min(end+1,start+cap)),count:selected.length+(countChange&&reads++>0?1:0)};
  };return q;
 }};
}
test('index handles API row caps and cuts inside repeated hazards; filtering is sent to the server',async()=>{
 const client=clientFor(rows);
 assert.deepEqual(await findDictionaryHazards(client,{locale:'ko-KR',category:'height',search:'anchor'}),[1,2]);
 assert.ok(client.calls.some(c=>c[0]==='eq'&&c[1]==='locale'&&c[2]==='ko-KR'));
 assert.ok(client.calls.some(c=>c[0]==='or'&&c[1].includes('anchor')));
});
test('details span multiple responses and retain complete groups without the keyword filter',async()=>{
 const client=clientFor(rows);
 const result=await readDictionaryGroups(client,{locale:'ko-KR',ids:[1]});
 assert.equal(result[0].measures.length,2);assert.equal(result[0].measures[0].solutions.length,2);
 assert.ok(!client.calls.some(c=>c[0]==='or'));
});
test('failed, partial or changed responses never look like complete dictionary data',async()=>{
 await assert.rejects(findDictionaryHazards(clientFor(rows,{fail:true}),{locale:'ko-KR'}),/offline/);
 for(const options of [{fail:true},{empty:true},{countChange:true}])await assert.rejects(readDictionaryGroups(clientFor(rows,options),{locale:'ko-KR',ids:[1]}));
 await assert.rejects(readDictionaryGroups(clientFor(rows),{locale:'ko-KR',ids:[1,99]}),/DICTIONARY_CHANGED/);
 assert.deepEqual(await readDictionaryGroups(clientFor(rows),{locale:'ko-KR',ids:[]}),[]);
});
test('aborted lookups cannot deliver stale data; all locale routes have guidance',async()=>{
 const controller=new AbortController();controller.abort();
 await assert.rejects(findDictionaryHazards(clientFor(rows),{locale:'ko-KR',signal:controller.signal}),/ABORTED/);
 const keys=Object.keys(getDictionaryGroupUi('en-US'));
 for(const locale of SUPPORTED_LANGS){const ui=getDictionaryGroupUi(locale);assert.deepEqual(Object.keys(ui),keys);assert.ok(Object.values(ui).every(Boolean));}
});
