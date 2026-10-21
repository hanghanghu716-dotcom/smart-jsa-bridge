import { readFile } from 'node:fs/promises';
export function parseCatalog(body){
 if(Buffer.byteLength(body)>2000000)throw Error('CATALOG_TOO_LARGE');
 const catalog=JSON.parse(body);
 if(catalog?.version!==1||!Array.isArray(catalog.offers)||catalog.offers.length>5000
   ||!Array.isArray(catalog.merchants)||!Array.isArray(catalog.reviews)||!Array.isArray(catalog.profiles))throw Error('INVALID_CATALOG');
 return catalog;
}
// Server-only snapshot. Credentials and raw vendor feeds never go to the browser.
export async function loadCatalog({env=process.env,fetcher=fetch}={}){
 // Operator-curated catalog stays in server configuration, outside public Git.
 if(env.JSA_COMMERCE_CATALOG_JSON)return parseCatalog(env.JSA_COMMERCE_CATALOG_JSON);
 if(!env.JSA_COMMERCE_CATALOG_URL)return parseCatalog(await readFile(new URL('../../data/commerce/catalog.json',import.meta.url),'utf8'));
 const url=new URL(env.JSA_COMMERCE_CATALOG_URL);
 if(url.protocol!=='https:'||url.hostname!==env.JSA_COMMERCE_CATALOG_HOST||url.username||url.password||url.port)throw Error('INVALID_CATALOG_HOST');
 const response=await fetcher(url.href,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(2500)});
 if(!response.ok)throw Error('CATALOG_UNAVAILABLE');
 if(Number(response.headers.get('content-length'))>2000000)throw Error('CATALOG_TOO_LARGE');
 let size=0;const chunks=[];
 for await(const chunk of response.body){size+=chunk.length;if(size>2000000)throw Error('CATALOG_TOO_LARGE');chunks.push(chunk);}
 return parseCatalog(Buffer.concat(chunks).toString('utf8'));
}
