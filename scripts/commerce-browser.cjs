// Mock-only browser smoke test. No affiliate account, public DB or real product traffic.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const {createServer}=await import('vite');
 const {default:puppeteer}=await import('puppeteer');
 const root=process.cwd(),cache=path.join(root,'.cache');
 await fs.mkdir(cache,{recursive:true});
 const html=path.join(cache,'commerce-test.html'),jsx=path.join(cache,'commerce-test.jsx');
 await fs.writeFile(html,'<!doctype html><html><head><meta charset="utf-8"><title>Commerce fixture</title></head><body style="margin:24px;font-family:system-ui"><div id="root"></div><script type="module" src="/.cache/commerce-test.jsx"></script></body></html>');
 await fs.writeFile(jsx,"import React from 'react';import {createRoot} from 'react-dom/client';import Commerce from '/src/components/CommerceRecommendations.jsx';function Preview(){const [id,setId]=React.useState('first');const [locale,setLocale]=React.useState('ko');window.showContent=setId;window.showLocale=setLocale;return <Commerce kind='case' contentId={id} locale={locale}/>;}createRoot(document.getElementById('root')).render(<Preview/>);");
 let server,browser;
 try{
  server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
  const executablePath=process.env.PUPPETEER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
  browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox']});
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request',async request=>{
   if(!request.url().includes('/api/commerce?'))return request.continue();
   const u=new URL(request.url()),id=u.searchParams.get('id');
   const country=u.searchParams.get('country')||(u.searchParams.get('locale')==='ko'?'KR':'US');
   if(id==='slow')await new Promise(resolve=>setTimeout(resolve,300));
   const items=country==='JP'?[]:[{id:'a:1',title:'TEST · Clipboard '+id,merchant:'TEST supplier A',href:'https://a.example/product'},{id:'b:1',title:'TEST · Document holder '+id,merchant:'TEST supplier B',href:'https://b.example/product'}];
   try{await request.respond({status:id==='withdrawn'?404:200,contentType:'application/json',body:JSON.stringify(id==='withdrawn'?{status:'unavailable',items:[]}:{status:items.length?'ready':'empty',country,items})});}catch{/* An aborted old request has no recipient. */}
  });
  await page.setViewport({width:1100,height:800});
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/.cache/commerce-test.html');
  await page.waitForSelector('.commerce-grid a');
  assert.equal(await page.$eval('.commerce-grid',e=>e.children.length),2);
  assert.equal(await page.$eval('select',e=>e.value),'KR');
  assert.ok((await page.$eval('.commerce-disclosure',e=>e.textContent)).includes('수수료'));
  assert.ok((await page.$eval('a',e=>e.rel)).includes('sponsored'));
  await page.screenshot({path:path.join(cache,'commerce-desktop.png'),fullPage:true});
  await page.select('select','JP');
  await page.waitForSelector('.commerce-panel [role="status"]');
  assert.equal(await page.$eval('select',e=>e.value),'JP');
  assert.equal(await page.$('.commerce-grid'),null);
  await page.select('select','US');await page.waitForSelector('.commerce-grid');
  await Promise.all([page.waitForRequest(req=>req.url().includes('id=slow')),page.evaluate(()=>window.showContent('slow'))]);
  await page.evaluate(()=>window.showContent('latest'));
  await page.waitForFunction(()=>document.querySelector('.commerce-grid')?.textContent.includes('latest'));
  // Let an old response arrive, verifying it cannot replace the newer content.
  await new Promise(resolve=>setTimeout(resolve,450));
  assert.ok((await page.$eval('.commerce-grid',e=>e.textContent)).includes('latest'));
  await page.setViewport({width:390,height:844});await page.evaluate(()=>window.showLocale('ar-SA'));
  await page.waitForFunction(()=>document.querySelector('.commerce-panel')?.getAttribute('dir')==='rtl');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await page.screenshot({path:path.join(cache,'commerce-mobile.png'),fullPage:true});
  await page.evaluate(()=>window.showContent('withdrawn'));
  await page.waitForFunction(()=>!document.querySelector('.commerce-panel'));
  assert.deepEqual(errors,[]);
  console.log('PASS: multiple merchants, disclosure, country override, empty state, stale response, mobile RTL, withdrawn content');
 }finally{
  await browser?.close();await server?.close();
  await fs.unlink(html).catch(()=>{});await fs.unlink(jsx).catch(()=>{});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
