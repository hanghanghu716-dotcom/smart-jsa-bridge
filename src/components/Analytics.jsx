import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAnalyticsText } from '../locales/analyticsText';
import { analyticsRegion, analyticsChoice, storeAnalyticsChoice } from '../utils/analyticsConsent';
import { LanguageLink } from '../hooks/useLanguage';
import { analyticsHost, publicAnalyticsPath, publicAnalyticsReferrer, publicAnalyticsTitle, analyticsOptedOut, clearAnalyticsCookies, ANALYTICS_CHANGE_EVENT } from '../utils/analytics.js';

function optedOut() { try { return analyticsOptedOut(window.localStorage); } catch { return true; } }
export default function Analytics() {
  const {i18n}=useTranslation(),text=getAnalyticsText(i18n.language);
  const [required,setRequired]=useState(null),[choice,setChoice]=useState(()=>analyticsChoice(window.localStorage));
  const [choiceError,setChoiceError]=useState(false);
  useEffect(()=>{let live=true;analyticsRegion().then(value=>{if(live)setRequired(value);});return()=>{live=false;};},[]);
  const { pathname } = useLocation();
  const [disabled, setDisabled] = useState(optedOut);
  const frame = useRef(null), ready = useRef(false), pending = useRef(null), sequence = useRef(0);
  const referrer = useRef(publicAnalyticsReferrer(document.referrer));
  const path = publicAnalyticsPath(pathname);
  const enabled = !!path && analyticsHost(window.location, navigator.userAgent) && !disabled && required!==null && (!required||choice==='allowed');
  const flush = useCallback(() => {
    if (!pending.current || !ready.current || !frame.current || optedOut()) return;
    const view = pending.current;
    frame.current.contentWindow?.postMessage({ type: 'smartjsa:page-view', ...view, referrer: referrer.current, sequence: ++sequence.current }, window.location.origin);
    referrer.current = window.location.origin + view.path;
    pending.current = null;
  }, []);
  useEffect(() => {
    const sync = () => {setDisabled(optedOut());setChoice(analyticsChoice(window.localStorage));};
    window.addEventListener('storage', sync);
    window.addEventListener(ANALYTICS_CHANGE_EVENT, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(ANALYTICS_CHANGE_EVENT, sync); };
  }, []);
  useEffect(() => {
    if (disabled || (required===true && choice!=='allowed')) clearAnalyticsCookies(document, window.location.hostname);
  }, [disabled,required,choice]);
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
  function choose(allow){try{storeAnalyticsChoice(window.localStorage,allow);setChoiceError(false);window.dispatchEvent(new Event(ANALYTICS_CHANGE_EVENT));}catch{setChoiceError(true);}}
  return required&&choice===null&&!disabled&&path&&analyticsHost(window.location,navigator.userAgent)?<aside role="region" aria-label={text.title} className="jsa-card" style={{position:'fixed',bottom:16,insetInlineStart:16,zIndex:2000,maxWidth:480,width:'calc(100% - 32px)',padding:20,boxSizing:'border-box'}}><strong>{text.title}</strong><p>{text.body}</p><LanguageLink to="/privacy">{i18n.t('privacy:heading.line1')}</LanguageLink>{choiceError&&<p role="alert">{text.error}</p>}<div className="jsa-toolbar" style={{marginTop:12,display:'flex',gap:12,flexWrap:'wrap'}}>{[false,true].map(allow=><button key={String(allow)} style={{flex:1,minHeight:44}} onClick={()=>choose(allow)}>{allow?text.allow:text.deny}</button>)}</div></aside>:null;
}
