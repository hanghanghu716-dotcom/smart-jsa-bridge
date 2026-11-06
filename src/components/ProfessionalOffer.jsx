import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { billingRequest } from '../services/billingService';
import '../styles/billing.css';
export default function ProfessionalOffer() {
  const [config, setConfig] = useState(null);
  useEffect(() => { let live = true; billingRequest('config').then(value => { if (live) setConfig(value); }).catch(() => {}); return () => { live = false; }; }, []);
  return <div className="billing-offer"><p><strong>Professional 30일 이용권</strong> · {config?.product?.amount?.toLocaleString('ko-KR') || '9,900'}원{config?.enabled ? ' · 1회 결제' : ' (예정)'}</p><p>회사 양식·개정 이력·팀 결재를 관리하세요. 자동 갱신은 없습니다.</p><Link to="/ko/billing">기능 비교와 이용권 안내 →</Link></div>;
}
