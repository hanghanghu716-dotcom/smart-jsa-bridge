// Read-only HTTP audit of a JSON URL array exported from Search Console.
// Does not submit indexing requests or change any stored content.
import fs from 'node:fs';
import { parse } from 'parse5';
const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error('Usage: node scripts/audit-indexing-urls.js input.json output.json');
const urls = [...new Set(JSON.parse(fs.readFileSync(input, 'utf8')))];
for (const url of urls) if (new URL(url).origin !== 'https://smartjsabridge.com') throw Error('Unexpected audit origin');
const attr = (n, key) => n.attrs?.find(a => a.name === key)?.value;
const nodes = (n, match) => [...(match(n) ? [n] : []), ...(n.childNodes || []).flatMap(c => nodes(c, match))];
const results = [];
let next = 0;
async function worker() {
 while (next < urls.length) {
  const url = urls[next++], start = Date.now();
  try {
   const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
   const body = await response.text(), tree = parse(body);
   const canonical = nodes(tree, n => n.tagName === 'link' && attr(n,'rel') === 'canonical').map(n => attr(n,'href'));
   const robots = nodes(tree, n => n.tagName === 'meta' && attr(n,'name') === 'robots').map(n => attr(n,'content'));
   const snapshot = nodes(tree, n => n.tagName === 'script' && attr(n,'id') === 'jsa-case-bootstrap')[0];
   const post = snapshot ? JSON.parse(snapshot.childNodes[0].value).post : null;
   results.push({url,status:response.status,location:response.headers.get('location'),ms:Date.now()-start,canonical,robots,
    articleId:post?.id,articleLocale:post?.language_code,articleCharacters:post?.content_md?.length || 0});
  } catch(error) { results.push({url,error:error.message,ms:Date.now()-start}); }
  if(results.length % 50 === 0) console.log(`Checked ${results.length}/${urls.length}`);
 }
}
await Promise.all([worker(), worker()]);
const summary = results.reduce((out,row)=>{const key=row.error?'request-error':String(row.status);out[key]=(out[key]||0)+1;return out;},{});
fs.writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),summary,results},null,2));
console.log(JSON.stringify({summary,missingArticle:results.filter(r=>r.status===200&&r.url.includes('/case-study/')&&!r.articleCharacters).length,
 noindex:results.filter(r=>r.robots?.some(v=>v.includes('noindex'))).length,output}));
