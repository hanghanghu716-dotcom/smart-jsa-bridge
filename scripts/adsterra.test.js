import test from 'node:test';
import assert from 'node:assert/strict';
import { ADSTERRA_MAX_AGE, ADSTERRA_CHOICE_KEY, ADSTERRA_FRAME_CSP, validAdsterra, adsterraHost, adsterraPath, adsterraChoice, storeAdsterraChoice, adsterraFrameHtml } from '../src/utils/adsterra.js';
import { createAdsterraFrame } from '../api/adsterra-frame.js';
import { adsterraUi } from '../src/locales/adsterraUi.js';
const key = 'a'.repeat(32);
const config = {enabled:true,key,scriptUrl:'https://bauval.org/22/'+key,width:300,height:250};
test('only a configured 300x250 HTTPS banner is accepted', () => {
  assert.equal(validAdsterra(config),true);
  for (const bad of [{enabled:false},{key:''},{height:50},{width:320},{scriptUrl:'javascript:alert(1)'},{scriptUrl:'https://ads-fixture.invalid/other/invoke.js'},{scriptUrl:config.scriptUrl+'?x=1'},{scriptUrl:config.scriptUrl+'#x'},{scriptUrl:config.scriptUrl.replace('https://','http://')},{scriptUrl:config.scriptUrl.replace('https://','https://user:pass@')},{scriptUrl:config.scriptUrl.replace('bauval.org/','bauval.org:9000/')}]) assert.equal(validAdsterra({...config,...bad}),false);
});
test('ads are limited to production public home and case pages', () => {
  assert.equal(adsterraHost({protocol:'https:',hostname:'smartjsabridge.com'},'Browser'),true);
  for (const hostname of ['localhost','127.0.0.1','branch.vercel.app','smartjsabridge.com.attacker.test']) assert.equal(adsterraHost({protocol:'https:',hostname},'Browser'),false);
  assert.equal(adsterraHost({protocol:'http:',hostname:'smartjsabridge.com'},'Browser'),false);
  for(const ua of ['ReactSnap','Googlebot','HeadlessChrome']) assert.equal(adsterraHost({protocol:'https:',hostname:'smartjsabridge.com'},ua),false);
  for(const path of ['/ko','/ja-JP','/fr-CA-QC/','/en-US/case-study/jsa-crane'])assert.equal(adsterraPath(path),true);
  for(const path of ['/ko/templates','/ko/analysis','/ko/export','/ko/admin/upload','/ko/privacy','/ko/library','/ko/business','/ko/case-study/','/xx/case-study/demo','/ko/case-study/demo/more'])assert.equal(adsterraPath(path),false);
});
test('ad consent is separate from analytics, expires, and is revocable', () => {
  const data=new Map([['smartjsa_analytics_choice_v2',JSON.stringify({choice:'allowed',time:1000})]]);
  const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  assert.equal(adsterraChoice(storage,1000),null);
  storeAdsterraChoice(storage,true,1000);
  assert.equal(adsterraChoice(storage,1001).choice,'allowed');
  assert.equal(adsterraChoice(storage,1000+ADSTERRA_MAX_AGE),null);
  assert.equal(adsterraChoice(storage,999),null);
  storeAdsterraChoice(storage,false,1100);
  assert.equal(adsterraChoice(storage,1101).choice,'denied');
  data.set(ADSTERRA_CHOICE_KEY,'broken');assert.equal(adsterraChoice(storage),null);
  assert.equal(adsterraChoice({getItem(){throw Error('blocked');}}),null);
  assert.throws(()=>storeAdsterraChoice({setItem(){throw Error('blocked');}},true));
});
test('frame uses only the validated public placement and cannot read application storage', () => {
  const html=adsterraFrameHtml(config);
  assert.ok(html.includes('"format":"iframe"'));
  assert.ok(html.includes(config.scriptUrl));
  assert.equal(adsterraFrameHtml({...config,enabled:false}),'');
  assert.equal(adsterraFrameHtml({...config,key:'</script>'}),'');
  assert.ok(ADSTERRA_FRAME_CSP.includes('sandbox allow-scripts'));
  assert.ok(!ADSTERRA_FRAME_CSP.includes('allow-same-origin'));
  assert.ok(!ADSTERRA_FRAME_CSP.includes('allow-top-navigation'));
});
test('server returns no ads to direct navigation, preview hosts or cross-site embeds', () => {
  const handler=createAdsterraFrame(config);
  const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=v;}});
  const headers={host:'smartjsabridge.com',referer:'https://smartjsabridge.com/','sec-fetch-dest':'iframe'};
  let res=response();handler({method:'GET',headers},res);
  assert.equal(res.statusCode,200);assert.ok(res.body.includes(config.key));
  assert.equal(res.headers['Content-Security-Policy'],ADSTERRA_FRAME_CSP);
  assert.equal(res.headers['Cache-Control'],'private, no-store');
  for(const change of [{host:'preview.vercel.app'},{referer:'https://attacker.test/'},{referer:undefined},{'sec-fetch-dest':'document'}]){
    res=response();handler({method:'GET',headers:{...headers,...change}},res);assert.equal(res.statusCode,404);assert.equal(res.body,undefined);
  }
  res=response();handler({method:'POST',headers},res);assert.equal(res.statusCode,405);
  res=response();handler({method:'HEAD',headers},res);assert.equal(res.statusCode,200);assert.equal(res.body,'');
  res=response();createAdsterraFrame({...config,enabled:false})({method:'GET',headers},res);assert.equal(res.statusCode,404);
});
test('all supported language families have advertising choices', () => {
  for(const locale of ['ko','ja-JP','en-US','en-CA','en-CA-AB','en-CA-ON','en-CA-BC','en-AU','en-GB','en-SG','fr-CA-QC','fr-FR','de-DE','es-ES','it-IT','pt-BR','ru-RU','ro-RO','ar-SA']) {
    for(const value of Object.values(adsterraUi(locale)))assert.ok(typeof value==='string'&&value.length>0);
  }
});
