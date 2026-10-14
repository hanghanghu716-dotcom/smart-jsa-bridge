const assert = require('node:assert/strict');

async function verifyListPagination(browser, base) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().startsWith(base + '/') || /^(data|blob):/.test(request.url())) return request.continue();
    const headers = {'access-control-allow-origin':'*','access-control-allow-headers':'*'};
    if (request.method() === 'OPTIONS') return request.respond({status:204,headers});
    const locale = new URL(page.url()).pathname.split('/')[1];
    const rows = Array.from({length:210},(_,i)=>({
      id:'10000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),
      post_group_id:'fixture-'+(i+1),title:'Example '+String(i+1).padStart(3,'0'),
      meta_description:'Fixture case',language_code:locale,
      created_at:new Date(Date.UTC(2026,0,300-i)).toISOString(),
    }));
    if(request.url().includes('/rest/v1/'))return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(request.url().includes('/case_studies')?rows:[])});
    return request.abort();
  });
  const active=()=>page.$eval('.case-pagination [aria-current="page"]',el=>Number(el.textContent));
  const numbers=()=>page.$$eval('.case-pagination .list-pagination-number',els=>els.map(el=>Number(el.textContent)));
  const click=async kind=>{
    await page.$eval('.case-pagination .list-pagination-'+kind,el=>el.click());
  };
  try {
    for(const locale of ['ko','en-US','ar-SA']){
      await page.setViewport({width:1440,height:1000});
      await page.goto(base+'/'+locale+'/',{waitUntil:'networkidle2',timeout:60000});
      await page.waitForFunction(()=>document.querySelector('#case-study-results h5')?.textContent==='Example 001');
      assert.deepEqual(await numbers(),Array.from({length:15},(_,i)=>i+1));
      await click('next');
      assert.equal(await active(),16);
      assert.deepEqual(await numbers(),Array.from({length:15},(_,i)=>i+16));
      assert.equal(await page.$eval('#case-study-results h5',el=>el.textContent),'Example 091');
      await click('last');assert.equal(await active(),35);
      assert.deepEqual(await numbers(),[31,32,33,34,35]);
      assert.equal(await page.$eval('.case-pagination .list-pagination-last',el=>el.getAttribute('aria-disabled')),'true');
      await click('previous');assert.equal(await active(),16);
      await click('first');assert.equal(await active(),1);
      for(const width of [320,390,1440]){
        await page.setViewport({width,height:900});
        await page.waitForFunction(expected=>document.querySelectorAll('.case-pagination .list-pagination-number').length===expected,{},width<640?5:15);
        assert.equal(await page.$eval('.case-pagination',el=>{
          const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&el.scrollWidth<=el.clientWidth+1;
        }),true,locale+' pagination fits '+width);
      }
      await page.setViewport({width:390,height:844});
      await page.waitForFunction(()=>document.querySelectorAll('.case-pagination .list-pagination-number').length===5);
      await click('next');assert.equal(await active(),6);
      await page.type('#case-studies input','Example 00');
      await page.waitForFunction(()=>document.querySelector('.case-pagination [aria-current="page"]')?.textContent==='1');
      assert.deepEqual(await numbers(),[1,2]);
      await page.type('#case-studies input','1');
      await page.waitForFunction(()=>!document.querySelector('.case-pagination'));
      assert.equal(await page.$eval('#case-study-results h5',el=>el.textContent),'Example 001');
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({sharedPagination:true,desktopGroup:15,mobileGroup:5,firstLast:true,caseFilterReset:true,locales:3,widths:[320,390,1440]}));
  } finally { await page.close(); }
}
module.exports={verifyListPagination};
if(require.main===module){
  const puppeteer=require('puppeteer');
  (async()=>{const browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
    try{await verifyListPagination(browser,process.env.TEST_BASE_URL||'http://127.0.0.1:4173');}finally{await browser.close();}
  })().catch(error=>{console.error(error);process.exitCode=1;});
}
