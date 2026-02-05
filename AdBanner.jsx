import React, { useEffect } from 'react';

const AdBanner = ({ slot, style, format = 'auto', responsive = 'true' }) => {
  useEffect(() => {
    try {
      // 광고 스크립트 재호출 (페이지 이동 시 광고 갱신)
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div style={{ ...style, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* 실제 배포 후 광고가 승인되면 이 부분이 광고로 바뀝니다 */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"  /* 나중에 실제 승인된 번호로 교체 필요 */
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      ></ins>
    </div>
  );
};

export default AdBanner;