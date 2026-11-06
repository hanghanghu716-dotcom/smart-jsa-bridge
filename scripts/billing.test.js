import test from 'node:test';
import assert from 'node:assert/strict';
import { billingConfig, publicBillingConfig, LIVE_RELEASE } from '../server/billing/config.js';
import { createBillingService, validatePayment } from '../server/billing/service.js';
import { createBillingHandler } from '../api/billing.js';

const userId = '10000000-0000-4000-8000-000000000001';
const orderId = 'jsa_test_20000000-0000-4000-8000-000000000001';
const seller = {businessName:'Fixture',representative:'Fixture',registrationNumber:'fixture',mailOrderNumber:'fixture',address:'Fixture',supportEmail:'fixture@example.com',supportPhone:'fixture',termsUrl:'https://shop.example/terms',privacyUrl:'https://shop.example/privacy',refundUrl:'https://shop.example/refunds',termsVersion:'v1'};
const env = {JSA_BILLING_MODE:'test',JSA_BILLING_SALES_ENABLED:'true',JSA_BILLING_ORIGIN:'https://shop.example',TOSS_CLIENT_KEY:'test_ck_fixture',TOSS_SECRET_KEY:'test_sk_fixture',TOSS_MID:'fixture-mid',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_fixture',JSA_BILLING_WEBHOOK_TOKEN:'x'.repeat(32),JSA_BILLING_TEST_USER_IDS:userId,JSA_BILLING_SELLER_JSON:JSON.stringify(seller),CRON_SECRET:'c'.repeat(32)};
const order = {id:orderId,user_id:userId,mode:'test',amount:9900,currency:'KRW',status:'PENDING',payment_key:'opaque/payment-key',created_at:'2026-11-01T00:00:00Z'};
const payment = {orderId,paymentKey:order.payment_key,mId:'fixture-mid',currency:'KRW',totalAmount:9900,balanceAmount:9900,status:'DONE',approvedAt:'2026-11-01T01:00:00Z'};
function fixture({ currentOrder = order, currentPayment = payment, overrides = {}, providerFails = false } = {}) {
  const calls = [], requests = [];
  const service = createBillingService({env:{...env,...overrides},authenticate:async token=>{assert.equal(token,'session');return{id:userId};},rpc:async(action,body)=>{
    calls.push({action,body});
    if(action==='account') return {access:{active:false},orders:[currentOrder]};
    if(action==='sweep') return [currentOrder];
    if(action==='apply') return {...currentOrder,status:body.status,expires_at:'2026-12-01T00:00:00Z'};
    if(action==='bind') return {...currentOrder,payment_key:body.payment_key};
    return {...currentOrder};
  },fetcher:async(url,options)=>{requests.push({url,options});if(providerFails&&url.endsWith('/confirm'))throw Error('timeout');return {ok:true,json:async()=>currentPayment};}});
  return {service,calls,requests};
}
test('sales remain disabled without merchant, policy, and matching key configuration',()=>{
  assert.equal(billingConfig({}).enabled,false);
  assert.equal(billingConfig(env).enabled,true);
  for(const field of ['TOSS_SECRET_KEY','TOSS_CLIENT_KEY','TOSS_MID','SUPABASE_SERVICE_ROLE_KEY','JSA_BILLING_WEBHOOK_TOKEN','JSA_BILLING_SELLER_JSON','JSA_BILLING_ORIGIN']) assert.equal(billingConfig({...env,[field]:''}).enabled,false,field);
  assert.equal(billingConfig({...env,TOSS_SECRET_KEY:'live_sk_fixture'}).enabled,false);
  const live={...env,JSA_BILLING_MODE:'live',TOSS_SECRET_KEY:'live_sk_fixture',TOSS_CLIENT_KEY:'live_ck_fixture'};
  assert.equal(billingConfig(live).enabled,false);
  assert.equal(billingConfig({...live,JSA_BILLING_LIVE_APPROVED:LIVE_RELEASE}).enabled,true);
  const exposed=JSON.stringify(publicBillingConfig(billingConfig(env)));
  assert.ok(!exposed.includes(env.TOSS_SECRET_KEY));assert.ok(!exposed.includes(env.SUPABASE_SERVICE_ROLE_KEY));assert.ok(!exposed.includes(env.JSA_BILLING_WEBHOOK_TOKEN));
});
test('server creates a fixed-price order for the authenticated user; forged price/user are ignored',async()=>{
  const {service,calls}=fixture();const result=await service.act('create',{termsVersion:'v1',amount:1,user_id:'attacker'},'session');
  assert.equal(calls[0].body.amount,9900);assert.equal(calls[0].body.user_id,userId);
  assert.equal(result.payment.amount.value,9900);assert.equal(result.payment.windowTarget,'self');assert.match(result.payment.successUrl,/^https:\/\/shop.example\/ko\/billing/);
  assert.equal(result.order.payment_key,undefined);
});
test('purchase requires current terms and allowlisted test account',async()=>{
  await assert.rejects(fixture().service.act('create',{termsVersion:'old'},'session'),/TERMS_REQUIRED/);
  await assert.rejects(fixture({overrides:{JSA_BILLING_TEST_USER_IDS:''}}).service.act('create',{termsVersion:'v1'},'session'),/TEST_ACCESS_REQUIRED/);
});
test('wrong amount, owner, or mode cannot trigger a provider charge',async()=>{
  for(const options of [{},{currentOrder:{...order,user_id:'other'}},{currentOrder:{...order,mode:'live'}}]){
    const {service,requests}=fixture(options);
    await assert.rejects(service.act('confirm',{orderId,paymentKey:order.payment_key,amount:options.currentOrder?9900:1},'session'));
    assert.equal(requests.length,0);
  }
});
test('charge retries use one idempotency key and always reconcile authoritative status',async()=>{
  const {service,requests,calls}=fixture({providerFails:true});
  const result=await service.act('confirm',{orderId,paymentKey:order.payment_key,amount:9900},'session');
  assert.equal(result.status,'DONE');assert.equal(requests.length,2);
  assert.equal(requests[0].options.headers['Idempotency-Key'],orderId);
  assert.equal(requests[1].url,'https://api.tosspayments.com/v1/payments/opaque%2Fpayment-key');
  assert.equal(calls.at(-1).action,'apply');
});
test('settled order replay does not confirm a second charge',async()=>{
  const {service,requests}=fixture({currentOrder:{...order,status:'DONE'}});
  await service.act('confirm',{orderId,paymentKey:order.payment_key,amount:9900},'session');
  assert.equal(requests.length,1);assert.ok(!requests[0].url.endsWith('/confirm'));
});
test('provider amount/currency/merchant/order/key/status mismatches cannot grant access',()=>{
  for(const patch of [{totalAmount:1},{currency:'USD'},{mId:'another-merchant'},{orderId:'another-order'},{paymentKey:'another-key'},{status:'IN_PROGRESS'},{approvedAt:null},{balanceAmount:0}]) assert.throws(()=>validatePayment({...payment,...patch},order,billingConfig(env)),/PAYMENT_MISMATCH/);
});
test('forged webhook is rejected; authenticated webhook status is ignored in favor of provider',async()=>{
  const {service,calls,requests}=fixture({currentPayment:{...payment,status:'CANCELED',balanceAmount:0}});
  await assert.rejects(service.webhook({eventType:'PAYMENT_STATUS_CHANGED',data:{orderId}},'wrong'),/ACCESS_DENIED/);
  assert.equal(requests.length,0);
  await service.webhook({eventType:'PAYMENT_STATUS_CHANGED',data:{orderId,status:'DONE',totalAmount:1}},env.JSA_BILLING_WEBHOOK_TOKEN);
  assert.equal(calls.at(-1).body.status,'CANCELED');assert.equal(calls.at(-1).body.balance,0);
});
test('pausing new sales still permits reconciliation and refund requests',async()=>{
  const {service,calls}=fixture({overrides:{JSA_BILLING_SALES_ENABLED:'false'}});
  await assert.rejects(service.act('create',{termsVersion:'v1'},'session'),/SALES_PAUSED/);
  await service.act('refund-request',{orderId},'session');assert.equal(calls.at(-1).action,'refund');
});
test('account responses never expose internal payment identifiers',async()=>{
  const {service}=fixture();const account=await service.act('account',{},'session');
  assert.equal(account.orders[0].payment_key,undefined);assert.equal(account.orders[0].user_id,undefined);
});
test('daily reconciliation is protected by its separate secret',async()=>{
  const {service,requests}=fixture();await assert.rejects(service.sweep('wrong'),/ACCESS_DENIED/);assert.equal(requests.length,0);
  assert.deepEqual(await service.sweep(env.CRON_SECRET),{checked:1});
});
async function request(handler, req) {
  const headers={};let body;const res={setHeader:(key,value)=>headers[key]=value,end:value=>body=JSON.parse(value)};
  await handler({method:'GET',headers:{},query:{},...req},res);return{status:res.statusCode,body,headers};
}
test('HTTP boundary rejects cross-origin and unsupported requests with private no-store responses',async()=>{
  const handler=createBillingHandler({env});
  const forbidden=await request(handler,{method:'POST',query:{action:'create'},headers:{origin:'https://evil.example','content-type':'application/json'},body:{}});
  assert.equal(forbidden.status,403);assert.equal(forbidden.headers['Cache-Control'],'private, no-store');
  assert.equal((await request(handler,{query:{action:'create'}})).status,405);
  const malformed=await request(handler,{method:'POST',query:{action:'create'},headers:{origin:env.JSA_BILLING_ORIGIN,'content-type':'application/json'},body:'{'});assert.equal(malformed.status,400);
});
test('bearer tokens are verified with Supabase Auth, not decoded as trusted identities',async()=>{
  let calls=0;const service=createBillingService({env,fetcher:async()=>{calls++;return{ok:false,json:async()=>({id:userId})};},rpc:()=>{throw Error('must not write');}});
  await assert.rejects(service.act('create',{termsVersion:'v1'},'forged'),/AUTH_REQUIRED/);assert.equal(calls,1);
});
