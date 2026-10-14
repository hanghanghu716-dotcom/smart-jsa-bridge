// Public UI fixtures only: never writes to production data or analytics.
const puppeteer=require('puppeteer'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5187';
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[],calls=[];let empty=false;
  page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);page.on('request',r=>{
   if(r.url().startsWith(base+'/')||/^(data|blob):/.test(r.url()))return r.continue();
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'};
   if(r.method()==='OPTIONS')return r.respond({status:204,headers});
   const url=new URL(r.url()),locale=new URL(page.url()).pathname.split('/')[1];let data=[];
   if(url.pathname.endsWith('/case_studies'))data=[{id:'00000000-0000-4000-8000-000000000001',post_group_id:'jsa-aerial-lift',language_code:locale,title:'Aerial lift case study',content_md:'Fixture content for layout verification.',created_at:'2026-10-01T00:00:00Z'}];
   if(url.pathname.endsWith('/rpc/editorial_jsa_by_country')){
    const payload=JSON.parse(r.postData());calls.push(payload);
    // Include an incompatible result to exercise the service's fail-closed check too.
    data=empty?[]:[{id:'00000000-0000-4000-8000-000000000002',title:'Related local JSA '+payload.p_country,country:payload.p_country,locale:'ko'},
     {id:'00000000-0000-4000-8000-000000000003',title:'Wrong-country JSA',country:payload.p_country==='KR'?'US':'KR',locale:'ko'}];
   }
   if(url.pathname.includes('/rest/v1/'))return r.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(data)});
   return r.abort();
  });
  for(const [locale,country] of [['en-SG','SG'],['ko','KR'],['en-US','US'],['en-GB','GB'],['fr-CA-QC','CA'],['ar-SA','SA']]){
   for(const width of [1440,360]){
    await page.setViewport({width,height:1000});await page.goto(base+'/'+locale+'/case-study/jsa-aerial-lift',{waitUntil:'networkidle0'});
    await page.waitForSelector('.discovery-links--editorial li a');
    assert.equal(calls.at(-1).p_country,country);assert.equal(calls.at(-1).p_kind,'case');assert.equal(calls.at(-1).p_target,'jsa-aerial-lift');
    assert.equal(await page.$$eval('.discovery-links--editorial li',es=>es.length),1);
    assert.equal(await page.$eval('.discovery-links--editorial li a',e=>e.textContent),'Related local JSA '+country);
    assert.equal(await page.$eval('.discovery-links--editorial li a',e=>new URL(e.href).pathname),'/'+locale+'/public-jsa/00000000-0000-4000-8000-000000000002');
    const geometry=await page.$eval('.discovery-links--editorial',e=>{
     const box=e.getBoundingClientRect(),title=e.querySelector('h2').getBoundingClientRect(),intro=e.querySelector('.discovery-links-intro').getBoundingClientRect(),list=e.querySelector('ul').getBoundingClientRect();
     return {left:box.left,right:box.right,width:innerWidth,titleX:title.x,introX:intro.x,titleBottom:title.bottom,introTop:intro.top,introBottom:intro.bottom,listTop:list.top,children:e.children.length};
    });
    assert.equal(geometry.children,1);assert.ok(Math.abs(geometry.titleX-geometry.introX)<1);
    assert.ok(geometry.introTop>=geometry.titleBottom);assert.ok(geometry.listTop>=geometry.introBottom);
    assert.ok(geometry.left>=0&&geometry.right<=geometry.width+1);
    if(locale==='en-SG'){
     fs.mkdirSync('.cache',{recursive:true});const card=await page.$('.discovery-links--editorial');await card.screenshot({path:'.cache/editorial-card-'+width+'.png'});
    }
   }
  }
  empty=true;await page.goto(base+'/en-SG/case-study/jsa-aerial-lift',{waitUntil:'networkidle0'});
  assert.equal(await page.$('.discovery-links--editorial'),null);assert.equal(await page.$('.discovery-links-intro'),null);
  assert.deepEqual(errors,[]);
  console.log('PASS: country-specific RPC, incompatible-result rejection, current-locale links, unified card alignment at desktop/mobile, RTL and empty-state omission');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
