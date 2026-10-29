import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';

// Isolated component harness: no production login, MFA enrollment or network writes.
const mock=`export const supabase={auth:{
 getUser:async()=>({data:{user:{app_metadata:{role:window.fixtureRole||'admin'}}}}),
 mfa:{
  listFactors:async()=>({data:{all:[{id:'unfinished',factor_type:'totp',status:'unverified'}],totp:window.existingFactor?[{id:'verified',status:'verified'}]:[]}}),
  getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal1'}}),
  unenroll:async({factorId})=>{window.removed=factorId;return{};},
  enroll:async()=>{window.enrolls=(window.enrolls||0)+1;return {data:{id:'new-factor',totp:{secret:'JBSWY3DPEHPK3PXP',qr_code:'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path fill="#000" d="M0 0h20v20H0z"/></svg>'}}};},
  challengeAndVerify:async(args)=>{window.challengeArgs=args;return args.code==='123456'?{}:{error:new Error('fixture rejection')};}
 }}};`;
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{
 name:'isolated-mfa-fixture',enforce:'pre',
 resolveId(id,importer){if(importer?.replaceAll('\\','/').endsWith('/AdminVerification.jsx')){
  if(id==='../supabaseClient')return '\0mfa-client';
  if(id==='react-i18next')return '\0mfa-locale';
 }},
 load(id){if(id==='\0mfa-client')return mock;if(id==='\0mfa-locale')return `export const useTranslation=()=>({i18n:{language:'ko'}});`;},
 configureServer(s){s.middlewares.use(async(req,res,next)=>{
  if(req.url!=='/__mfa-test')return next();
  const html=await s.transformIndexHtml('/__mfa-test','<html><body><div id="root"></div><script type="module">import React from "react";import {createRoot} from "react-dom/client";import Component from "/src/components/AdminVerification.jsx";createRoot(document.getElementById("root")).render(React.createElement(Component,{onVerified:()=>window.didVerify=true}));</script></body></html>');
  res.setHeader('Content-Type','text/html');res.end(html);
 });}
}]});
let browser;
try{
 await server.listen();const base='http://127.0.0.1:'+server.httpServer.address().port;
 browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base)||r.url().startsWith('data:')?r.continue():r.abort());
 await page.setViewport({width:360,height:800});await page.goto(base+'/__mfa-test');await page.waitForSelector('button');await page.click('button');
 await page.waitForSelector('summary');await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);
 assert.equal(await page.evaluate(()=>window.removed),'unfinished');
 assert.equal(await page.$eval('img',e=>getComputedStyle(e.parentElement).backgroundColor),'rgb(255, 255, 255)');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.click('summary');assert.equal(await page.$eval('code',e=>e.textContent),'JBSWY3DPEHPK3PXP');
 assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,'Enrollment key is not persisted');
 await page.type('input','111111');await page.click('form button');await page.waitForSelector('[role=alert]');assert.ok(await page.$('code'),'Manual key remains available after invalid OTP');
 await page.$eval('input',e=>e.select());await page.type('input','123456');await page.click('form button');await page.waitForSelector('[role=status]');
 assert.equal(await page.$('code'),null);assert.equal(await page.$('img'),null);assert.equal(await page.evaluate(()=>window.didVerify),true);
 await page.reload();await page.waitForSelector('button');await page.click('button');await page.waitForSelector('img');await page.$eval('img',e=>e.dispatchEvent(new Event('error')));
 await page.waitForFunction(()=>document.querySelector('details')?.open);assert.equal(await page.$('img'),null);
 await page.evaluateOnNewDocument(()=>{window.existingFactor=true;});await page.reload();await page.waitForSelector('form');assert.equal(await page.$('details'),null);assert.equal(await page.evaluate(()=>window.enrolls||0),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: mobile QR rendering, manual key, invalid/valid OTP, secret clearing, broken-image fallback, verified-factor flow; no real account writes');
}finally{await browser?.close();await server.close();}
