import adsterraPolicyHandler, { adsterraPolicy } from '../api/adsterra-policy.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ADSTERRA_MAX_AGE, ADSTERRA_CHOICE_KEY, ADSTERRA_FRAME_CSP, validAdsterra, adsterraHost, adsterraPath, adsterraChoice, storeAdsterraChoice, adsterraFrameHtml, adsterraCanLoad, createAdsterraPolicyLoader } from '../src/utils/adsterra.js';
import { createAdsterraFrame } from '../api/adsterra-frame.js';
import { ADSTERRA_FRAME_HOST, adsterraPlacements } from '../src/config/adsterra.js';
import { adsterraUi } from '../src/locales/adsterraUi.js';
const key = 'a'.repeat(32);
const config = {enabled:true,key,scriptUrl:'https://bauval.org/22/'+key,width:300,height:250};
test('only approved banner dimensions and HTTPS script hosts are accepted', () => {
  assert.equal(validAdsterra(config),true);
  for (const bad of [{enabled:false},{key:''},{height:50},{width:320},{scriptUrl:'javascript:alert(1)'},{scriptUrl:'https://ads-fixture.invalid/other/invoke.js'},{scriptUrl:config.scriptUrl+'?x=1'},{scriptUrl:config.scriptUrl+'#x'},{scriptUrl:config.scriptUrl.replace('https://','http://')},{scriptUrl:config.scriptUrl.replace('https://','https://user:pass@')},{scriptUrl:config.scriptUrl.replace('bauval.org/','bauval.org:9000/')}]) assert.equal(validAdsterra({...config,...bad}),false);
});
test('ads are limited to production approved pages', () => {
  assert.equal(adsterraHost({protocol:'https:',hostname:'smartjsabridge.com'},'Browser'),true);
  for (const hostname of ['localhost','127.0.0.1','branch.vercel.app','smartjsabridge.com.attacker.test']) assert.equal(adsterraHost({protocol:'https:',hostname},'Browser'),false);
  assert.equal(adsterraHost({protocol:'http:',hostname:'smartjsabridge.com'},'Browser'),false);
  for(const ua of ['ReactSnap','Googlebot','HeadlessChrome']) assert.equal(adsterraHost({protocol:'https:',hostname:'smartjsabridge.com'},ua),false);
  for(const path of ['/ko','/ja-JP','/fr-CA-QC/','/en-US/case-study/jsa-crane'])assert.equal(adsterraPath(path),true);
  for(const path of ['/ko/templates','/ko/login','/ko/export','/ko/admin/upload','/ko/privacy','/ko/reset-password','/ko/business','/ko/case-study/','/xx/case-study/demo','/ko/case-study/demo/more'])assert.equal(adsterraPath(path),false);
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
  assert.ok(ADSTERRA_FRAME_CSP.includes('allow-same-origin'));
  assert.ok(ADSTERRA_FRAME_CSP.includes('frame-ancestors https://smartjsabridge.com'));
  assert.ok(!ADSTERRA_FRAME_CSP.includes('allow-top-navigation'));
});
test('server returns no ads to direct navigation, preview hosts or cross-site embeds', () => {
  const handler=createAdsterraFrame({mobile:config});
  const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=v;}});
  const headers={host:ADSTERRA_FRAME_HOST,referer:'https://smartjsabridge.com/','sec-fetch-dest':'iframe'};
  let res=response();handler({method:'GET',url:'/api/adsterra-frame?placement=mobile',headers},res);
  assert.equal(res.statusCode,200);assert.ok(res.body.includes(config.key));
  assert.equal(res.headers['Content-Security-Policy'],ADSTERRA_FRAME_CSP);
  assert.equal(res.headers['Cache-Control'],'private, no-store');
  for(const change of [{host:'preview.vercel.app'},{referer:'https://attacker.test/'},{referer:undefined},{'sec-fetch-dest':'document'}]){
    res=response();handler({method:'GET',url:'/api/adsterra-frame?placement=mobile',headers:{...headers,...change}},res);assert.equal(res.statusCode,404);assert.equal(res.body,undefined);
  }
  res=response();handler({method:'POST',headers},res);assert.equal(res.statusCode,405);
  res=response();handler({method:'HEAD',url:'/api/adsterra-frame?placement=mobile',headers},res);assert.equal(res.statusCode,200);assert.equal(res.body,'');
  res=response();createAdsterraFrame({mobile:{...config,enabled:false}})({method:'GET',url:'/api/adsterra-frame?placement=mobile',headers},res);assert.equal(res.statusCode,404);
});
test('all supported language families have advertising choices', () => {
  for(const locale of ['ko','ja-JP','en-US','en-CA','en-CA-AB','en-CA-ON','en-CA-BC','en-AU','en-GB','en-SG','fr-CA-QC','fr-FR','de-DE','es-ES','it-IT','pt-BR','ru-RU','ro-RO','ar-SA']) {
    for(const value of Object.values(adsterraUi(locale)))assert.ok(typeof value==='string'&&value.length>0);
  }
});

