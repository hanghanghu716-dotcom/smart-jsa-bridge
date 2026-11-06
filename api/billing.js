import { readProjectEnv } from '../server/supabase-config.js';
import { BillingError } from '../server/billing/config.js';
import { createBillingService } from '../server/billing/service.js';

export function createBillingHandler(options = {}) {
  const service = createBillingService(options);
  return async (req, res) => {
    for (const [key, value] of Object.entries({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'CDN-Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' })) res.setHeader(key, value);
    const send = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    try {
      const action = req.query?.action;
      const read = action === 'config' || action === 'account' || action === 'sweep';
      if (!['config','account','create','confirm','reconcile','refund-request','webhook','sweep'].includes(action)) throw new BillingError('INVALID_INPUT');
      if (req.method !== (read ? 'GET' : 'POST')) { res.setHeader('Allow', read ? 'GET' : 'POST'); return send(405, { error: 'METHOD_NOT_ALLOWED' }); }
      if (!read && !String(req.headers['content-type'] || '').startsWith('application/json')) throw new BillingError('INVALID_INPUT', 415);
      if (action !== 'webhook' && !read && req.headers.origin !== service.config.origin) throw new BillingError('ACCESS_DENIED', 403);
      let body = req.body || {};
      if (typeof body === 'string') { if (body.length > 16384) throw new BillingError('INVALID_INPUT', 413); try { body = JSON.parse(body); } catch { throw new BillingError('INVALID_INPUT'); } }
      if (!body || Array.isArray(body) || typeof body !== 'object' || JSON.stringify(body).length > 16384) throw new BillingError('INVALID_INPUT');
      const result = action === 'sweep' ? await service.sweep(/^Bearer ([^\s]+)$/.exec(req.headers.authorization || '')?.[1])
        : action === 'webhook' ? await service.webhook(body, req.query.token)
        : await service.act(action, body, /^Bearer ([^\s]+)$/.exec(req.headers.authorization || '')?.[1]);
      return send(200, result);
    } catch (error) {
      return send(error instanceof BillingError ? error.status : 503, { error: error instanceof BillingError ? error.code : 'BILLING_UNAVAILABLE' });
    }
  };
}
export default createBillingHandler({ env: readProjectEnv() });
