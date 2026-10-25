const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),puppeteer=require('puppeteer');
const base='http://127.0.0.1:4210',id='20000000-0000-4000-8000-000000000001',author='20000000-0000-4000-8000-000000000002';
const doc={id,author_id:author,is_public:true,title:'Valve isolation procedure',public_country:'US',public_locale:'en-US',reuse_license:'community-v1',assessment:{checked:true},content_updated_at:'2026-10-19T10:00:00Z',publication_context:{scope:'Valve isolation before maintenance.'},form_data:{jsaType:'3-step',managerName:'PRIVATE_MANAGER',workLocation:'PRIVATE_LOCATION'},analysis_data:Array.from({length:3},(_,i)=>({proc:{stepTitle:'Step '+(i+1),stepDetail:'Inspect the isolation boundary.\n  - Verify zero pressure.'},risks:[{factor:'Trapped pressure',category:'고압유체/압력',current_measure:'Bleed trapped pressure.',recommend_measure:'Keep the vent open.'}],actionPlan:{additionalControls:'Confirm the vent remains open.',owner:'PRIVATE_OWNER',verifiedBy:'PRIVATE_VERIFIER'}}))};
(async()=>{
 const {SUPPORTED_LANGS}=await import('../src/locales/config.js');const {getPublicDocumentUi}=await import('../src/locales/publicDocumentUi.js');
 const preview=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4210','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
 try{
  for(let n=0;n<60;n++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
  browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:['--no-sandbox']});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(()=>{const original=URL.createObjectURL;window.__pdfBlobs=[];URL.createObjectURL=function(blob){if(blob.type==='application/pdf')window.__pdfBlobs.push(blob);return original.call(URL,blob);};});
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=request.url();if(url.startsWith(base)||url.startsWith('data:')||url.startsWith('blob:'))return request.continue();
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS','content-type':'application/json'};
   if(request.method()==='OPTIONS')return request.respond({status:200,headers,body:''});
   let data=null;
   if(url.includes('/public_jsa_catalog'))data=request.headers().accept?.includes('vnd.pgrst.object')?doc:[doc];
   else if(url.includes('/rpc/author_action'))data={id:author,nickname:'Public author',items:[]};
   else if(url.includes('/rpc/discovery_links'))data={related:[],children:[],editorial:[]};
   else if(url.includes('/rest/v1/'))data=[];
   else if(!url.includes('/auth/v1/'))return request.abort();
   return request.respond({status:200,headers,body:JSON.stringify(data)});
  });
  const report=[];
  for(const locale of SUPPORTED_LANGS){
   doc.public_locale=locale;await page.setViewport({width:1440,height:1000});await page.goto(base+'/'+locale+'/public-jsa/'+id,{waitUntil:'networkidle2'});
   await page.waitForSelector('#public-preview-panel');
   assert.equal(await page.$eval('#public-preview-panel',el=>el.open),false);
   await page.click('a[href="#public-preview-panel"]');
   await page.waitForSelector('.procedure-document-inline .procedure-document-paper',{visible:true});
   const ui=getPublicDocumentUi(locale);
   assert.equal(await page.$eval('.procedure-document-toolbar h2',e=>e.textContent),ui.procedurePreview);
   assert.equal(await page.$('[data-procedure-document-open]'),null);assert.equal(await page.$('[data-procedure-print]'),null);
   assert.equal(await page.$$eval('.procedure-document-inline button',e=>e.length),1);
   assert.equal(await page.$$eval('.procedure-document-paper tbody tr',e=>e.length),3);
   assert.equal(await page.$$eval('.public-document-preview > *',els=>els[0].classList.contains('procedure-document-inline')&&els[1].classList.contains('public-document-version')),true);
   assert.ok((await page.$eval('.public-reading',e=>e.textContent)).includes('Confirm the vent remains open.'));
   assert.doesNotMatch(await page.$eval('main',e=>e.textContent),/PRIVATE_MANAGER|PRIVATE_LOCATION|PRIVATE_OWNER|PRIVATE_VERIFIER/);
   if(locale!=='ko')assert.ok(!(await page.$eval('.public-reading',e=>e.textContent)).includes('고압유체/압력'));
   await page.waitForFunction(()=>[...document.querySelectorAll('script[type="application/ld+json"]')].some(e=>JSON.parse(e.textContent)['@graph']?.[0]?.author?.name==='Public author'));
   if(locale==='en-US'){
    await fs.mkdir('.cache/public-preview',{recursive:true});await page.screenshot({path:'.cache/public-preview/desktop.png'});
    await page.click('[data-procedure-pdf]');await page.waitForFunction(()=>window.__pdfBlobs.length===1,{timeout:60000});
    const data=await page.evaluate(async()=>{const b=window.__pdfBlobs[0];return {size:b.size,header:await b.slice(0,5).text()};});assert.equal(data.header,'%PDF-');assert.ok(data.size>10000);
    await page.click('.public-document-version .jsa-toolbar button');await page.waitForFunction(()=>window.__pdfBlobs.length===2,{timeout:60000});
    assert.equal(await page.evaluate(()=>window.__pdfBlobs[1].slice(0,5).text()),'%PDF-');
   }
   await page.setViewport({width:390,height:844});await new Promise(r=>setTimeout(r,100));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No outer page overflow: '+locale);
   if(locale==='en-US')await page.screenshot({path:'.cache/public-preview/mobile.png'});
   report.push(locale);
  }
  // Legacy variants must remain printable even when none are currently public.
  for(const variant of ['basic','technical','handover']){
   doc.public_locale='en-US';doc.document_variant=variant;
   await page.goto(base+'/en-US/public-jsa/'+id,{waitUntil:'networkidle2'});
   await page.click('a[href="#public-preview-panel"]');
   await page.waitForFunction(expected=>document.querySelector('.public-document-version')?.dataset.documentVariant===expected,{},variant);
   await page.click('.public-document-version .jsa-toolbar button');
   await page.waitForFunction(()=>window.__pdfBlobs.length===1,{timeout:60000});
   assert.equal(await page.evaluate(()=>window.__pdfBlobs[0].slice(0,5).text()),'%PDF-');
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,locales:report.length,procedureFirst:true,downloadOnly:true,pdfs:5,legacyVariants:3,mobile:true,privateFieldsHidden:true}));
 }finally{await browser?.close();preview.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
