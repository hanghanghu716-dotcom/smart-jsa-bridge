import { supabase } from '../supabaseClient';

export async function billingRequest(action, body, client = supabase) {
  const headers = {};
  if (action !== 'config') {
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.access_token) throw Error('AUTH_REQUIRED');
    headers.Authorization = 'Bearer ' + data.session.access_token;
  }
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch('/api/billing?action=' + encodeURIComponent(action), {
    method: body ? 'POST' : 'GET', headers, credentials: 'same-origin', cache: 'no-store',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let result;
  try { result = await response.json(); } catch { throw Error('BILLING_UNAVAILABLE'); }
  if (!response.ok) throw Error(result.error || 'BILLING_UNAVAILABLE');
  return result;
}

let sdkPromise;
export function loadTossSdk() {
  if (window.TossPayments) return Promise.resolve(window.TossPayments);
  if (!sdkPromise) sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard'; script.async = true;
    script.referrerPolicy = 'no-referrer';
    const timer = setTimeout(() => { script.remove(); reject(Error('CHECKOUT_UNAVAILABLE')); }, 15000);
    script.onload = () => { clearTimeout(timer); if (window.TossPayments) resolve(window.TossPayments); else reject(Error('CHECKOUT_UNAVAILABLE')); };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(Error('CHECKOUT_UNAVAILABLE')); };
    document.head.appendChild(script);
  }).catch(error => { sdkPromise = null; throw error; });
  return sdkPromise;
}

export const BILLING_ERRORS = {
  AUTH_REQUIRED: '로그인 후 이용해 주세요.', TEST_ACCESS_REQUIRED: '현재는 등록된 테스트 계정만 결제 흐름을 확인할 수 있습니다.',
  BILLING_UNAVAILABLE: '결제 정보를 확인하지 못했습니다. 잠시 후 다시 확인해 주세요.', SALES_PAUSED: '새 이용권 구매가 잠시 중단되었습니다.',
  ACCESS_ACTIVE: '현재 이용 기간이 남아 있습니다. 기간이 끝난 뒤 구매해 주세요.', TERMS_REQUIRED: '현재 구매 약관을 확인하고 동의해 주세요.',
  ORDER_EXPIRED: '주문 시간이 만료되었습니다. 새 주문으로 진행해 주세요.', PAYMENT_KEY_CONFLICT: '이 주문의 결제 정보가 다릅니다. 결제 내역을 확인해 주세요.',
  PAYMENT_MISMATCH: '결제 정보가 주문과 일치하지 않아 이용권을 발급하지 않았습니다. 고객지원에 문의해 주세요.',
  PAYMENT_NOT_CONFIRMED: '결제 완료 여부를 아직 확인하지 못했습니다. 다시 결제하기 전에 결제 내역의 상태 확인을 눌러 주세요.',
  PAYMENT_PENDING: '확인 중인 결제가 있습니다. 중복 결제를 막기 위해 새 주문을 만들지 않았습니다. 기존 주문의 상태를 먼저 확인해 주세요.',
  CHECKOUT_UNAVAILABLE: '결제창을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', NOT_FOUND: '이 계정의 주문을 찾을 수 없습니다.',
  REFUND_UNAVAILABLE: '이 주문은 환불 요청을 접수할 수 없는 상태입니다.',
};
