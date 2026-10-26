const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const puppeteer=require('puppeteer');
const {spawn}=require('node:child_process');
(async()=>{
 const {explorePageSize}=await import('../src/utils/exploreView.js');
 const pageSize=explorePageSize();
 const {pageWindow}=await import('../src/utils/pagination.js');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jsa-operator-'));
 const local=process.argv.includes('--local');
 const baseUrl=local?'http://127.0.0.1:4173':'https://smartjsabridge.com';
 const preview=local?spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173'],{stdio:'ignore',windowsHide:true}):null;
 let browser;
 try {
  if(local){
   let ready=false;
   for(let attempt=0;attempt<60;attempt++){
    try {if((await fetch(baseUrl)).ok){ready=true;break;}} catch {}
    await new Promise(resolve=>setTimeout(resolve,500));
   }
   assert.ok(ready,'Local preview must start');
  }
  browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-setuid-sandbox']});
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000});
  if(!local){
   await page.goto(baseUrl+'/ko',{waitUntil:'networkidle2',timeout:60000});
   await page.waitForSelector('.home-risk-thumbnail',{timeout:30000});
   assert.equal(await page.$('.home-risk-thumbnail .document-paper'),null,'Live home must not contain the scope summary underneath images');
   const thumbnails=await page.$$('.home-risk-thumbnail');let loaded=0;
   for(const thumbnail of thumbnails){
    await thumbnail.evaluate(node=>node.scrollIntoView({block:'center'}));
    if(await thumbnail.$('img')){
     await page.waitForFunction(node=>node.querySelector('img')?.naturalWidth===720&&getComputedStyle(node.querySelector('.risk-pdf-thumbnail')).opacity==='1',{timeout:20000},thumbnail);loaded++;
    }
    assert.ok(await thumbnail.evaluate(node=>node.getBoundingClientRect().height>100),'Live placeholder keeps its height');
   }
   assert.ok(loaded>0,'Existing saved previews must still display');
   console.log(JSON.stringify({liveHomeImages:loaded,scopeSummaryUnderImages:false}));
  }
  const catalogRows=new Map(),detailReads=[],catalogErrors=[];
  page.on('response',response=>{
   const url=new URL(response.url());
   if(response.request().method()!=='GET'||!url.pathname.endsWith('/public_jsa_catalog')||url.searchParams.get('is_operator')!=='eq.true'||!url.searchParams.get('select')?.includes('analysis_data')||url.searchParams.has('title'))return;
   detailReads.push((async()=>{
    assert.ok(response.ok(),'Operator detail batch must load successfully');
    const ids=url.searchParams.get('id');
    assert.match(ids||'',/^in\.\(.+\)$/,'Details must be constrained to selected IDs');
    const selected=ids.slice(4,-1).split(',');
    assert.ok(selected.length<=10,'Assessment batches stay bounded');
    const rows=await response.json();
    assert.ok(Array.isArray(rows),'Operator details must be an array');
    for(const row of rows){
     assert.ok(selected.includes(row.id));
     assert.equal(row.is_operator,true);
     assert.equal(row.is_public,true);
     assert.ok(row.document_variant==null||['basic','technical','handover'].includes(row.document_variant),'Known document variant');
     catalogRows.set(row.id,row);
    }
   })().catch(error=>catalogErrors.push(error)));
  });
  const waitForCatalog=()=>page.waitForResponse(response=>{
   const url=new URL(response.url());
   return response.request().method()==='GET'&&url.pathname.endsWith('/public_jsa_catalog')&&url.searchParams.get('is_operator')==='eq.true'&&url.searchParams.get('select')==='id'&&!url.searchParams.has('title');
  },{timeout:60000});
  const readCatalog=async response=>{
   assert.ok(response.ok(),'Operator catalog must load successfully');
   const range=response.headers()['content-range']||'';
   assert.match(range,/[/][0-9]+$/,'Catalog must return an exact public total');
   const total=Number(range.split('/')[1]);
   const rows=await response.json();
   assert.ok(Array.isArray(rows)&&rows.length>0,'Operator catalog must contain documents');
   await Promise.all(detailReads);
   if(catalogErrors.length)throw catalogErrors[0];
   for(const row of rows)assert.ok(catalogRows.has(row.id),'Every selected ID must have current public details');
   return {total,rows};
  };
  let catalogResponse=waitForCatalog();
  await page.goto(baseUrl+'/ko/explore?author=operator',{waitUntil:'networkidle2',timeout:60000});
  await page.waitForFunction(()=>document.querySelectorAll('.explore-card').length>0&&!document.querySelector('.explore-loading'),{timeout:30000});
  const firstCatalog=await readCatalog(await catalogResponse);
  const expectedDocuments=firstCatalog.total,totalPages=Math.ceil(expectedDocuments/pageSize);
  assert.ok(totalPages>1,'Live operator catalog must exercise pagination');
  assert.equal(await page.$$eval('.explore-card',cards=>cards.length),Math.min(pageSize,expectedDocuments));
  assert.equal(await page.$eval('.explore-operator-filter input',el=>el.checked),true);
  assert.equal(await page.$$eval('.explore-card',cards=>cards.every(card=>card.querySelector('.operator-badge')?.textContent==='운영자')),true);
  assert.equal(await page.$('.explore-document-icon'),null,'Remove the decorative document icon');
  for(const theme of ['light','dark']){
   const colors=await page.evaluate(theme=>{
    document.documentElement.dataset.theme=theme;
    const badge=getComputedStyle(document.querySelector('.operator-badge'));
    return {background:badge.backgroundColor,color:badge.color};
   },theme);
   assert.deepEqual(colors,theme==='light'?{background:'rgb(0, 98, 204)',color:'rgb(255, 255, 255)'}:{background:'rgb(102, 173, 255)',color:'rgb(23, 26, 32)'});
  }
  await page.evaluate(()=>{document.documentElement.dataset.theme='light';});
  await page.waitForSelector('.explore-pagination');
  assert.deepEqual(await page.$$eval('.explore-pagination .list-pagination-number',els=>els.map(el=>Number(el.textContent))),pageWindow(1,totalPages).pages);
  const contentLinks=new Set(await page.$$eval('.explore-card > h2 > a',links=>links.map(link=>link.href)));
  const firstTitle=await page.$eval('.explore-card > h2 > a',el=>el.textContent);
  for(let index=1;index<totalPages;index++){
   const previousTitle=await page.$eval('.explore-card > h2 > a',el=>el.textContent);
   catalogResponse=waitForCatalog();
   if(index===totalPages-1)await page.$eval('.explore-pagination .list-pagination-last',el=>el.click());
   else if(index%15===0)await page.$eval('.explore-pagination .list-pagination-next',el=>el.click());
   else await page.$$eval('.explore-pagination .list-pagination-number',(els,number)=>els.find(el=>Number(el.textContent)===number).click(),index+1);
   await page.waitForFunction((index,count,previousTitle)=>new URL(location.href).searchParams.get('page')===String(index)&&!document.querySelector('.explore-loading')&&document.querySelectorAll('.explore-card').length===count&&document.querySelector('.explore-card > h2 > a')?.textContent!==previousTitle,{timeout:30000},index,Math.min(pageSize,expectedDocuments-index*pageSize),previousTitle);
   const currentCatalog=await readCatalog(await catalogResponse);
   assert.equal(currentCatalog.total,expectedDocuments,'Public catalog changed during verification; retry against a stable publication');
   assert.deepEqual(await page.$$eval('.explore-pagination .list-pagination-number',els=>els.map(el=>Number(el.textContent))),pageWindow(index+1,totalPages).pages);
   for(const link of await page.$$eval('.explore-card > h2 > a',links=>links.map(link=>link.href)))contentLinks.add(link);
  }
  assert.equal(contentLinks.size,expectedDocuments,'Every public operator document appears exactly once across pages');
  assert.deepEqual([...contentLinks].map(href=>new URL(href).pathname.split('/').pop()).sort(),[...catalogRows.keys()].sort(),'Cards match the complete public catalog');
  assert.equal(new URL(page.url()).searchParams.get('author'),'operator');
  assert.notEqual(await page.$eval('.explore-card > h2 > a',el=>el.textContent),firstTitle);
  await page.$eval('.explore-pagination .list-pagination-first',el=>el.click());
  await page.waitForFunction((count,title)=>!new URL(location.href).searchParams.has('page')&&!document.querySelector('.explore-loading')&&document.querySelectorAll('.explore-card').length===count&&document.querySelector('.explore-card > h2 > a')?.textContent===title,{timeout:30000},pageSize,firstTitle);
  for(const width of [320,390]){
   await page.setViewport({width,height:844});
   assert.equal(await page.$eval('.explore-pagination',el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&el.scrollWidth<=el.clientWidth+1;}),true);
  }
  await page.setViewport({width:1440,height:1000});
  // Exercise Chrome's native IME path, not only synthetic React events.
  const searchSelector='.explore-search input';
  const searchSession=await page.target().createCDPSession();
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let searchRequests=0,facetSearchRequests=0;
  page.on('request',request=>{
   const url=new URL(request.url());
   if(request.method()==='GET'&&url.pathname.endsWith('/public_jsa_catalog')&&url.searchParams.has('title')){
    if(url.searchParams.get('select')==='id,tags')facetSearchRequests++;
    else if(url.searchParams.get('select')==='id')searchRequests++;
   }
  });
  await page.focus(searchSelector);
  await page.$eval(searchSelector,input=>{window.__searchInput=input;});
  for(const text of ['ㄷ','도','도장']){
   await searchSession.send('Input.imeSetComposition',{text,selectionStart:text.length,selectionEnd:text.length});
   await delay(400);
   assert.equal(new URL(page.url()).searchParams.get('q'),null,'Do not navigate during IME composition');
   assert.equal(await page.$eval(searchSelector,input=>input.value),text);
  }
  assert.equal(searchRequests,0,'Do not fetch intermediate Korean syllables');
  assert.equal(facetSearchRequests,0,'Do not count facets for intermediate Korean syllables');
  await searchSession.send('Input.insertText',{text:'도장'});
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('q')==='도장'&&!document.querySelector('.explore-loading'),{timeout:30000});
  await delay(500);
  assert.equal(searchRequests,1,'Commit one search after composition');
  assert.deepEqual(await page.$eval(searchSelector,input=>({value:input.value,same:input===window.__searchInput,focused:document.activeElement===input,caret:input.selectionStart})),{value:'도장',same:true,focused:true,caret:2});
  // A second composition must leave the previous committed query intact.
  await searchSession.send('Input.imeSetComposition',{text:'ㅂ',selectionStart:1,selectionEnd:1});
  await delay(450);
  assert.equal(new URL(page.url()).searchParams.get('q'),'도장');
  await searchSession.send('Input.imeSetComposition',{text:'',selectionStart:0,selectionEnd:0});
  await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');
  await page.keyboard.type('rapid search',{delay:30});
  assert.equal(new URL(page.url()).searchParams.get('q'),'도장','Fast typing stays local until settled');
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('q')==='rapid search'&&!document.querySelector('.explore-loading'),{timeout:30000});
  assert.equal(await page.$eval(searchSelector,input=>input.value),'rapid search');
  await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');
  await page.keyboard.type('cancelled',{delay:10});
  await page.click('.explore-filter-tools button');
  await delay(650);
  assert.equal(new URL(page.url()).searchParams.get('q'),null,'Reset cancels pending search');
  assert.equal(await page.$eval(searchSelector,input=>input.value),'');
  // Restore the operator view through its UI before document checks.
  await page.click('.explore-operator-filter input');
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('author')==='operator'&&document.querySelectorAll('.explore-card').length>0&&!document.querySelector('.explore-loading'),{timeout:30000});
  const session=await page.target().createCDPSession();
  await session.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:dir});
  const variants={basic:0,technical:0,handover:0,standard:0},expectedVariants={...variants},downloaded=new Set();
  for(const row of catalogRows.values())expectedVariants[row.document_variant||'standard']++;
  // Live publications can change; all legacy variants are exercised by the isolated preview test.
  assert.equal(Object.values(expectedVariants).reduce((sum,count)=>sum+count,0),expectedDocuments);
  for(const href of contentLinks){
   const id=new URL(href).pathname.split('/').pop();
   await page.goto(href,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(id=>document.querySelector('.public-document-version')?.dataset.projectId===id,{timeout:30000},id);
   await page.click('a[href="#public-preview-panel"]');
   const details=await page.$$eval('.public-document-version',sections=>sections.map(section=>({
    id:section.dataset.projectId,variant:section.dataset.documentVariant,
    testText:/TEST_[A-D][1-3]|TEST 위험성평가/.test(section.textContent),
    scores:[...section.querySelectorAll('[data-document-block="JSA_TABLE"] tbody tr')].filter(tr=>getComputedStyle(tr).visibility!=='hidden').map(tr=>[...tr.cells].slice(-3).map(td=>td.textContent.trim()))
   })));
   assert.equal(details.length,1,'Each content page shows only its own document');
   assert.equal(details[0].id,id);
   const expectedVariant=catalogRows.get(id).document_variant||undefined;
   assert.equal(details[0].variant,expectedVariant,'Preview retains its own catalog variant');
   const variant=expectedVariant||'standard';
   variants[variant]++;
   assert.ok(!details[0].testText&&details[0].scores.length>0,'Every document has real analysis rows');
   if(expectedVariant)assert.ok(details[0].scores.every(values=>values.every(v=>v==='')),'A/B/C reference risk cells stay blank');
   const buttons=await page.$$('.public-document-version .jsa-toolbar button');
   assert.equal(buttons.length,1,'Each content has exactly one PDF download');
   if(!downloaded.has(variant)){
    await buttons[0].click();
    await page.waitForFunction(()=>!document.querySelector('.public-document-version .jsa-toolbar button').disabled,{timeout:60000});
    let files=[];
    for(let attempt=0;attempt<40;attempt++){
     files=(await fs.readdir(dir)).filter(f=>f.endsWith('.pdf'));
     if(files.length===downloaded.size+1)break;
     await new Promise(resolve=>setTimeout(resolve,250));
    }
    assert.equal(files.length,downloaded.size+1);
    downloaded.add(variant);
   }
  }
  assert.deepEqual(variants,expectedVariants,'Verify every published variant and standard document');
  const files=(await fs.readdir(dir)).filter(f=>f.endsWith('.pdf'));
  for(const name of files){const bytes=await fs.readFile(path.join(dir,name));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>10000);}
  await page.setViewport({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'Page must not overflow on mobile');
  await require('./main-pagination-browser.cjs').verifyHomeDiscovery(browser,baseUrl);
  console.log(JSON.stringify({numberedExplore:true,invertedBadge:true,noDecorativeIcon:true,imeSearch:true,debouncedSearch:true,searchFocus:true,searchReset:true,operatorFilter:true,operatorBadge:true,independentContents:contentLinks.size,onePdfPerContent:true,variants,blankRiskCells:true,pdfDownloads:files.length,mobileWidth:true}));
 } finally {if(browser)await browser.close();if(preview)preview.kill();await fs.rm(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
