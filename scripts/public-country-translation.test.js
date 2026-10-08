import test from 'node:test';
import assert from 'node:assert/strict';
import {PUBLIC_COUNTRIES,documentCountry,exploreCountry,localeCountry} from '../src/utils/publicCountry.js';
import {exploreQuery,exploreSearch} from '../src/utils/discovery.js';
import {SUPPORTED_LANGS} from '../src/locales/config.js';
import {projectPayload,projectEditorState} from '../src/utils/projectPersistence.js';
import {translationAvailability,translatePublicRows,translationPairs} from '../src/services/browserTranslation.js';
import {getPublicCountryUi} from '../src/locales/publicCountryUi.js';
import {browserTranslationUi} from '../src/locales/browserTranslationUi.js';
import {sortCases} from '../src/utils/caseSort.js';
import {createExploreHandler} from '../api/explore.js';

test('every supported locale has a country; work jurisdiction takes precedence over UI language',()=>{
 for(const locale of SUPPORTED_LANGS)assert.ok(PUBLIC_COUNTRIES.includes(localeCountry(locale)),locale);
 assert.equal(documentCountry({jurisdiction:'SG'},'ko'),'SG');
 assert.equal(documentCountry({jurisdiction:'CA-QC'},'en-US'),'CA');
 assert.equal(exploreCountry(undefined,'en-GB'),'GB');assert.equal(exploreCountry('all','ko'),null);
 assert.equal(exploreCountry('KR','en-US'),'KR');
 const query=exploreQuery('?country=KR&sort=views&page=3&q=valve&tag=gas');
 assert.deepEqual(exploreQuery(exploreSearch(query)),query);
 assert.equal(exploreQuery('?country=invalid').country,undefined);
 for(const locale of SUPPORTED_LANGS)for(const labels of [getPublicCountryUi(locale),browserTranslationUi(locale)])assert.ok(Object.values(labels).every(value=>typeof value==='string'&&value.trim()));
});
test('public save preserves country without exposing private context; reopening preserves the country',()=>{
 const payload=projectPayload({locale:'ko',publicationConsent:true,formData:{projectName:'Test',context:{jurisdiction:'SG',region:'Private location'}}},'author',true);
 assert.equal(payload.public_country,'SG');assert.equal(payload.form_data.context,undefined);
 const restored=projectEditorState(payload,true);assert.equal(restored.formData.context.jurisdiction,'SG');
 assert.equal(projectPayload({...restored,locale:'en-US',publicationConsent:true},'author',true).public_country,'SG');
});
test('SSR filters country in DB before pagination; all-countries is explicit and noindexed',async()=>{
 let params;const handler=createExploreHandler({readShell:async()=>'<html><head></head><body><div id="root"></div></body></html>',fetcher:async url=>{params=new URL(url).searchParams;return {ok:true,json:async()=>[],headers:new Headers({'content-range':'*/0'})};}});
 const run=async query=>{const res={setHeader(){},end(html){this.html=html;}};await handler({query},res);return res;};
 await run({lng:'en-US'});assert.equal(params.get('public_country'),'eq.US');
 const result=await run({lng:'en-US',country:'all'});assert.equal(params.has('public_country'),false);assert.match(result.html,/noindex/);
 await run({lng:'ko',country:'CA'});assert.equal(params.get('public_country'),'eq.CA');
});
const source={id:'source',public_country:'KR',public_locale:'ko',title:'원문',form_data:{projectName:'작업',ppe:['PPE_HELMET'],permits:[]},analysis_data:[{proc:{stepTitle:'점검',stepDetail:'검사'},frequency:2,severity:3,riskLevel:6,risks:[{factor:'위험',category:'MECHANICAL',current_measure:'차단',recommend_measure:'확인'}]}],publication_context:{region:'KR',scope:'범위',sources:'https://example.com'},custom_layout:{savedUserColumns:[{id:'x',label:'항목'}]}};
test('browser translation changes text only, leaves the original and country/risk scores intact, and releases models',async()=>{
 let destroyed=0;const api={create:async()=>({translate:async text=>'translated:'+text,destroy(){destroyed++;}})};
 const before=structuredClone(source);const [result]=await translatePublicRows([source],'en-US',{api,detail:true});
 assert.deepEqual(source,before);assert.equal(result.public_country,'KR');assert.equal(result.public_locale,'ko');
 assert.equal(result.analysis_data[0].riskLevel,6);assert.equal(result.analysis_data[0].risks[0].category,'MECHANICAL');
 assert.equal(result.form_data.ppe[0],'PPE_HELMET');assert.equal(result.publication_context.sources,'https://example.com');
 assert.equal(result.title,'translated:원문');assert.equal(result.analysis_data[0].risks[0].current_measure,'translated:차단');assert.equal(destroyed,1);
});
test('translation handles unavailable, download, same-language and failure without fabricating results',async()=>{
 assert.equal(await translationAvailability([source],'en-US',null),'unsupported');
 for(const [availability,expected] of [['available','available'],['downloadable','download'],['downloading','download'],['unavailable','unsupported']])assert.equal(await translationAvailability([source],'en-US',{availability:async()=>availability}),expected);
 assert.deepEqual(translationPairs([{public_locale:'en-GB'}],'en-SG'),[]);
 assert.equal(await translationAvailability([source],'ko',null),'original');
 let destroyed=0;
 await assert.rejects(translatePublicRows([source],'en-US',{api:{create:async()=>({translate:async()=>{throw Error('model failed');},destroy(){destroyed++;}})}}));
 assert.equal(destroyed,1);assert.equal(source.title,'원문');
 const controller=new AbortController();controller.abort();await assert.rejects(translatePublicRows([source],'en-US',{signal:controller.signal,api:{}}),{name:'AbortError'});
});
test('view sorting is deterministic, puts higher counts first and preserves source order data',()=>{
 const rows=[{id:'a',created_at:'2026-10-02',view_count:1},{id:'b',created_at:'2026-10-01',view_count:10},{id:'c',created_at:'2026-10-03',view_count:1}];
 assert.deepEqual(sortCases(rows,'views').map(row=>row.id),['b','c','a']);
 assert.deepEqual(sortCases(rows,'latest').map(row=>row.id),['c','a','b']);assert.equal(rows[0].id,'a');
});
