const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),puppeteer=require('puppeteer');
const base='http://127.0.0.1:4214';
(async()=>{
 const {SUPPORTED_LANGS}=await import('../src/locales/config.js');
 const {regionalFixedGuidance}=await import('../src/utils/regionalFixedGuidance.js');
 const preview=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4214','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
 try{
  for(let n=0;n<60;n++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
  browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:['--no-sandbox']});
  const page=await browser.newPage(),errors=[],chunks=new Set();page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=request.url();
   if(url.startsWith(base)){if(url.includes('/assets/'))chunks.add(new URL(url).pathname);return request.continue();}
   if(url.startsWith('data:')||url.startsWith('blob:'))return request.continue();
   // No account, database writes or production data are involved in this test.
   return request.abort();
  });
  let count=0;
  for(const locale of SUPPORTED_LANGS)for(const ns of ['regulation','jrajsa','about']){
   await page.setViewport({width:1280,height:960});
   await page.goto(`${base}/${locale}/${ns}`,{waitUntil:'networkidle2',timeout:60000});
   await page.waitForSelector('h1');
   assert.equal(await page.$$eval('h1',nodes=>nodes.length),1,`${locale}/${ns}: one heading`);
   const g=regionalFixedGuidance(`/${locale}/${ns}`,ns);
   if(g){
    assert.equal(await page.title(),g.title);
    assert.equal(await page.$eval('[data-regional-guidance]',el=>el.dataset.regionalGuidance),locale);
    if(ns!=='about')for(const [,href] of g.profile.links)assert.ok(await page.$$eval('[data-regional-guidance-sources] a',(links,href)=>links.some(a=>a.href===href),href));
    if(ns==='about')assert.ok(await page.$('.plan-overview'),'Existing plan information remains available');
   }
   await page.setViewport({width:390,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${locale}/${ns}: mobile overflow`);
   if(locale==='ar-SA')assert.equal(await page.$eval('[dir="rtl"]',el=>el.dir),'rtl');
   count++;
  }
  assert.deepEqual(errors,[]);
  assert.ok(![...chunks].some(url=>/\/(Analysis|Export|WorkPackages|DocumentDesigner|MyLibrary)-/.test(url)),'Public reading must not load private editor chunks');
  console.log(JSON.stringify({pages:count,mobileChecks:count,javascriptErrors:errors.length,privateEditorChunksLoaded:0,remoteWrites:0}));
 }finally{if(browser)await browser.close();preview.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
