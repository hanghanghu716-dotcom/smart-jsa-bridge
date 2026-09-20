import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function AdSlot({ client, slot, format, responsive, style }) {
  const adRef = useRef(null);
  const requested = useRef(false);
  const valid = /^ca-pub-\d{16}$/.test(client || '') && /^\d+$/.test(slot || '');

  useEffect(() => {
    if (!valid || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
      || navigator.userAgent.includes('ReactSnap')) return;
    const element = adRef.current;
    const request = () => {
      if (!element?.isConnected || requested.current || element.getAttribute('data-adsbygoogle-status')) return;
      if (element.getBoundingClientRect().width <= 0 || getComputedStyle(element).visibility === 'hidden') return;
      requested.current = true;
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
      catch (error) { console.error('AdSense error:', error); }
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(request) : null;
    if (element) observer?.observe(element);
    window.addEventListener('resize', request);
    request();
    return () => { observer?.disconnect(); window.removeEventListener('resize', request); };
  }, [client, slot, valid]);

  // Stable snapshot/browser markup; only effects request advertisements.
  if (!valid) return null;
  return (
    <div className="adsense-wrapper" style={{ width: '100%', overflow: 'hidden', ...style }}>
      <ins ref={adRef} className="adsbygoogle" style={{ display: 'block', width: '100%', ...style }}
        data-ad-client={client} data-ad-slot={slot} data-ad-format={format}
        data-full-width-responsive={responsive} />
    </div>
  );
}

export default function AdSenseUnit({ client, slot, format = 'auto', responsive = 'true', style = {} }) {
  const { pathname } = useLocation();
  return <AdSlot key={pathname + ':' + client + ':' + slot} {...{ client, slot, format, responsive, style }} />;
}
