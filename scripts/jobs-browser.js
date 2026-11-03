import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {mkdirSync} from 'node:fs';
import {SUPPORTED_LANGS} from '../src/locales/config.js';
import {JOB_SOURCES,jobSourcesFor} from '../src/data/jobSources.js';
import {jobUi} from '../src/locales/jobUi.js';
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});
await server.listen();const base='http://127.0.0.1:'+server.httpServer.address().port;let browser;
try{
 browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage(),errors=[],calls=[];let admin=false;
 page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
 page.on('request',r=>{
  const url=new URL(r.url());if(url.origin===base||url.protocol==='data:')return r.continue();
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'};
  if(r.method()==='OPTIONS')return r.respond({status:204,headers});
  let body=[];
  if(url.pathname.endsWith('/rpc/job_catalog')){
   const args=JSON.parse(r.postData()),now=Date.now();calls.push(args);
   body={items:[{id:'fixture-'+args.p_page,title:'Safety & field job fixture · '+args.p_locale,locale:args.p_locale,source_id:({'en-AU':'qldsmartjobs','es-ES':'jcyljobs','ru-RU':'trudvsem'})[args.p_locale],source:'Government fixture',url:'https://www.usajobs.gov/job/fixture',employer:'Government employer',location:'Local work location',deadline_text:'2026-12-31',verified_at:new Date(now-(args.p_status==='unconfirmed'?49:0)*3600000).toISOString(),closes_at:args.p_status==='closed'?new Date(now-1000).toISOString():null}],sources:jobSourcesFor(args.p_locale),has_more:args.p_page===0};
  }
  if(url.pathname.endsWith('/rpc/resource_home')){const a=JSON.parse(r.postData());calls.push(a);body={news:Array.from({length:4},(_,n)=>({id:'news-'+n,title:'Safety update '+n,url:'https://www.hse.gov.uk/',source:'Official fixture',policy_url:'https://www.hse.gov.uk/help/copyright.htm',locale:a.p_locale,source_date:'2026-11-03',automatic:true})),jobs:Array.from({length:4},(_,n)=>({id:'job-'+n,title:'Safety vacancy '+n,url:'https://www.usajobs.gov/',source_id:({'en-AU':'qldsmartjobs','es-ES':'jcyljobs','ru-RU':'trudvsem'})[a.p_locale],employer:'Employer fixture',location:'Local region',verified_at:new Date().toISOString()})),jobs_connected:true};}
  if(url.pathname.endsWith('/rpc/community_workflow'))body={admin};
  if(url.pathname.endsWith('/rpc/job_catalog_admin')){const args=JSON.parse(r.postData());calls.push(args);body={sources:JOB_SOURCES.map(s=>({...s,policy_url:s.policy,enabled:false})),items:[],has_more:false};}
  r.respond({status:200,contentType:'application/json',headers,body:JSON.stringify(body)});
 });
 for(const locale of (process.env.JOBS_QA_LOCALE ? [process.env.JOBS_QA_LOCALE] : SUPPORTED_LANGS)){
  await page.setViewport({width:390,height:844});await page.goto(base+'/'+locale+'/jobs',{waitUntil:'networkidle0'});
  try{await page.waitForSelector('.resource-cards article',{timeout:12000,visible:true});}catch(error){throw Error(JSON.stringify({locale,errors,calls:calls.slice(-2),body:await page.$eval('body',e=>e.innerText.slice(0,1000))})+' '+error.message);}
  assert.equal(await page.$eval('h1',e=>e.textContent),jobUi(locale).title);
  if(['en-AU','es-ES','ru-RU'].includes(locale))assert.ok(await page.$('.job-attribution a'),'required attribution '+locale);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+locale);
  assert.equal(calls.filter(c=>c.p_locale).at(-1).p_locale,locale);
 }
 await page.goto(base+'/ko/jobs',{waitUntil:'networkidle0'});
 await page.$$eval('.resource-tabs button',buttons=>buttons.find(b=>b.textContent==='마감된 공고').click());
 await page.waitForFunction(()=>document.querySelector('.resource-meta')?.textContent.startsWith('마감된 공고'));
 await page.$$eval('.resource-pages a',links=>links.find(a=>a.textContent==='다음').click());
 await page.waitForFunction(()=>document.querySelector('.resource-pages span')?.textContent==='2').catch(async e=>{console.log('Pagination debug',await page.url(),await page.$eval('body',e=>e.innerText.slice(-2500)),errors);throw e;});
 assert.ok(calls.some(c=>c.p_status==='closed'&&c.p_page===1));
 await page.type('main .resource-search input[name=q]','safety');
 await page.click('main .resource-search button');
 await page.waitForFunction(()=>document.querySelector('.resource-pages span')?.textContent==='1');
 await page.waitForNetworkIdle();assert.ok(calls.some(c=>c.p_query==='safety'&&c.p_page===0));
 mkdirSync('.cache/jobs-qa',{recursive:true});await page.screenshot({path:'.cache/jobs-qa/mobile.png',fullPage:true});
 await page.setViewport({width:1366,height:900});await page.screenshot({path:'.cache/jobs-qa/desktop.png',fullPage:true});
 for(const locale of ['ko','en-US','en-GB','fr-CA-QC','ar-SA']){await page.goto(base+'/'+locale+'/',{waitUntil:'networkidle0'});await page.waitForSelector('[data-home-latest] li',{visible:true});assert.equal((await page.$$('[data-home-latest] li')).length,8);assert.equal((await page.$$('[data-home-latest] .resource-policy[href="https://www.hse.gov.uk/help/copyright.htm"]')).length,4);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'homepage overflow '+locale);assert.equal(calls.filter(c=>c.p_locale).at(-1).p_locale,locale);}
 await page.setViewport({width:390,height:844});await page.goto(base+'/ko/',{waitUntil:'networkidle0'});await page.waitForSelector('[data-home-latest] li',{visible:true});await page.screenshot({path:'.cache/jobs-qa/home-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile homepage overflow');
 await page.setViewport({width:1366,height:900});await page.screenshot({path:'.cache/jobs-qa/home-desktop.png',fullPage:true});
 admin=true;await page.goto(base+'/ko/admin/jobs',{waitUntil:'networkidle0'});await page.waitForSelector('.resource-admin-panel details');
 assert.equal((await page.$$('.resource-admin-panel details')).length,JOB_SOURCES.length);
 assert.deepEqual(JOB_SOURCES.filter(s=>s.adapter).map(s=>s.id).sort(),['jcyljobs','narailter','qldsmartjobs','trudvsem','usajobs','work24']);
 assert.equal((await page.$$('.resource-admin-panel form')).length,6);
 assert.deepEqual(errors,[]);console.log('PASS: requested locale set, visible mobile layout, country queries, status navigation, pagination, search reset, homepage sections and gated source admin; all external traffic mocked');
}finally{await browser?.close();await server.close();}
