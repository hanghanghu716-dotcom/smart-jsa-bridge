// Country is supplied by Vercel, never inferred from the page language or query string.
// This is a limited product rollout, not an assertion about every country's law.
export function adsterraPolicy(headers = {}, hosted = false) {
  const country = hosted ? headers['x-vercel-ip-country'] : null;
  const automatic = typeof country === 'string' && ['KR', 'JP'].includes(country);
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