test('left right bottom and mobile have distinct approved placement keys',()=>{
 assert.equal(new Set(Object.values(adsterraPlacements).map(p=>p.key)).size,4);
 for(const config of Object.values(adsterraPlacements)){assert.ok(validAdsterra(config));assert.ok(adsterraFrameHtml(config).includes('"width":'+config.width));}
});
test('the application origin never executes the advertisement endpoint',()=>{
 const res={headers:{},setHeader(k,v){this.headers[k]=v},end(v){this.body=v}};
 createAdsterraFrame()({method:'GET',url:'/api/adsterra-frame?placement=left',headers:{host:'smartjsabridge.com',referer:'https://smartjsabridge.com/','sec-fetch-dest':'iframe'}},res);
 assert.equal(res.statusCode,404);
});

test('automatic ads use reviewed notice/opt-out regions, not interface language', () => {
  for (const country of ['KR','JP','US','AU']) assert.equal(adsterraPolicy({'x-vercel-ip-country':country},true).requiresConsent,false);
  for (const country of ['GB','DE','FR','IT','ES','RO','CH','NO','SG','CA','BR','RU','SA',undefined,'','kr','KR,DE']) assert.equal(adsterraPolicy({'x-vercel-ip-country':country},true).requiresConsent,true);
  assert.equal(adsterraPolicy({'x-vercel-ip-country':'KR'},false).requiresConsent,true);
  assert.equal(adsterraPolicy({'sec-gpc':'1'},true).blocked,true);
  assert.equal(adsterraPolicy({dnt:'1'},true).blocked,true);
});
test('explicit denial and browser privacy signals take precedence over automatic advertising', () => {
  const automatic={requiresConsent:false}, strict={requiresConsent:true};
  assert.equal(adsterraCanLoad(null,automatic),true);
  assert.equal(adsterraCanLoad(null,strict),false);
  assert.equal(adsterraCanLoad({choice:'allowed'},strict),true);
  for (const policy of [automatic,strict]) {
    assert.equal(adsterraCanLoad({choice:'denied'},policy),false);
    assert.equal(adsterraCanLoad({choice:'allowed'},policy,{globalPrivacyControl:true}),false);
    assert.equal(adsterraCanLoad(null,policy,{doNotTrack:'1'}),false);
    assert.equal(adsterraCanLoad({choice:'allowed'},{...policy,blocked:true}),false);
  }
  assert.equal(adsterraCanLoad({choice:'allowed'},null),false);
});
test('policy lookup is shared, sends no cookies and fails closed', async () => {
  let calls=0;
  const load=createAdsterraPolicyLoader(async (url,options) => {
    calls++; assert.equal(url,'/api/adsterra-policy'); assert.equal(options.cache,'no-store'); assert.equal(options.credentials,'omit');
    return {ok:true,json:async()=>({requiresConsent:false,blocked:false})};
  });
  assert.deepEqual(await Promise.all([load(),load()]),[{requiresConsent:false,blocked:false},{requiresConsent:false,blocked:false}]);
  assert.equal(calls,1);
  for(const fetcher of [()=>{throw Error('offline');},async()=>({ok:false}),async()=>({ok:true,json:async()=>({})})]) {
    assert.equal((await createAdsterraPolicyLoader(fetcher)()).requiresConsent,true);
  }
});
test('regional advertising response is uncached and contains no IP or user identifier', () => {
  const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=v;}});
  const res=response();
  adsterraPolicyHandler({method:'GET',headers:{}},res);
  assert.deepEqual(JSON.parse(res.body),{requiresConsent:true,blocked:false});
  assert.equal(res.headers['Cache-Control'],'private, no-store');
  assert.equal(res.headers['Vercel-CDN-Cache-Control'],'no-store');
  const rejected=response();adsterraPolicyHandler({method:'POST',headers:{}},rejected);
  assert.equal(rejected.statusCode,405);
});

test('Canadian opt-out regions exclude Quebec and unknown subdivisions', () => {
  for(const region of ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','SK','YT']) {
    assert.equal(adsterraPolicy({'x-vercel-ip-country':'CA','x-vercel-ip-country-region':region},true).requiresConsent,false);
  }
  for(const region of ['QC',undefined,'','ca-on','ON,QC','XX']) {
    assert.equal(adsterraPolicy({'x-vercel-ip-country':'CA','x-vercel-ip-country-region':region},true).requiresConsent,true);
  }
  assert.equal(adsterraPolicy({'x-vercel-ip-country':'CA','x-vercel-ip-country-region':'ON'},false).requiresConsent,true);
  assert.equal(adsterraPolicy({'x-vercel-ip-country':'SG','x-vercel-ip-country-region':'ON'},true).requiresConsent,true);
});
test('saved advertising opt-outs do not expire into automatic tracking', () => {
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  storeAdsterraChoice(storage,false,1000);
  assert.equal(adsterraChoice(storage,1000+ADSTERRA_MAX_AGE*10).choice,'denied');
  storeAdsterraChoice(storage,true,2000);
  assert.equal(adsterraChoice(storage,2000+ADSTERRA_MAX_AGE),null);
});
