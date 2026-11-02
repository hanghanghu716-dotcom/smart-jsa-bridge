// Korean route audit. Local UI; external mutations are blocked. Public reads only.
import puppeteer from 'puppeteer';
import {createServer} from 'vite';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const paths=[...readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8').matchAll(/path="\/:lng([^" :]*)"/g)].map(x=>'/ko'+x[1]);
const readRpcs=new Set(['resource_home','resource_hub','job_catalog','community_workflow','author_action','discovery_links','public_jsa_page','public_jsa_facets','public_jsa_read','public_jsa_assess','publication_assessment_batch']);
const server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
const base='http://127.0.0.1:'+server.httpServer.address().port,out=new URL('../.cache/korean-audit/',import.meta.url);mkdirSync(out,{recursive:true});
let browser;const report=[];
try{
 browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:['--no-sandbox']});
 const page=await browser.newPage();let errors=[],dialogs=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
 await page.setRequestInterception(true);
 page.on('request',r=>{
  const u=new URL(r.url());if(u.origin===base||['data:','blob:'].includes(u.protocol))return r.continue();
  if(['GET','HEAD','OPTIONS'].includes(r.method())&&!/google-analytics|doubleclick|googlesyndication/.test(u.hostname))return r.continue();
  const rpc=u.pathname.split('/rpc/')[1];let b={};try{b=JSON.parse(r.postData()||'{}');}catch{}
  if(u.hostname==='aajvezmhyrdawxxbulqz.supabase.co'&&readRpcs.has(rpc)&&(!b.p_action||['status','list','profile','public','read'].includes(b.p_action)))return r.continue();
  return r.respond({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:'{}'});
 });
 for(const path of paths){
  errors=[];dialogs=[];
  await page.setViewport({width:1440,height:1000});
  try{
   await page.goto(base+path,{waitUntil:'networkidle2',timeout:30000});
   await page.waitForFunction(()=>document.body.innerText.trim().length>20,{timeout:15000});
   const readings=[];
   for(const width of [1440,390]){
    await page.setViewport({width,height:900});
    readings.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,title:document.title,heading:[...document.querySelectorAll('h1,h2')].filter(e=>e.getBoundingClientRect().height&&getComputedStyle(e).visibility!=='hidden').slice(0,3).map(e=>e.textContent),text:document.body.innerText.slice(0,500),emptyLabels:[...document.querySelectorAll('main label')].filter(e=>!e.textContent.trim()).length,links:[...document.querySelectorAll('a[href]')].map(e=>e.getAttribute('href')).filter(h=>h.includes('undefined')||h.includes('null'))})));
   }
   const name=path.replaceAll('/','_')||'main';await page.screenshot({path:fileURLToPath(new URL(name+'.png',out)),fullPage:true});
   report.push({path,finalPath:new URL(page.url()).pathname,errors:[...errors],dialogs:[...dialogs],readings});
   console.log(JSON.stringify({path,errors,desktopOverflow:readings[0].overflow,mobileOverflow:readings[1].overflow,mobileHeading:readings[1].heading,emptyLabels:readings[0].emptyLabels}));
  }catch(e){report.push({path,error:e.message,errors});console.log(JSON.stringify({path,error:e.message}));}
 }
 writeFileSync(new URL('routes.json',out),JSON.stringify(report,null,2));
 const failed=report.filter(r=>r.error||r.errors?.length||r.readings?.some(v=>v.overflow>2||v.links.length));
 console.log('AUDIT: '+report.length+' Korean routes; no real document writes or account changes.');
 if(failed.length)throw Error('Route audit failures: '+failed.map(r=>r.path).join(', '));
}finally{await browser?.close();await server.close();}
