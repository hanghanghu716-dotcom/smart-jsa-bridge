const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
(async()=>{
 const root=path.resolve(__dirname,'..'),{createServer}=await import('vite'),out=path.join(root,'.cache/feedback-qa');
 fs.mkdirSync(out,{recursive:true});
 const server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
 const base='http://127.0.0.1:'+server.httpServer.address().port;let browser;
 try{
  browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH,headless:true,userDataDir:path.join(out,'browser-'+Date.now()),args:['--no-sandbox']});
  const page=await browser.newPage(),errors=[],prepared=[],writes=[];let submission=0,uploadCount=0,failNextUpload=false,uploads=new Set(),reserved=[],adminFixture=false,adminCalls=[];
  const id='4ef311fa-6519-40d2-830b-bd1a11fc31cf',receipt='a'.repeat(64),post={id,title:'Pump maintenance',language_code:'ko',post_group_id:'qa-pump',content_md:'## Procedure\nInspect and isolate the pump.',created_at:'2026-10-28T00:00:00Z'};
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setRequestInterception(true);
  page.on('request',r=>{
   const url=r.url(),headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
   const json=(body,status=200)=>r.respond({status,headers,contentType:'application/json',body:JSON.stringify(body)});
   if(url===base+'/api/public-gateway'){
    const body=JSON.parse(r.postData());if(body.action==='feedback_prepare'){prepared.push(body.payload);reserved=body.payload.files.map((file,index)=>({...file,path:'test/'+index,id:String(index),uploaded:uploads.has(index)}));return json({id,receipt,status:'draft',files:reserved});}
    if(body.action==='feedback_resume')return json({id,status:'draft',files:reserved.map((file,index)=>({...file,uploaded:uploads.has(index)}))});
    if(body.action==='feedback_submit'){submission++;return json({id,status:'open',files:[]});}
    if(body.action==='feedback_status')return json({id,status:'reviewing',response:'We are checking this request.'});
    return json({});
   }
   if(url.startsWith(base)||/^(blob|data):/.test(url))return r.continue();
   if(r.method()==='OPTIONS')return r.respond({status:204,headers});
   if(adminFixture&&url.includes('/storage/v1/object/authenticated/feedback-attachments/'))return r.respond({status:200,headers,contentType:'application/pdf',body:fs.readFileSync(filePath)});
   if(url.includes('/storage/v1/object/feedback-attachments/')){
    uploadCount++;if(failNextUpload){failNextUpload=false;return json({message:'temporary error'},503);}
    uploads.add(Number(url.split('/').pop()));return json({Key:'feedback-attachments/test',Id:id});
   }
   if(!['GET','HEAD'].includes(r.method()))writes.push(url);
   if(adminFixture&&url.includes('/auth/v1/user'))return json({id,email:'fixture@example.test',role:'authenticated',aud:'authenticated',app_metadata:{role:'admin'},user_metadata:{}});
   if(adminFixture&&url.includes('/rest/v1/rpc/community_workflow'))return json({admin:true});
   if(adminFixture&&url.includes('/rest/v1/rpc/feedback_admin')){
    const body=JSON.parse(r.postData());adminCalls.push(body);
    const row={id,category:'case_request',title:'Operator review fixture',locale:'ko',country:'KR',status:'open',created_at:'2026-10-28T00:00:00Z',updated_at:'2026-10-28T00:00:00Z',attachments:0};
    if(body.p_action==='list')return json([row]);
    if(body.p_action==='detail')return json({...row,detail:'A private work story.',context:'Equipment: pump.',contact_email:'fixture@example.test',internal_notes:'',response:'',files:[{id:'attachment-fixture',name:'permit.pdf',type:'application/pdf',size:fs.statSync(filePath).size,path:'test/0'}]});
    return json({ok:true});
   }
   if(url.includes('/rest/v1/case_studies')){
    const params=new URL(url).searchParams;
    if(params.get('select')==='language_code')return json([{language_code:'ko'},{language_code:'en-US'},{language_code:'ar-SA'}]);
    if(params.get('post_group_id'))return json([{...post,language_code:params.get('language_code')?.includes('en-US')?'en-US':'ko'}]);
    return json([]);
   }
   if(url.includes('.supabase.co/'))return json([]);
   return r.abort();
  });
  const wait=s=>page.waitForSelector(s,{timeout:30000});
  const fill=async(s,value)=>{await page.$eval(s,(node,value)=>{Object.getOwnPropertyDescriptor(node.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));},value);};
  const launch=async()=>{await page.click('.feedback-launcher');await wait('.feedback-form');};
  const title='.feedback-dialog .feedback-field input[type=text]';
  console.log('Feedback QA: open desktop home');
  await page.setViewport({width:1440,height:1000});await page.goto(base+'/ko',{waitUntil:'networkidle0'});
  assert.equal(await page.$eval('#feedback-dialog',n=>n.open),false);await launch();
  await page.click('.feedback-dialog-header button');assert.equal(await page.$eval('.feedback-launcher',n=>document.activeElement===n),true);await launch();
  console.log('Feedback QA: submit name-only request');
  await fill(title,'펌프 교체');await page.click('.feedback-check input[required]');await page.click('.feedback-dialog .feedback-primary');await wait('.feedback-review');
  await page.click('.feedback-dialog .feedback-primary');await wait('.feedback-success');
  assert.equal(submission,1);assert.equal(prepared[0].title,'펌프 교체');assert.equal(prepared[0].source_path,'');assert.equal(prepared[0].files.length,0);
  assert.ok(!('formData' in prepared[0]));assert.equal(await page.$eval('.feedback-status input',n=>n.value),id+'.'+receipt);
  console.log('Feedback QA: receipt status');
  await page.click('.feedback-status button');await page.waitForFunction(()=>document.querySelector('.feedback-status').textContent.includes('We are checking'));
  await page.screenshot({path:path.join(out,'receipt-ko.png')});
  await page.click('.feedback-dialog-header button');await page.goto(base+'/ko/case-study/qa-pump',{waitUntil:'networkidle0'});await wait('.case-language-switch');
  await page.click('.case-language-switch summary');
  const links=await page.$$eval('.case-language-switch a',nodes=>nodes.map(n=>n.getAttribute('href')));assert.deepEqual(links.sort(),['/ar-SA/case-study/qa-pump','/en-US/case-study/qa-pump','/ko/case-study/qa-pump'].sort());
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.screenshot({path:path.join(out,'language-'+theme+'.png')});
  }
  await page.keyboard.press('Escape');assert.equal(await page.$eval('.case-language-switch',n=>n.open),false);
  await page.click('.case-language-switch summary');await page.click('.case-language-switch a[href^="/en-US"]');await wait('.case-language-switch');assert.ok(page.url().includes('/en-US/case-study/qa-pump'));
  console.log('Feedback QA: mobile file-only request and retry');
  await page.setViewport({width:390,height:844});await page.goto(base+'/ko',{waitUntil:'networkidle0'});await launch();
  const filePath=path.join(out,'permit.pdf');const {jsPDF}=require('jspdf'),pdf=new jsPDF();pdf.text('QA permit: no real workplace data',15,20);fs.writeFileSync(filePath,Buffer.from(pdf.output('arraybuffer')));await (await page.$('.feedback-dialog input[type=file]')).uploadFile(filePath);
  await page.click('.feedback-check input[required]');await page.click('.feedback-dialog .feedback-primary');await wait('.feedback-review');failNextUpload=true;
  await page.click('.feedback-dialog .feedback-primary');await wait('.feedback-error');assert.equal(submission,1);assert.ok(await page.$('.feedback-review'));assert.equal(prepared.at(-1).title,'');
  await page.click('.feedback-dialog .feedback-primary');await wait('.feedback-success');assert.equal(submission,2);assert.equal(uploadCount,2);assert.equal(prepared.at(-1).client_id,prepared.at(-2).client_id);
  await page.click('.feedback-dialog-header button');await page.goto(base+'/ar-SA',{waitUntil:'networkidle0'});await launch();
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   assert.equal(await page.$eval('.feedback-form',n=>n.dir),'rtl');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.ok(await page.$eval('#feedback-dialog',n=>n.scrollWidth<=n.clientWidth+1));
   await page.screenshot({path:path.join(out,'mobile-ar-'+theme+'.png')});
  }
  await page.emulateMediaType('print');assert.equal(await page.$eval('.feedback-widget',n=>getComputedStyle(n).display),'none');await page.emulateMediaType('screen');
  await page.keyboard.press('Escape');assert.equal(await page.$eval('#feedback-dialog',n=>n.open),false);
  console.log('Feedback QA: 19 locale dialogs');
  const {SUPPORTED_LANGS}=await import('../src/locales/config.js');
  for(const locale of SUPPORTED_LANGS){console.log('Feedback QA locale',locale);await page.goto(base+'/'+locale,{waitUntil:'domcontentloaded'});await wait('.feedback-launcher');await launch();assert.ok(await page.$eval('.feedback-dialog h2',n=>n.textContent.trim().length>0));await page.click('.feedback-dialog-header button');}
  console.log('Feedback QA: operator inbox with isolated auth fixture');
  adminFixture=true;
  await page.evaluate(id=>{
   const encode=value=>btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
   const now=Math.floor(Date.now()/1000),user={id,email:'fixture@example.test',role:'authenticated',aud:'authenticated',app_metadata:{role:'admin'},user_metadata:{}};
   localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token',JSON.stringify({access_token:encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:id,role:'authenticated',aud:'authenticated',aal:'aal2',exp:now+3600,iat:now})+'.fixture',refresh_token:'fixture',expires_at:now+3600,expires_in:3600,token_type:'bearer',user}));
  },id);
  await page.setViewport({width:1280,height:900});await page.goto(base+'/ko/admin/requests',{waitUntil:'networkidle0'});await wait('.feedback-queue button');
  await page.click('.feedback-queue button');await wait('.feedback-inbox-detail');
  await page.click('.feedback-inbox-detail .feedback-files button');await wait('.feedback-attachment-preview');
  assert.ok(await page.$eval('.feedback-attachment-preview',image=>image.src.startsWith('data:image/webp')));
  await fill('.feedback-inbox-detail form textarea','Private operator note');
  await page.$$eval('.feedback-inbox-detail form textarea',nodes=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(nodes[1],'Public reply');nodes[1].dispatchEvent(new Event('input',{bubbles:true}));});
  await page.screenshot({path:path.join(out,'admin-inbox.png')});
  await page.click('.feedback-inbox-detail form button');await page.waitForFunction(()=>!document.querySelector('.feedback-inbox-detail'));
  const update=adminCalls.find(call=>call.p_action==='update');assert.equal(update.p_payload.notes,'Private operator note');assert.equal(update.p_payload.response,'Public reply');assert.equal(update.p_payload.expected,'2026-10-28T00:00:00Z');
  assert.deepEqual(errors,[]);assert.ok(writes.every(url=>/rpc\//.test(url)),'No real data writes');
  console.log('Feedback browser: 19 locales, mobile/RTL/themes, title-only, file-only, retry, receipts, real sibling links and print exclusion passed. No real submissions.');
 }catch(error){console.error('Feedback QA failed',error);throw error;}finally{if(browser)await browser.close();server.httpServer?.closeAllConnections();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
