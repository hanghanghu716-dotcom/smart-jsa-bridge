import React, { useEffect } from 'react';

// 광고 슬롯 번호와 스타일을 받아오는 공용 광고 부품입니다.
const AdBanner = ({ slot, style, format = 'auto' }) => {
  useEffect(() => {
    try {
      // 페이지가 로드될 때 구글 광고를 호출합니다.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div style={{ ...style, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}>
      {/* 실제 광고가 들어가는 영역 */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // 나중에 사용자님의 ID로 교체
        data-ad-slot={slot}                       // 광고 위치별 고유 번호
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;