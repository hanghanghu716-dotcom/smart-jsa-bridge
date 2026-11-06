// All downstream ad traffic is mocked; no real impressions or clicks are created.
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const {createServer}=await import('vite'),{default:puppeteer}=await import('puppeteer');
 const {createAdsterraFrame}=await import('../api/adsterra-frame.js');
 const {adsterraPlacements,ADSTERRA_FRAME_ORIGIN}=await import('../src/config/adsterra.js');
 const {ADSTERRA_CHOICE_KEY}=await import('../src/utils/adsterra.js');
 const root=process.cwd(),cache=path.join(root,'.cache');await fs.mkdir(cache,{recursive:true});
 await fs.writeFile(cache+'/adsterra-test.html','<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/.cache/adsterra-test.jsx"></script></body></html>');
 await fs.writeFile(cache+'/adsterra-test.jsx',`import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,useNavigate} from 'react-router-dom';import {AdsterraConsent,AdsterraPageAds} from '/src/components/AdsterraBanner.jsx';function Fixture(){const nav=useNavigate();window.fixtureNavigate=nav;return <><main style={{maxWidth:1200,margin:'auto',minHeight:200}}>Public article</main><AdsterraConsent/><AdsterraPageAds contentReady/></>;}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/ko/case-study/demo']}><Fixture/></MemoryRouter>);`);
 const handler=createAdsterraFrame(),requests=[],errors=[];let server,browser;
 try{
  server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();const port=server.httpServer.address().port;
  browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();await page.setUserAgent('Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36');await page.setViewport({width:1800,height:1000});
  page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
  page.on('request',async request=>{try{
   const u=new URL(request.url());
   if(u.origin==='https://smartjsabridge.com'){const r=await fetch('http://127.0.0.1:'+port+u.pathname+u.search);return request.respond({status:r.status,contentType:r.headers.get('content-type')||'text/plain',body:Buffer.from(await r.arrayBuffer())});}
   if(u.origin===ADSTERRA_FRAME_ORIGIN){const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(v){this.body=v||''}};
    handler({method:request.method(),url:u.pathname+u.search,headers:{...request.headers(),host:u.host,'sec-fetch-dest':'iframe'}},res);
    return request.respond({status:res.statusCode,headers:res.headers,body:res.body});}
   const pair=Object.entries(adsterraPlacements).find(([,p])=>p.scriptUrl===u.href);
   if(pair){requests.push(pair[0]);return request.respond({status:200,contentType:'application/javascript',body:`'use strict';const o=window.atOptions;delete window.atOptions;let isolated=false;try{window.parent.localStorage.getItem('private')}catch{isolated=true}const frame=document.createElement('iframe');frame.width=o.width;frame.height=o.height;document.body.append(frame);frame.contentWindow.document.open();frame.contentWindow.document.write('<body style="margin:0;background:#ddeeff"><div data-mock-ad data-isolated="'+isolated+'">TEST AD '+o.width+' x '+o.height+'</div>');frame.contentWindow.document.close();`});}
   if(u.protocol==='about:'||u.protocol==='data:')return request.continue();return request.abort();
  }catch(e){errors.push(e.message);try{await request.abort()}catch{}}});
  await page.goto('https://smartjsabridge.com/.cache/adsterra-test.html');await page.waitForSelector('[data-adsterra-allow]');assert.equal(requests.length,0);
  await page.click('[data-adsterra-allow]');await page.waitForFunction(()=>document.querySelectorAll('[data-adsterra-banner] iframe').length===3);
  await new Promise(r=>setTimeout(r,250));assert.deepEqual([...requests].sort(),['bottom','left','right']);
  const creatives=page.frames().filter(frame=>frame.url()==='about:blank');assert.equal(creatives.length,3);
  for(const frame of creatives)assert.equal(await frame.$eval('[data-mock-ad]',el=>el.dataset.isolated),'true');
  await page.screenshot({path:cache+'/adsterra-desktop.png'});
  await page.emulateMediaType('print');assert.equal(await page.$eval('[data-adsterra-banner]',el=>getComputedStyle(el).display),'none');
  await page.emulateMediaType('screen');assert.equal(requests.length,3);
  await page.setViewport({width:390,height:844});await page.waitForFunction(()=>document.querySelector('[data-placement="mobile"] iframe'));
  await new Promise(r=>setTimeout(r,200));assert.equal(requests.filter(p=>p==='mobile').length,1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:cache+'/adsterra-mobile.png'});
  await page.setViewport({width:1800,height:1000});await new Promise(r=>setTimeout(r,150));assert.equal(requests.length,4);
  await page.click('[data-placement="bottom"] [data-adsterra-disable]');await page.waitForFunction(()=>!document.querySelector('[data-adsterra-banner]'));
  await page.reload();assert.equal(requests.length,4);
  await page.evaluate(key=>localStorage.removeItem(key),ADSTERRA_CHOICE_KEY);await page.reload();await page.waitForSelector('[data-adsterra-allow]');
  await page.evaluate(()=>window.fixtureNavigate('/ko/login'));await page.waitForFunction(()=>!document.querySelector('[data-adsterra-allow]'));assert.equal(requests.length,4);
  assert.deepEqual(errors,[]);console.log('Independent placements, nested writes, cross-origin storage isolation, consent, responsive switching, print and no refresh verified.');
 }finally{await browser?.close();await server?.close();}
})().catch(e=>{console.error(e);process.exit(1)});
