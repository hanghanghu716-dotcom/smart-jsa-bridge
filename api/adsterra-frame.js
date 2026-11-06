import { adsterra } from '../src/config/adsterra.js';
import { ADSTERRA_HOSTS, ADSTERRA_FRAME_CSP, adsterraFrameHtml } from '../src/utils/adsterra.js';

export function createAdsterraFrame(config = adsterra) {
  return function handler(req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin');
    // The opaque sandbox prevents advertising code from reading application sessions or documents.
    res.setHeader('Content-Security-Policy', ADSTERRA_FRAME_CSP);
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.statusCode = 405; res.setHeader('Allow', 'GET, HEAD'); return res.end();
    }
    let parent;
    try { parent = new URL(req.headers.referer); } catch { /* No standalone ad impressions. */ }
    const host = req.headers.host;
    const html = adsterraFrameHtml(config);
    if (!html || !ADSTERRA_HOSTS.includes(host) || parent?.protocol !== 'https:'
      || parent?.host !== host || req.headers['sec-fetch-dest'] !== 'iframe') {
      res.statusCode = 404; return res.end();
    }
    res.statusCode = 200;
    return res.end(req.method === 'HEAD' ? '' : html);
  };
}
export default createAdsterraFrame();
