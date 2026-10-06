import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsHost, publicAnalyticsPath, publicAnalyticsReferrer, publicAnalyticsTitle, analyticsOptedOut, clearAnalyticsCookies, ANALYTICS_CHANGE_EVENT } from '../utils/analytics.js';

function optedOut() { try { return analyticsOptedOut(window.localStorage); } catch { return true; } }
export default function Analytics() {
  const { pathname } = useLocation();
  const [disabled, setDisabled] = useState(optedOut);
  const frame = useRef(null), ready = useRef(false), pending = useRef(null), sequence = useRef(0);
  const referrer = useRef(publicAnalyticsReferrer(document.referrer));
  const path = publicAnalyticsPath(pathname);
  const enabled = !!path && analyticsHost(window.location, navigator.userAgent) && !disabled;
  const flush = useCallback(() => {
    if (!pending.current || !ready.current || !frame.current || optedOut()) return;
    const view = pending.current;
    frame.current.contentWindow?.postMessage({ type: 'smartjsa:page-view', ...view, referrer: referrer.current, sequence: ++sequence.current }, window.location.origin);
    referrer.current = window.location.origin + view.path;
    pending.current = null;
  }, []);
  useEffect(() => {
    const sync = () => setDisabled(optedOut());
    window.addEventListener('storage', sync);
    window.addEventListener(ANALYTICS_CHANGE_EVENT, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(ANALYTICS_CHANGE_EVENT, sync); };
  }, []);
  useEffect(() => {
    if (disabled) clearAnalyticsCookies(document, window.location.hostname);
  }, [disabled]);
  useEffect(() => {
    if (!enabled) return;
    const element = document.createElement('iframe');
    element.src = '/analytics-frame.html';
    element.title = 'Analytics';
    element.hidden = true;
    element.referrerPolicy = 'no-referrer';
    element.setAttribute('aria-hidden', 'true');
    element.onload = () => {
      ready.current = true;
      flush();
    };
    frame.current = element;
    document.body.appendChild(element);
    return () => { ready.current = false; element.onload = null; element.remove(); frame.current = null; };
  }, [enabled, flush]);
  useEffect(() => {
    pending.current = null;
    if (!enabled) return;
    // Helmet updates the head after SPA navigation. Wait for the current
    // route's title to settle, rather than sending the preceding page's title.
    let quiet, deadline, sent = false;
    const matchesRoute = () => {
      try { return publicAnalyticsPath(new URL(document.querySelector('link[rel="canonical"]')?.href).pathname) === path; }
      catch { return false; }
    };
    const send = () => {
      if (sent) return;
      sent = true;
      clearTimeout(quiet); clearTimeout(deadline); observer.disconnect();
      pending.current = { path, title: publicAnalyticsTitle(matchesRoute() ? document.title : '') };
      flush();
    };
    const settle = () => {
      clearTimeout(quiet);
      if (matchesRoute()) quiet = setTimeout(send, 200);
    };
    const observer = new MutationObserver(settle);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true });
    deadline = setTimeout(send, 2500);
    settle();
    return () => { clearTimeout(quiet); clearTimeout(deadline); observer.disconnect(); pending.current = null; };
  }, [path, enabled, flush]);
  return null;
}
