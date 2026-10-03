import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import puppeteer from 'puppeteer';
import { SUPPORTED_LANGS, getLanguageTag } from '../src/locales/config.js';
import { GUIDE_CATEGORIES, GUIDE_VERSION } from '../src/utils/guideContent.js';
import { guideText } from '../src/locales/guideText.js';

// Chromium keeps Korean/Japanese/Arabic shaping and searchable text identical to HTML.
// PDFs are build artifacts, never independent translations or database attachments.
export async function renderGuides({baseUrl,outputRoot='dist',locales=SUPPORTED_LANGS,categories=Object.keys(GUIDE_CATEGORIES),snapshots=!baseUrl}={}){
 let server;
 if(!baseUrl){
  const root=path.resolve(outputRoot),shell=fs.readFileSync(path.join(root,'public-jsa-shell.html'));
  const types={'.js':'text/javascript','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
  server=http.createServer((req,res)=>{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(/\/guideline\/[^/]+\/?$/.test(pathname)){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(shell);}
   const file=path.resolve(root,'.'+pathname);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.statusCode=404;return res.end();}
   res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));baseUrl=`http://127.0.0.1:${server.address().port}`;
 }
 const executablePath=process.env.PUPPETEER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'/usr/bin/google-chrome');
 const profile=path.resolve('.cache',`guide-chrome-${process.pid}`);fs.mkdirSync(profile,{recursive:true});
 let browser;
 const manifest=[];
 try{
  browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox',`--user-data-dir=${profile}`]});
  const page=await browser.newPage();await page.setUserAgent('ReactSnap SmartJSAGuideBuild');
  await page.setViewport({width:1280,height:960});
  await page.setRequestInterception(true);
  page.on('request',req=>{const u=req.url();return u.startsWith(baseUrl)||u.startsWith('data:')||u.startsWith('blob:')?req.continue():req.abort();});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const locale of locales){
   for(const category of categories){
    const route=`/${locale}/guideline/${category}`;
    await page.goto(baseUrl+route,{waitUntil:'networkidle0'});
    await page.waitForSelector(`[data-guide-locale="${locale}"][data-guide-category="${category}"] #guide-document`);
    await page.evaluate(()=>document.fonts.ready);
    if(errors.length)throw new Error(errors.join('\n'));
    const state=await page.evaluate(()=>({text:document.querySelector('#guide-document').innerText,locale:document.documentElement.lang,canonical:document.querySelector('link[rel=canonical]')?.href,examples:document.querySelectorAll('.guide-example').length}));
    if(state.text.length<1500||!state.examples||state.locale!==getLanguageTag(locale)||state.canonical!==`https://smartjsabridge.com${route}`)throw new Error(`Incomplete guide: ${route}`);
    if(snapshots){
     const directory=path.join(outputRoot,locale,'guideline',category);fs.mkdirSync(directory,{recursive:true});
     fs.writeFileSync(path.join(directory,'index.html'),await page.content());
    }
    const relative=`assets/guides/${locale}/${category}-${GUIDE_VERSION}.pdf`,target=path.join(outputRoot,relative);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    await page.pdf({path:target,format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,
     headerTemplate:'<div></div>',footerTemplate:`<div style="font-family:Arial,sans-serif;font-size:8px;width:100%;margin:0 16mm;display:flex;justify-content:space-between;color:#607084"><span>Smart JSA Bridge · ${locale} · ${GUIDE_VERSION}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
     margin:{top:'16mm',bottom:'18mm',left:'16mm',right:'16mm'}});
    const bytes=fs.readFileSync(target);if(bytes.subarray(0,5).toString()!=='%PDF-'||bytes.length<10000)throw new Error(`Invalid PDF: ${route}`);
    manifest.push({locale,category,route,pdf:`/${relative}`,version:GUIDE_VERSION,title:guideText(locale,category),examples:state.examples,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
   }
   console.log(`Guides ready: ${locale} (${categories.length} HTML/PDF pairs)`);
  }
  const manifestPath=path.join(outputRoot,'assets/guides/manifest.json');fs.mkdirSync(path.dirname(manifestPath),{recursive:true});fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2));
 }finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
 return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 await renderGuides({baseUrl:process.env.GUIDE_BASE_URL,outputRoot:process.env.GUIDE_OUTPUT_ROOT||'dist',
  locales:process.env.GUIDE_LOCALES?.split(',')||SUPPORTED_LANGS,categories:process.env.GUIDE_CATEGORIES?.split(',')||Object.keys(GUIDE_CATEGORIES)});
}
