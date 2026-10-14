const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const puppeteer=require('puppeteer');
const {spawn}=require('node:child_process');
(async()=>{
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
  const href=await page.$eval('.explore-card h2 a',a=>a.href);
  await page.goto(href,{waitUntil:'networkidle2',timeout:60000});
  await page.waitForFunction(()=>document.querySelectorAll('.public-document-version').length===3,{timeout:30000});
  const details=await page.$$eval('.public-document-version',sections=>sections.map(section=>({
   label:section.querySelector('h3').textContent,
   testText:/TEST_[A-D][1-3]|TEST 위험성평가/.test(section.textContent),
   scores:[...section.querySelectorAll('[data-document-block="JSA_TABLE"] tbody tr')].filter(tr=>getComputedStyle(tr).visibility!=='hidden').map(tr=>[...tr.cells].slice(-3).map(td=>td.textContent.trim()))
  })));
  assert.deepEqual(details.map(d=>d.label),['기록 인계','기술 실패','기본 통제']);
  assert.ok(details.every(d=>!d.testText&&d.scores.length===4&&d.scores.every(values=>values.every(v=>v===''))));
  const session=await page.target().createCDPSession();
  await session.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:dir});
  const buttons=await page.$$('.public-document-version .jsa-toolbar button');
  for(let i=0;i<buttons.length;i++){
   await buttons[i].click();
   await page.waitForFunction(()=>[...document.querySelectorAll('.public-document-version .jsa-toolbar button')].every(button=>!button.disabled),{timeout:60000});
   let files=[];
   for(let attempt=0;attempt<40;attempt++){
    files=(await fs.readdir(dir)).filter(f=>f.endsWith('.pdf'));
    if(files.length===i+1)break;
    await new Promise(resolve=>setTimeout(resolve,250));
   }
   assert.equal(files.length,i+1,'Each version downloads a separate PDF');
  }
  const files=(await fs.readdir(dir)).filter(f=>f.endsWith('.pdf'));
  for(const name of files){const bytes=await fs.readFile(path.join(dir,name));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>10000);}
  await page.setViewport({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'Page must not overflow on mobile');
  console.log(JSON.stringify({imeSearch:true,debouncedSearch:true,searchFocus:true,searchReset:true,operatorFilter:true,operatorBadge:true,versions:details.map(d=>d.label),blankRiskCells:true,pdfDownloads:files.length,mobileWidth:true}));
 } finally {if(browser)await browser.close();if(preview)preview.kill();await fs.rm(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
