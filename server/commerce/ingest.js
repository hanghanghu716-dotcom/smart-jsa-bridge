import { COUNTRIES, safeLink } from './engine.js';
const MAX_BYTES=8_000_000;
export function parseCsv(input, delimiter=',') {
 if(![',',';','\t'].includes(delimiter))throw Error('INVALID_DELIMITER');
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<input.length;i++){
   const c=input[i];
   if(c==='"'){if(quoted && input[i+1]==='"'){value+='"';i++;}else if(quoted || value==='')quoted=!quoted;else throw Error('INVALID_CSV');}
   else if(c===delimiter&&!quoted){row.push(value);value='';}
   else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&input[i+1]==='\n')i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';}
   else value+=c;
 }
 if(quoted)throw Error('INVALID_CSV');
 row.push(value);if(row.some(Boolean))rows.push(row);
 const header=rows.shift()?.map(h=>h.replace(/^\uFEFF/,''));
 if(!header?.length||new Set(header).size!==header.length)throw Error('INVALID_HEADER');
 return rows.map(values=>{if(values.length!==header.length)throw Error('INVALID_ROW');return Object.fromEntries(header.map((key,i)=>[key,values[i]]));});
}
export function normalizeFeed(rows, feed, merchant, now=Date.now()) {
 if(!Array.isArray(rows)||rows.length>5000||!merchant||merchant.id!==feed.merchantId)throw Error('INVALID_FEED');
 if(!COUNTRIES.includes(feed.country)||!merchant.countries?.includes(feed.country))throw Error('INVALID_COUNTRY');
 const map=feed.fields||{}, offers=[],seen=new Set();
 const ttl=Math.min(Number(merchant.maxAgeHours),24);
 if(!Number.isFinite(ttl)||ttl<=0)throw Error('INVALID_TTL');
 for(const row of rows){
   if(!row||typeof row!=='object')continue;
   const id=String(row[map.id]??''),title=String(row[map.title]??'');
   const category=feed.categories?.[String(row[map.category]??'')];
   const affiliateUrl=safeLink(row[map.affiliateUrl],merchant.linkHosts);
   // Unknown stock, category, country or tracking host is never guessed.
   if(!id||seen.has(id)||!title||title.length>240||!category||!affiliateUrl
     ||!feed.inStockValues?.includes(String(row[map.availability]??'')))continue;
   seen.add(id);
   const attributes={};
   for(const [key,column] of Object.entries(feed.attributes||{})){
     const value=row[column];if(typeof value==='string'&&value)attributes[key]=value;
   }
   offers.push({id,merchantId:merchant.id,country:feed.country,title,category,affiliateUrl,attributes,
     availability:'in_stock',checkedAt:new Date(now).toISOString(),expiresAt:new Date(now+ttl*3600000).toISOString()});
 }
 return offers;
}
export async function refreshCatalog({config,governance,loadFeed,now=Date.now()}) {
 if(config.version!==1||governance.version!==1||!Array.isArray(config.feeds)||!Array.isArray(governance.merchants))throw Error('INVALID_CONFIG');
 const offers=[],failedFeeds=[];
 for(const feed of config.feeds){
   try{
     const merchant=governance.merchants.find(m=>m.id===feed.merchantId);
     if(!merchant||merchant.affiliateApproved!==true||merchant.displayApproved!==true||merchant.enabled!==true)continue;
     const body=await loadFeed(feed);
     if(Buffer.byteLength(body)>MAX_BYTES)throw Error('FEED_TOO_LARGE');
     const rows=feed.format==='csv'?parseCsv(body,feed.delimiter||','):feed.format==='json'?JSON.parse(body):null;
     offers.push(...normalizeFeed(rows,feed,merchant,now));
   }catch{failedFeeds.push(String(feed.id||feed.merchantId));}
 }
 if(offers.length>5000)throw Error('CATALOG_TOO_LARGE');
 // Supplier content cannot approve itself. Governance is owned by the operator.
 return {catalog:{version:1,generatedAt:new Date(now).toISOString(),merchants:governance.merchants,
   reviews:governance.reviews||[],profiles:governance.profiles||[],offers},failedFeeds};
}
export async function downloadFeed(feed,env=process.env,fetcher=fetch) {
 const endpoint=env[feed.urlEnv];
 const url=new URL(endpoint);
 if(url.protocol!=='https:'||!feed.allowedHosts?.includes(url.hostname)||url.username||url.password||url.port)throw Error('INVALID_FEED_HOST');
 const response=await fetcher(url.href,{redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
 if(!response.ok||Number(response.headers.get('content-length'))>MAX_BYTES)throw Error('FEED_UNAVAILABLE');
 let size=0;const chunks=[];
 for await(const chunk of response.body){size+=chunk.length;if(size>MAX_BYTES)throw Error('FEED_TOO_LARGE');chunks.push(chunk);}
 return Buffer.concat(chunks).toString('utf8');
}
