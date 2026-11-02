import test from 'node:test';
import assert from 'node:assert/strict';
import {JOB_SOURCES,jobSourcesFor} from '../src/data/jobSources.js';
import {SUPPORTED_LANGS} from '../src/locales/config.js';
import {jobUi,JOB_UI_KEYS} from '../src/locales/jobUi.js';
import {jobStatus,jobQuery,jobUrl} from '../src/utils/jobs.js';
import {work24Deadline,usajobsDeadline,parseWork24,parseUsajobs,collectJobs} from '../server/job-feeds.js';
import {renderJobHtml} from '../server/job-html.js';
import {createResourceHandler} from '../api/resource-hub.js';
const now=Date.parse('2026-11-03T09:00:00Z');
test('all 19 locales have government candidates and complete translated job UI',()=>{
 assert.equal(new Set(JOB_SOURCES.map(s=>s.id)).size,JOB_SOURCES.length);
 for(const l of SUPPORTED_LANGS){assert.ok(jobSourcesFor(l).length,l);for(const k of JOB_UI_KEYS)assert.ok(jobUi(l)[k],l+k);}
 assert.deepEqual(jobSourcesFor('en-SG').map(s=>s.id),['mycareersfuture']);
 assert.deepEqual(jobSourcesFor('fr-CA-QC').map(s=>s.id),['jobbank']);
});
test('deadline boundary, stale data, withdrawal and confirmed closure are separate',()=>{
 const fresh={verified_at:new Date(now).toISOString()};
 assert.equal(jobStatus(fresh,now),'open');
 assert.equal(jobStatus({...fresh,closes_at:new Date(now).toISOString()},now),'closed');
 assert.equal(jobStatus({...fresh,verified_at:new Date(now-48*3600000).toISOString()},now),'unconfirmed');
 assert.equal(jobStatus({...fresh,closes_at:new Date(now-1000).toISOString(),withdrawn_at:'2026-01-01'},now),'withdrawn');
 assert.equal(jobStatus({...fresh,closed_at:'2026-01-01'},now),'closed');
 assert.equal(jobStatus({},now),'unconfirmed');
});
test('Korean dates close at next midnight KST; no invented deadline for until-filled jobs',()=>{
 assert.equal(work24Deadline('26.11.03'),'2026-11-03T15:00:00.000Z');
 assert.equal(work24Deadline('2028-02-29'),'2028-02-29T15:00:00.000Z');
 assert.equal(work24Deadline('채용시까지'),null);
 assert.throws(()=>work24Deadline('2026-02-30'),/invalid_data/);
});
test('USAJOBS closing date follows Eastern time including daylight saving boundaries',()=>{
 assert.equal(usajobsDeadline('2026-07-01T00:00:00Z'),'2026-07-02T04:00:00.000Z');
 assert.equal(usajobsDeadline('2026-11-03'),'2026-11-04T05:00:00.000Z');
 assert.equal(usajobsDeadline('2026-03-07'),'2026-03-08T05:00:00.000Z');
 assert.equal(usajobsDeadline('2026-03-08'),'2026-03-09T04:00:00.000Z');
 assert.equal(usajobsDeadline('2026-11-03T17:00:00-05:00'),'2026-11-03T22:00:00.000Z');
 assert.equal(usajobsDeadline('2026-11-03T17:00:00'),null);
});
const xml='<wantedRoot><total>1</total><wanted><wantedAuthNo>K123</wantedAuthNo><title>건설 안전관리자</title><company>시험 기업</company><region>전북</region><infoSvc>VALIDATION</infoSvc><closeDt>26.11.03</closeDt><contact>PRIVATE</contact><description>DO NOT COPY</description></wanted></wantedRoot>';
test('official adapters retain minimal job fields and reject unsafe/malformed sources',()=>{
 const rows=parseWork24(xml);assert.equal(rows.length,1);assert.ok(rows[0].url.startsWith('https://www.work24.go.kr/'));assert.ok(!JSON.stringify(rows).includes('PRIVATE'));assert.ok(!JSON.stringify(rows).includes('DO NOT COPY'));
 assert.throws(()=>parseWork24('<error>bad key</error>'),/source_error/);
 assert.throws(()=>parseWork24('<!DOCTYPE x>'+xml),/invalid_data/);
 assert.deepEqual(parseWork24(xml.replace('건설 안전관리자','일반 사무원')),[]);
 const data={SearchResult:{SearchResultItems:[{MatchedObjectId:'123',MatchedObjectDescriptor:{PositionTitle:'Safety Officer',PositionURI:'https://www.usajobs.gov/job/123',ApplicationCloseDate:'2026-11-03',OrganizationName:'Agency',PositionLocationDisplay:'Washington',UserArea:{private:'DO NOT COPY'}}}]}};
 assert.equal(parseUsajobs(data)[0].closes_at,'2026-11-04T05:00:00.000Z');
 data.SearchResult.SearchResultItems[0].MatchedObjectDescriptor.PositionURI='https://www.usajobs.gov.evil.test/job/123';assert.deepEqual(parseUsajobs(data),[]);
});
test('collector needs explicit credentials, requests fixed hosts and deduplicates without detail crawling',async()=>{
 let calls=0;
 await assert.rejects(collectJobs({id:'work24',adapter:'work24'},()=>'',()=>{calls++;}),/missing_credentials/);assert.equal(calls,0);
 const result=await collectJobs({id:'work24',adapter:'work24'},()=> 'fixture-secret',async(url,options)=>{calls++;assert.equal(url.host,'www.work24.go.kr');assert.equal(options.redirect,'error');return new Response(xml);});
 assert.equal(calls,2);assert.equal(result.length,1);assert.ok(!JSON.stringify(result).includes('fixture-secret'));
 await assert.rejects(collectJobs({id:'unreviewed',adapter:'work24'},()=> 'x'),/source_error/);
});
test('job query bounds and official links exclude hostile schemes and hosts',()=>{
 assert.equal(jobQuery('?status=withdrawn&page=-9').status,'open');assert.equal(jobQuery('?page=999999').page,5000);
 for(const url of ['javascript:alert(1)','https://www.usajobs.gov@evil.test/','https://www.usajobs.gov:443/x'])assert.equal(jobUrl(url,['www.usajobs.gov']),null);
});

