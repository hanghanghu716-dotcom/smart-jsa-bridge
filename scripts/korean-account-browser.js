// Isolated account fixture: every external request is intercepted, including writes.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
import {createServer} from 'vite';
const root=fileURLToPath(new URL('..',import.meta.url)),out=new URL('../.cache/korean-account/',import.meta.url);mkdirSync(out,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
const base='http://127.0.0.1:'+server.httpServer.address().port;
const user={id:'00000000-0000-4000-8000-000000000001',email:'korean-audit@example.invalid',aud:'authenticated',role:'authenticated'};
const session={access_token:[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:Math.floor(Date.now()/1000)+3600},'fixture'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.'),refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user};
let browser;const errors=[],dialogs=[],report=[];
try{
 browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:['--no-sandbox']});
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
 await page.evaluateOnNewDocument(s=>localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token',JSON.stringify(s)),session);
 await page.setRequestInterception(true);page.on('request',r=>{
  const url=r.url();if(url.startsWith(base)||/^(data|blob):/.test(url))return r.continue();
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
  if(r.method()==='OPTIONS')return r.respond({status:204,headers});
  if(!url.includes('.supabase.co/'))return r.abort();
  let data=[];
  if(url.includes('/auth/v1/user'))data=user;
  else if(url.includes('/profiles'))data={id:user.id,username:'한국어 검증 계정',company_name:'',bio:''};
  else if(url.includes('/profile_preferences'))data={default_publicity:false};
  else if(url.includes('/rpc/community_workflow'))data={admin:false};
  else if(url.includes('/rpc/get_jsa_storage_usage'))data={used:0,limit:3,can_create:true};
  else if(url.includes('/rpc/job_catalog'))data={items:[],sources:[{id:'kr-work24',name:'고용24',connected:false}],has_more:false};
  else if(url.includes('/storage/'))return r.respond({status:404,headers,body:'{}'});
  return r.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(data)});
 });
 for(const route of ['profile','library','reset-password','jobs']){
  for(const width of [1440,390]){
   await page.setViewport({width,height:900});await page.goto(base+'/ko/'+route,{waitUntil:'networkidle0'});
   const result=await page.evaluate(()=>({path:location.pathname,width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,text:document.body.innerText,clipped:[...document.querySelectorAll('input:not([type=hidden]),button,textarea')].filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth+2);}).map(n=>n.textContent||n.type)}));
   report.push(result);await page.screenshot({path:fileURLToPath(new URL(route+'-'+width+'.png',out)),fullPage:true});
   assert.equal(result.path,'/ko/'+route);assert.ok(!result.text.includes('PC 전용'),route+' must be available on mobile');
   if(process.env.KOREAN_ACCOUNT_DIAGNOSE!=='1'){
    assert.ok(result.overflow<=2&&result.clipped.length===0,route+' clipped: '+JSON.stringify(result.clipped));
    assert.ok(!/reset\.(?:title|guide|alert|password|confirm)/.test(result.text),'Untranslated reset keys');
    if(route==='jobs')assert.ok(await page.$('a[href="https://www.work24.go.kr/"]'));
    if(route==='profile')assert.ok(result.text.includes('새 문서의 기본 저장 방식을 공개로 설정'));
   }
  }
 }
 assert.deepEqual(errors,[]);assert.ok(!dialogs.some(x=>x.startsWith('reset.')));
 console.log('PASS: Korean profile, library, password reset and official job fallback at desktop/mobile widths; external writes intercepted.');
}finally{writeFileSync(new URL('report.json',out),JSON.stringify({report,errors,dialogs},null,2));await browser?.close();await server.close();}
