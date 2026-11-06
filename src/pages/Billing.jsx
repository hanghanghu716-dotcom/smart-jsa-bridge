import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { billingRequest, loadTossSdk, BILLING_ERRORS } from '../services/billingService';
import '../styles/workspaces.css';
import '../styles/billing.css';

const date = value => value ? new Date(value).toLocaleString('ko-KR') : '—';
const states = { PENDING: '결제 대기', DONE: '결제 완료', CANCELED: '전액 취소', PARTIAL_CANCELED: '부분 취소 · 이용권 정지', ABORTED: '결제 실패', EXPIRED: '주문 만료' };
export default function Billing() {
  const [config, setConfig] = useState(null), [user, setUser] = useState(undefined), [account, setAccount] = useState(null);
  const [agree, setAgree] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const pending = useRef(false), callbackHandled = useRef(false);
  const [callback] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    return { result: query.get('result'), orderId: query.get('orderId'), paymentKey: query.get('paymentKey'), amount: Number(query.get('amount')) };
  });
  const loadAccount = async () => { const value = await billingRequest('account'); setAccount(value); return value; };
  const run = async task => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setMessage('');
    try { await task(); } catch (e) { setError(BILLING_ERRORS[e.message] || '요청을 처리하지 못했습니다. 결제 내역을 확인한 뒤 다시 시도해 주세요.'); }
    finally { pending.current = false; setBusy(false); }
  };
  useEffect(() => {
    // No payment identifiers in browser history, links, analytics, or referrers.
    if (window.location.search) window.history.replaceState(window.history.state, '', window.location.pathname);
    let live = true;
    billingRequest('config').then(value => { if (live) setConfig(value); }).catch(() => { if (live) setError(BILLING_ERRORS.BILLING_UNAVAILABLE); });
    supabase.auth.getUser().then(({ data }) => { if (live) setUser(data?.user || null); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (!user || !config || config.mode === 'disabled' || callbackHandled.current) return;
    callbackHandled.current = true;
    run(async () => {
      if (callback.result === 'success') {
        const result = await billingRequest('confirm', callback);
        setMessage(result.status === 'DONE' ? (result.mode === 'test' ? '테스트 결제를 확인했습니다. 실제 청구와 유료 권한 부여는 없습니다.' : '결제를 확인했습니다. Professional 이용권이 발급되었습니다.') : '현재 결제 상태: ' + (states[result.status] || result.status));
      } else if (callback.result === 'fail') setMessage('결제창에서 결제가 완료되지 않았습니다. 아래 내역에서 상태를 확인할 수 있습니다.');
      await loadAccount();
    });
  }, [user, config]);
  const purchase = () => run(async () => {
    const TossPayments = await loadTossSdk();
    const checkout = await billingRequest('create', { termsVersion: agree ? config.seller.termsVersion : '' });
    await TossPayments(checkout.clientKey).payment({ customerKey: checkout.customerKey }).requestPayment(checkout.payment);
  });
  return <div className="jsa-workspace billing-page" lang="ko">
    <SEO pageTitle="Professional 이용권 | Smart JSA Bridge" noIndex />
    <Helmet><meta name="referrer" content="no-referrer" /></Helmet>
    <header className="jsa-nav"><Link to="/ko">Smart JSA Bridge</Link><div className="jsa-toolbar"><Link to="/ko/business">회사 작업공간</Link><ThemeSwitcher compact /></div></header>
    <main className="jsa-container billing-container">
      <p className="jsa-eyebrow">Professional</p><h1>현장 문서를 팀의 기록으로</h1>
      <p>회사 양식을 맞추고, 이전 기록을 복원하고, 문서 버전별 검토와 결재를 관리하세요.</p>
      {error && <p className="jsa-notice" role="alert">{error}</p>}
      {message && <p className="jsa-notice" role="status">{message}</p>}
      {!config && <p role="status">이용권 정보를 확인하고 있습니다.</p>}
      {config && <>
        {config.mode === 'test' && <p className="billing-test">테스트 결제 · 실제 요금이 청구되지 않으며 유료 권한도 부여하지 않습니다.</p>}
        <div className="billing-grid">
          <section className="jsa-card"><h2>Community</h2><p className="billing-price">무료</p><ul><li>JSA 기본 작성과 작업단계 자료</li><li>개인 문서 저장 및 PDF 내보내기</li><li>공개 사례 열람과 재사용</li></ul><Link to="/ko/templates">무료로 문서 작성하기 →</Link></section>
          <section className="jsa-card billing-professional"><h2>Professional</h2><p className="billing-price">{config.product.amount.toLocaleString('ko-KR')}원 <span>/ {config.product.days}일</span></p><p>{config.enabled ? '최종 결제금액 · 1회 결제 · 자동 갱신 없음' : '예정 가격 · 유료 이용권 판매 준비 중'}</p><ul><li>개인 문서 개정 이력과 이전 버전 복원</li><li>회사별 공통 문서 양식</li><li>구성원 역할과 비공개 팀 문서</li><li>문서 버전별 검토·승인 이력</li><li>계정당 최대 3개 회사 작업공간</li></ul><p>회사 소유자 계정의 이용권으로 해당 회사 구성원이 권한에 따라 참여합니다. 만료 후에는 기존 문서와 이력을 열람할 수 있습니다.</p></section>
        </div>
        <section className="jsa-card billing-purchase"><h2>이용권 구매</h2><p>결제를 확인한 시점부터 30일 동안 이용합니다. 현재 무료 체험이나 유료 이용 기간이 남아 있으면 만료 후 구매할 수 있습니다.</p>
          {!config.enabled && <p>결제 개통을 준비하고 있습니다. 현재 결제는 받지 않습니다.</p>}
          {user === undefined ? <p>로그인 상태 확인 중…</p> : !user ? <Link className="jsa-primary" to="/ko/login?next=%2Fko%2Fbilling">로그인하기</Link> : <>
            {account?.access?.active && <p>현재 이용 기간: {date(account.access.expires_at)}까지</p>}
            {config.seller && <label className="billing-consent"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /> <span><a href={config.seller.termsUrl} target="_blank" rel="noopener noreferrer">구매 약관</a>, <a href={config.seller.refundUrl} target="_blank" rel="noopener noreferrer">환불 기준</a>과 30일 이용 기간·최종 결제금액을 확인했습니다.</span></label>}
            <button className="jsa-primary" disabled={!config.enabled || !agree || busy || !account || account.access.active} onClick={purchase}>{busy ? '처리 중…' : config.mode === 'test' ? '테스트 결제하기' : '9,900원 결제하기'}</button>
          </>}
          <p><Link to="/ko/business">Professional 30일 무료 체험 확인하기 →</Link></p>
        </section>
        {user && config.mode !== 'disabled' && <section className="jsa-card billing-orders"><h2>내 결제 내역</h2><button disabled={busy} onClick={() => run(loadAccount)}>내역 새로고침</button><p>최근 주문 20건을 표시합니다. 결제 후 화면이 닫혔다면 해당 주문의 ‘상태 확인’을 눌러 주세요.</p>
          {account?.orders.length === 0 && <p>결제 내역이 없습니다.</p>}
          {account?.orders.map(order => <article className="billing-order" key={order.id}><h3>{states[order.status] || order.status}{order.mode === 'test' ? ' (테스트)' : ''}</h3><p className="billing-order-id">주문번호: {order.id}</p><p>{order.amount.toLocaleString('ko-KR')}원 · 주문일 {date(order.created_at)}</p>{order.expires_at && <p>이용 기간: {date(order.starts_at)} ~ {date(order.expires_at)}</p>}
            <div className="jsa-toolbar"><button disabled={busy} onClick={() => run(async () => { await billingRequest('reconcile', { orderId: order.id }); await loadAccount(); })}>상태 확인</button>
            {['DONE','PARTIAL_CANCELED'].includes(order.status) && <button disabled={busy || Boolean(order.refund_requested_at)} onClick={() => run(async () => { await billingRequest('refund-request', { orderId: order.id }); await loadAccount(); setMessage('환불 요청을 기록했습니다. 아래 고객지원 연락처로 주문번호와 함께 문의해 주세요. 환불 완료 시 결제 상태가 변경됩니다.'); })}>{order.refund_requested_at ? '환불 요청 접수됨' : '환불 요청 기록'}</button>}</div>
          </article>)}
        </section>}
        {config.seller && <section className="jsa-card billing-seller"><h2>판매자 및 고객지원</h2><dl>{[['상호',config.seller.businessName],['대표자',config.seller.representative],['사업자등록번호',config.seller.registrationNumber],['통신판매업 신고',config.seller.mailOrderNumber],['주소',config.seller.address],['연락처',config.seller.supportPhone]].map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p><a href={'mailto:' + config.seller.supportEmail}>{config.seller.supportEmail}</a></p><a href={config.seller.privacyUrl} rel="noreferrer">개인정보 처리방침</a></section>}
      </>}
    </main>
  </div>;
}
