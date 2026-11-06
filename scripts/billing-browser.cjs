const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const puppeteer=require('puppeteer');
const root=path.join(__dirname,'..'),uid='10000000-0000-4000-8000-000000000001';
const orderId='jsa_test_20000000-0000-4000-8000-000000000001';
const user={id:uid,email:'fixture@example.com',app_metadata:{provider:'email'},user_metadata:{},aud:'authenticated',role:'authenticated'};
const jwt=[{alg:'HS256',typ:'JWT'},{sub:uid,exp:Math.floor(Date.now()/1000)+3600},'fixture'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.');
const session={access_token:jwt,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user};
let enabled=false,loggedIn=true,confirmFails=false,sdkRequests=0,order=null;const calls=[],errors=[];
const product={amount:9900,currency:'KRW',days:30};
async function main(){
 const {preview}=await import('vite');const server=await preview({preview:{host:'127.0.0.1',port:4179,strictPort:true}});
 const origin='http://127.0.0.1:4179';
 const browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.setViewport({width:1200,height:900});
  page.on('pageerror',e=>errors.push(String(e)));await page.setRequestInterception(true);
  page.on('request',async req=>{
   const url=new URL(req.url());
   if(url.pathname==='/api/billing'){
    const action=url.searchParams.get('action'),body=JSON.parse(req.postData()||'{}');calls.push(action);let result,status=200;
    if(action==='config')result={enabled,mode:enabled?'test':'disabled',product,seller:enabled?{businessName:'테스트 판매자',representative:'테스트',registrationNumber:'테스트',mailOrderNumber:'테스트',address:'테스트 주소',supportEmail:'fixture@example.com',supportPhone:'테스트',termsUrl:origin+'/ko/terms',refundUrl:origin+'/ko/terms',privacyUrl:origin+'/ko/privacy',termsVersion:'v1'}:null};
    else if(action==='account')result={access:{active:false},orders:order?[order]:[]};
    else if(action==='create'){
     assert.equal(body.termsVersion,'v1');order={id:orderId,mode:'test',amount:9900,currency:'KRW',status:'PENDING',created_at:new Date().toISOString()};
     result={order,clientKey:'test_ck_fixture',customerKey:uid,payment:{method:'CARD',amount:{value:9900,currency:'KRW'},orderId,orderName:'Professional 30일 이용권',windowTarget:'self',successUrl:origin+'/ko/billing?result=success',failUrl:origin+'/ko/billing?result=fail'}};
    }else if(action==='confirm'){
     assert.equal(body.amount,9900);assert.equal(body.orderId,orderId);
     if(confirmFails){status=502;result={error:'PAYMENT_NOT_CONFIRMED'};}
     else{order={...order,status:'DONE',starts_at:new Date().toISOString(),expires_at:new Date(Date.now()+30*86400000).toISOString()};result=order;}
    }else if(action==='reconcile'){order={...order,status:'DONE'};result=order;}
    else if(action==='refund-request'){order={...order,refund_requested_at:new Date().toISOString()};result=order;}
    else{status=400;result={error:'INVALID_INPUT'};}
    return req.respond({status,contentType:'application/json',body:JSON.stringify(result)});
   }
   if(url.hostname==='js.tosspayments.com'){
    sdkRequests++;return req.respond({status:200,contentType:'application/javascript',body:`window.TossPayments=()=>({payment:()=>({requestPayment:async p=>{window.location.href=p.successUrl+'&orderId='+p.orderId+'&amount='+p.amount.value+'&paymentKey=fixture-key';}})});`});
   }
   if(url.origin===origin||['data:','blob:'].includes(url.protocol))return req.continue();
   if(req.method()==='OPTIONS')return req.respond({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'},body:''});
   let value=[];if(url.pathname==='/auth/v1/user')value=loggedIn?user:{error:'signed out'};
   if(url.pathname.includes('jsa_professional_access'))value={active:false,source:'none'};
   return req.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(value)});
  });
  await page.evaluateOnNewDocument(session=>localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token',JSON.stringify(session)),session);
  const open=()=>page.goto(origin+'/ko/billing',{waitUntil:'networkidle0'});
  const click=label=>page.evaluate(label=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent===label);if(!b||b.disabled)throw Error('Button unavailable: '+label);b.click();},label);
  await open();assert.match(await page.$eval('main',e=>e.textContent),/현재 결제는 받지 않습니다/);assert.equal(sdkRequests,0);
  enabled=true;await open();await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='테스트 결제하기'));
  assert.equal(await page.$eval('.billing-purchase button',b=>b.disabled),true);
  await page.click('input[type=checkbox]');await page.waitForFunction(()=>!document.querySelector('.billing-purchase button').disabled);
  await click('테스트 결제하기');await page.waitForFunction(()=>document.body.textContent.includes('테스트 결제를 확인했습니다.'));
  assert.equal(new URL(page.url()).search,'');assert.ok(calls.includes('confirm'));assert.equal(sdkRequests,1);
  await click('환불 요청 기록');await page.waitForFunction(()=>document.body.textContent.includes('환불 요청 접수됨'));
  fs.mkdirSync(path.join(root,'.cache'),{recursive:true});
  await page.screenshot({path:path.join(root,'.cache/billing-desktop.png'),fullPage:true});
  await page.setViewport({width:390,height:844});await page.waitForSelector('.billing-purchase',{visible:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(root,'.cache/billing-mobile.png'),fullPage:true});
  confirmFails=true;order={...order,status:'PENDING',refund_requested_at:null};
  await page.goto(origin+'/ko/billing?result=success&orderId='+orderId+'&paymentKey=fixture-key&amount=9900',{waitUntil:'networkidle0'});
  await page.waitForSelector('[role=alert]');assert.match(await page.$eval('[role=alert]',e=>e.textContent),/아직 확인하지 못했습니다/);
  assert.doesNotMatch(await page.$eval('main',e=>e.textContent),/이용권이 발급되었습니다/);
  await click('내역 새로고침');await page.waitForFunction(()=>document.body.textContent.includes('결제 대기'));
  await click('상태 확인');await page.waitForFunction(()=>document.querySelector('.billing-order h3')?.textContent.includes('결제 완료'));
  assert.deepEqual(errors,[]);
  console.log('PASS: disabled sales, consent gate, SDK redirect, confirmation, query removal, refund-request record, failure/recovery, mobile layout, no runtime errors.');
  console.log('BILLING_PREVIEW_BASE64 '+fs.readFileSync(path.join(root,'.cache/billing-desktop.png')).toString('base64'));
  console.log('BILLING_MOBILE_BASE64 '+fs.readFileSync(path.join(root,'.cache/billing-mobile.png')).toString('base64'));
 }finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