test('USAJOBS bounded summary requests accept official default-port links, not lookalikes',async()=>{
 const descriptor={PositionTitle:'SAFETY AND OCCUPATIONAL HEALTH SPECIALIST',PositionURI:'https://www.usajobs.gov:443/job/123',ApplicationCloseDate:'2026-12-01T00:00:00Z',OrganizationName:'Agency'};
 const data={SearchResult:{SearchResultItems:[{MatchedObjectId:'123',MatchedObjectDescriptor:descriptor}]}};
 let calls=0;
 const rows=await collectJobs({id:'usajobs',adapter:'usajobs'},()=> 'fixture-only',async(url,options)=>{
  calls++;assert.equal(url.origin,'https://data.usajobs.gov');assert.equal(url.searchParams.get('Fields'),'Min');assert.equal(url.searchParams.get('ResultsPerPage'),'50');assert.ok(url.searchParams.has('PositionTitle'));assert.equal(options.redirect,'error');return Response.json(data);
 });
 assert.equal(calls,2);assert.equal(rows.length,1);assert.equal(rows[0].url,'https://www.usajobs.gov/job/123');assert.equal(rows[0].closes_at,'2026-12-02T05:00:00.000Z');
 for(const url of ['https://www.usajobs.gov:444/job/123','https://www.usajobs.gov:443@evil.test/job/123','https://www.usajobs.gov.evil.test:443/job/123']){
  descriptor.PositionURI=url;assert.deepEqual(parseUsajobs(data),[]);
 }
});
test('job SSR has readable content, escapes text, no JobPosting markup and country-scoped request',async()=>{
 const fixture={items:[{title:'<script>bad</script>',url:'https://www.usajobs.gov/job/1',status:'closed',employer:'Government',source:'USAJOBS'}],sources:[],has_more:false};
 const shell='<html lang="en"><head></head><body><div id="root"></div></body></html>';
 const html=renderJobHtml(shell,'en-US',jobQuery('?status=closed'),fixture);
 assert.ok(html.includes('Government'));assert.ok(!html.includes('<script>bad</script>'));assert.ok(html.includes('noindex,follow'));assert.ok(!html.includes('"@type":"JobPosting"'));
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=v;}};
 await createResourceHandler({readShell:async()=>shell,fetcher:async(url,options)=>{assert.ok(url.endsWith('/rpc/job_catalog'));assert.equal(JSON.parse(options.body).p_locale,'fr-CA-QC');return Response.json({items:[],sources:[],has_more:false});}})({method:'GET',query:{lng:'fr-CA-QC',mode:'jobs'},headers:{}},res);
 assert.equal(res.statusCode,200);assert.ok(res.body.includes('Emplois'));
 await createResourceHandler({readShell:async()=>shell,fetcher:async()=>new Response('',{status:500})})({method:'GET',query:{lng:'ko',mode:'jobs'},headers:{}},res);assert.equal(res.statusCode,503);
});
