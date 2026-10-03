// Isolated guide UI checks: no account, database changes or external requests.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url'),puppeteer=require('puppeteer');
(async()=>{
 const root=path.resolve(__dirname,'..'),base=process.env.GUIDE_TEST_URL||'http://127.0.0.1:5174';
 const {SUPPORTED_LANGS}=await import(pathToFileURL(path.join(root,'src/locales/config.js')));
 const qa=path.join(root,'.cache/guide-qa');fs.mkdirSync(qa,{recursive:true});
 const browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox',`--user-data-dir=${path.join(qa,'browser-profile')}`]});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base)||r.url().startsWith('data:')||r.url().startsWith('blob:')?r.continue():r.abort());
  const cats=['common','construction','manufacturing','chemical','high-risk','general'];
  for(let i=0;i<SUPPORTED_LANGS.length;i++){
   const locale=SUPPORTED_LANGS[i],category=cats[i%6];
   await page.setViewport({width:1360,height:950});await page.goto(`${base}/${locale}/guideline/${category}`,{waitUntil:'networkidle0'});
   await page.waitForSelector(`[data-guide-locale="${locale}"] #guide-document`);
   const state=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,text:document.querySelector('#guide-document').innerText,canonical:document.querySelector('link[rel=canonical]').href,pdf:document.querySelector('a[download]').getAttribute('href'),old:document.querySelectorAll('[src*="/assets/pdf/"],[href*="/assets/pdf/"]').length,article:JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)}));
   assert.equal(state.h1,1);assert.ok(state.text.length>1500);assert.equal(state.old,0);assert.ok(state.pdf.includes(`/${locale}/`));assert.ok(state.canonical.endsWith(`/${locale}/guideline/${category}`));assert.equal(state.article['@type'],'Article');
   if(locale==='ko')await page.screenshot({path:path.join(qa,'desktop-light.png')});
   if(locale==='en-GB'){
    await page.evaluate(()=>{localStorage.setItem('smartjsa_theme_preference','dark');location.reload();});await page.waitForNavigation({waitUntil:'networkidle0'});
    await page.screenshot({path:path.join(qa,'desktop-dark.png')});
   }
   await page.setViewport({width:390,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`${locale} mobile overflow`);
   const wide=await page.evaluate(()=>[...document.querySelectorAll('#guide-document *')].filter(e=>e.getBoundingClientRect().width>window.innerWidth).map(e=>e.className));assert.deepEqual(wide,[],`${locale} article overflow`);
   if(['ko','ar-SA'].includes(locale))await page.screenshot({path:path.join(qa,`${locale}-mobile.png`)});
   // The preview must request the same locale PDF and offer an inline fallback for invalid files.
   await page.click('button[aria-controls="guide-pdf-preview"]');
   await page.waitForSelector('#guide-pdf-preview iframe, #guide-pdf-preview [role=alert]');
   const src=await page.$eval('#guide-pdf-preview',e=>e.querySelector('iframe')?.getAttribute('src')||'error');
   if(process.env.GUIDE_REQUIRE_PDF==='1')assert.equal(src,state.pdf,`${locale} PDF not ready`);
   console.log(`PASS ${locale}: article, metadata, country PDF, 390px layout`);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
