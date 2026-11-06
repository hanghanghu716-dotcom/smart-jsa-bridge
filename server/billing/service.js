import { randomUUID, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { PASS, BillingError, billingConfig, publicBillingConfig } from './config.js';
import { resolvePublicSupabaseConfig } from '../../src/config/supabase.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const orderPattern = /^jsa_(test|live)_[0-9a-f-]{36}$/;
const allowedErrors = new Set(['AUTH_REQUIRED','NOT_FOUND','ACCESS_ACTIVE','INVALID_INPUT','ORDER_EXPIRED','PAYMENT_KEY_CONFLICT','PAYMENT_MISMATCH','PAYMENT_PENDING','TERMS_REQUIRED','REFUND_UNAVAILABLE']);
const safeOrder = o => ({ id: o.id, amount: o.amount, currency: o.currency, mode: o.mode, status: o.status,
  created_at: o.created_at, starts_at: o.starts_at, expires_at: o.expires_at, refund_requested_at: o.refund_requested_at });

export function validatePayment(payment, order, config) {
  if (!payment || payment.orderId !== order.id || payment.paymentKey !== order.payment_key
    || payment.mId !== config.mid || payment.currency !== order.currency || payment.totalAmount !== order.amount
    || !['DONE','CANCELED','PARTIAL_CANCELED','ABORTED','EXPIRED'].includes(payment.status)
    || !Number.isSafeInteger(payment.balanceAmount) || payment.balanceAmount < 0 || payment.balanceAmount > order.amount
    || (payment.status === 'DONE' && (payment.balanceAmount !== order.amount || !Number.isFinite(Date.parse(payment.approvedAt))))
    || (payment.status === 'CANCELED' && payment.balanceAmount !== 0)) throw new BillingError('PAYMENT_MISMATCH', 409);
  return { order_id: order.id, mode: order.mode, payment_key: payment.paymentKey, amount: payment.totalAmount,
    currency: payment.currency, status: payment.status, approved_at: payment.approvedAt || null, balance: payment.balanceAmount };
}

export function createBillingService({ env = {}, fetcher = fetch, rpc: injectedRpc, authenticate: injectedAuth } = {}) {
  const config = billingConfig(env);
  const supabase = resolvePublicSupabaseConfig(env);
  const rpc = injectedRpc || (async (action, payload) => {
    const headers = { 'Content-Type': 'application/json', apikey: config.serviceKey };
    if (!config.serviceKey.startsWith('sb_secret_')) headers.Authorization = 'Bearer ' + config.serviceKey;
    const response = await fetcher(supabase.url + '/rest/v1/rpc/jsa_billing_service', {
      method: 'POST', headers, body: JSON.stringify({ p_action: action, p_payload: payload }), signal: AbortSignal.timeout(5000),
    });
    const body = await response.json();
    if (!response.ok) throw new BillingError(allowedErrors.has(body?.message) ? body.message : 'BILLING_UNAVAILABLE', response.status === 404 ? 503 : 409);
    return body;
  });
  const authenticate = injectedAuth || (async token => {
    if (!token || token.length > 8192) throw new BillingError('AUTH_REQUIRED', 401);
    const response = await fetcher(supabase.url + '/auth/v1/user', {
      headers: { apikey: supabase.key, Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(5000),
    });
    const user = await response.json();
    if (!response.ok || !uuid.test(user?.id)) throw new BillingError('AUTH_REQUIRED', 401);
    return user;
  });
  async function provider(path, options = {}) {
    const response = await fetcher('https://api.tosspayments.com/v1/payments' + path, {
      ...options, headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(config.secretKey + ':').toString('base64'), ...options.headers },
      signal: AbortSignal.timeout(6000),
    });
    const payment = await response.json();
    if (!response.ok) throw new BillingError('PAYMENT_NOT_CONFIRMED', 502);
    return payment;
  }
  async function reconcile(order) {
    if (!order.payment_key) return safeOrder(order);
    const payment = await provider('/' + encodeURIComponent(order.payment_key));
    return safeOrder(await rpc('apply', validatePayment(payment, order, config)));
  }
  async function owned(orderId, user) {
    if (!orderPattern.test(orderId || '')) throw new BillingError('INVALID_INPUT');
    const order = await rpc('get', { order_id: orderId, user_id: user.id, mode: config.mode });
    if (!order || order.user_id !== user.id || order.mode !== config.mode) throw new BillingError('NOT_FOUND', 404);
    return order;
  }
  async function act(action, body, token) {
    if (action === 'config') return publicBillingConfig(config);
    if (!config.configured) throw new BillingError('BILLING_UNAVAILABLE', 503);
    const user = await authenticate(token);
    if (!uuid.test(user?.id)) throw new BillingError('AUTH_REQUIRED', 401);
    if (config.mode === 'test' && !config.testUsers.has(user.id)) throw new BillingError('TEST_ACCESS_REQUIRED', 403);
    if (action === 'account') {
      const result = await rpc('account', { user_id: user.id, mode: config.mode });
      return { ...result, orders: result.orders.map(safeOrder) };
    }
    if (action === 'create') {
      if (!config.enabled) throw new BillingError('SALES_PAUSED', 503);
      if (body.termsVersion !== config.seller.termsVersion) throw new BillingError('TERMS_REQUIRED');
      const order = await rpc('create', { user_id: user.id, mode: config.mode, order_id: `jsa_${config.mode}_${randomUUID()}`,
        amount: PASS.amount, currency: PASS.currency, terms_version: config.seller.termsVersion });
      return { order: safeOrder(order), customerKey: user.id, clientKey: config.clientKey,
        payment: { method: 'CARD', amount: { currency: order.currency, value: order.amount }, orderId: order.id,
          orderName: PASS.name, windowTarget: 'self', successUrl: config.origin + '/ko/billing?result=success', failUrl: config.origin + '/ko/billing?result=fail' } };
    }
    const order = await owned(body.orderId, user);
    if (action === 'confirm') {
      if (!Number.isSafeInteger(body.amount) || body.amount !== order.amount || typeof body.paymentKey !== 'string'
        || !body.paymentKey.length || body.paymentKey.length > 200 || /[\x00-\x1f]/.test(body.paymentKey)) throw new BillingError('PAYMENT_MISMATCH', 409);
      const bound = await rpc('bind', { order_id: order.id, user_id: user.id, mode: config.mode, payment_key: body.paymentKey });
      // A replay of an already settled/canceled order must never reconfirm or extend it.
      if (bound.status !== 'PENDING') return reconcile(bound);
      try {
        await provider('/confirm', { method: 'POST', headers: { 'Idempotency-Key': order.id },
          body: JSON.stringify({ orderId: order.id, paymentKey: body.paymentKey, amount: order.amount }) });
      } catch {
        // The charge may have succeeded despite a timeout. Read the provider before
        // deciding, including ALREADY_PROCESSED_PAYMENT and database-write retries.
      }
      // Read the current status even after success, so a cached confirm response
      // cannot resurrect a refunded payment.
      return reconcile(bound);
    }
    if (action === 'reconcile') return reconcile(order);
    if (action === 'refund-request') {
      await reconcile(order);
      return safeOrder(await rpc('refund', { order_id: order.id, user_id: user.id, mode: config.mode }));
    }
    throw new BillingError('INVALID_INPUT');
  }
  async function webhook(body, token) {
    if (!config.configured) throw new BillingError('BILLING_UNAVAILABLE', 503);
    const received = Buffer.from(typeof token === 'string' ? token : '');
    const expected = Buffer.from(config.webhookToken);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new BillingError('ACCESS_DENIED', 403);
    if (body.eventType !== 'PAYMENT_STATUS_CHANGED') return { received: true };
    const orderId = body.data?.orderId;
    if (!orderPattern.test(orderId || '')) return { received: true };
    const order = await rpc('get', { order_id: orderId, mode: config.mode });
    if (order?.payment_key) await reconcile(order); // Ignore all asserted webhook amounts/statuses.
    return { received: true };
  }
  async function sweep(token) {
    if (config.mode === 'disabled') return { checked: 0 };
    const expected = Buffer.from(env.CRON_SECRET || '');
    const received = Buffer.from(token || '');
    if (expected.length < 32 || expected.length !== received.length || !timingSafeEqual(expected, received)) throw new BillingError('ACCESS_DENIED', 403);
    if (!config.configured) return { checked: 0 };
    const orders = await rpc('sweep', { mode: config.mode });
    // A daily backstop for missed webhooks; small bounded batches fit serverless limits.
    let checked = 0;
    for (let i = 0; i < orders.length; i += 4) {
      const results = await Promise.allSettled(orders.slice(i, i + 4).map(reconcile));
      checked += results.filter(r => r.status === 'fulfilled').length;
    }
    if (checked !== orders.length) throw new BillingError('RECONCILIATION_INCOMPLETE', 503);
    return { checked };
  }
  return { config, act, webhook, sweep };
}
