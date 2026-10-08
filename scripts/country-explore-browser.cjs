// Browser acceptance with mocked public data/translation. Never writes to production.
const puppeteer=require('puppeteer'),assert=require('node:assert/strict');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const doc=(n,country,locale,title)=>({id:id(n),title,public_country:country,public_locale:locale,is_public:true,reuse_license:'community-v1',author_id:id(99),created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z',form_data:{projectName:title,jsaType:'2-step',ppe:[],permits:[]},custom_layout:{},tags:[],view_count:2,analysis_data:[{proc:{stepTitle:'원문 단계',stepDetail:'원문 설명'},frequency:2,severity:3,riskLevel:6,risks:[{factor:'원문 위험',current_measure:'원문 대책'}]}]});
const rows=[doc(1,'KR','ko','한국 자료'),doc(2,'US','en-US','US document'),doc(3,'SG','en-SG','Singapore document')];
(async()=>{
 const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5187';
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];let writes=0;
  page.on('pageerror',error=>errors.push(error.message));
  await page.evaluateOnNewDocument(()=>{
   window.__mode='available';Object.defineProperty(navigator,'webdriver',{get:()=>false});
   window.Translator={availability:async()=>window.__mode,create:async()=>{
    if(window.__mode==='downloadable'&&!navigator.userActivation.isActive)throw new DOMException('Needs click','NotAllowedError');
    if(window.__mode==='error')throw Error('model failed');
    return {translate:async text=>'Translated '+text,destroy(){}};
   }};
  });
  await page.setRequestInterception(true);
  page.on('request',request=>{
   if(request.url().startsWith(base+'/')||/^(blob|data):/.test(request.url()))return request.continue();
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-expose-headers':'content-range'};
   if(request.method()==='OPTIONS')return request.respond({status:204,headers});
   const url=new URL(request.url());let data=[];
   if(url.pathname.endsWith('/public_jsa_catalog')){
    data=rows.filter(row=>(!url.searchParams.get('public_country')||url.searchParams.get('public_country')==='eq.'+row.public_country)&&(!url.searchParams.get('id')||url.searchParams.get('id')==='eq.'+row.id));
    headers['content-range']=`0-${data.length-1}/${data.length}`;
    if(request.headers().accept?.includes('vnd.pgrst.object'))data=data[0]||null;
   }else if(url.pathname.endsWith('/case_studies')){
    const locale=new URL(page.url()).pathname.split('/')[1];
    data=[{id:id(10),post_group_id:'new-case',title:'New case',meta_description:'New case description',language_code:locale,created_at:'2026-10-08T00:00:00Z',content_md:'Example case body'},{id:id(11),post_group_id:'popular-case',title:'Popular case',meta_description:'Popular case description',language_code:locale,created_at:'2026-10-01T00:00:00Z'}];
    if(url.searchParams.get('post_group_id'))data=data.filter(row=>'eq.'+row.post_group_id===url.searchParams.get('post_group_id'));
   }else if(url.pathname.endsWith('/case_study_metrics'))data=[{case_id:id(10),view_count:2},{case_id:id(11),view_count:30}];
   else if(url.pathname.endsWith('/rpc/record_case_study_view')){writes++;data=3;}
   else if(url.pathname.includes('/rpc/'))data=null;
   if(url.pathname.includes('/rest/v1/'))return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(data)});
   return request.abort();
  });
  await page.setViewport({width:390,height:844});
  await page.goto(base+'/ko/explore',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>document.querySelectorAll('.explore-card').length===1);
  assert.equal(await page.$eval('.explore-card > h2',e=>e.textContent),'한국 자료');
  await page.goto(base+'/en-US/explore',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>document.querySelectorAll('.explore-card').length===1);
  assert.equal(await page.$eval('.explore-card > h2',e=>e.textContent),'US document');
  await page.select('.explore-country select','all');
  await page.waitForFunction(()=>document.querySelectorAll('.explore-card').length===3&&document.querySelector('.explore-card > h2').textContent.startsWith('Translated'));
  await page.click('.public-translation-notice button');
  assert.equal(await page.$eval('.explore-card > h2',e=>e.textContent),'한국 자료');
  await page.click('.public-translation-notice button');
  await page.select('.explore-country select','KR');
  await page.waitForFunction(()=>document.querySelectorAll('.explore-card').length===1);
  assert.ok(page.url().includes('country=KR'));
  assert.ok(await page.$eval('.explore-document-meta',e=>e.textContent.includes('South Korea')));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(base+'/en-US/public-jsa/'+id(1),{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>document.querySelector('h1')?.textContent==='Translated 한국 자료');
  assert.ok((await page.$eval('.public-reading',e=>e.textContent)).includes('Translated 원문 위험'));
  assert.ok((await page.$eval('.public-risk-score',e=>e.textContent)).includes('6'));
  await page.click('.public-translation-notice button');
  assert.equal(await page.$eval('h1',e=>e.textContent),'한국 자료');
  // Changing the page invalidates the old translation, even when the source language matches.
  await page.goto(base+'/en-US/explore?country=all',{waitUntil:'networkidle0'});
  await page.evaluate(()=>{window.__mode='unavailable';});
  await page.select('.explore-country select','KR');
  await page.waitForFunction(()=>document.querySelector('.public-translation-notice')?.textContent.includes('unavailable'));
  assert.equal(await page.$eval('.explore-card > h2',e=>e.textContent),'한국 자료');
  await page.evaluate(()=>{window.__mode='downloadable';});
  await page.select('.explore-country select','all');
  await page.waitForFunction(()=>document.querySelector('.public-translation-notice button')?.textContent.includes('Prepare'));
  await page.click('.public-translation-notice button');
  await page.waitForFunction(()=>document.querySelector('.explore-card > h2')?.textContent.startsWith('Translated'));
  await page.goto(base+'/en-SG/explore',{waitUntil:'networkidle0'});
  assert.equal(await page.$eval('.explore-card > h2',e=>e.textContent),'Singapore document');
  await page.goto(base+'/fr-CA-QC/explore',{waitUntil:'networkidle0'});
  assert.equal((await page.$$('.explore-card')).length,0);assert.ok(await page.$('.explore-state button'));
  await page.goto(base+'/ko/',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>document.querySelectorAll('#case-study-results h5').length===2);
  assert.equal(await page.$eval('#case-study-results h5',e=>e.textContent),'New case');
  await page.select('.case-sort-controls select','views');
  await page.waitForFunction(()=>document.querySelector('#case-study-results h5')?.textContent==='Popular case');
  await page.goto(base+'/ko/case-study/new-case',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>document.body.textContent.includes('조회 3'));
  assert.equal(writes,1);assert.deepEqual(errors,[]);
  console.log('PASS: regional defaults, all/selected countries, translated titles/detail/original toggle, download activation, unavailable fallback, mobile, empty state, case sorting and view registration');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

