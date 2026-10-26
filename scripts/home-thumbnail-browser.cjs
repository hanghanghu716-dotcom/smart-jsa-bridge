const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const puppeteer = require('puppeteer');
const root = path.resolve(__dirname,'..');
const out = process.env.JSA_QA_OUTPUT || path.join(os.tmpdir(),'smartjsa-thumbnail-qa');
const id = n => '10000000-0000-4000-8000-' + String(n).padStart(12,'0');
const revision = 'a'.repeat(32), ownerId=id(50);
const documentRow = {
 id:id(1),author_id:ownerId,title:'Risk assessment thumbnail QA',is_public:true,public_locale:'ko',public_country:'KR',
 assessment:{revision,review:'approved'},revision,step_count:24,excerpt:'Isolation, maintenance and safe restart',
 publication_context:{scope:'Isolation, maintenance and safe restart'},form_data:{projectName:'Thumbnail QA',jsaType:'3-step',ppe:[],permits:[],managerName:'PRIVATE_MANAGER'},
 custom_layout:{savedOrientation:'landscape',documentBlocks:[{id:'PROJECT_INFO',enabled:true},{id:'JSA_TABLE',enabled:true}]},
 analysis_data:Array.from({length:24},(_,i)=>({proc:{stepTitle:'Step '+(i+1),stepDetail:'Verify isolated equipment'},
 risks:[{factor:'Stored pressure',current_measure:'Isolate and verify zero pressure',recommend_measure:'Lock and tag each isolation point'}],frequency:2,severity:3})),
 published_at:'2026-10-25T00:00:00Z',content_updated_at:'2026-10-25T00:00:00Z',tags:[],
};
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({root,cacheDir:path.join(os.tmpdir(),'smartjsa-thumbnail-vite-cache'),server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});
 await server.listen();
 const base='http://127.0.0.1:'+server.httpServer.address().port;
 fs.mkdirSync(out,{recursive:true});
 let browser;
 try {
 browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:fs.mkdtempSync(path.join(out,'browser-')),dumpio:process.env.JSA_QA_DEBUG==='1',args:['--no-sandbox']});
  const page=await browser.newPage();await page.setViewport({width:1280,height:900});
  const errors=[],requests=[],writes=[];let legacy=false,published=false;
  let releaseThumbnail;const thumbnailReady=new Promise(resolve=>{releaseThumbnail=resolve;});
  page.on('pageerror',error=>errors.push(String(error)));
  const sample=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=720;c.height=509;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,720,509);x.fillStyle='#1667b1';x.fillRect(20,30,680,20);x.font='24px sans-serif';x.fillText('Saved risk assessment preview',30,100);return c.toDataURL('image/webp').split(',')[1];});
  await page.setRequestInterception(true);
  page.on('request',async request=>{
    const url=request.url(),u=new URL(url);requests.push(url);
    if(url.startsWith('data:')||url.startsWith('blob:'))return request.continue();
    if(u.pathname==='/api/jsa-thumbnail'){await thumbnailReady;return request.respond(u.searchParams.get('id')===id(2) ? {status:404,contentType:'text/plain',body:'Not found'} : {status:200,contentType:'image/webp',body:Buffer.from(sample,'base64')});}
    if(url.startsWith(base))return request.continue();
    if(request.method()==='OPTIONS')return request.respond({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
    if(u.hostname.endsWith('.supabase.co')){
      const q=u.searchParams;let data=[],status=200;
      if(u.pathname.includes('/auth/v1/user'))data={id:ownerId,email:'qa@example.invalid',aud:'authenticated',role:'authenticated'};
      else if(u.pathname.includes('/storage/v1/object/')){writes.push('image');data={Key:'jsa-thumbnails/'+id(1)+'/'+revision+'/risk-v1.webp'};}
      else if(u.pathname.endsWith('/jsa_thumbnail_assets')){
        if(request.method()==='POST'){writes.push('metadata');published=true;data=null;}else data=[];
      }else if(u.pathname.endsWith('/public_jsa_cards')){
        if(legacy){status=404;data={code:'PGRST205',message:'Missing view'};}
        else if(q.has('author_id'))data=published?[]:[{id:id(1),revision}];
        else data=Array.from({length:6},(_,i)=>({...documentRow,id:id(i+1),title:'Public task '+(i+1),thumbnail_revision:i<2?revision:null,thumbnail_width:720,thumbnail_height:509,form_data:undefined,analysis_data:undefined,custom_layout:undefined})).slice(Number(q.get('offset')||0),Number(q.get('offset')||0)+Number(q.get('limit')||6));
      }else if(u.pathname.endsWith('/public_jsa_catalog')){
        if(q.has('id'))data=[documentRow];
        else if((q.get('select')||'').includes('excerpt:'))data=Array.from({length:6},(_,i)=>({...documentRow,id:id(i+1),analysis_data:undefined,form_data:undefined,custom_layout:undefined})).slice(Number(q.get('offset')||0),Number(q.get('offset')||0)+Number(q.get('limit')||6));
      }
      if(Array.isArray(data) && q.get('or')){
        const afterId=q.get('or').match(/id[.]gt[.]([0-9a-f-]+)/)?.[1];
        if(afterId && (u.pathname.endsWith('/public_jsa_cards') || u.pathname.endsWith('/public_jsa_catalog'))) {
          data=Array.from({length:6},(_,i)=>({...documentRow,id:id(i+1),title:'Public task '+(i+1),thumbnail_revision:i<2?revision:null,thumbnail_width:720,thumbnail_height:509,form_data:undefined,analysis_data:undefined,custom_layout:undefined})).filter(row=>row.id>afterId).slice(0,Number(q.get('limit')||6));
        }
      }
      return request.respond({status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
    }
    return request.abort();
  });
  await page.goto(base+'/ko',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.home-resource-card');
  await page.click('.public-site-all-menu>summary');
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
   const colors=await page.$eval('.public-site-menu-panel',node=>({panel:getComputedStyle(node).color,link:getComputedStyle(node.querySelector('a')).color}));
   assert.equal(colors.link,colors.panel,'Full-menu links retain theme text color inside the blue masthead');
  }
  await page.evaluate(()=>{document.documentElement.dataset.theme='light';});
  await page.click('.public-site-all-menu>summary');
  await page.$eval('.home-public-section',n=>n.scrollIntoView());
  await page.waitForFunction(()=>document.querySelector('.risk-pdf-thumbnail img'));
  assert.equal(await page.$('.home-risk-thumbnail .document-paper'),null,'loading must never show a scope summary');
  const placeholder=await page.$eval('.home-risk-thumbnail',node=>({height:node.getBoundingClientRect().height,background:getComputedStyle(node).backgroundColor,opacity:getComputedStyle(node.querySelector('.risk-pdf-thumbnail')).opacity}));
  assert.ok(placeholder.height>100,'placeholder reserves the image height');
  assert.notEqual(placeholder.background,'rgba(0, 0, 0, 0)');assert.equal(placeholder.opacity,'0');
  releaseThumbnail();
  await page.waitForFunction(()=>document.querySelector('.risk-pdf-thumbnail img')?.naturalWidth>0&&getComputedStyle(document.querySelector('.risk-pdf-thumbnail')).opacity==='1');
  assert.equal(await page.$('.home-risk-thumbnail .document-paper'),null,'loaded image has no summary underneath');
  await page.$$eval('.home-resource-card',nodes=>nodes[1].scrollIntoView());
  await page.waitForFunction(()=>document.querySelectorAll('.home-resource-card')[1]?.querySelector('.risk-pdf-thumbnail')===null).catch(async error=>{
    console.error('Thumbnail states',await page.$$eval('.home-resource-card',nodes=>nodes.map(n=>({title:n.querySelector('h3')?.textContent,src:n.querySelector('img')?.src,complete:n.querySelector('img')?.complete,width:n.querySelector('img')?.naturalWidth}))));throw error;
  });
  assert.equal(await page.$$eval('.home-resource-card',nodes=>nodes.length),6);
  assert.equal(requests.filter(url=>/renderRiskThumbnail|RiskAssessmentThumbnail|html2canvas|jspdf/i.test(url)).length,0,'anonymous home must not load canvas/PDF code');
  const summaryReads=requests.filter(url=>url.includes('/rest/v1/public_jsa_cards'));
  assert.ok(summaryReads.length>0);
  for(const url of summaryReads)assert.doesNotMatch(new URL(url).searchParams.get('select'),/analysis_data|form_data|custom_layout/);
  await page.screenshot({path:path.join(out,'saved-thumbnail-home.png')});
  legacy=true;await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('.home-resource-card');
  assert.equal(await page.$$eval('.home-resource-card',nodes=>nodes.length),6);
  assert.equal(await page.$('.risk-thumbnail-renderer'),null);
  assert.equal(await page.$('.home-risk-thumbnail .document-paper'),null,'missing images retain only the blank placeholder');
  legacy=false;
  const captures=await page.evaluate(async row=>{
    const {renderRiskThumbnail}=await import('/src/utils/renderRiskThumbnail.jsx');
    const {publicJsaView}=await import('/src/utils/publicJsa.js');
    const {default:i18n}=await import('/src/i18n.js');
    const result=[];
    for(const theme of ['light','dark']){
      document.documentElement.dataset.theme=theme;
      const value=await renderRiskThumbnail(publicJsaView(row),i18n,new AbortController().signal);
      const buffer=await value.blob.arrayBuffer(),bytes=new Uint8Array(buffer);
      const image=await createImageBitmap(value.blob),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const context=canvas.getContext('2d');context.drawImage(image,0,0);
      const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
      let ink=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<200||pixels[i+1]<200||pixels[i+2]<200)ink++;
      result.push({theme,width:value.width,height:value.height,size:value.blob.size,type:value.blob.type,ink,corner:[...pixels.slice(0,4)],base64:btoa(String.fromCharCode(...bytes))});
    }
    return result;
  },documentRow);
  for(const capture of captures){
    assert.equal(capture.width,720);assert.equal(capture.height,509);assert.equal(capture.type,'image/webp');
    assert.ok(capture.size<200*1024);assert.ok(capture.ink>1000);assert.deepEqual(capture.corner,[255,255,255,255]);
    fs.writeFileSync(path.join(out,'risk-first-page-'+capture.theme+'.webp'),Buffer.from(capture.base64,'base64'));
  }
  assert.equal(await page.$('.risk-thumbnail-renderer'),null,'detached capture must clean up');
  const user={id:ownerId,email:'qa@example.invalid',aud:'authenticated',role:'authenticated'};
  const token=[{alg:'HS256',typ:'JWT'},{sub:ownerId,exp:Math.floor(Date.now()/1000)+3600},'fixture'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.');
  await page.evaluate(session=>localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token',JSON.stringify(session)),{access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user});
  await page.goto(base+'/ko/library',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>!document.querySelector('.risk-thumbnail-renderer'),{timeout:30000});
  const deadline=Date.now()+30000;while(!published&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,200));
  assert.equal(published,true,'workspace must generate and save existing public thumbnails');
  assert.deepEqual(writes,['image','metadata']);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:['metadata-only home','no PDF/canvas code on home','blank loading/error placeholder without summary overlap','old-schema fallback','first-page WebP in light/dark','owner workspace backfill'],captures:captures.map(({base64,...rest})=>rest),out},null,2));
 }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
