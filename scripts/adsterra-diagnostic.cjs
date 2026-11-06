const {default:puppeteer}=require('puppeteer');
(async()=>{
const url='https://bauval.org/22/65ef0aecda401badd30234b75cc2eb6b';
const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
const source=await response.text();
console.log('SDK_RESPONSE',response.status,source.length);
console.log('SDK_SOURCE_BASE64',Buffer.from(source).toString('base64'));
for(const url of ['https://www.smartjsabridge.com/ko','https://smartjsabridge.com/ko']){
try{const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)});console.log('HOST',url,r.status,r.headers.get('location'));}catch(e){console.log('HOST_ERROR',url,e.message);}
}
const browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
try{for(const mode of ['opaque','separate-origin']){
 const page=await browser.newPage();const errors=[],blocked=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setRequestInterception(true);
 page.on('request',async request=>{
 const u=new URL(request.url());
 if(u.hostname==='app.fixture.test')return request.respond({status:200,contentType:'text/html',body:'<h1>Fixture</h1><iframe sandbox="allow-scripts '+(mode==='separate-origin'?'allow-same-origin':'')+'" src="https://ads.fixture.test/frame"></iframe>'});
 if(u.hostname==='ads.fixture.test')return request.respond({status:200,contentType:'text/html',body:'<script>window.atOptions={key:"'+ 'a'.repeat(32)+'",format:"iframe",width:300,height:250,params:{}};<'+ '/script><script src="'+url+'"><'+ '/script>'});
 if(request.url()===url)return request.respond({status:200,contentType:'application/javascript',body:source});
 if(u.protocol==='about:')return request.continue();
 blocked.push({type:request.resourceType(),host:u.hostname,path:u.pathname});return request.abort();
 });
 await page.goto('https://app.fixture.test',{waitUntil:'load',timeout:15000});
 await new Promise(r=>setTimeout(r,1500));
 console.log('FIXTURE',JSON.stringify({mode,errors,blocked,frames:await Promise.all(page.frames().map(async f=>({url:f.url(),html:(await f.content()).slice(0,1500)})))}));
 await page.close();
}}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
