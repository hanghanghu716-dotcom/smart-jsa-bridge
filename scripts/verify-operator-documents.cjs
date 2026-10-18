const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const puppeteer=require('puppeteer');
const {spawn}=require('node:child_process');
(async()=>{
 const {explorePageSize}=await import('../src/utils/exploreView.js');
 const pageSize=explorePageSize(),expectedDocuments=36,totalPages=Math.ceil(expectedDocuments/pageSize);
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
  await page.goto(baseUrl+'/ko/explore?author=operator',{waitUntil:'networkidle2',timeout:60000});
  await page.waitForFunction(()=>document.querySelectorAll('.explore-card').length>0&&!document.querySelector('.explore-loading'),{timeout:30000});
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
  assert.deepEqual(await page.$$eval('.explore-pagination .list-pagination-number',els=>els.map(el=>Number(el.textContent))),Array.from({length:totalPages},(_,i)=>i+1));
  const contentLinks=new Set(await page.$$eval('.explore-card > h2 > a',links=>links.map(link=>link.href)));
  const firstTitle=await page.$eval('.explore-card > h2 > a',el=>el.textContent);
  for(let index=1;index<totalPages;index++){
   const previousTitle=await page.$eval('.explore-card > h2 > a',el=>el.textContent);
   if(index===totalPages-1)await page.$eval('.explore-pagination .list-pagination-last',el=>el.click());
   else await page.$$eval('.explore-pagination .list-pagination-number',(els,number)=>els.find(el=>Number(el.textContent)===number).click(),index+1);
   await page.waitForFunction((index,count,previousTitle)=>new URL(location.href).searchParams.get('page')===String(index)&&!document.querySelector('.explore-loading')&&document.querySelectorAll('.explore-card').length===count&&document.querySelector('.explore-card > h2 > a')?.textContent!==previousTitle,{timeout:30000},index,Math.min(pageSize,expectedDocuments-index*pageSize),previousTitle);
   for(const link of await page.$$eval('.explore-card > h2 > a',links=>links.map(link=>link.href)))contentLinks.add(link);
  }
  assert.equal(contentLinks.size,expectedDocuments,'Twelve jobs have three separate content cards each');
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
  let searchRequests=0;
  page.on('request',request=>{
   const url=new URL(request.url());
   if(request.method()==='GET'&&url.pathname.endsWith('/public_jsa_catalog')&&url.searchParams.has('title'))searchRequests++;
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
  const variants={basic:0,technical:0,handover:0}, downloaded=new Set();
  for(const href of contentLinks){
   const id=new URL(href).pathname.split('/').pop();
   await page.goto(href,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(id=>document.querySelector('.public-document-version')?.dataset.projectId===id,{timeout:30000},id);
   const details=await page.$$eval('.public-document-version',sections=>sections.map(section=>({
    id:section.dataset.projectId,variant:section.dataset.documentVariant,
    testText:/TEST_[A-D][1-3]|TEST 위험성평가/.test(section.textContent),
    scores:[...section.querySelectorAll('[data-document-block="JSA_TABLE"] tbody tr')].filter(tr=>getComputedStyle(tr).visibility!=='hidden').map(tr=>[...tr.cells].slice(-3).map(td=>td.textContent.trim()))
   })));
   assert.equal(details.length,1,'Each content page shows only its own document');
   assert.equal(details[0].id,id);
   assert.ok(Object.hasOwn(variants,details[0].variant));
   variants[details[0].variant]++;
   assert.ok(!details[0].testText&&details[0].scores.length>0&&details[0].scores.every(values=>values.every(v=>v==='')));
   const buttons=await page.$$('.public-document-version .jsa-toolbar button');
   assert.equal(buttons.length,1,'Each content has exactly one PDF download');
   if(!downloaded.has(details[0].variant)){
    await buttons[0].click();
    await page.waitForFunction(()=>!document.querySelector('.public-document-version .jsa-toolbar button').disabled,{timeout:60000});
    let files=[];
    for(let attempt=0;attempt<40;attempt++){
     files=(await fs.readdir(dir)).filter(f=>f.endsWith('.pdf'));
     if(files.length===downloaded.size+1)break;
     await new Promise(resolve=>setTimeout(resolve,250));
    }
    assert.equal(files.length,downloaded.size+1);
    downloaded.add(details[0].variant);
   }
  }
  assert.deepEqual(variants,{basic:12,technical:12,handover:12});
  const files=(await fs.readdir(dir)).filter(f=>f.endsWith('.pdf'));
  for(const name of files){const bytes=await fs.readFile(path.join(dir,name));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>10000);}
  await page.setViewport({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'Page must not overflow on mobile');
  await require('./main-pagination-browser.cjs').verifyListPagination(browser,baseUrl);
  console.log(JSON.stringify({numberedExplore:true,invertedBadge:true,noDecorativeIcon:true,imeSearch:true,debouncedSearch:true,searchFocus:true,searchReset:true,operatorFilter:true,operatorBadge:true,independentContents:contentLinks.size,onePdfPerContent:true,variants,blankRiskCells:true,pdfDownloads:files.length,mobileWidth:true}));
 } finally {if(browser)await browser.close();if(preview)preview.kill();await fs.rm(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
