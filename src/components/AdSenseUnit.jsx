import { useEffect, useRef } from 'react';

const AdSenseUnit = ({ client, slot, format = 'auto', responsive = 'true', style = {} }) => {
  const adRef = useRef(null);
  
  // 1. 도메인 기반 로컬 환경 감지 (react-snap 캡처 서버 및 로컬 개발 환경 동시 차단)
  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  useEffect(() => {
    // 2. 로컬 환경(크롤링 중)에서는 애드센스 통신을 완전 봉쇄
    if (isLocalHost) return;

    try {
      if (adRef.current && !adRef.current.getAttribute('data-adsbygoogle-status')) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [client, slot, isLocalHost]); 

  // 3. 로컬 환경일 경우 아예 <ins> 태그 자체를 생성하지 않고 빈 div만 반환합니다.
  if (isLocalHost) {
    return <div className="adsense-blocker" style={{ width: '100%', minHeight: '100px', display: 'none' }}></div>;
  }

  return (
    <div className="adsense-wrapper" style={{ overflow: 'hidden', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};

export default AdSenseUnit;