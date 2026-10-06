import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsHost, publicAnalyticsPath, publicAnalyticsReferrer, publicAnalyticsTitle, analyticsOptedOut, startAnalyticsFrame, CONSENT_KEY, OPT_OUT_KEY } from '../src/utils/analytics.js';
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
test('new visitors use analytics automatically; existing refusal and browser opt-out are respected', () => {
  const storage = values => ({ getItem: key => values[key] ?? null });
  assert.equal(analyticsOptedOut(storage({})), false);
  assert.equal(analyticsOptedOut(storage({[CONSENT_KEY]:JSON.stringify({choice:'granted'})})), false);
  assert.equal(analyticsOptedOut(storage({[CONSENT_KEY]:JSON.stringify({choice:'denied'})})), true);
  assert.equal(analyticsOptedOut(storage({[OPT_OUT_KEY]:'true'})), true);
  assert.equal(analyticsOptedOut(storage({[OPT_OUT_KEY]:'false',[CONSENT_KEY]:JSON.stringify({choice:'denied'})})), false);
  assert.equal(analyticsOptedOut({ getItem: () => { throw Error('blocked'); } }), true);
});
test('acquisition retains referring domains while removing search terms and private paths', () => {
  for (const host of ['search.naver.com','m.search.naver.com','www.google.com','www.google.co.kr','www.bing.com','example.org']) {
    assert.equal(publicAnalyticsReferrer(`https://${host}/search?q=PRIVATE#token`), `https://${host}/`);
  }
  for (const value of ['', null, {}, 'invalid', 'javascript:alert(1)', 'file:///secret', 'https://smartjsabridge.com/ko/info?token=PRIVATE']) assert.equal(publicAnalyticsReferrer(value), '');
  assert.equal(publicAnalyticsReferrer('https://user:password@example.org/private?q=secret'), 'https://example.org/');
  assert.equal(publicAnalyticsReferrer('https://smartjsabridge.com/ko/about?email=secret'), 'https://smartjsabridge.com/ko/about');
  assert.equal(publicAnalyticsTitle(' 위험성평가\n가이드 '), '위험성평가 가이드');
  assert.equal(publicAnalyticsTitle(null), 'Smart JSA Bridge');
  assert.equal(publicAnalyticsTitle('a'.repeat(250)).length, 200);
});
test('frame automatically loads GA with acquisition and page titles; one event per navigation', () => {
  let handler, value = null; const scripts = [], parent = {};
  const win = { parent, location: { origin:'https://smartjsabridge.com', protocol:'https:', hostname:'smartjsabridge.com', pathname:'/analytics-frame.html' }, navigator:{userAgent:'Browser'}, localStorage:{getItem: key => key === CONSENT_KEY ? value : null}, addEventListener: (_, cb) => {handler=cb;}, removeEventListener:()=>{} };
  const doc = { createElement: () => ({}), head: { appendChild: script => scripts.push(script) } };
  startAnalyticsFrame(win, doc);
  const send = (path, sequence, extra={}) => handler({source:parent,origin:win.location.origin,data:{type:'smartjsa:page-view',path,sequence,referrer:'https://search.naver.com/search.naver?query=PRIVATE',title:'공개 위험성평가 가이드'},...extra});
  send('/ko/info',2); send('/ko/explore?token=secret',3); send('/ko/',4,{origin:'https://evil.test'}); send('/ko/',5,{source:{}});
  assert.equal(scripts.length,0);
  send('/ko/',6); send('/ko/',6); send('/ko/explore',7); send('/ko/',8);
  assert.equal(scripts.length,1);
  const commands=win.dataLayer.map(args=>Array.from(args));
  assert.equal(commands.filter(c=>c[0]==='event').length,3);
  assert.equal(commands.find(c=>c[0]==='config')[2].send_page_view,false);
  assert.equal(commands.find(c=>c[0]==='config')[2].page_referrer,'https://search.naver.com/');
  assert.equal(commands.find(c=>c[0]==='event')[2].page_referrer,'https://search.naver.com/');
  assert.equal(commands.find(c=>c[0]==='event')[2].page_title,'공개 위험성평가 가이드');
  assert.equal(JSON.stringify(commands).includes('PRIVATE'),false);
  assert.equal(commands[0][2].analytics_storage,'granted');
  assert.equal(commands[0][2].ad_storage,'denied');
  assert.equal(commands.filter(c=>c[0]==='consent'&&c[1]==='update').length,0,'Do not manufacture an affirmative consent event');
  assert.equal(commands.at(-1)[2].page_referrer,'https://smartjsabridge.com/ko/explore');
  value=JSON.stringify({version:1,choice:'denied',at:Date.now()});
  send('/ko/about',9); assert.equal(win.dataLayer.length,commands.length);
});
