// Conservative product policy, independent of the selected interface language.
export const automaticAnalyticsCountries = new Set(['KR','US','JP','AU','SG']);
export function privacyRegion(headers, hosted) {
  const value=hosted?headers['x-vercel-ip-country']:null;
  const country=typeof value==='string'&&/^[A-Z]{2}$/.test(value)?value:null;
  return {requiresConsent:!automaticAnalyticsCountries.has(country)};
}
export default function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end();}
  res.end(req.method==='HEAD'?'':JSON.stringify(privacyRegion(req.headers,process.env.VERCEL==='1')));
}
