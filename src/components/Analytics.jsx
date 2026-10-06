import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsHost, publicAnalyticsPath, analyticsOptedOut, clearAnalyticsCookies, ANALYTICS_CHANGE_EVENT } from '../utils/analytics.js';

function optedOut() { try { return analyticsOptedOut(window.localStorage); } catch { return true; } }
export default function Analytics() {
  const { pathname } = useLocation();
  const [disabled, setDisabled] = useState(optedOut);
  const frame = useRef(null), ready = useRef(false), currentPath = useRef(null), sequence = useRef(0);
  const path = publicAnalyticsPath(pathname);
  const enabled = !!path && analyticsHost(window.location, navigator.userAgent) && !disabled;
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
      if (currentPath.current && !optedOut()) element.contentWindow?.postMessage({ type: 'smartjsa:page-view', path: currentPath.current, sequence: ++sequence.current }, window.location.origin);
    };
    frame.current = element;
    document.body.appendChild(element);
    return () => { ready.current = false; element.onload = null; element.remove(); frame.current = null; };
  }, [enabled]);
  useEffect(() => {
    currentPath.current = path;
    if (enabled && ready.current && !optedOut()) frame.current?.contentWindow?.postMessage({ type: 'smartjsa:page-view', path, sequence: ++sequence.current }, window.location.origin);
  }, [path, enabled]);
  return null;
}
