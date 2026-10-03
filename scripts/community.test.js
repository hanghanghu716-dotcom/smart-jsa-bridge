import test from 'node:test';
import assert from 'node:assert/strict';
import {adEligible} from '../src/utils/adEligibility.js';
import {operations} from '../src/config/operations.js';
import fs from 'node:fs';
import {getCommunityPolicy} from '../src/locales/communityPolicy.js';
import {getCommunityUi} from '../src/locales/communityUi.js';
import {SUPPORTED_LANGS} from '../src/locales/config.js';
import {publicForkState,publicJsaQuality} from '../src/utils/publicJsa.js';
test('ads fail closed without all regional and consent gates, including expiry and route',()=>{
 const cfg={adsEnabled:true,contactsVerified:true,regionalReviewComplete:true,certifiedCmpConfigured:true,approvedRegions:['KR'],approvedCmpIds:[10]};
 const c={region:'KR',cmpId:10,verified:true,ads:true,expiresAt:2000};
 assert.equal(adEligible(cfg,c,'/ko/public-jsa/10000000-0000-4000-8000-000000000001',1000,{indexable:true,review:'approved'}),true);
 assert.equal(adEligible(operations,c,'/ko/public-jsa/10000000-0000-4000-8000-000000000001',1000,{indexable:true,review:'approved'}),false);
 for(const key of ['adsEnabled','contactsVerified','regionalReviewComplete','certifiedCmpConfigured'])assert.equal(adEligible({...cfg,[key]:false},c,'/ko/public-jsa/10000000-0000-4000-8000-000000000001',1000,{indexable:true,review:'approved'}),false);
 for(const change of [{ads:false},{verified:false},{region:'unknown'},{cmpId:999},{expiresAt:1000}])assert.equal(adEligible(cfg,{...c,...change},'/ko/public-jsa/10000000-0000-4000-8000-000000000001',1000,{indexable:true,review:'approved'}),false);
 for(const path of ['/ko/info','/ko/export','/ko/community','/ko/business','/ko/login','/ko/explore-admin'])assert.equal(adEligible(cfg,c,path,1000,{indexable:true,review:'approved'}),false);
});
test('legacy publications cannot silently gain a reuse license; test titles are noindex',()=>{
 assert.throws(()=>publicForkState({is_public:true,analysis_data:[]}),/CONSENT_REQUIRED/);
 assert.equal(publicJsaQuality({is_public:true,public_locale:'ko',title:'TEST_D3_document'}).indexable,false);
});
test('community labels exist across every supported locale',()=>{
 const keys=Object.keys(getCommunityUi('en-US'));
 for(const locale of SUPPORTED_LANGS)for(const key of keys)assert.equal(typeof getCommunityUi(locale)[key],'string',locale+':'+key);
 for(const locale of SUPPORTED_LANGS)for(const value of Object.values(getCommunityPolicy(locale)))assert.ok(typeof value==='string'&&value.length>0);
});
test('the HTML shell never loads advertising or analytics before consent',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/adsbygoogle|googletagmanager|gtag\(/);
});
