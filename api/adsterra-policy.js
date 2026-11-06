// Country is supplied by Vercel, never inferred from the page language or query string.
// Notice/opt-out regions for the current service. Consent remains the fallback.
// Country/subdivision are trusted only on Vercel; see docs/adsterra.md for sources.
export const automaticAdCountries = new Set(['KR', 'JP', 'US', 'AU']);
const automaticCanadianRegions = new Set(['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','SK','YT']);
export function adsterraPolicy(headers = {}, hosted = false) {
  const country = hosted ? headers['x-vercel-ip-country'] : null;
  const region = hosted ? headers['x-vercel-ip-country-region'] : null;
  // Quebec profiling controls start disabled. Unknown Canadian subdivisions are
  // also consent-first; the interface locale is not evidence of visitor location.
  const automatic = automaticAdCountries.has(country)
    || (country === 'CA' && automaticCanadianRegions.has(region));
  return {
    requiresConsent: !automatic,
    blocked: headers['sec-gpc'] === '1' || headers.dnt === '1',
  };
}
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.statusCode = 405; res.setHeader('Allow', 'GET, HEAD'); return res.end();
  }
  res.end(req.method === 'HEAD' ? '' : JSON.stringify(adsterraPolicy(req.headers, process.env.VERCEL === '1')));
}
