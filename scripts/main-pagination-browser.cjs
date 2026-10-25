const assert = require('node:assert/strict');

// The home now exposes a short public catalog; full browsing lives in Explore.
async function verifyHomeDiscovery(browser, base) {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().startsWith(base + '/') || /^(data|blob):/.test(request.url())) return request.continue();
    const headers = {'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-expose-headers':'content-range'};
    if (request.method() === 'OPTIONS') return request.respond({status:204,headers});
    const url=new URL(request.url()),locale = new URL(page.url()).pathname.split('/')[1],country={ko:'KR','en-US':'US','ar-SA':'SA'}[locale];
    const cases = Array.from({length:210},(_,i)=>({
      id:'10000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),
      post_group_id:'fixture-'+(i+1),title:'Example '+String(i+1).padStart(3,'0'),
      meta_description:'Fixture case',language_code:locale,
      created_at:new Date(Date.UTC(2026,0,300-i)).toISOString(),
    }));
    let rows=[];
    if(url.pathname.endsWith('/case_studies'))rows=cases;
    if(url.pathname.endsWith('/public_jsa_catalog')){
      const documents=cases.slice(0,12).map(c=>({id:c.id,title:'Valve task '+c.title,is_public:true,public_locale:locale,public_country:country,
        publication_context:{scope:'Authored valve task scope.'},analysis_data:[{proc:{stepTitle:'Isolation',stepDetail:'Verify the boundary.'},risks:[{factor:'Pressure',measure:'Verify zero pressure.'}]}],tags:[]}));
      const selected=url.searchParams.get('id')?.slice(4,-1).split(',');
      rows=documents.filter(d=>!selected||selected.includes(d.id));
      if(url.searchParams.get('select')==='id')rows=rows.map(({id})=>({id}));
      headers['content-range']='0-'+(rows.length-1)+'/12';
    }
    if(url.pathname.includes('/rest/v1/'))return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(rows)});
    return request.abort();
  });
  try {
    for(const locale of ['ko','en-US','ar-SA']){
      await page.setViewport({width:1440,height:1000});
      await page.goto(base+'/'+locale+'/',{waitUntil:'networkidle2',timeout:60000});
      await page.waitForFunction(()=>document.querySelectorAll('.home-resource-card').length===6&&document.querySelector('.home-case-card h3')?.textContent==='Example 001');
      assert.equal(await page.$$eval('.home-case-card',cards=>cards.length),3);
      assert.equal(await page.$('.case-pagination'),null,'Full catalog navigation belongs in Explore');
      assert.equal(await page.$$eval('.home-resource-card h3 a',links=>links.every(a=>a.href.includes('/public-jsa/'))),true);
      assert.equal(await page.$$eval('.public-site-footer nav a',links=>links.length),5);
      for(const width of [320,390,1440]){
        await page.setViewport({width,height:900});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,locale+' home fits '+width);
      }
      await page.click('.home-intro .home-create');
      await page.waitForSelector('[role="dialog"]');
      await page.keyboard.press('Escape');
      await page.waitForSelector('[role="dialog"]',{hidden:true});
      assert.equal(await page.$eval('.home-intro .home-create',el=>document.activeElement===el),true,'Return focus after closing the guest dialog');
      await page.type('.home-search input','Valve');await page.click('.home-search button');
      await page.waitForFunction(()=>location.pathname.endsWith('/explore')&&new URL(location.href).searchParams.get('q')==='Valve');
      assert.equal(new URL(page.url()).searchParams.get('country'),{ko:'KR','en-US':'US','ar-SA':'SA'}[locale]);
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({homeDiscovery:true,publicCards:6,caseArticles:3,searchRouting:true,guestDialogFocus:true,locales:3,widths:[320,390,1440]}));
  } finally { await page.close(); }
}
module.exports={verifyHomeDiscovery};
if(require.main===module){
  const puppeteer=require('puppeteer');
  (async()=>{const browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
    try{await verifyHomeDiscovery(browser,process.env.TEST_BASE_URL||'http://127.0.0.1:4173');}finally{await browser.close();}
  })().catch(error=>{console.error(error);process.exitCode=1;});
}
