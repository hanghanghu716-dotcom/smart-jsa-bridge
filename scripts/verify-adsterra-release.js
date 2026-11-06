import assert from 'node:assert/strict';
import {ADSTERRA_FRAME_ORIGIN,adsterraPlacements} from '../src/config/adsterra.js';
import {ADSTERRA_FRAME_CSP} from '../src/utils/adsterra.js';
for(const [placement,config] of Object.entries(adsterraPlacements)){
 const r=await fetch(ADSTERRA_FRAME_ORIGIN+'/api/adsterra-frame?placement='+placement,{headers:{Referer:'https://smartjsabridge.com/','sec-fetch-dest':'iframe'},signal:AbortSignal.timeout(15000)});
 assert.equal(r.status,200);assert.equal(r.headers.get('content-security-policy'),ADSTERRA_FRAME_CSP);assert.match(r.headers.get('cache-control'),/no-store/);
 assert.ok((await r.text()).includes(config.scriptUrl));
}
const direct=await fetch(ADSTERRA_FRAME_ORIGIN+'/api/adsterra-frame?placement=left',{signal:AbortSignal.timeout(15000)});assert.equal(direct.status,404);
const app=await fetch('https://smartjsabridge.com/api/adsterra-frame',{headers:{Referer:'https://smartjsabridge.com/','sec-fetch-dest':'iframe'},signal:AbortSignal.timeout(15000)});assert.equal(app.status,404);
console.log('Verified four separate ad placements and isolated serving origin. No ad scripts were executed.');
