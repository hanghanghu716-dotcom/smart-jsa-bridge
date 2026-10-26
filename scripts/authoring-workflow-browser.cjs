const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),puppeteer=require('puppeteer');
(async()=>{
 const root=path.resolve(__dirname,'..'),{createServer}=await import('vite');
 const out=path.join(root,'.cache/authoring-qa');fs.mkdirSync(out,{recursive:true});
 const server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
 const base='http://127.0.0.1:'+server.httpServer.address().port;
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
  const page=await browser.newPage(),errors=[],writes=[];await page.setViewport({width:1600,height:1000});
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('dialog',async d=>{errors.push('Unexpected dialog: '+d.message());await d.dismiss();});
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=request.url();if(url.startsWith(base)||/^(blob|data):/.test(url))return request.continue();
   if(!['GET','HEAD','OPTIONS'].includes(request.method()))writes.push(url);
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
   if(request.method()==='OPTIONS')return request.respond({status:204,headers});
   if(url.includes('.supabase.co/'))return request.respond({status:200,contentType:'application/json',headers,body:'[]'});
   return request.abort();
  });
  const wait=selector=>page.waitForSelector(selector,{timeout:30000});
  const fill=async(selector,text)=>{await wait(selector);await page.$eval(selector,(node,value)=>{const setter=Object.getOwnPropertyDescriptor(node.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;setter.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));},text);};
  await page.goto(base+'/ko/info',{waitUntil:'networkidle0'});await wait('[data-template=standard]');
  assert.ok(page.url().endsWith('/ko/templates'));
  assert.equal(await page.$$eval('.authoring-steps>li',nodes=>nodes.length),5);
  await wait('[data-preview-page]');
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   await page.screenshot({path:path.join(out,'templates-'+theme+'.png'),fullPage:true});
   assert.equal(await page.$eval('.authoring-sheet',n=>getComputedStyle(n).backgroundColor),'rgb(255, 255, 255)');
  }
  await page.click('[data-template=portrait]');await page.click('[data-template-continue]');
  await wait('[data-info-next]');assert.ok(page.url().endsWith('/info'));
  await fill('input[name=projectName]','Preview workflow fixture');
  await page.waitForFunction(()=>document.querySelector('.authoring-preview [data-preview-body]')?.textContent.includes('Preview workflow fixture'));
  await page.setViewport({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Mobile inputs must not overflow');
  await page.click('.authoring-mobile-tabs button:nth-child(2)');
  assert.ok(await page.$eval('.authoring-preview',n=>n.getBoundingClientRect().width>0));
  assert.equal(await page.$eval('.authoring-grid>main',n=>getComputedStyle(n).display),'none');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Mobile preview must not overflow');
  await page.screenshot({path:path.join(out,'mobile-preview.png'),fullPage:true});
  await page.setViewport({width:1600,height:1000});
  await page.click('[data-info-next]');await wait('[data-procedure-next]');
  await fill('[data-procedure-title]','Isolation');await fill('[data-procedure-detail]','Isolate the pump before maintenance.');
  await page.click('[data-procedure-next]');await wait('[data-analysis-next]');
  await page.click('[data-add-manual]');await fill('.analysis-selected tbody textarea','Stored pressure');
  await fill('.analysis-selected tbody td:nth-child(2) textarea','Isolate and verify zero pressure.');
  await page.select('[data-assessed-frequency]','2');await page.select('[data-assessed-severity]','2');
  await page.waitForFunction(()=>document.querySelector('.authoring-preview [data-preview-body]')?.textContent.includes('Stored pressure'));
  await page.click('[data-analysis-next]');await wait('.reportPaper');
  assert.ok(page.url().endsWith('/export'),'Risk analysis proceeds directly to output');
  assert.ok(await page.$eval('.reportPaper',n=>n.textContent.includes('Stored pressure')));
  const state=await page.evaluate(()=>history.state.usr);
  assert.equal(state.templateId,'portrait');assert.equal(state.savedOrientation,'portrait');
  await page.click('[data-change-template]');await wait('[data-template=current]');
  await page.click('[data-template=photo]');await page.click('[data-template-customize]');await wait('[data-designer-next]');
  assert.ok(await page.$eval('.designer-paper',n=>n.textContent.includes('Stored pressure')));
  await page.setViewport({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Mobile designer must not overflow');
  await page.setViewport({width:1600,height:1000});
  await page.click('[data-designer-next]');await wait('[data-template-continue]');
  await page.click('[data-template-continue]');await wait('.reportPaper');
  assert.ok(page.url().endsWith('/export'));assert.ok(await page.$eval('.reportPaper',n=>n.textContent.includes('Stored pressure')));
  const preserved=await page.evaluate(()=>history.state.usr);
  assert.ok(preserved.savedActiveOrder.includes('DATA_PHOTO'));assert.equal(preserved.formData.projectName,'Preview workflow fixture');
  // Reload without router state to exercise durable guest draft recovery.
  await new Promise(r=>setTimeout(r,1300));
  await page.evaluate(()=>history.replaceState({},'',location.href));await page.reload({waitUntil:'networkidle0'});await wait('.reportPaper');
  assert.ok(await page.$eval('.reportPaper',n=>n.textContent.includes('Preview workflow fixture')));
  // Long risk rows use the same page planner as a real PDF, with no per-keystroke canvas work.
  const long={...preserved,analysisData:Array.from({length:9},(_,id)=>({id,proc:{stepTitle:'Step '+(id+1)},risks:Array.from({length:8},(_,r)=>({factor:'Hazard '+r+' stored energy and access',measure:'Isolate equipment, prevent access and verify the controls before starting work.'})),frequency:2,severity:2,riskLevel:4}))};
  await page.evaluate(state=>history.replaceState({usr:state},'','/ko/info'),long);await page.reload({waitUntil:'networkidle0'});await wait('[data-preview-page]');
  const result=await page.evaluate(async()=>{
   await document.fonts.ready;
   const {createReportPdf}=await import('/src/utils/reportPdf.js');
   const element=document.querySelector('.authoring-measure>.authoring-report');
   element.parentElement.style.visibility='visible';
   const {doc}=await createReportPdf([{element,orientation:'landscape',paperSize:'a4'}]);
   element.parentElement.style.visibility='hidden';
   return {pdfPages:doc.getNumberOfPages(),previewPages:Number(document.querySelector('.authoring-page-controls output').textContent.split('/')[1])};
  });
  assert.ok(result.pdfPages>1);assert.equal(result.previewPages,result.pdfPages);
  const {SUPPORTED_LANGS}=await import('../src/locales/config.js');
  for(const locale of SUPPORTED_LANGS){
   await page.evaluate(()=>{sessionStorage.clear();localStorage.clear();});
   await page.goto(base+'/'+locale+'/templates',{waitUntil:'networkidle0'});await wait('[data-template=standard]');
   assert.equal(await page.$$eval('.authoring-steps>li',nodes=>nodes.length),5);
   assert.ok(await page.$eval('h1',n=>n.textContent.trim().length>0));
   await page.setViewport({width:390,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),locale+' mobile overflow');
   if(locale==='ar-SA')assert.equal(await page.$eval('.template-page',n=>n.dir),'rtl');
   await page.setViewport({width:1600,height:1000});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  console.log(JSON.stringify({templateLocales:SUPPORTED_LANGS.length,workflow:'template-info-procedure-analysis-export',preservedContent:true,draftRecovery:true,pagination:result,remoteWrites:0}));
 }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
