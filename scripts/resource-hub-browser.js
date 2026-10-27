import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import {readFileSync,mkdirSync} from 'node:fs';
import {SUPPORTED_LANGS} from '../src/locales/config.js';
import {resourceHubUi} from '../src/locales/resourceHubUi.js';
const sources=JSON.parse(readFileSync('src/data/resource-sources.json'));
const browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.setRequestInterception(true);
page.on('request',r=>{
 if(!r.url().includes('.supabase.co'))return r.continue();
 if(r.method()==='OPTIONS')return r.respond({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'}});
 const u=new URL(r.url());let body=[];
 if(u.pathname.endsWith('/rpc/resource_hub')){const args=JSON.parse(r.postData());const s=sources.find(s=>s.locales.includes(args.p_locale));body={items:[{id:'fixture',title:s.name+' · '+resourceHubUi(args.p_locale).form,url:s.home_url,locale:args.p_locale,source:s.name,kind:'form',topic:'general',summary:'',checked_at:'2026-10-28',policy_url:s.policy_url}],sources:[{...s,url:s.home_url}],has_more:false};}
 if(u.pathname.endsWith('/rpc/community_workflow'))body={admin:false};
 r.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify(body)});
});
try{
 for(const locale of SUPPORTED_LANGS){
  await page.setViewport({width:390,height:844});await page.goto('http://127.0.0.1:5194/'+locale+'/resources',{waitUntil:'networkidle0'});
  await page.waitForSelector('.resource-cards article',{timeout:15000}).catch(async e=>{console.log(locale,errors,await page.evaluate(()=>document.body.innerText.slice(0,1200)));throw e;});assert.equal(await page.$eval('h1',e=>e.textContent),resourceHubUi(locale).title);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow '+locale);
  assert.ok(await page.$eval('.resource-cards h2 a',e=>e.href)===sources.find(s=>s.locales.includes(locale)).home_url);
 }
 for(const locale of ['ko','en-US','fr-CA-QC','ar-SA']){
  await page.setViewport({width:1366,height:900});await page.goto('http://127.0.0.1:5194/'+locale+'/search?q=lift',{waitUntil:'networkidle0'});await page.waitForSelector('.resource-results section');assert.equal((await page.$$('.resource-results section')).length,4);
 }
 mkdirSync('tmp/resource-hub',{recursive:true});await page.goto('http://127.0.0.1:5194/ko/resources',{waitUntil:'networkidle0'});await page.screenshot({path:'tmp/resource-hub/desktop.png',fullPage:true});await page.setViewport({width:390,height:844});await page.screenshot({path:'tmp/resource-hub/mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: 19 locales, mobile layout, country isolation, four search collections, no browser errors');
}finally{await browser.close();}
