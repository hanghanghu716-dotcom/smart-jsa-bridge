import { readCommerceSnapshot } from '../server/commerce/source.js';
import { fingerprint, offerFingerprint, extractNeeds } from '../server/commerce/engine.js';
import { loadCatalog } from '../server/commerce/catalog.js';
import { readProjectEnv } from '../server/supabase-config.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
const [kind,id,locale]=process.argv.slice(2);
if(!['case','ugc'].includes(kind)||!id||!SUPPORTED_LANGS.includes(locale))throw Error('Usage: node scripts/commerce-review.js case|ugc CONTENT_ID LOCALE');
const snapshot=await readCommerceSnapshot(kind,id,locale);
if(!snapshot)throw Error('PUBLIC_CONTENT_UNAVAILABLE');
const catalog=await loadCatalog({env:readProjectEnv()});
// This is a pending review packet; never an approval or a PPE suitability claim.
console.log(JSON.stringify({source:snapshot,profile:{sourceFingerprint:fingerprint(snapshot),status:'pending',reviewer:'',
 reviewedAt:null,validUntil:null,needs:extractNeeds(snapshot)},offers:catalog.offers.map(offer=>({id:offer.id,
 merchantId:offer.merchantId,title:offer.title,attributes:offer.attributes,offerFingerprint:offerFingerprint(offer)}))},null,2));
