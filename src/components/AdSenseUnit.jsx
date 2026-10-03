import { operations } from '../config/operations';
import { adEligible } from '../utils/adEligibility';
import { useEffect, useRef, useState } from 'react';
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

export default function AdSenseUnit({ client, slot, format = 'auto', responsive = 'true', style = {}, content = null }) {
  const { pathname } = useLocation();
  const [consent,setConsent]=useState(null),[checkedAt,setCheckedAt]=useState(()=>Date.now());
  useEffect(()=>{const update=()=>{setCheckedAt(Date.now());setConsent(window.__SMARTJSA_PRIVACY__ || null);};window.addEventListener('smartjsa-privacy-change',update);update();return()=>window.removeEventListener('smartjsa-privacy-change',update);},[]);
  useEffect(()=>{if(!consent?.expiresAt)return;const timer=setTimeout(()=>setConsent(null),Math.max(0,Math.min(2147483647,consent.expiresAt-Date.now())));return()=>clearTimeout(timer);},[consent]);
  const allowed=adEligible(operations,consent,pathname,checkedAt,content);
  useEffect(()=>{
    if(!allowed || document.querySelector('script[data-smartjsa-ads]'))return;
    const script=document.createElement('script');script.dataset.smartjsaAds='true';script.async=true;script.crossOrigin='anonymous';
    script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client);document.head.appendChild(script);
  },[allowed,client]);
  if (!allowed) return null;
  return <AdSlot key={pathname + ':' + client + ':' + slot} {...{ client, slot, format, responsive, style }} />;
}
