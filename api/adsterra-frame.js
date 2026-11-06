import { adsterraPlacements, ADSTERRA_FRAME_HOST } from '../src/config/adsterra.js';
import { ADSTERRA_HOSTS, ADSTERRA_FRAME_CSP, adsterraFrameHtml } from '../src/utils/adsterra.js';
export function createAdsterraFrame(configurations = adsterraPlacements) {
 return function handler(req,res) {
  for(const [key,value] of Object.entries({'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':ADSTERRA_FRAME_CSP,'Permissions-Policy':'camera=(), microphone=(), geolocation=()'}))res.setHeader(key,value);
  if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end();}
  let parent,placement;try{parent=new URL(req.headers.referer);placement=new URL(req.url,'https://'+ADSTERRA_FRAME_HOST).searchParams.get('placement');}catch{}
  const config=Object.hasOwn(configurations,placement||'')?configurations[placement]:null,html=adsterraFrameHtml(config);
  // No app sessions exist on this separate origin; the endpoint is disabled on the main site.
  if(!html||req.headers.host!==ADSTERRA_FRAME_HOST||parent?.protocol!=='https:'||!ADSTERRA_HOSTS.includes(parent.hostname)||parent.port||req.headers['sec-fetch-dest']!=='iframe'){res.statusCode=404;return res.end();}
  res.statusCode=200;return res.end(req.method==='HEAD'?'':html);
 };
}
export default createAdsterraFrame();
