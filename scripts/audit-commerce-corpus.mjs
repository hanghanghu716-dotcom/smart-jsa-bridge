// node scripts/audit-commerce-corpus.mjs <snapshots.json> <private-catalog.json> <report.json>
// Inputs and detailed reports belong outside public Git. No affiliate URLs or
// account identifiers are copied into the audit output.
import { readFile, writeFile } from 'node:fs/promises';
import { selectOffers } from '../server/commerce/engine.js';
import { parseCatalog } from '../server/commerce/catalog.js';
const [input,catalogPath,output]=process.argv.slice(2);
if(!input||!catalogPath||!output)throw Error('Provide snapshot, catalog and report paths');
const snapshots=JSON.parse(await readFile(input,'utf8'));
const catalog=parseCatalog(await readFile(catalogPath,'utf8'));
const now=Date.now();
const rows=snapshots.map(snapshot=>{
 const items=selectOffers({snapshot,catalog,country:'KR',now});
 return {kind:snapshot.kind,id:snapshot.routeId||snapshot.id,locale:snapshot.locale,title:snapshot.title,
  items:items.map(({id,title,category})=>({id,title,category}))};
});
const summarize=list=>({total:list.length,zero:list.filter(x=>!x.items.length).length,one:list.filter(x=>x.items.length===1).length,multiple:list.filter(x=>x.items.length>=2).length,four:list.filter(x=>x.items.length===4).length});
const report={checkedAt:new Date(now).toISOString(),country:'KR',products:catalog.offers.length,
 summary:summarize(rows),locales:Object.fromEntries([...new Set(rows.map(x=>x.locale))].map(l=>[l,summarize(rows.filter(x=>x.locale===l))])),
 usage:Object.fromEntries(catalog.offers.map(o=>[o.category,rows.filter(x=>x.items.some(i=>i.category===o.category)).length])),rows};
await writeFile(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({products:report.products,summary:report.summary,locales:report.locales,usage:report.usage},null,2));
