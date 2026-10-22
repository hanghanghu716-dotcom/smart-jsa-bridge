import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer';
import {getLanguageTag} from '../src/locales/config.js';

// Explicit route list, fresh browser context per route, and no link crawling.
// Keep the ReactSnap user-agent marker because the app uses it to disable
// private routes and analytics; the retired react-snap package is not loaded.
export async function renderStatic({routes,concurrency=2,executablePath,outputRoot='dist',cache}){
 const requested=routes.length;
 routes=routes.filter(route=>!cache?.restore(route,'static'));
 console.log(`Static HTML: ${requested-routes.length} reused, ${routes.length} to render.`);
 if(!routes.length)return;
 const root=path.resolve(outputRoot),shell=fs.readFileSync(path.join(root,'public-jsa-shell.html'));
 const types={'.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf'};
 const server=http.createServer((req,res)=>{
  try{
   const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(!path.extname(route)){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(shell);}
   const file=path.resolve(root,'.'+route);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.statusCode=404;return res.end();}
   res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  }catch{res.statusCode=400;res.end();}
 });
 let browser;
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox']});
  let next=0;
  await Promise.all(Array.from({length:concurrency},async()=>{
   while(next<routes.length){
    const route=routes[next++],locale=route.split('/')[1];
    const context=await browser.createBrowserContext();
    try{
     const page=await context.newPage();await page.setUserAgent('ReactSnap SmartJSAStaticBuild');await page.setViewport({width:1280,height:960});
     const errors=[];page.on('pageerror',e=>errors.push(e.message));
     // The root snapshot is the global English entry, independent of the build
     // machine's language. Interactive visitors still use the app's locale flow.
     await page.goto(base+(route==='/'?'/en-US/':route),{waitUntil:'networkidle0',timeout:60000});
     await page.waitForFunction(()=>document.getElementById('root')?.textContent.trim().length>50,{timeout:20000});
     await page.evaluate(()=>document.fonts.ready);
     const state=await page.evaluate(()=>({lang:document.documentElement.lang,canonical:document.querySelector('link[rel=canonical]')?.href,title:document.title}));
     if(errors.length||!state.title||!state.canonical|| (locale&&state.lang!==getLanguageTag(locale)))throw Error(`Static page verification failed: ${route} (${errors.join('; ')})`);
     const target=path.resolve(root,'.'+route,'index.html');
     if(!target.startsWith(root+path.sep))throw Error('INVALID_STATIC_PATH');
     fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,await page.content());
     cache?.save(route,'static');
    }finally{await context.close();}
   }
  }));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
