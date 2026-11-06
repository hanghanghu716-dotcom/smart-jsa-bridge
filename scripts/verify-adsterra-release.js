import assert from 'node:assert/strict';
import { adsterra } from '../src/config/adsterra.js';
import { ADSTERRA_FRAME_CSP, validAdsterra } from '../src/utils/adsterra.js';
// Fetch only first-party HTML/headers. Never execute a third-party ad script.
const url='https://smartjsabridge.com/api/adsterra-frame';
const response=await fetch(url,{headers:{referer:'https://smartjsabridge.com/','sec-fetch-dest':'iframe'},redirect:'error',signal:AbortSignal.timeout(15000)});
if(validAdsterra(adsterra)){
  assert.equal(response.status,200,'Approved advertising frame must be served');
  assert.equal(response.headers.get('content-security-policy'),ADSTERRA_FRAME_CSP,'Advertising frame must retain its opaque sandbox and its own CSP');
  assert.match(response.headers.get('x-robots-tag')||'',/noindex/);
  assert.match(response.headers.get('cache-control')||'',/no-store/);
  const html=await response.text();assert.ok(html.includes(adsterra.scriptUrl));assert.ok(html.includes(adsterra.key));
}else{assert.equal(response.status,404);}
const standalone=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});
assert.equal(standalone.status,404,'Standalone ad requests must stay disabled');
console.log('PASS: deployed ad frame, isolated CSP, uncached response, noindex and standalone rejection; no third-party ad request.');
