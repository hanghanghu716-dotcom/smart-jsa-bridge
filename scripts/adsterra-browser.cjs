// Mock-only checks. Every external request is intercepted; no real ad impressions or clicks.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
(async () => {
  const {createServer} = await import('vite');
  const {default:puppeteer} = await import('puppeteer');
  const {createAdsterraFrame} = await import('../api/adsterra-frame.js');
  const {ADSTERRA_CHOICE_KEY,ADSTERRA_MAX_AGE} = await import('../src/utils/adsterra.js');
  const key='a'.repeat(32),config={enabled:true,key,scriptUrl:'https://bauval.org/22/'+key,width:300,height:250};
  const handler=createAdsterraFrame(config),root=process.cwd(),cache=path.join(root,'.cache');
  await fs.mkdir(cache,{recursive:true});
  const htmlPath=path.join(cache,'adsterra-test.html'),jsxPath=path.join(cache,'adsterra-test.jsx');
  await fs.writeFile(htmlPath,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Adsterra fixture</title></head><body style="margin:16px;font-family:system-ui"><div id="root"></div><script type="module" src="/.cache/adsterra-test.jsx"></script></body></html>');
  await fs.writeFile(jsxPath,`import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,useNavigate,useLocation} from 'react-router-dom';import AdsterraBanner,{AdsterraSettings} from '/src/components/AdsterraBanner.jsx';const config=${JSON.stringify(config)};function Fixture(){const nav=useNavigate(),{pathname}=useLocation();const [ready,setReady]=React.useState(true);window.fixtureNavigate=nav;window.fixtureReady=setReady;return <main style={{maxWidth:900,margin:'auto'}}><h1>Public safety guide</h1><p>Example content for testing.</p>{pathname.endsWith('/privacy')?<AdsterraSettings locale={pathname.split('/')[1]} configuration={config}/>:<AdsterraBanner contentReady={ready} configuration={config}/>}<p id="article">Article content remains available</p><div style={{height:1200}}>More article content</div></main>;}createRoot(document.getElementById('root')).render(<React.StrictMode><MemoryRouter initialEntries={['/ko/case-study/demo']}><Fixture/></MemoryRouter></React.StrictMode>);`);
  let server,browser;
  try {
    server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
    const port=server.httpServer.address().port;
    browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
    const page=await browser.newPage(),errors=[],external=[];
    await page.setUserAgent('Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36');
    await page.setViewport({width:390,height:844});
    let frames=0,ads=0;
    page.on('pageerror',e=>errors.push(e.message));
    await page.setRequestInterception(true);
    page.on('request',async request=>{
      try {
        const url=new URL(request.url());
        if(url.origin==='https://smartjsabridge.com'){
          if(url.pathname==='/api/adsterra-frame'){
            frames++;
            const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=v||'';}};
            handler({method:request.method(),headers:{...request.headers(),host:'smartjsabridge.com'}},res);
            return request.respond({status:res.statusCode,headers:res.headers,body:res.body});
          }
          const response=await fetch('http://127.0.0.1:'+port+url.pathname+url.search);
          return request.respond({status:response.status,contentType:response.headers.get('content-type')||'text/plain',body:Buffer.from(await response.arrayBuffer())});
        }
        if(url.href===config.scriptUrl){
          ads++;
          return request.respond({status:200,contentType:'application/javascript',body:"let isolated=false;try{window.parent.localStorage.getItem('private-fixture')}catch{isolated=true}document.body.innerHTML='<div data-mock-ad data-isolated='+isolated+' style=\"width:300px;height:250px;background:#e7eef5;display:grid;place-items:center\">TEST AD · 300 × 250</div>';"}); 
        }
        if(url.protocol==='data:')return request.continue();
        external.push(url.origin);return request.abort();
      } catch(error){errors.push(error.message);try{await request.abort();}catch{}}
    });
    await page.goto('https://smartjsabridge.com/.cache/adsterra-test.html');
    await page.waitForSelector('[data-adsterra-allow]');
    assert.equal(frames,0);assert.equal(ads,0);
    await page.click('[data-adsterra-deny]');
    await page.waitForFunction(()=>!document.querySelector('[data-adsterra-banner]'));
    assert.equal(frames,0);
    await page.evaluate(()=>window.fixtureNavigate('/ko/privacy'));
    await page.waitForSelector('[data-adsterra-allow]');
    await page.click('[data-adsterra-allow]');
    assert.equal(frames,0,'privacy settings never load advertising');
    await page.evaluate(()=>window.fixtureNavigate('/ko/case-study/demo'));
    await page.waitForSelector('.adsterra-creative iframe');
    await page.waitForFunction(()=>document.querySelector('.adsterra-creative iframe')?.contentWindow!==null);
    const iframe=await page.$('.adsterra-creative iframe'),frame=await iframe.contentFrame();
    await frame.waitForSelector('[data-mock-ad]');
    assert.equal(await frame.$eval('[data-mock-ad]',el=>el.dataset.isolated),'true');
    assert.equal(frames,1);assert.equal(ads,1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await iframe.evaluate(el=>el.getBoundingClientRect().width),300);
    await page.screenshot({path:path.join(cache,'adsterra-mobile.png')});
    await page.evaluate(()=>scrollTo(0,900));await page.evaluate(()=>scrollTo(0,0));
    await page.waitForFunction(()=>scrollY===0);
    assert.equal(frames,1,'scrolling must not refresh an ad');
    await page.setViewport({width:1440,height:1000});
    await page.screenshot({path:path.join(cache,'adsterra-desktop.png')});
    assert.equal(frames,1,'resizing must not refresh an ad');
    await page.emulateMediaType('print');
    assert.equal(await page.$eval('[data-adsterra-banner]',el=>getComputedStyle(el).display),'none');
    await page.emulateMediaType('screen');
    await page.click('[data-adsterra-disable]');
    await page.waitForFunction(()=>!document.querySelector('.adsterra-creative iframe'));
    for(const route of ['/ko/templates','/ko/analysis','/ko/export','/ko/library','/ko/business','/ko/admin/upload']){
      await page.evaluate(route=>window.fixtureNavigate(route),route);
      await page.waitForFunction(()=>!document.querySelector('[data-adsterra-banner]'));
    }
    assert.equal(frames,1);
    await page.evaluate(({key,maxAge})=>{
      localStorage.setItem(key,JSON.stringify({choice:'allowed',time:Date.now()-maxAge-1}));
      dispatchEvent(new Event('smartjsa-adsterra-change'));
      window.fixtureNavigate('/ja-JP/case-study/demo');
    },{key:ADSTERRA_CHOICE_KEY,maxAge:ADSTERRA_MAX_AGE});
    await page.waitForSelector('[data-adsterra-allow]');
    assert.equal(await page.$eval('[data-adsterra-allow]',el=>el.textContent),'広告を許可');
    assert.equal(frames,1,'expired consent cannot load ads');
    await page.evaluate(()=>window.fixtureReady(false));
    await page.waitForFunction(()=>!document.querySelector('[data-adsterra-banner]'));
    assert.equal(frames,1,'empty content cannot load ads');
    assert.deepEqual(external,[]);
    assert.deepEqual(errors,[]);
    console.log('PASS: no advertising before consent, denial, privacy-only settings, isolated frame, one impression, mobile/desktop, no scroll refresh, print, withdrawal, private routes, expiry, localized choices, empty content; no live ad requests.');
  } finally {
    await browser?.close();await server?.close();
    await fs.unlink(htmlPath).catch(()=>{});await fs.unlink(jsxPath).catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
