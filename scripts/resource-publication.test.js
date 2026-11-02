import test from 'node:test';
import assert from 'node:assert/strict';
import {canPublishFeed,visibleResource} from '../src/utils/resourceHub.js';
import {latestUi} from '../src/locales/latestUi.js';
import {SUPPORTED_LANGS} from '../src/locales/config.js';
const now=Date.parse('2026-11-03T12:00:00Z'),expiry='2026-12-03T00:00:00Z';
const source={active:true,commercial:true,review_until:expiry,domains:['official.example'],locales:['en-GB'],collection:{enabled:true,mode:'feed',review_until:expiry},automatic_publication:{eligible:true,enabled:true,review_until:expiry,evidence_url:'https://official.example/terms',attribution:'Official source, licensed title and link metadata.'}};
const item={state:'published',kind:'news',title:'Safety announcement fixture',url:'https://official.example/news/1',locale:'en-GB',source_date:'2026-11-03',summary:'',translated:false,review_until:expiry,evidence_url:'https://official.example/terms',collection_provenance:{mode:'feed',automatic_publication:true}};
test('automatic publication requires explicit current source rights and bounded usable metadata',()=>{
 assert.equal(canPublishFeed(item,source,now),true);
 for(const patch of [{source_date:null},{source_date:'2025-01-01'},{source_date:'2027-01-01'},{locale:'ko'},{summary:'Copied body'},{translated:true},{title:'HSE — link awaiting review'},{title:'<b>unsafe title</b>'},{url:'https://evil.example/news/1'},{collection_provenance:{mode:'feed-links'}}])assert.equal(canPublishFeed({...item,...patch},source,now),false,JSON.stringify(patch));
 assert.equal(visibleResource(item,{...source,automatic_publication:{...source.automatic_publication,enabled:false}},now),false);
 assert.equal(canPublishFeed(item,{...source,automatic_publication:{}},now),false);
 assert.equal(canPublishFeed(item,{...source,commercial:false},now),false);
 assert.equal(visibleResource({...item,state:'withdrawn'},source,now),false);
});
test('homepage and automatic-source labels exist for every supported locale',()=>{
 for(const locale of SUPPORTED_LANGS)for(const [key,value]of Object.entries(latestUi(locale)))assert.ok(typeof value==='string'&&value.length>0,locale+key);
});
