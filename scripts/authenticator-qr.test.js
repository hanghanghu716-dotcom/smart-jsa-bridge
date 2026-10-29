import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticatorQrSource } from '../src/utils/authenticatorQr.js';
import { accountSecurity } from '../src/locales/accountSecurity.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

test('raw SDK SVG URLs keep color hashes inside the image rather than URL fragments',()=>{
 const svg='<svg xmlns="http://www.w3.org/2000/svg"><path fill="#000" d="M0 0h20v20H0z"/></svg>';
 for(const input of [svg,'data:image/svg+xml;utf-8,'+svg]){
  const output=authenticatorQrSource(input);
  assert.equal(new URL(output).hash,'');
  assert.equal(decodeURIComponent(output.slice(output.indexOf(',')+1)),svg);
  assert.equal(authenticatorQrSource(output),output);
 }
});
test('encoded and base64 image responses remain intact and remote QR URLs are refused',()=>{
 for(const value of ['data:image/svg+xml;base64,PHN2Zy8+','data:image/png;base64,AAAA'])assert.equal(authenticatorQrSource(value),value);
 for(const value of [null,undefined,'https://external.test/secret','javascript:alert(1)'])assert.equal(authenticatorQrSource(value),'');
});
test('manual setup is available in every supported locale',()=>{
 for(const locale of SUPPORTED_LANGS)for(const key of ['manualSetup','manualHelp','setupKey','keepSecret'])assert.ok(accountSecurity(locale)[key]?.trim().length>0,locale+' '+key);
});
