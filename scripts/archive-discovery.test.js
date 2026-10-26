import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveQuery, archiveSearch, archiveResults, loadArchiveRows, previewPdfUrl, casePdf } from '../src/utils/archiveDiscovery.js';
import { browseTags, TAG_GROUPS } from '../src/utils/tagBrowser.js';
import { archiveUi } from '../src/locales/archiveUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { homePublicCards } from '../src/utils/homePublicCatalog.js';
import { renderDocumentThumbnail } from '../src/utils/documentThumbnail.js';
import { renderIndexHtml } from '../api/content-index.js';
const rows = Array.from({length:30},(_,i)=>({id:String(i+1).padStart(4,'0'),post_group_id:'case-'+i,language_code:'ko',title:(i%2?'용접':'배관')+' 작업 '+i,meta_description:'<p>압력 점검</p>',created_at:(i<10?'2025':'2026')+'-10-'+String(i%20+1).padStart(2,'0'),pdf_download_url:i%3?'https://smartjsabridge.com/test.pdf':''}));
test('archive combines search, PDF and year filters and resets malformed URL values',()=>{
 const query=archiveQuery('?q=용접 압력&pdf=1&year=2026&sort=oldest&page=2');
 const result=archiveResults(rows,query,'ko');
 assert.ok(result.total>0);assert.equal(result.page,1);
 assert.ok(result.rows.every(r=>r.title.includes('용접')&&casePdf(r)&&r.created_at.startsWith('2026')));
 assert.deepEqual(archiveQuery(archiveSearch(query)),query);
 assert.deepEqual(archiveQuery('?sort=oops&page=-5&year=x'),{search:'',pdf:false,year:'',sort:'latest',page:1});
});
test('archive pagination is stable and covers all matches without mutating input',()=>{
 const before=JSON.stringify(rows), q=archiveQuery();
 const found=[1,2,3].flatMap(page=>archiveResults(rows,{...q,page},'ko').rows.map(r=>r.id));
 assert.equal(new Set(found).size,30);assert.equal(found.length,30);assert.equal(JSON.stringify(rows),before);
 const title=archiveResults(rows,{...q,sort:'title'},'ko').rows;
 assert.ok(title.findIndex(r=>r.title==='배관 작업 2')<title.findIndex(r=>r.title==='배관 작업 10'));
 assert.equal(archiveResults(rows,{...q,search:'NO_MATCH'},'ko').total,0);
});
test('keyset read does not truncate when the service caps a response below requested limit',async()=>{
 const records=rows.slice(0,7), calls=[];
 const client={from:()=>{let after='';const q={select:()=>q,in:()=>q,order:()=>q,limit:()=>q,abortSignal:()=>q,gt:(_k,v)=>{after=v;return q;},then:resolve=>{calls.push(after);return Promise.resolve(resolve({data:records.filter(r=>r.id>after).slice(0,2)}));}};return q;}};
 const result=await loadArchiveRows(client,'ko',new AbortController().signal);
 assert.equal(result.length,7);assert.deepEqual(calls,['','0002','0004','0006','0007']);
 await assert.rejects(loadArchiveRows({from:()=>{const q={select:()=>q,in:()=>q,order:()=>q,limit:()=>q,abortSignal:()=>q,then:r=>Promise.resolve(r({error:Error('unavailable')}))};return q;}},'ko'),/unavailable/);
});
test('all localized tag catalogs remain navigable, including equipment and accident tags',()=>{
 for(const locale of SUPPORTED_LANGS){const tags=browseTags(locale);assert.ok(tags.length>100,locale);for(const [group]of TAG_GROUPS)assert.ok(browseTags(locale,'',group).length>0,locale+group);assert.ok(Object.values(archiveUi(locale)).every(v=>typeof v==='string'&&v.length));if(!locale.startsWith('en'))assert.notEqual(archiveUi(locale).title,archiveUi('en-US').title);}
 assert.ok(browseTags('ko','용접').length>1);assert.equal(browseTags('ko','NO_MATCH').length,0);
});
test('only public first-party PDF URLs are rasterized; unsafe links never fetch',()=>{
 for(const value of ['javascript:alert(1)','https://tracker.example/a.pdf','https://user:pass@smartjsabridge.com/a.pdf','https://aajvezmhyrdawxxbulqz.supabase.co/storage/v1/object/sign/private/a.pdf'])assert.equal(previewPdfUrl(value),'');
 assert.ok(previewPdfUrl('https://smartjsabridge.com/a.pdf'));
});
test('document thumbnails use real bounded public excerpts and escape markup without private fields',()=>{
 const card=homePublicCards([{id:'10000000-0000-4000-8000-000000000001',is_public:true,title:'<img src=x>',public_country:'KR',public_locale:'ko',form_data:{managerName:'PRIVATE'},analysis_data:Array.from({length:20},()=>({proc:{stepTitle:'Isolate'},risks:[{factor:'Pressure',measure:'<script>evil</script>'+('Long '.repeat(100))}]}))}],'ko')[0];
 assert.equal(card.preview.length,3);assert.ok(card.preview[0].control.length<110);assert.equal(card.preview[0].step,'Isolate');assert.doesNotMatch(JSON.stringify(card),/PRIVATE|managerName/);
 const html=renderDocumentThumbnail(card,'ko');assert.doesNotMatch(html,/<img|<script/);assert.equal(card.preview[0].hazard,'Pressure');
});
test('server archive matches filtered page and escapes titles while preserving non-JS navigation',()=>{
 const shell='<html><head><link rel="canonical" href="old"></head><body><section data-live-case-list="archive"></section></body></html>';
 const html=renderIndexHtml(shell,rows,'ko','archive',null,archiveQuery('?q=용접&sort=oldest'));
 assert.match(html,/archive-card/);assert.match(html,/noindex,follow/);assert.match(html,/q=%EC%9A%A9%EC%A0%91/);assert.match(html,/JSA/);
 const page2=renderIndexHtml(shell,rows,'ko','archive',null,archiveQuery('?page=2'));
 assert.ok(page2.includes('href="https://smartjsabridge.com/ko/archive?page=2"'));
 assert.equal((page2.match(/class="archive-card"/g)||[]).length,12);
});
