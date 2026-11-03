import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMhlwList,parseMhlwDetail,mhlwDeadline,MHLW_LIST} from '../server/japan-government-jobs.js';
import {collectJobs} from '../server/job-feeds.js';
import {renderJobHtml} from '../server/job-html.js';
import {jobQuery,jobStatus} from '../src/utils/jobs.js';
const url='https://www.mhlw.go.jp/stf/kouseiroudoushou/saiyou/ninkituki/safety.html';
const item=(id='safety',title='化学物質審査専門官の募集について',date='2026-11-02')=>`<li><a href="/stf/kouseiroudoushou/saiyou/ninkituki/${id}.html"><time datetime="${date}"></time><div class="m-listNews__txt">${title}</div></a></li>`;
const list=items=>`<div class="l-contentMain"><h1>新着情報一覧（採用情報）</h1><ul class="m-listNews">${items}</ul></div>`;
const detail=`<div class="l-contentMain"><h1>化学物質審査専門官の募集について</h1><h3>勤務先</h3>厚生労働省安全衛生部（所在地：東京都千代田区）<h3>雇用期間</h3>令和９年４月１日～令和12年３月31日<h3>応募期限</h3>令和８年10月８日（木）～令和８年11月27日（金）（必着）<h3>連絡先</h3>PRIVATE CONTACT<script>PRIVATE SCRIPT</script><p>PRIVATE BODY</p></div>`;
const now=new Date('2026-11-03T00:00:00Z');
test('Japan discovery limits recent relevant notices, deduplicates and rejects untrusted URLs',()=>{
 assert.deepEqual(parseMhlwList(list(item()+item()+item('old','化学物質審査専門官の募集','2025-11-02')+item('admin','経理職員の募集')),now),[url]);
 assert.equal(parseMhlwList(list(Array.from({length:8},(_,n)=>item('safety'+n)).join('')),now).length,5);
 assert.throws(()=>parseMhlwList('<h1>Access denied</h1>',now),/invalid_data/);
 assert.deepEqual(parseMhlwList(list(item('admin','看護師の募集')),now),[]);
 assert.throws(()=>parseMhlwList(list(item().replace('href="/stf','href="https://evil.example/stf')),now),/invalid_data/);
 assert.throws(()=>parseMhlwDetail(detail,url+'?url=https://evil.example'),/invalid_data/);
});
test('Japan metadata excludes body and contacts; employment end is not the deadline',()=>{
 const row=parseMhlwDetail(detail,url);assert.equal(row.locale,'ja-JP');assert.equal(row.location,'東京都千代田区');
 assert.equal(row.employer,'厚生労働省安全衛生部');assert.equal(row.deadline_text,'2026-11-27（必着）');
 assert.equal(row.closes_at,'2026-11-27T15:00:00.000Z');assert.ok(!JSON.stringify(row).includes('PRIVATE'));
 assert.equal(parseMhlwDetail(detail.replace('<h3>応募期限</h3>','<h3>採用期間</h3>'),url).closes_at,null);
 assert.equal(parseMhlwDetail(detail.replace('PRIVATE BODY','募集は終了しました'),url).source_closed,true);
 assert.throws(()=>parseMhlwDetail(detail.replace('PRIVATE BODY','転載禁止'),url),/invalid_data/);
 assert.equal(jobStatus({...row,verified_at:now.toISOString()},Date.parse(row.closes_at)),'closed');
});
test('Japanese era and width conversion, explicit clock time, ambiguity and impossible dates',()=>{
 assert.equal(mhlwDeadline('令和８年１１月３０日（月）必着で郵送して下さい。',true).closes_at,'2026-11-30T15:00:00.000Z');
 assert.equal(mhlwDeadline('2026年11月27日（金）午後5時30分まで').closes_at,'2026-11-27T08:30:00.000Z');
 assert.equal(mhlwDeadline('2026年11月1日～2026年11月30日').closes_at,'2026-11-30T15:00:00.000Z');
 assert.equal(mhlwDeadline('令和８年11月27日が面接日です。',true).closes_at,null);
 assert.equal(mhlwDeadline('郵送：令和８年11月27日必着、電子：令和８年11月30日まで').closes_at,null);
 assert.throws(()=>mhlwDeadline('令和８年2月30日'),/invalid_data/);
 assert.throws(()=>mhlwDeadline('2026年11月27日 25時'),/invalid_data/);
});
test('collector has six-request ceiling, does not use keys, RSS or attachments, fails without partial publication',async()=>{
 let calls=0;
 const rows=await collectJobs({id:'mhlwjobs',adapter:'mhlwjobs'},()=>{throw Error('no credentials');},async(input,options)=>{
  calls++;assert.equal(input.host,'www.mhlw.go.jp');assert.equal(options.redirect,'error');assert.ok(options.signal);
  return new Response(input.href===MHLW_LIST?list(Array.from({length:7},(_,n)=>item('safety'+n)).join('')):detail);
 },now);
 assert.equal(calls,6);assert.equal(rows.length,5);
 await assert.rejects(collectJobs({id:'mhlwjobs',adapter:'mhlwjobs'},()=>null,async input=>new Response(input.href===MHLW_LIST?list(item()):'Unavailable',{status:input.href===MHLW_LIST?200:503}),now),/source_error/);
 await assert.rejects(collectJobs({id:'unreviewed',adapter:'mhlwjobs'},()=>null),/source_error/);
});
test('Japanese initial HTML includes source licence and narrow coverage',()=>{
 const row=parseMhlwDetail(detail,url);
 const html=renderJobHtml('<html><head></head><body><div id="root"></div></body></html>','ja-JP',jobQuery(''),{items:[{...row,source_id:'mhlwjobs',source:'厚生労働省',status:'open'}],sources:[],has_more:false});
 assert.ok(html.includes('PDL1.0'));assert.ok(html.includes('全国の求人一覧ではありません'));assert.ok(html.includes('出典：厚生労働省'));assert.ok(!html.includes('PRIVATE'));
});
