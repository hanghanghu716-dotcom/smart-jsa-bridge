import test from 'node:test';
import assert from 'node:assert/strict';
import {collectJobs,jobSourceFailure} from '../server/job-feeds.js';

const source={id:'trudvsem',adapter:'trudvsem'};
const fixture={status:'200',meta:{total:1},results:{vacancies:[{vacancy:{id:'a1','job-name':'Специалист по охране труда',vac_url:'https://trudvsem.ru/vacancy/card/1/a1',company:{name:'Employer'},region:{name:'Москва'}}}]}};
const noCredentials=()=>{throw Error('must not access credentials');};

test('Russia recovers one timeout with a longer, bounded attempt including response body',async t=>{
  const timeout=AbortSignal.timeout.bind(AbortSignal),budgets=[],logs=[];
  t.mock.method(AbortSignal,'timeout',ms=>{budgets.push(ms);return timeout(ms);});
  t.mock.method(console,'warn',value=>logs.push(JSON.parse(value)));
  let calls=0;
  const rows=await collectJobs(source,noCredentials,async(url,options)=>{
    calls++;assert.equal(url.origin,'https://opendata.trudvsem.ru');assert.equal(options.redirect,'error');assert.ok(options.signal);
    if(calls===1)return new Response(new ReadableStream({start(controller){controller.error(new DOMException('PRIVATE https://example.test/?key=secret','TimeoutError'));}}));
    return Response.json(fixture);
  });
  assert.equal(calls,3);assert.equal(rows.length,1);assert.deepEqual(budgets,[18000,18000,18000]);
  assert.deepEqual(logs,[{event:'job_source_retry',source:'trudvsem',reason:'upstream_timeout',attempt:2}]);
});

test('two queries stay sequential and each permits only one transient retry',async t=>{
  t.mock.method(console,'warn',()=>{});
  const queries=[];
  const rows=await collectJobs(source,noCredentials,async url=>{
    queries.push(url.searchParams.get('text'));
    return queries.length%2?new Response('',{status:503,headers:{'Retry-After':'0'}}):Response.json(fixture);
  });
  assert.equal(rows.length,1);assert.deepEqual(queries,['охране труда','охране труда','промышленной безопасности','промышленной безопасности']);
});

test('persistent provider failure stops after two requests with a safe reason',async t=>{
  t.mock.method(console,'warn',()=>{});let calls=0;
  await assert.rejects(collectJobs(source,noCredentials,async()=>{calls++;return new Response('PRIVATE upstream details',{status:503,headers:{'Retry-After':'0'}});}),error=>jobSourceFailure(error)==='upstream_http_503');
  assert.equal(calls,2);
});

test('no retries for denied access, bad data, oversized bodies or long rate-limit cooldowns',async()=>{
  const responses=[
    ()=>new Response('',{status:403}),
    ()=>new Response('',{status:401}),
    ()=>new Response('',{status:404}),
    ()=>new Response('invalid JSON'),
    ()=>Response.json({unexpected:'schema'}),
    ()=>new Response('x'.repeat(2*1024*1024+1)),
    ()=>new Response('',{status:429,headers:{'Retry-After':'60'}}),
    ()=>new Response('',{status:503,headers:{'Retry-After':new Date(Date.now()+60000).toUTCString()}}),
  ];
  for(const response of responses){
    let calls=0;await assert.rejects(collectJobs(source,noCredentials,async()=>{calls++;return response();}));assert.equal(calls,1);
  }
});

test('a failing second query rejects the entire source instead of committing a partial sample',async()=>{
  let calls=0;
  await assert.rejects(collectJobs(source,noCredentials,async()=>++calls===1?Response.json(fixture):new Response('',{status:403})),error=>jobSourceFailure(error)==='upstream_http_403');
  assert.equal(calls,2);
});

test('diagnostics never include raw error messages, URLs or unknown reason fields',()=>{
  const secret='https://example.test/?key=PRIVATE';
  assert.equal(jobSourceFailure(Error(secret)),'source_error');
  assert.equal(jobSourceFailure(Object.assign(Error(secret),{sourceReason:secret})),'source_error');
  assert.equal(jobSourceFailure(new TypeError(secret)),'upstream_network');
  assert.equal(jobSourceFailure(new SyntaxError(secret)),'invalid_json');
  assert.equal(jobSourceFailure(new DOMException(secret,'AbortError')),'upstream_timeout');
  assert.equal(jobSourceFailure(Error('invalid_data')),'invalid_data');
});
