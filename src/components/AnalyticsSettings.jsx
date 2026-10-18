import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAnalyticsText } from '../locales/analyticsText.js';
import { analyticsRegion,analyticsChoice,storeAnalyticsChoice } from '../utils/analyticsConsent.js';
import { analyticsOptedOut, ANALYTICS_CHANGE_EVENT, clearAnalyticsCookies } from '../utils/analytics.js';

function read() { try { return analyticsOptedOut(window.localStorage); } catch { return true; } }
export default function AnalyticsSettings() {
  const { i18n } = useTranslation();
  const text = getAnalyticsText(i18n.language);
  const [disabled, setDisabled] = useState(read), [error, setError] = useState(false);
  const [required,setRequired]=useState(null);
  useEffect(() => {
    const sync = () => setDisabled(read()||(required===true&&analyticsChoice(window.localStorage)!=='allowed'));
    analyticsRegion().then(value=>{setRequired(value);setDisabled(read()||(value&&analyticsChoice(window.localStorage)!=='allowed'));});
    window.addEventListener('storage', sync);
    window.addEventListener(ANALYTICS_CHANGE_EVENT,sync);
    return () => {window.removeEventListener('storage', sync);window.removeEventListener(ANALYTICS_CHANGE_EVENT,sync);};
  }, [required]);
  function change() {
    try {
      storeAnalyticsChoice(window.localStorage,disabled);
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
