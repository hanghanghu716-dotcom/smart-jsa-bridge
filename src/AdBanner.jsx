import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ 경로 변경 감지를 위해 추가

const AdBanner = ({ slot, style, format = 'auto', responsive = 'true' }) => {
  const location = useLocation(); // ✅ 현재 경로 정보를 가져옴

  useEffect(() => {
    try {
      // ✅ 페이지 경로(언어 포함)가 바뀔 때마다 광고 스크립트 재호출
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      // SPA 특성상 광고 유닛이 채워지기 전에 이동하는 경우 에러가 발생할 수 있으나 무시해도 무방합니다.
      console.error("AdSense error:", e);
    }
  }, [location.pathname]); // ✅ 경로(pathname)가 바뀔 때마다 실행

  return (
    <div style={{ 
      ...style, 
      overflow: 'hidden', 
      backgroundColor: 'rgba(255,255,255,0.02)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '100px' // 광고 로딩 전 레이아웃 붕괴 방지
    }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-9791625990220699"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      ></ins>
    </div>
  );
};

export default AdBanner;