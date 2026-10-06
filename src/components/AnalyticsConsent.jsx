import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAnalyticsText } from '../locales/analyticsText.js';
import { normalizeLocale, SUPPORTED_LANGS } from '../locales/config.js';
import { analyticsHost, publicAnalyticsPath, readConsent, clearAnalyticsCookies, CONSENT_KEY } from '../utils/analytics.js';
import '../styles/analytics-consent.css';

function currentConsent() { try { return readConsent(window.localStorage); } catch { return null; } }
export default function AnalyticsConsent() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const [choice, setChoice] = useState(currentConsent);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);
  const frame = useRef(null);
  const ready = useRef(false);
  const currentPath = useRef(null);
  const sequence = useRef(0);
  const path = publicAnalyticsPath(pathname);
  const crawler = /ReactSnap|HeadlessChrome/i.test(navigator.userAgent);
  const enabled = !!path && !crawler && analyticsHost(window.location, navigator.userAgent) && choice === 'granted';
  const locale = normalizeLocale(pathname.split('/')[1]);
  const language = SUPPORTED_LANGS.includes(locale) ? locale : i18n.language;
  const text = getAnalyticsText(language);

  useEffect(() => {
    const sync = () => setChoice(currentConsent());
    window.addEventListener('storage', sync);
    const timer = window.setInterval(sync, 1000);
    return () => { window.removeEventListener('storage', sync); window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (choice !== 'granted') clearAnalyticsCookies(document, window.location.hostname);
  }, [choice]);
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
      if (currentPath.current && currentConsent() === 'granted') element.contentWindow?.postMessage({ type: 'smartjsa:page-view', path: currentPath.current, sequence: ++sequence.current }, window.location.origin);
    };
    frame.current = element;
    document.body.appendChild(element);
    return () => { ready.current = false; element.onload = null; element.remove(); frame.current = null; };
  }, [enabled]);
  useEffect(() => {
    currentPath.current = path;
    if (enabled && ready.current && currentConsent() === 'granted') frame.current?.contentWindow?.postMessage({ type: 'smartjsa:page-view', path, sequence: ++sequence.current }, window.location.origin);
  }, [path, enabled]);

  function choose(next) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, choice: next, at: Date.now() }));
      if (next !== 'granted') { frame.current?.remove(); clearAnalyticsCookies(document, window.location.hostname); }
      setChoice(next); setOpen(false); setDismissed(false); setError(false);
    } catch { setError(true); }
  }
  if (crawler) return null;
  const expanded = open || (!!path && choice === null && !dismissed);
  return <aside className="analytics-consent" dir={language?.startsWith('ar') ? 'rtl' : 'ltr'} aria-label={text.settings}>
    {expanded ? <section className="analytics-consent-panel" aria-labelledby="analytics-consent-title">
      <h2 id="analytics-consent-title">{text.title}</h2>
      <p>{text.body}</p>
      <p className="analytics-consent-detail">{text.detail}</p>
      <Link to={`/${SUPPORTED_LANGS.includes(locale) ? locale : 'en-US'}/privacy`}>{text.privacy}</Link>
      <p role="status">{error ? text.error : choice === 'granted' ? text.allowed : text.denied}</p>
      <div className="analytics-consent-actions">
        <button type="button" onClick={() => choose('denied')} data-analytics-choice="denied">{text.deny}</button>
        <button type="button" onClick={() => choose('granted')} data-analytics-choice="granted">{text.allow}</button>
        <button type="button" onClick={() => { setOpen(false); setDismissed(true); }}>{text.close}</button>
      </div>
    </section> : <button className="analytics-consent-settings" type="button" onClick={() => setOpen(true)}>{text.settings}</button>}
  </aside>;
}
