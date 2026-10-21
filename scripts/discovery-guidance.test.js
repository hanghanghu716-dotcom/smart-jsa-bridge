import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { regionalFixedGuidance } from '../src/utils/regionalFixedGuidance.js';
import { discoveryToolsUi } from '../src/locales/discoveryToolsUi.js';
import { seoDiagnosticsUi } from '../src/locales/seoDiagnosticsUi.js';
import { publicationDiagnostics, publicationReviewHints } from '../src/utils/publicationDiagnostics.js';
import { exploreEvidence } from '../src/utils/explorePresentation.js';
import { discoveryTopics } from '../src/utils/discoveryTopics.js';
import { translationPayload, translatePublicRows } from '../src/services/browserTranslation.js';
import { renderExploreHtml } from '../api/explore.js';
import { renderPublicHtml } from '../api/public-jsa.js';

const row = { id:'10000000-0000-4000-8000-000000000001',is_public:true,reuse_license:'community-v1',public_locale:'en-US',public_country:'US',title:'Valve inspection',assessment:{checked:true,review:'pending'},
  publication_context:{scope:'Isolation of the pressure system',limitations:'Verify on site',sources:'Equipment manual'},
  tags:['밸브조작'],form_data:{},custom_layout:{},
  analysis_data:['Prepare','Isolate','Verify'].map(stepTitle=>({proc:{stepTitle,stepDetail:'Identify the isolation boundary and check the pressure system before opening.'},risks:[{factor:'Unexpected release of trapped pressure through the valve assembly.',current_measure:'Verify the isolation boundary and check for stored pressure before opening the connection.'}]})) };
const shell='<!doctype html><html><head></head><body><div id="root"></div></body></html>';

test('all non-US locales have exact-jurisdiction guidance, sources and complete UI copy',()=>{
  for(const locale of SUPPORTED_LANGS){
    for(const ns of ['regulation','jrajsa','about']){
      const g=regionalFixedGuidance(`/${locale}/${ns}`,ns);
      if(locale==='en-US'){assert.equal(g,null);continue;}
      assert.equal(g.locale,locale);assert.ok(g.title&&g.description);
      assert.ok(g.profile.scope.length>120&&g.profile.application.length>100);
      assert.equal(g.text.labels.length,10);assert.equal(g.text.steps.length,5);
      assert.equal(g.text.about.length,4);
      for(const [title,url] of g.profile.links){assert.ok(title);assert.equal(new URL(url).protocol,'https:');}
      for(const value of Object.values(discoveryToolsUi(locale)))assert.ok(value);
      for(const value of Object.values(seoDiagnosticsUi(locale)))assert.ok(value);
    }
  }
  for(const path of ['/en/about','/en-SG-other/about','/unknown/about','/about'])assert.equal(regionalFixedGuidance(path,'about'),null);
  assert.match(regionalFixedGuidance('/en-SG/regulation','regulation').profile.links[0][1],/mom.gov.sg/);
  assert.match(regionalFixedGuidance('/fr-CA-QC/regulation','regulation').profile.links[0][1],/cnesst.gouv.qc.ca/);
  assert.match(regionalFixedGuidance('/fr-FR/regulation','regulation').profile.links[0][1],/inrs.fr/);
  assert.match(regionalFixedGuidance('/en-AU/regulation','regulation').profile.scope,/high risk construction/);
});

test('diagnostic check results agree with the existing index gate without approving ads or changing source',()=>{
  const before=JSON.stringify(row);
  const variants=[row,{...row,assessment:{checked:false}},{...row,is_public:false},{...row,reuse_license:null},{...row,public_locale:'unknown'},{...row,title:'TEST_trial'},
    {...row,assessment:{checked:true,review:'rejected'}},{...row,assessment:{checked:true,duplicate_of:'some-id'}},{...row,analysis_data:row.analysis_data.slice(0,2)},
    {...row,analysis_data:row.analysis_data.map(step=>({...step,proc:{...step.proc,stepTitle:'Same'}}))}];
  for(const source of variants){const result=publicationDiagnostics(source);assert.equal(result.indexable,Object.values(result.checks).every(Boolean));assert.equal(result.adsContentEligible,false);}
  assert.equal(publicationDiagnostics({...row,assessment:{checked:true,review:'approved'}}).adsContentEligible,true);
  const hints=publicationReviewHints(row);assert.equal(hints.repeated.length,2);assert.deepEqual(hints.repeated[0].steps,[1,2,3]);assert.deepEqual(hints.missing,[]);
  assert.deepEqual(publicationReviewHints({analysis_data:{}}).repeated,[]);
  assert.equal(JSON.stringify(row),before);
});

test('card evidence quotes authored hazard/control and browser translation leaves stored text unchanged',async()=>{
  const before=JSON.stringify(row),evidence=exploreEvidence(row);
  assert.equal(evidence[0].text,row.analysis_data[0].risks[0].factor);
  const payload=translationPayload([row]);assert.deepEqual(payload[0].cardEvidence,evidence);
  const result=await translatePublicRows(payload,'ko',{api:{create:async()=>({translate:async text=>'번역 '+text,destroy(){}})}});
  assert.match(result[0].cardEvidence[0].text,/^번역 /);
  assert.equal(result[0].cardEvidence[0].key,'risk');assert.equal(JSON.stringify(row),before);
  assert.deepEqual(exploreEvidence({analysis_data:[]}),[]);
});

test('initial HTML exposes matching topic links and step anchors, escapes excerpts and keeps country catalogs separate',()=>{
  const query={page:0,tags:[],sort:'latest',search:''};
  const html=renderExploreHtml(shell,{rows:[row],total:1},'en-US',query);
  for(const item of discoveryTopics([row],'en-US',query))assert.ok(html.includes('/en-US'+item.href.replace(/&/g,'&amp;')));
  assert.ok(html.includes('Hazard excerpt'));assert.ok(html.includes(row.analysis_data[0].risks[0].factor));
  assert.doesNotMatch(html,/hreflang=/);
  const dangerous=structuredClone(row);dangerous.analysis_data[0].risks[0].factor='<img src=x onerror=alert(1)>';
  assert.doesNotMatch(renderExploreHtml(shell,{rows:[dangerous],total:1},'en-US',query),/<img src=x/);
  const detail=renderPublicHtml(shell,row,'en-US');
  for(let i=1;i<=3;i++){assert.ok(detail.includes(`href="#public-step-${i}"`));assert.ok(detail.includes(`id="public-step-${i}"`));}
  assert.ok(detail.includes('id="public-procedure-preview"'));
});
