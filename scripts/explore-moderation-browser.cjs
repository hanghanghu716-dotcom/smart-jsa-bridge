// Mock network only: never changes live publications or sends real notices.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const base = process.env.JSA_QA_BASE_URL || 'http://127.0.0.1:5192';
const id = '11111111-1111-4111-8111-111111111111';
const user = { id: '00000000-0000-4000-8000-000000000001', email: 'qa@example.invalid', aud: 'authenticated', role: 'authenticated' };
const session = { access_token: [{ alg: 'HS256' }, { sub: user.id, exp: Math.floor(Date.now()/1000)+3600 }, 'fixture'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.'), refresh_token:'fixture', expires_at:Math.floor(Date.now()/1000)+3600, user };
const row = { id, title:'Moderation browser fixture', author_id:user.id, is_public:true, public_locale:'en-US', public_country:'US', form_data:{projectName:'Fixture',jsaType:'3-step'}, analysis_data:[{proc:{stepTitle:'Prepare',stepDetail:'Check the work area'},risks:[]}], custom_layout:{}, tags:[], reuse_license:'community-v1', created_at:'2026-10-01T00:00:00Z', updated_at:'2026-10-01T00:00:00Z' };
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 let admin=true,restricted=false,version=0,mutations=0,stale=false;const errors=[];
 try {
  const page=await browser.newPage();await page.setViewport({width:1400,height:1000});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.evaluateOnNewDocument(s=>localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token',JSON.stringify(s)),session);
  await page.setRequestInterception(true);
  page.on('request',async request=>{
   const url=request.url();if(url.startsWith(base)||url.startsWith('data:')||url.startsWith('blob:'))return request.continue();
   if(!url.includes('/rest/v1/')&&!url.includes('/auth/v1/'))return request.abort();
   const params=new URL(url).searchParams, body=JSON.parse(request.postData()||'{}');let data=[],status=200;
   if(request.method()==='OPTIONS')return request.respond({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'},body:''});
   if(url.includes('/auth/v1/user'))data=user;
   else if(url.includes('/rpc/community_workflow'))data={admin};
   else if(url.includes('/rpc/explore_moderation')){
    const state={id,title:row.title,restricted,version:String(version),updated_at:row.updated_at};
    if(!admin){status=403;data={message:'ADMIN_REQUIRED'};}
    else if(body.p_action==='inspect')data=state;
    else if(body.p_action==='document')data={...state,document:row};
    else if(body.p_action==='restricted')data=restricted?[row]:[];
    else {
     if(stale){version++;stale=false;}
     if(body.p_payload.version!==String(version)){status=400;data={message:'STALE_MODERATION'};}
     else {restricted=body.p_action==='restrict';version++;mutations++;data={id,restricted};}
    }
   }
   else if(url.includes('/public_jsa_catalog'))data=params.has('id')?(restricted?null:row):(restricted?[]:[row]);
   else if(url.includes('/rpc/'))data=null;
   return request.respond({status,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-expose-headers':'content-range','content-range':restricted?'*/0':'0-0/1'},body:JSON.stringify(data)});
  });
  async function open(){await page.waitForSelector('[data-moderation-open]');await page.click('[data-moderation-open]');await page.waitForFunction(()=>document.querySelector('dialog[open] .moderation-document-title'));}
  async function reason(text){await page.$eval('[data-moderation-reason]',(n,text)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(n,text);n.dispatchEvent(new Event('input',{bubbles:true}));},text);}
  async function submit(){await reason('Test reason for operator moderation');await page.click('[data-moderation-submit]');}
  await page.goto(base+'/en-US/explore',{waitUntil:'networkidle0'});
  await open();await page.keyboard.press('Escape');assert.equal(mutations,0);
  await open();await reason('short');assert.equal(await page.$eval('[data-moderation-submit]',n=>n.disabled),true);
  await page.setViewport({width:390,height:844});assert.ok(await page.$eval('dialog[open]',n=>n.getBoundingClientRect().right<=innerWidth));
  if(process.env.JSA_QA_SCREENSHOT)await page.screenshot({path:process.env.JSA_QA_SCREENSHOT});
  await submit();await page.waitForFunction(()=>!document.querySelector('.explore-grid [data-moderation-open]'));assert.equal(mutations,1);assert.equal(restricted,true);
  await page.click('[data-restricted-toggle]');await page.waitForSelector('.explore-moderation-panel li a');
  await page.click('.explore-moderation-panel li a');await page.waitForSelector('.explore-moderation-notice');
  assert.ok(await page.$eval('meta[name=robots]',n=>n.content.includes('noindex')));
  await open();await submit();await page.waitForFunction(()=>!document.querySelector('.explore-moderation-notice'));assert.equal(mutations,2);assert.equal(restricted,false);
  assert.equal(await page.$$eval('[data-moderation-open]',nodes=>nodes.length),1);
  await open();stale=true;await submit();await page.waitForSelector('dialog[open] [role=alert]');assert.equal(mutations,2);assert.equal(await page.$eval('[data-moderation-submit]',n=>n.disabled),true);
  await page.keyboard.press('Escape');
  // Ordinary users cannot see either the controls or an admin-only preview.
  admin=false;restricted=true;await page.reload({waitUntil:'networkidle0'});await page.waitFor(300);
  assert.equal(await page.$('[data-moderation-open]'),null);assert.equal(await page.$('.public-document-preview'),null);
  await page.goto(base+'/en-US/explore',{waitUntil:'networkidle0'});assert.equal(await page.$('[data-restricted-toggle]'),null);
  assert.deepEqual(errors,[]);
  console.log('PASS: cancel, reason, mobile dialog, restrict, restricted list, detail restore, stale conflict, ordinary-user denial');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
