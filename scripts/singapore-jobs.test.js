import test from 'node:test';
import assert from 'node:assert/strict';
import {collectJobs,parseSingaporeUsajobs,parseUsajobs} from '../server/job-feeds.js';
import {renderJobHtml} from '../server/job-html.js';
import {jobCoverage} from '../src/data/jobAttribution.js';
import {jobQuery} from '../src/utils/jobs.js';
const descriptor={PositionTitle:'Safety and Occupational Health Specialist',PositionURI:'https://www.usajobs.gov:443/job/123',OrganizationName:'Department of the Navy',PositionLocationDisplay:'Multiple locations',PositionLocation:[{CountryCode:'Singapore',LocationName:'Sembawang, Singapore'},{CountryCode:'United States',LocationName:'Norfolk, Virginia'}],ApplicationCloseDate:'2026-11-30T00:00:00Z',UserArea:{Details:{RemoteIndicator:false,Requirements:'PRIVATE FULL TEXT'}}};
const data=d=>({SearchResult:{SearchResultItems:[{MatchedObjectId:'123',MatchedObjectDescriptor:d}]}});

test('Singapore requires a structured local work location and keeps source deadline timezone',()=>{
 const [row]=parseSingaporeUsajobs(data(descriptor));
 assert.equal(row.locale,'en-SG');assert.equal(row.location,'Sembawang, Singapore');assert.equal(row.url,'https://www.usajobs.gov/job/123');assert.equal(row.closes_at,'2026-12-01T05:00:00.000Z');assert.match(row.deadline_text,/ET$/);
 assert.ok(!JSON.stringify(row).includes('PRIVATE'));assert.ok(!JSON.stringify(row).includes('Norfolk'));
 assert.equal(parseUsajobs(data(descriptor))[0].locale,'en-US','existing US parser is unchanged');
 assert.equal(parseSingaporeUsajobs(data({...descriptor,PositionLocation:[{CountryCode:'SG',LocationName:'Singapore'}]})).length,1);
});
test('Singapore rejects keyword matches abroad, unknown countries, remote and unrelated jobs',()=>{
 for(const d of [
  {...descriptor,PositionLocation:[{CountryCode:'United States',LocationName:'Singapore office, Virginia'}]},
  {...descriptor,PositionLocation:[{CountryCode:'MY',LocationName:'Near Singapore'}]},
  {...descriptor,UserArea:{Details:{RemoteIndicator:true}}},
  {...descriptor,UserArea:{Details:{RemoteIndicator:'True'}}},
  {...descriptor,PositionTitle:'Recreation Assistant'},
 ])assert.deepEqual(parseSingaporeUsajobs(data(d)),[]);
 for(const PositionLocation of [undefined,[],[{LocationName:'Singapore'}]])assert.throws(()=>parseSingaporeUsajobs(data({...descriptor,PositionLocation})),/invalid_data/);
 assert.throws(()=>parseSingaporeUsajobs({SearchResult:{SearchResultItems:Array(101).fill({})}}),/invalid_data/);
 assert.deepEqual(parseSingaporeUsajobs({SearchResult:{SearchResultItems:[]}}),[]);
});
test('Singapore uses one official bounded request and existing private USAJOBS credentials',async t=>{
 t.mock.method(console,'info',()=>{});let calls=0;
 const rows=await collectJobs({id:'usajobssg',adapter:'usajobssg'},name=>({USAJOBS_API_KEY:'fixture-key',USAJOBS_API_EMAIL:'fixture@example.test'})[name],async(url,options)=>{
  calls++;assert.equal(url.origin,'https://data.usajobs.gov');assert.equal(url.searchParams.get('LocationName'),'Singapore');assert.equal(url.searchParams.get('RemoteIndicator'),'False');assert.equal(url.searchParams.get('ResultsPerPage'),'100');assert.equal(url.searchParams.get('Page'),'1');assert.equal(url.searchParams.get('Fields'),'Min');assert.ok(!url.href.includes('fixture-key'));assert.equal(options.headers['Authorization-Key'],'fixture-key');assert.equal(options.redirect,'error');assert.ok(options.signal);return Response.json(data(descriptor));
 });
 assert.equal(calls,1);assert.equal(rows[0].locale,'en-SG');
 await assert.rejects(collectJobs({id:'usajobssg',adapter:'usajobssg'},()=>null,()=>{throw Error('must not fetch');}),/missing_credentials/);
 await assert.rejects(collectJobs({id:'mycareersfuture',adapter:'usajobssg'},()=> 'fixture'),/source_error/);
});
test('Singapore scope and eligibility remain readable with zero current listings',()=>{
 const empty={items:[],sources:[{id:'usajobssg',name:'USAJOBS · U.S. federal roles in Singapore',connected:true}],has_more:false};
 const shell='<html lang="en"><head></head><body><div id="root"></div></body></html>';
 const html=renderJobHtml(shell,'en-SG',jobQuery(''),empty);
 assert.ok(html.includes(jobCoverage('en-SG')));assert.match(html,/U.S. citizenship/);assert.match(html,/noindex,follow/);assert.ok(!html.includes('JobPosting'));
 assert.ok(!renderJobHtml(shell,'en-US',jobQuery(''),empty).includes('job-coverage'));
 const withItem=renderJobHtml(shell,'en-SG',jobQuery(''),{...empty,items:[{...parseSingaporeUsajobs(data(descriptor))[0],source_id:'usajobssg',source:'USAJOBS',status:'open'}]});
 assert.match(withItem,/USAJOBS public-data terms/);assert.match(withItem,/endorsed by OPM/);
});
