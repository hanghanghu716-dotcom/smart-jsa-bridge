import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsHost, publicAnalyticsPath, readConsent, startAnalyticsFrame, CONSENT_KEY, CONSENT_AGE } from '../src/utils/analytics.js';
import { getAnalyticsText } from '../src/locales/analyticsText.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { getCommunityPolicy } from '../src/locales/communityPolicy.js';

test('analytics is restricted to public canonical paths and production hosts', () => {
  for (const locale of SUPPORTED_LANGS) {
    assert.ok(publicAnalyticsPath(`/${locale}/`));
    assert.ok(publicAnalyticsPath(`/${locale}/guideline/construction`));
    for (const route of ['info', 'analysis', 'export', 'library', 'business', 'login', 'reset-password', 'profile', 'community', 'work-packages', 'document-designer', 'admin/upload', 'authors/secret', 'following', 'unknown']) assert.equal(publicAnalyticsPath(`/${locale}/${route}`), null);
    for (const suffix of ['?email=private', '#access_token=secret', '/../../info', '%3Fsecret']) assert.equal(publicAnalyticsPath(`/${locale}/explore${suffix}`), null);
    assert.ok(Object.values(getAnalyticsText(locale)).every(t => t.length > 0));
    assert.ok(getCommunityPolicy(locale).measurement.startsWith(getAnalyticsText(locale).body));
  }
  for (const hostname of ['localhost', '127.0.0.1', 'preview.vercel.app', 'smartjsabridge.com.evil.test']) assert.equal(analyticsHost({ protocol: 'https:', hostname }), false);
  assert.equal(analyticsHost({ protocol: 'https:', hostname: 'smartjsabridge.com' }), true);
  assert.equal(analyticsHost({ protocol: 'https:', hostname: 'smartjsabridge.com' }, 'ReactSnap'), false);
});
test('consent expires, rejects corrupt/future versions and storage failure', () => {
  const now = Date.now();
  const storage = value => ({ getItem: () => JSON.stringify(value) });
  for (const choice of ['granted', 'denied']) assert.equal(readConsent(storage({ version: 1, choice, at: now }), now), choice);
  for (const value of [null, {}, {version:2,choice:'granted',at:now}, {version:1,choice:'granted',at:now+1}, {version:1,choice:'granted',at:now-CONSENT_AGE}]) assert.equal(readConsent(storage(value), now), null);
  assert.equal(readConsent({ getItem: () => { throw Error('blocked'); } }), null);
});
test('frame loads GA only after consent and validated parent messages; one event per navigation', () => {
  let handler, value = null; const scripts = [], parent = {};
  const win = { parent, location: { origin:'https://smartjsabridge.com', protocol:'https:', hostname:'smartjsabridge.com', pathname:'/analytics-frame.html' }, navigator:{userAgent:'Browser'}, localStorage:{getItem: key => key === CONSENT_KEY ? value : null}, addEventListener: (_, cb) => {handler=cb;}, removeEventListener:()=>{} };
  const doc = { createElement: () => ({}), head: { appendChild: script => scripts.push(script) } };
  startAnalyticsFrame(win, doc);
  const send = (path, sequence, extra={}) => handler({source:parent,origin:win.location.origin,data:{type:'smartjsa:page-view',path,sequence},...extra});
  send('/ko/', 1); assert.equal(scripts.length,0);
  value = JSON.stringify({version:1,choice:'granted',at:Date.now()});
  send('/ko/info',2); send('/ko/explore?token=secret',3); send('/ko/',4,{origin:'https://evil.test'}); send('/ko/',5,{source:{}});
  assert.equal(scripts.length,0);
  send('/ko/',6); send('/ko/',6); send('/ko/explore',7); send('/ko/',8);
  assert.equal(scripts.length,1);
  const commands=win.dataLayer.map(args=>Array.from(args));
  assert.equal(commands.filter(c=>c[0]==='event').length,3);
  assert.equal(commands.find(c=>c[0]==='config')[2].send_page_view,false);
  assert.equal(commands[0][2].analytics_storage,'denied');
  assert.equal(commands[1][2].ad_storage,'denied');
  assert.equal(commands[1][2].analytics_storage,'granted');
  assert.equal(commands.at(-1)[2].page_referrer,'https://smartjsabridge.com/ko/explore');
  value=JSON.stringify({version:1,choice:'denied',at:Date.now()});
  send('/ko/about',9); assert.equal(win.dataLayer.length,commands.length);
});
