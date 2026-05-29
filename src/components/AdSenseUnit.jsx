import { useEffect, useRef } from 'react';

const AdSenseUnit = ({ client, slot, format = 'auto', responsive = 'true', style = {} }) => {
  const adRef = useRef(null);

  useEffect(() => {
    try {
      // React Strict Mode 및 SPA 라우팅 시 광고 중복 호출 방지
      if (adRef.current && !adRef.current.getAttribute('data-adsbygoogle-status')) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [client, slot]); 

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