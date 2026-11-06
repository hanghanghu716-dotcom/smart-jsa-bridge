export const PASS = Object.freeze({ sku: 'professional-30d-v1', name: 'Professional 30일 이용권', amount: 9900, currency: 'KRW', days: 30 });
export const LIVE_RELEASE = 'professional-9900-v1';
export class BillingError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
export function billingConfig(env = {}) {
  const mode = ['test', 'live'].includes(env.JSA_BILLING_MODE) ? env.JSA_BILLING_MODE : 'disabled';
  let origin = '', seller = null;
  try {
    const url = new URL(env.JSA_BILLING_ORIGIN);
    if (url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password) origin = url.origin;
  } catch { /* Disabled until configured. */ }
  try {
    const input = JSON.parse(env.JSA_BILLING_SELLER_JSON || '{}');
    const fields = ['businessName', 'representative', 'registrationNumber', 'mailOrderNumber', 'address', 'supportEmail', 'supportPhone', 'termsUrl', 'privacyUrl', 'refundUrl', 'termsVersion'];
    if (fields.every(k => typeof input[k] === 'string' && input[k].trim().length > 0 && input[k].length <= 1000)
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.supportEmail)
      && ['termsUrl', 'privacyUrl', 'refundUrl'].every(k => { const u = new URL(input[k]); return u.origin === origin && !u.username && !u.password; })) {
      seller = Object.fromEntries(fields.map(k => [k, input[k].trim()]));
    }
  } catch { /* Never publish incomplete seller details or draft terms. */ }
  const clientKey = env.TOSS_CLIENT_KEY || '', secretKey = env.TOSS_SECRET_KEY || '', mid = env.TOSS_MID || '';
  const webhookToken = env.JSA_BILLING_WEBHOOK_TOKEN || '';
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const configured = Boolean(mode !== 'disabled' && origin && seller && mid && serviceKey
    && clientKey.startsWith(mode + '_ck_') && secretKey.startsWith(mode + '_sk_')
    && /^[A-Za-z0-9_-]{32,128}$/.test(webhookToken));
  const enabled = configured && env.JSA_BILLING_SALES_ENABLED === 'true'
    && (mode === 'test' || (env.JSA_BILLING_LIVE_APPROVED === LIVE_RELEASE && (env.CRON_SECRET || '').length >= 32));
  const testUsers = new Set((env.JSA_BILLING_TEST_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean));
  return { mode, origin, seller, clientKey, secretKey, mid, webhookToken, serviceKey, configured, enabled, testUsers };
}
export function publicBillingConfig(config) {
  return { enabled: config.enabled, mode: config.mode, product: PASS, seller: config.seller,
    ...(config.enabled ? { clientKey: config.clientKey } : {}) };
}
