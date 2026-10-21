import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { refreshCatalog, downloadFeed } from '../server/commerce/ingest.js';
import { parseCatalog } from '../server/commerce/catalog.js';
import { readProjectEnv } from '../server/supabase-config.js';
const [configPath='data/commerce/feeds.json', governancePath='data/commerce/governance.json', outputPath='data/commerce/catalog.json']=process.argv.slice(2);
const config=JSON.parse(await readFile(resolve(configPath),'utf8'));
const governance=JSON.parse(await readFile(resolve(governancePath),'utf8'));
const env=readProjectEnv();
const {catalog,failedFeeds}=await refreshCatalog({config,governance,loadFeed:feed=>downloadFeed(feed,env)});
const serialized=JSON.stringify(catalog,null,2)+'\n';
parseCatalog(serialized);
const output=resolve(outputPath);
await mkdir(dirname(output),{recursive:true});
const temporary=output+'.'+process.pid+'.tmp';
await writeFile(temporary,serialized,{mode:0o600});
await rename(temporary,output);
console.log(JSON.stringify({offers:catalog.offers.length,failedFeeds}));
// A failed feed is removed from the replacement snapshot, not retained stale.
// Publish this replacement even on partial failure, then alert on failedFeeds.
