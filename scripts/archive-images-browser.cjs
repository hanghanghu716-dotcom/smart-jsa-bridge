const assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const storage='https://aajvezmhyrdawxxbulqz.supabase.co/storage/v1/object/public/';
const imageFixture=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#147bc1"/></svg>');
(async()=>{
 const live=process.argv.includes('--live');let server,browser;
 try{
  if(!live){const {preview}=await import('vite');server=await preview({preview:{host:'127.0.0.1',port:0},logLevel:'silent'});}
  const base=live?'https://smartjsabridge.com':'http://127.0.0.1:'+server.httpServer.address().port;
  browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH,args:['--no-sandbox']});
  const page=await browser.newPage(),errors=[],pdfReads=[],bodyReads=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/\.pdf(?:[?#]|$)|pdf\.worker/.test(request.url()))pdfReads.push(request.url());});
  if(!live){
   await page.setRequestInterception(true);
   page.on('request',request=>{
    const url=request.url(),headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'};
    if(url.startsWith(base+'/')||/^(data|blob):/.test(url))return request.continue();
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    const u=new URL(url),q=u.searchParams;
    if(url.startsWith(storage+'blog-images/archive-fixture/'))return request.respond({status:200,headers,contentType:'image/svg+xml',body:imageFixture});
    if(u.pathname.endsWith('/case_studies')){
     const locale=new URL(page.url()).pathname.split('/')[1];
     let rows=Array.from({length:30},(_,i)=>({
      id:'10000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),post_group_id:'example-'+(i+1),
      title:'Example '+String(i+1).padStart(3,'0'),meta_description:'A case with its own article image.',language_code:locale,
      created_at:new Date(Date.UTC(2026,0,30-i)).toISOString(),content_updated_at:'2026-10-28T00:00:00Z',
      content_md:'<img src="'+storage+'blog-images/archive-fixture/'+(i+1)+'.png">',
      pdf_download_url:storage+'case-pdf/archive-fixture/'+(i+1)+'.pdf'
     }));
     const filter=q.get('id')||'';
     if(filter.startsWith('gt.'))rows=rows.filter(row=>row.id>filter.slice(3));
     if(filter.startsWith('in.'))rows=rows.filter(row=>filter.includes(row.id));
     rows=rows.slice(0,Number(q.get('limit')||500));
     if(q.get('select')==='id,content_md'){assert.ok(rows.length<=3);bodyReads.push(rows.map(row=>row.id));}
     const fields=q.get('select').split(',');rows=rows.map(row=>Object.fromEntries(fields.map(key=>[key,row[key]])));
     return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(rows)});
    }
    if(u.pathname.includes('/rest/v1/')||u.pathname.includes('/auth/v1/'))return request.respond({status:200,headers,contentType:'application/json',body:'[]'});
    return request.abort();
   });
  }
  const ready=async first=>page.waitForFunction(first=>{
   const cards=[...document.querySelectorAll('.archive-card')];
   return cards.length===12&&(!first||cards[0].querySelector('h2').textContent===first)&&cards.every(card=>card.querySelectorAll('.archive-card-image').length===1);
  },{timeout:45000},first);
  for(const locale of live?['ko']:['ko','en-US','ar-SA']){
   await page.setViewport({width:1440,height:1100});
   await page.goto(base+'/'+locale+'/archive',{waitUntil:'domcontentloaded',timeout:60000});
   await ready(live?'':'Example 001');
   await page.waitForFunction(()=>{const img=document.querySelector('.archive-card-image');return img.complete&&img.naturalWidth>0;});
   assert.equal(await page.$('.archive-card .document-paper,.archive-card .archive-thumbnail,.archive-card .document-preview-badge,.archive-card canvas,.archive-card iframe'),null);
   if(live){
    const cards=await page.$$eval('.archive-card',nodes=>nodes.map(node=>({href:node.querySelector('h2 a').href,image:node.querySelector('.archive-card-image').src})));
    const {caseThumbnail}=await import('../src/utils/caseThumbnail.js');
    for(const card of cards.slice(0,3)){
     const response=await fetch(card.href);assert.equal(response.status,200);
     const html=await response.text(),article=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
     assert.ok(article,'Public article body');assert.equal(card.image,caseThumbnail(article[1]),'Thumbnail is the image in this article');
    }
    await page.screenshot({path:'.cache/archive-live-images.png'});
    console.log('ARCHIVE_REVIEW:'+Buffer.from(await page.screenshot()).toString('base64'));
   }else{
    const checkImages=async()=>assert.equal(await page.$$eval('.archive-card',cards=>cards.every(card=>{
     const n=Number(card.querySelector('h2').textContent.split(' ').pop());
     return card.querySelector('img').src.endsWith('/'+n+'.png');
    })),true);
    await checkImages();
    await page.$$eval('.list-pagination-number',links=>links.find(link=>link.textContent==='2').click());await ready('Example 013');await checkImages();
    await page.type('.archive-search input','Example 020');
    await page.waitForFunction(()=>document.querySelectorAll('.archive-card').length===1&&document.querySelector('.archive-card-image')?.src.endsWith('/20.png'));
    await page.click('.archive-reset');await ready('Example 001');await checkImages();
   }
   for(const theme of ['light','dark']){
    await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
    for(const width of [320,390,1440]){
     await page.setViewport({width,height:1000});
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
     assert.equal(await page.$('.archive-card .document-paper,.archive-card .archive-thumbnail,.archive-card canvas,.archive-card iframe'),null);
    }
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(pdfReads,[]);
  console.log(JSON.stringify({archiveArticleImages:true,mode:live?'production':'fixture',cardsPerPage:12,locales:live?1:3,matchingArticleImages:live?3:24,duplicatePreviews:0,pdfRequests:0,maxBodyBatch:live?null:Math.max(...bodyReads.map(ids=>ids.length))}));
 }finally{await browser?.close();await new Promise(resolve=>server?.httpServer?server.httpServer.close(resolve):resolve());}
})().catch(error=>{console.error(error);process.exitCode=1;});
