import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseResourceLinks, robotsAllows, collectResourceSource, collectResourceBatch, reviewPlaceholder } from '../src/utils/resourceCollection.js';
import { parseResourceFeed } from '../src/utils/resourceFeed.js';
const source={id:'test',name:'Agency',domains:['official.example'],collection:{enabled:true,mode:'links',url:'https://official.example/news',review_until:'2099-01-01',item_prefixes:['/news/']}};

test('link discovery discards copied titles, body and attachments and scopes exact host/path',()=>{
 const html='<base href="https://evil.test"><script>bad()</script><a href=/news/one>Copyright title</a><a href=/news/one>duplicate</a><a href=/news/file.pdf>PDF</a><a href=https://evil.test/news/a>foreign</a><a href=/private/a>outside</a><a href=javascript:alert(1)>unsafe</a>';
 const rows=parseResourceLinks(html,source);
 assert.deepEqual(rows.map(x=>x.url),['https://official.example/news/one','https://official.example/news/file.pdf']);
 assert.ok(rows.every(r=>r.title===reviewPlaceholder(source)&&r.source_date===null));
 assert.ok(!JSON.stringify(rows).includes('Copyright'));
 assert.equal(parseResourceLinks(Array.from({length:80},(_,i)=>`<a href=/news/${i}>x</a>`).join(''),source).length,40);
});
test('Japanese notices only traverse the selected labour section',()=>{
 const scoped={...source,collection:{...source.collection,section_start:'labour',section_end:'other'}};
 assert.deepEqual(parseResourceLinks('<a href=/news/health>x</a><a name=labour></a><a href=/news/work>x</a><a name=other></a><a href=/news/other>x</a>',scoped).map(x=>x.url),['https://official.example/news/work']);
 assert.equal(parseResourceLinks('<a href=/news/health>x</a>',scoped).length,0);
});
test('robots exact agent groups, wildcards and longest allow rules are respected',()=>{
 const text='User-agent: *\nDisallow: /\nUser-agent: SmartJSABridge-ResourceReader\nDisallow: /private*\nAllow: /private/news$';
 assert.equal(robotsAllows(text,'https://official.example/news'),true);
 assert.equal(robotsAllows(text,'https://official.example/private/news'),true);
 assert.equal(robotsAllows(text,'https://official.example/private/news?a=1'),false);
 assert.equal(robotsAllows(text,'https://official.example/news','OtherBot'),false);
 assert.equal(robotsAllows('User-agent: *\nDisallow:',source.collection.url),true);
 assert.equal(robotsAllows('User-agent: SmartJSA\nAllow: /news\nUser-agent: SmartJSABridge-ResourceReader\nDisallow: /',source.collection.url),false);
});
test('collector fails closed for expiry, denied robots, redirects and invalid robot responses',async()=>{
 let calls=0;
 await assert.rejects(collectResourceSource({...source,collection:{...source.collection,review_until:'2000-01-01'}},async()=>{calls++;}),/DISABLED/);
 assert.equal(calls,0);
 for(const response of [new Response('User-agent: *\nDisallow: /',{headers:{'Content-Type':'text/plain'}}),new Response('',{status:302}),new Response('<html>challenge</html>',{headers:{'Content-Type':'text/html'}})]){
  calls=0;await assert.rejects(collectResourceSource(source,async()=>{calls++;return response;}),/ROBOTS_/);assert.equal(calls,1);
 }
});
test('URL-only fetch never follows or downloads discovered PDF links',async()=>{
 const calls=[];const rows=await collectResourceSource(source,async(url,options)=>{
  calls.push(url);assert.equal(options.redirect,'manual');
  return url.endsWith('robots.txt')?new Response('',{status:404}):new Response('<a href=/news/file.pdf>Protected title</a>',{headers:{'Content-Type':'text/html'}});
 });
 assert.equal(calls.length,2);assert.equal(rows[0].title,reviewPlaceholder(source));
});
test('batch records actual inserted counts; one blocked country does not abort others',async()=>{
 const sources=[{...source,id:'blocked',collection:{...source.collection,enabled:false}},source],commits=[];
 const results=await collectResourceBatch(sources,async(id,items,status)=>{commits.push({id,items,status});return {inserted:0};},async u=>u.endsWith('robots.txt')?new Response('',{status:404}):new Response('<a href=/news/a>x</a>',{headers:{'Content-Type':'text/html'}}));
 assert.equal(results[0].error,'SOURCE_DISABLED');assert.equal(results[1].discovered,1);assert.equal(results[1].inserted,0);assert.equal(commits.length,2);
});
test('official RSS variants preserve dates and only approved destinations',()=>{
 const xml='<rss><channel><item><title>Notice</title><link>http://official.example/news/a</link><pubdate>27/10/2026</pubdate></item><item><title>External</title><link>http://evil.test/a</link></item></channel></rss>';
 assert.deepEqual(parseResourceFeed(xml,{...source,collection:{date_format:'dmy'}}),[{title:'Notice',url:'https://official.example/news/a',source_date:'2026-10-27'}]);
 const rdf='<rdf:RDF><item><title>Notice</title><link>https://official.example/news/a</link><dc:date>2026-10-28</dc:date></item></rdf:RDF>';
 assert.equal(parseResourceFeed(rdf,source)[0].source_date,'2026-10-28');
});
test('all collection registry entries have evidence, expiration or explicit disabled reason',()=>{
 const sources=JSON.parse(readFileSync(new URL('../src/data/resource-sources.json',import.meta.url)));
 for(const s of sources){
  const c=s.collection;assert.ok(c?.note,s.id);
  if(c.enabled){assert.ok(c.evidence_urls.length,s.id);assert.ok(c.review_until,s.id);assert.ok(s.domains.includes(new URL(c.url).hostname),s.id);}
 }
 assert.equal(sources.find(s=>s.id==='official-en-sg').active,false);
});
