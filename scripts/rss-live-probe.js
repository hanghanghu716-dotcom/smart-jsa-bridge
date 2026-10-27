import { mkdir,writeFile } from 'node:fs/promises';
import { createContentFeedHandler } from '../api/content-feed.js';
// Public read-only candidate probe; no credentials beyond the publishable key.
await mkdir('.cache',{recursive:true});
const report=[];
for(const locale of ['ko','en-US']){
 const start=performance.now();let calls=0,active=0,peak=0;
 const handler=createContentFeedHandler({fetcher:async(url,options)=>{
  calls++;active++;peak=Math.max(peak,active);
  try{return await fetch(url,options);}finally{active--;}
 }});
 const res={setHeader(){},end(body){this.body=body;}};
 await handler({query:{kind:'rss',lng:locale},headers:{}},res);
 if(res.statusCode!==200)throw Error('RSS_CANDIDATE_FAILED: '+locale+' HTTP '+res.statusCode);
 await writeFile('.cache/rss-'+locale+'.xml',res.body);
 report.push({locale,milliseconds:Math.round(performance.now()-start),calls,peak,bytes:Buffer.byteLength(res.body)});
}
console.log('RSS_CANDIDATE_PROBE '+JSON.stringify(report));
