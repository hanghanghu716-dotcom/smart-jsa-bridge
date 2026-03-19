// src/components/AdSenseUnit.jsx
import { useEffect } from 'react';

const AdSenseUnit = ({ client, slot, format = 'auto', responsive = 'true', style = {} }) => {
  useEffect(() => {
    try {
      // 컴포넌트가 렌더링된 후 애드센스 스크립트를 한 번만 실행합니다.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []); // 빈 배열은 마운트 시 한 번만 실행됨을 의미합니다.

  return (
    <div className="adsense-wrapper" style={{ overflow: 'hidden', ...style }}>
      <ins
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