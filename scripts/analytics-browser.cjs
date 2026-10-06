// Isolated browser: serve the local build under the production origin; never
// send measurements to production GA. Real gtag loads, collection is intercepted.
const http=require('http'), fs=require('fs'), path=require('path'), assert=require('node:assert/strict');
const puppeteer=require('puppeteer');
const root=path.resolve(__dirname,'../dist');
const out=path.resolve(__dirname,'../tmp/analytics-qa');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 let file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 if(!fs.existsSync(file)||fs.statSync(file).isDirectory()) file=path.join(root,'index.html');
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const local=`http://127.0.0.1:${server.address().port}`;
 const browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 try {
 const page=await browser.newPage();
 const collects=[],google=[],errors=[];
 async function instrument(target) {
 await target.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
 target.on('pageerror',e=>errors.push(String(e)));
 await target.setRequestInterception(true);
 target.on('request',async r=>{
  const u=new URL(r.url());
  try {
   if(u.hostname==='smartjsabridge.com') {
    if(u.pathname.startsWith('/api/')) return r.respond({status:200,contentType:'application/json',body:'{}'});
    const resp=await fetch((process.env.ANALYTICS_LIVE==='1'?'https://smartjsabridge.com':local)+u.pathname);return r.respond({status:resp.status,contentType:resp.headers.get('content-type'),body:Buffer.from(await resp.arrayBuffer())});
   }
   if(u.hostname.endsWith('google-analytics.com')) { collects.push({url:r.url(),body:r.postData()||''});return r.respond({status:204,headers:{'access-control-allow-origin':'*'}}); }
   if(u.hostname==='www.googletagmanager.com') {google.push(r.url());return r.continue();}
   if(u.protocol==='data:'||u.protocol==='blob:')return r.continue();
   return r.respond({status:200,contentType:'application/json',body:'[]',headers:{'access-control-allow-origin':'*'}});
  }catch {return r.abort();}
 });
 }
 await instrument(page);
 const views=()=>collects.flatMap(c=>{const u=new URL(c.url);return (c.body?c.body.split('\n'):['']).map(body=>new URLSearchParams(u.search.slice(1)+'&'+body));}).filter(p=>p.get('en')==='page_view');
 const waitViews=async n=>{for(let i=0;i<160&&views().length<n;i++)await sleep(100);assert.equal(views().length,n,JSON.stringify(collects));};
 const go=async path=>{await page.evaluate(p=>{history.pushState({},'',p);dispatchEvent(new PopStateEvent('popstate'));},path);await sleep(300);};
 await page.setViewport({width:390,height:844});
 await page.goto('https://smartjsabridge.com/ko/?private=DO_NOT_SEND#secret',{waitUntil:'networkidle0',referer:'https://search.naver.com/search.naver?query=REFERRER_SECRET'});
 await waitViews(1);
 assert.equal(await page.$('.analytics-consent'),null);
 assert.equal(await page.$('[data-analytics-choice]'),null);
 await page.screenshot({path:path.join(out,'ko-mobile-automatic.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(views()[0].get('tid'),'G-73YTNRN5KJ');assert.equal(views()[0].get('dl'),'https://smartjsabridge.com/ko');
 assert.equal(views()[0].get('dr'),'https://search.naver.com/');
 assert.equal(views()[0].get('dt'),await page.title());
 await go('/ko/about?email=DO_NOT_SEND');await waitViews(2);
 assert.equal(views()[1].get('dr'),'https://smartjsabridge.com/ko');
 assert.equal(views()[1].get('dt'),await page.title());
 assert.notEqual(views()[1].get('dt'),views()[0].get('dt'));
 await go('/ko/about?email=ANOTHER_SECRET#token');await sleep(1000);assert.equal(views().length,2);
 await go('/ko/privacy');await waitViews(3);
 await go('/ko/login?token=PRIVATE_TOKEN');assert.equal(await page.$('iframe[title="Analytics"]'),null);await sleep(1000);assert.equal(views().length,3);
 await go('/ko/about');await waitViews(4);
 assert.equal(views()[3].get('dr'),'https://smartjsabridge.com/ko/privacy');
 await go('/ko/privacy');await waitViews(5);
 await page.click('[data-analytics-toggle]');
 assert.equal(await page.$('iframe[title="Analytics"]'),null);
 assert.equal((await page.cookies()).filter(c=>/^_ga/.test(c.name)).length,0);
 await go('/ko/about');await sleep(1000);assert.equal(views().length,5);
 await page.reload({waitUntil:'networkidle0'});assert.equal(await page.$('iframe[title="Analytics"]'),null);
 await go('/ar-SA/about');await page.screenshot({path:path.join(out,'ar-mobile-automatic.png')});
 assert.equal(await page.$('.analytics-consent'),null);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(JSON.stringify(collects).includes('DO_NOT_SEND'),false);assert.equal(JSON.stringify(collects).includes('PRIVATE_TOKEN'),false);assert.equal(JSON.stringify(collects).includes('ANOTHER_SECRET'),false);
 assert.ok(google.length>=1 && google.length<=2,'The second frame can reuse the cached tag');
 // Fresh browser storage for each acquisition scenario. The real gtag request
 // must contain the source and current title; no test requests reach GA.
 for(const source of ['https://m.search.naver.com/search.naver?query=REFERRER_SECRET','https://www.google.com/search?q=REFERRER_SECRET','https://www.google.co.kr/search?q=REFERRER_SECRET','https://www.bing.com/search?q=REFERRER_SECRET','https://example.org/private-path?token=REFERRER_SECRET','']) {
  const context=await (browser.createBrowserContext ? browser.createBrowserContext() : browser.createIncognitoBrowserContext());
  try {
   const visitor=await context.newPage();await instrument(visitor);
   const before=views().length;
   await visitor.goto('https://smartjsabridge.com/ko/dictionary?private=DO_NOT_SEND',{waitUntil:'networkidle0',...(source?{referer:source}:{})});
   await waitViews(before+1);
   const view=views().at(-1);
   assert.equal(view.get('dr')||'',source?new URL(source).origin+'/':'');
   assert.equal(view.get('dt'),await visitor.title());
   assert.notEqual(view.get('dt'),'Smart JSA Bridge');
  } finally {await context.close();}
 }
 assert.equal(JSON.stringify(collects).includes('REFERRER_SECRET'),false);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,process.env.ANALYTICS_LIVE==='1'?'acquisition-live.json':'acquisition-local.json'),JSON.stringify({pageViews:views().map(p=>({id:p.get('tid'),path:p.get('dl'),referrer:p.get('dr'),title:p.get('dt')})),googleLoads:google.length,errors,collection:'intercepted, never sent to Google'},null,2));
 console.log('PASS: real gtag emitted 11 page_view requests; all intercepted. Naver desktop/mobile, Google, Bing, referral, direct, real titles, SPA, private routes, opt-out and KO/AR mobile passed.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
