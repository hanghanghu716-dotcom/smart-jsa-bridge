import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import {readFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {SUPPORTED_LANGS} from '../src/locales/config.js';
import {resourceHubUi} from '../src/locales/resourceHubUi.js';
const sources=JSON.parse(readFileSync(new URL('../src/data/resource-sources.json',import.meta.url)));
const root=fileURLToPath(new URL('..',import.meta.url)),server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});
await server.listen();const base='http://127.0.0.1:'+server.httpServer.address().port;
let browser;
try{
 browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage(),errors=[],adminCalls=[];let admin=false,follows=[];
 const id='a2aa88cb-505c-4265-998e-af68ff0a0038',fixture={id,source_id:'official-en-us',locale:'en-US',url:'https://www.osha.gov/publications',title:'Review fixture',summary:'',attribution:'',search_term:'',kind:'form',topic:'general',checks:{},state:'pending',evidence_url:'https://www.dol.gov/general/aboutdol/copyright',translated:false,reuse_confirmed:false};
 page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
 page.on('request',r=>{
  if(!r.url().includes('.supabase.co'))return r.continue();
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'};
  if(r.method()==='OPTIONS')return r.respond({status:204,headers});
  const u=new URL(r.url());let body=[];
  if(u.pathname.endsWith('/rpc/resource_hub')){const args=JSON.parse(r.postData());const s=sources.find(s=>s.locales.includes(args.p_locale));body={items:[{id:'fixture',title:s.name+' · '+resourceHubUi(args.p_locale).form,url:s.home_url,locale:args.p_locale,source:s.name,kind:'form',topic:'general',summary:'',checked_at:'2026-10-28',policy_url:s.policy_url}],sources:[{...s,url:s.home_url}],has_more:false};}
  if(u.pathname.endsWith('/rpc/community_workflow'))body={admin};
  if(u.pathname.endsWith('/auth/v1/user'))body={id,email:'fixture@example.test',role:'authenticated',aud:'authenticated',app_metadata:{role:'admin'},user_metadata:{}};
  if(u.pathname.endsWith('/rpc/resource_admin')){const args=JSON.parse(r.postData());adminCalls.push(args);body=args.p_action==='list'?{sources:sources.map(s=>({...s,active:true})),items:[fixture],audit:[],has_more:!args.p_data.page}:{ok:true,id:args.p_id};}
  if(u.pathname.endsWith('/rpc/resource_follows')){const args=JSON.parse(r.postData());if(args.p_action==='follow')follows=[{locale:args.p_locale,topic:args.p_topic}];if(args.p_action==='unfollow')follows=[];body=follows;}
  r.respond({status:200,contentType:'application/json',headers,body:JSON.stringify(body)});
 });
 for(const locale of SUPPORTED_LANGS){
  await page.setViewport({width:390,height:844});await page.goto(base+'/'+locale+'/resources',{waitUntil:'networkidle0'});
  await page.waitForSelector('.resource-cards article',{timeout:15000});assert.equal(await page.$eval('h1',e=>e.textContent),resourceHubUi(locale).title);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow '+locale);
  assert.ok(await page.$eval('.resource-cards h2 a',e=>e.href)===sources.find(s=>s.locales.includes(locale)).home_url);
 }
 for(const locale of ['ko','en-US','fr-CA-QC','ar-SA']){
  await page.setViewport({width:1366,height:900});await page.goto(base+'/'+locale+'/search?q=lift',{waitUntil:'networkidle0'});await page.waitForSelector('.resource-results section');assert.equal((await page.$$('.resource-results section')).length,4);
 }
 const output='.cache/resource-hub-qa';mkdirSync(output,{recursive:true});await page.goto(base+'/ko/resources',{waitUntil:'networkidle0'});await page.screenshot({path:output+'/desktop.png',fullPage:true});await page.setViewport({width:390,height:844});await page.screenshot({path:output+'/mobile.png',fullPage:true});
 admin=true;
 await page.evaluate(id=>{
  const encode=x=>btoa(JSON.stringify(x)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'),now=Math.floor(Date.now()/1000),user={id,email:'fixture@example.test',role:'authenticated',aud:'authenticated',app_metadata:{role:'admin'},user_metadata:{}};
  localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token',JSON.stringify({access_token:encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:id,role:'authenticated',aud:'authenticated',aal:'aal2',exp:now+3600,iat:now})+'.fixture',refresh_token:'fixture',expires_at:now+3600,expires_in:3600,token_type:'bearer',user}));
 },id);
 await page.goto(base+'/ko/resources?topic=general',{waitUntil:'networkidle0'});await page.waitForSelector('.resource-subscribe button');await page.click('.resource-subscribe button');await page.waitForFunction(()=>document.querySelector('.resource-subscribe button')?.textContent==='구독 해제');assert.deepEqual(follows,[{locale:'ko',topic:'general'}]);
 await page.setViewport({width:1366,height:900});await page.goto(base+'/ko/admin/resources',{waitUntil:'networkidle0'});await page.waitForSelector('.resource-admin-list button');await page.click('.resource-admin-list button');
 assert.ok(await page.$$eval('button',buttons=>buttons.find(b=>b.textContent==='검토 완료·공개').disabled));
 await page.$$eval('input[type=checkbox]',inputs=>inputs.filter(i=>i.closest('label')?.textContent.match(/권리·상업적|내용·출처|개인정보·피해자|적용 국가·지역/)).forEach(i=>i.click()));
 await page.$$eval('button',buttons=>buttons.find(b=>b.textContent==='검토 완료·공개').click());
 await page.waitForFunction(()=>document.querySelector('[role=status]')?.textContent.includes('반영했습니다'));
 assert.ok(adminCalls.some(c=>c.p_action==='publish'&&c.p_data.checks.rights&&c.p_data.checks.privacy));
 await page.$$eval('.resource-pages button',buttons=>buttons.find(b=>b.textContent==='다음').click());await page.waitForFunction(()=>document.querySelector('.resource-pages span')?.textContent==='2');
 await page.waitForNetworkIdle();assert.ok(adminCalls.some(c=>c.p_action==='list'&&c.p_data.page===1));
 assert.deepEqual(errors,[]);console.log('PASS: 19 locales, responsive layout, country isolation, unified search, follows, admin checklist and review pagination; all remote writes mocked');
}finally{await browser?.close();await server.close();}
