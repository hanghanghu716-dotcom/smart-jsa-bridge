const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),puppeteer=require('puppeteer');
const base='http://127.0.0.1:4201';
const uid='10000000-0000-4000-8000-000000000001',folder='20000000-0000-4000-8000-000000000001';
const user={id:uid,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated'};
const session={access_token:[{alg:'HS256',typ:'JWT'},{sub:uid,exp:Math.floor(Date.now()/1000)+3600},'fixture'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.'),refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user};
const records=Array.from({length:37},(_,i)=>({id:'30000000-0000-4000-8000-'+String(i).padStart(12,'0'),author_id:uid,is_public:true,public_country:i<25?'US':'KR',public_locale:'en-US',title:`Document ${i+1}: Valve inspection`,category_id:i<10?folder:null,created_at:'2026-10-19T00:00:00Z',tags:i%2?['밸브조작']:['밸브조작','고압유체/압력'],form_data:{jsaType:'3-step'},analysis_data:[{proc:{stepTitle:'Inspect the isolation',stepDetail:'Inspect the assembly'},risks:[{factor:'Unexpected pressure release\n  - Check trapped pressure',current_measure:'Verify isolation before opening the connection and maintain a clear access route for the inspection team.\n  - Check zero energy\n    1. Record result',current_measure_confirmed:false,recommend_measure:'Confirm readiness\n  - Review isolation boundaries'}]}],reuse_license:'community-v1'}));
(async()=>{
 const preview=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4201','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
 try{
  for(let n=0;n<60;n++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
  browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:['--no-sandbox']});
  const page=await browser.newPage(),errors=[],bodyReads=[],writes=[],facetReads=[];
  const readFailures=new Set();
  page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(s=>localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token',JSON.stringify(s)),session);
  await page.setRequestInterception(true);
  page.on('request',async request=>{
   const url=request.url();if(url.startsWith(base)||url.startsWith('data:')||url.startsWith('blob:'))return request.continue();
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,HEAD,POST,OPTIONS','access-control-expose-headers':'content-range'};
   if(request.method()==='OPTIONS')return request.respond({status:200,headers,body:''});
   const u=new URL(url),q=u.searchParams;let data=[],total=0;
   if(url.includes('/auth/v1/user'))data=user;
   else if(url.includes('/rpc/'))data=url.includes('get_project_storage_usage')?{used:0,limit:3,can_create:true}:[];
   else if(!['GET','HEAD'].includes(request.method())){writes.push(url);return request.abort();}
   else if(readFailures.has(u.pathname.split('/').pop()))return request.respond({status:400,headers:{...headers,'content-type':'application/json'},body:JSON.stringify({code:'PGRST200',message:'Fixture read failure'})});
   else if(url.includes('/user_blocks')){
    assert.ok(['id,blocked_user_id,created_at','blocked_user_id'].includes(q.get('select')),'Do not embed a nonexistent private-profile relationship');
    data=[{id:'block-1',blocked_user_id:'90000000-0000-4000-8000-000000000001'}];
   }
   else if(url.includes('/jsa_projects')){
    assert.ok(q.get('author_id')==='eq.'+uid||q.get('id')?.startsWith('in.'));
    data=records.filter(row=>!q.has('id')||q.get('id').includes(row.id));
    if(q.get('select')==='*'){bodyReads.push(data.length);assert.ok(data.length<=12,'Load only one page of private document bodies');}
   }else if(url.includes('/public_jsa_catalog')){
    if(q.get('select')==='id,tags')facetReads.push(url);
    data=records.filter(row=>(!q.has('public_country')||q.get('public_country')==='eq.'+row.public_country)&&(!q.has('id')||q.get('id')==='eq.'+row.id));
    if(q.has('tags'))data=data.filter(row=>row.tags.includes('高')||row.tags.some(tag=>q.get('tags').includes(tag)));
   }else if(url.includes('/user_jsa_categories'))data=[{id:folder,user_id:uid,category_name:'Fixture folder',parent_id:null}];
   else if(url.includes('/user_jsa_drafts')||url.includes('/user_work_steps')||url.includes('/user_layouts'))data=Array.from({length:25},(_,i)=>({id:'fixture-'+i,title:'Saved '+(i+1),name:'Layout '+(i+1),current_stage:'info',updated_at:'2026-10-19T00:00:00Z',tags:['밸브조작'],analysis_data:url.includes('/user_work_steps')?{risks:[]}:[]}));
   else if(!url.includes('/rest/v1/')&&!url.includes('/auth/v1/'))return request.abort();
   if(Array.isArray(data)){
    total=data.length;const start=Number(q.get('offset')||0),limit=Number(q.get('limit')||data.length);
    data=data.slice(start,start+limit);
    if(request.headers().accept?.includes('vnd.pgrst.object'))data=data[0]||null;
   }
   return request.respond({status:200,headers:{...headers,'content-type':'application/json','content-range':`0-0/${total}`},body:JSON.stringify(data)});
  });
  await page.setViewport({width:1440,height:1000});
  await page.goto(base+'/en-US/library',{waitUntil:'networkidle2'});
  const ready=async n=>page.waitForFunction(n=>document.querySelector('#library-results')?.getAttribute('aria-busy')==='false'&&document.querySelectorAll('#library-results .card').length===n,{},n);
  await ready(12);
  assert.doesNotMatch(await page.$eval('#library-results',el=>el.textContent),/[가-힣]/);
  readFailures.add('user_blocks');readFailures.add('user_jsa_drafts');
  await page.goto(base+'/en-US/library',{waitUntil:'networkidle2'});await ready(12);
  assert.equal(await page.$('#library-results [role="alert"]'),null,'Unrelated failures must not block documents');
  assert.ok(!(await page.$eval('.library-grid > aside',el=>el.textContent)).includes('Drafts (0)'),'Failed reads are not empty libraries');
  await page.$$eval('#library-results .card button',els=>els.find(el=>el.textContent==='Edit & Modify').click());
  await page.waitForFunction(()=>location.pathname.endsWith('/analysis')&&history.state?.usr?.existingId);
  assert.deepEqual(await page.evaluate(()=>({id:history.state.usr.existingId,own:history.state.usr.projectSaveContext.own,isFork:history.state.usr.isFork})),{id:records[0].id,own:true,isFork:false});
  await page.goto(base+'/en-US/library',{waitUntil:'networkidle2'});await ready(12);
  await page.$$eval('.library-grid > aside > div',els=>els.find(el=>el.textContent.includes('Reports & Blocks')).click());
  await page.waitForSelector('#library-results [role="alert"]');
  readFailures.clear();
  await page.click('#library-results [role="alert"] button');
  await page.waitForFunction(()=>!document.querySelector('#library-results [role="alert"]')&&document.querySelector('#library-results')?.textContent.includes('90000000'));
  await page.goto(base+'/en-US/library',{waitUntil:'networkidle2'});await ready(12);
  await page.$$eval('.library-pagination .list-pagination-number',els=>els.find(el=>el.textContent==='2').click());await ready(12);
  await page.waitForFunction(()=>document.querySelector('#library-results h4')?.textContent.startsWith('Document 13:'));
  await page.click('.library-pagination .list-pagination-last');await ready(1);
  await page.$$eval('.library-grid > aside span',els=>els.find(el=>el.textContent.includes('Fixture folder')).click());await ready(10);
  assert.equal(await page.$('.library-pagination'),null);
  for(const title of ['Draft','Work Step Library','Layout']){
   await page.$$eval('.library-grid > aside > div',(els,title)=>{const item=els.find(el=>el.textContent.includes(title));if(!item)throw Error('Missing folder '+title);item.click();},title);
   try { await page.waitForSelector('.library-pagination .list-pagination-last'); } catch(e) { console.log(JSON.stringify({title,errors,text:await page.$eval('body',el=>el.textContent.slice(-1200))}));throw e; }
   await page.click('.library-pagination .list-pagination-last');
   await page.waitForFunction(()=>document.querySelector('.library-pagination [aria-current="page"]')?.textContent==='3');
  }
  await page.setViewport({width:390,height:844});
  assert.ok(await page.$eval('.library-pagination',el=>el.getBoundingClientRect().right<=innerWidth+1));
  await page.goto(base+'/en-US/explore',{waitUntil:'networkidle2'});
  await page.waitForFunction(()=>[...document.querySelectorAll('.explore-facet-count')].some(el=>el.textContent===' (25)'));
  const initialFacetReads=facetReads.length;
  await page.$$eval('.list-pagination-number',els=>els.find(el=>el.textContent==='2').click());
  await page.waitForNetworkIdle();
  assert.equal(facetReads.length,initialFacetReads,'Changing pages must not reload all tag metadata');
  await page.select('.explore-country select','all');
  await page.waitForFunction(()=>[...document.querySelectorAll('.explore-facet-count')].some(el=>el.textContent===' (37)'));
  await page.setViewport({width:1440,height:1000});
  await page.goto(base+'/en-US/public-jsa/'+records[0].id,{waitUntil:'networkidle2'});
  await page.waitForSelector('[data-document-list]');
  const text=await page.$eval('.document-content',el=>el.textContent);
  assert.ok(text.includes('Not confirmed at the worksite'));
  assert.ok(!text.includes('result *'));
  assert.ok(await page.$eval('[data-document-list]',el=>getComputedStyle(el).textAlign==='start'));
  assert.ok(await page.$$eval('.public-control-text [data-document-list] > span > span',els=>els.some(el=>parseFloat(el.style.paddingInlineStart)>1)));
  await fs.mkdir('.cache',{recursive:true});await page.screenshot({path:'.cache/library-discovery-document.png',fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  console.log(JSON.stringify({passed:true,libraryPageSize:12,privateBodyReads:bodyReads,folders:true,isolatedFailures:true,retryRecovery:true,editOriginal:true,facets:[25,37],indentation:true,unconfirmedNote:true,writes:0}));
 }finally{if(browser)await browser.close();preview.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
