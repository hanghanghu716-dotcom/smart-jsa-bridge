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
 await fs.writeFile(jsx,"import React from 'react';import {createRoot} from 'react-dom/client';import Commerce from '/src/components/CommerceRecommendations.jsx';import '/src/styles/workspaces.css';function Preview(){const [id,setId]=React.useState('first');const [locale,setLocale]=React.useState('ko');window.showContent=setId;window.showLocale=setLocale;return <main className='jsa-workspace' style={{maxWidth:1100,margin:'auto'}}><div data-preview='document'>Document preview</div><Commerce kind='case' contentId={id} locale={locale} placement='rail' sectionNumber={4}/><h2 id='section-5'>5. Controls</h2></main>;}createRoot(document.getElementById('root')).render(<Preview/>);");
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
   const country=u.searchParams.get('marketLocale')==='ja-JP'?'JP':u.searchParams.get('marketLocale')==='ko'?'KR':'SA';
   if(id==='slow')await new Promise(resolve=>setTimeout(resolve,300));
   const items=country==='JP'?[]:[{id:'a:1',title:'TEST · Clipboard '+id,merchant:'TEST supplier A',href:'https://a.example/product'},{id:'b:1',title:'TEST · Document holder '+id,merchant:'TEST supplier B',href:'https://b.example/product'}];
   try{await request.respond({status:id==='withdrawn'?404:200,contentType:'application/json',body:JSON.stringify(id==='withdrawn'?{status:'unavailable',items:[]}:{status:items.length?'ready':'empty',country,items})});}catch{/* An aborted old request has no recipient. */}
  });
  await page.setViewport({width:1920,height:1080});
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/.cache/commerce-test.html');
  await page.waitForSelector('.commerce-grid a');
  assert.equal(await page.$eval('.commerce-grid',e=>e.children.length),2);
  assert.equal(await page.$('select'),null);
  assert.ok((await page.$eval('.commerce-disclosure',e=>e.textContent)).includes('수수료'));
  assert.ok((await page.$eval('a',e=>e.rel)).includes('sponsored'));
  
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>{
    document.documentElement.dataset.theme=theme;
    const vars=theme==='dark'?{'--app-bg':'#0f172a','--card-bg':'#1e293b','--text-primary':'#f1f5f9','--text-secondary':'#cbd5e1','--accent':'#60a5fa'}:{'--app-bg':'#ffffff','--card-bg':'#f8fafc','--text-primary':'#172033','--text-secondary':'#475569','--accent':'#2563eb'};
    for(const [name,value]of Object.entries(vars))document.documentElement.style.setProperty(name,value);
   },theme);
   const links=await page.$$eval('.commerce-product-link',els=>els.map(el=>({color:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})));
   assert.ok(links.length>=4);
   for(const link of links){assert.equal(link.color,'rgb(255, 255, 255)');assert.equal(link.bg,'rgb(29, 78, 216)');}
   await page.hover('.commerce-panel--rail .commerce-product-link');
   assert.equal(await page.$eval('.commerce-panel--rail .commerce-product-link',el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
   await page.mouse.move(0,0);
   await page.screenshot({path:path.join(cache,'commerce-'+theme+'.png'),fullPage:true});
  }
  assert.equal(await page.$eval('.commerce-panel--rail',el=>getComputedStyle(el).display),'block');
  assert.equal(await page.$eval('[data-preview]',el=>el.nextElementSibling.id),'section-4');

  await Promise.all([page.waitForResponse(response=>response.url().includes('marketLocale=ja-JP')),page.evaluate(()=>window.showLocale('ja-JP'))]);
  await page.waitForFunction(()=>!document.querySelector('.commerce-panel'));
  assert.equal(await page.$('.commerce-grid'),null);
  assert.equal(await page.$('.commerce-panel--rail'),null);
  assert.equal(await page.$eval('[data-preview]',el=>el.nextElementSibling.id),'section-5');
  await page.evaluate(()=>window.showLocale('ko'));await page.waitForSelector('.commerce-grid');
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
  await Promise.all([page.waitForResponse(response=>response.url().includes('id=withdrawn')),page.evaluate(()=>window.showContent('withdrawn'))]);
  await page.waitForFunction(()=>!document.querySelector('.commerce-panel'));
  assert.equal(await page.$('.commerce-grid'),null);
  assert.equal(await page.$('.commerce-panel--rail'),null);
  assert.deepEqual(errors,[]);
  console.log('PASS: light/dark button contrast, desktop rails, section order, disclosures, locale, empty state, stale response, mobile RTL, withdrawn content');
 }finally{
  await browser?.close();await server?.close();
  await fs.unlink(html).catch(()=>{});await fs.unlink(jsx).catch(()=>{});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
