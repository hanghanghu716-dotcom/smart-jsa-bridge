import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAnalyticsText } from '../locales/analyticsText.js';
import { analyticsOptedOut, OPT_OUT_KEY, ANALYTICS_CHANGE_EVENT, clearAnalyticsCookies } from '../utils/analytics.js';

function read() { try { return analyticsOptedOut(window.localStorage); } catch { return true; } }
export default function AnalyticsSettings() {
  const { i18n } = useTranslation();
  const text = getAnalyticsText(i18n.language);
  const [disabled, setDisabled] = useState(read), [error, setError] = useState(false);
  useEffect(() => {
    const sync = () => setDisabled(read());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function change() {
    try {
      window.localStorage.setItem(OPT_OUT_KEY, String(!disabled));
      if (!disabled) clearAnalyticsCookies(document, window.location.hostname);
      setDisabled(!disabled); setError(false);
      window.dispatchEvent(new Event(ANALYTICS_CHANGE_EVENT));
    } catch { setError(true); }
  }
  return <div className="analytics-preference" style={{margin:'20px 0',padding:'16px',border:'1px solid var(--border-default)',borderRadius:12,color:'var(--text-primary)',background:'var(--panel-bg)'}}>
    <p role="status">{error ? text.error : disabled ? text.denied : text.allowed}</p>
    <button type="button" data-analytics-toggle onClick={change} style={{marginTop:12,minHeight:44,padding:'10px 16px',border:'1px solid var(--border-strong)',borderRadius:8,color:'var(--text-primary)',background:'var(--panel-bg)',cursor:'pointer'}}>{disabled ? text.allow : text.deny}</button>
  </div>;
}
