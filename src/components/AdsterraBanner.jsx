import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adsterra } from '../config/adsterra.js';
import { adsterraUi } from '../locales/adsterraUi.js';
import { ADSTERRA_CHANGE_EVENT, ADSTERRA_MAX_AGE, adsterraChoice, storeAdsterraChoice, validAdsterra, adsterraHost, adsterraPath } from '../utils/adsterra.js';
import './AdsterraBanner.css';

function readChoice() { try { return adsterraChoice(window.localStorage); } catch { return null; } }
function useAdChoice() {
  const [choice, setChoice] = useState(readChoice);
  const [error, setError] = useState(false);
  useEffect(() => {
    const sync = () => setChoice(readChoice());
    window.addEventListener('storage', sync);
    window.addEventListener(ADSTERRA_CHANGE_EVENT, sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(ADSTERRA_CHANGE_EVENT, sync);
      window.removeEventListener('focus', sync);
    };
  }, []);
  useEffect(() => {
    if (!choice) return;
    const remaining = choice.time + ADSTERRA_MAX_AGE - Date.now();
    const timer = setTimeout(() => setChoice(readChoice()), Math.max(0, Math.min(remaining, 2147483647)));
    return () => clearTimeout(timer);
  }, [choice]);
  function choose(allow) {
    try {
      const saved = storeAdsterraChoice(window.localStorage, allow);
      setChoice(saved); setError(false);
      window.dispatchEvent(new Event(ADSTERRA_CHANGE_EVENT));
    } catch { setChoice(null); setError(true); }
  }
  return { choice, error, choose };
}

function AdChoices({ text, choose, error }) {
  return <>
    <p>{text.body}</p>
    <a href="https://adsterra.com/privacy-policy/" target="_blank" rel="noopener noreferrer">{text.privacy}</a>
    {error && <p role="alert">{text.error}</p>}
    <div className="adsterra-actions">
      <button type="button" data-adsterra-deny onClick={() => choose(false)}>{text.deny}</button>
      <button type="button" data-adsterra-allow onClick={() => choose(true)}>{text.allow}</button>
    </div>
  </>;
}

export function AdsterraSettings({ locale, configuration = adsterra }) {
  const text = adsterraUi(locale), { choice, error, choose } = useAdChoice();
  if (!validAdsterra(configuration)) return null;
  return <section className="adsterra-settings" aria-label={text.settings}>
    <h3>{text.settings}</h3>
    <AdChoices {...{ text, choose, error }} />
    {choice?.choice === 'allowed' && <button className="adsterra-disable" onClick={() => choose(false)}>{text.disable}</button>}
  </section>;
}

function VisibleCreative({ text, canStart }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    const check = () => {
      const rect = element?.getBoundingClientRect();
      setVisible(Boolean(canStart && rect && rect.width >= 300 && document.visibilityState === 'visible'
        && rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0));
    };
    const intersection = typeof IntersectionObserver === 'function' ? new IntersectionObserver(check) : null;
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(check) : null;
    if (element) { intersection?.observe(element); resize?.observe(element); }
    window.addEventListener('resize', check);
    window.addEventListener('scroll', check, { passive: true });
    document.addEventListener('visibilitychange', check);
    check();
    return () => {
      intersection?.disconnect(); resize?.disconnect();
      window.removeEventListener('resize', check); window.removeEventListener('scroll', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [canStart]);
  // The frame is mounted once when visible; scrolling cannot refresh an impression.
  const [started, setStarted] = useState(false);
  useEffect(() => { if (visible) setStarted(true); }, [visible]);
  return <div ref={ref} className="adsterra-creative" style={{ display: canStart ? undefined : 'none' }}>
    {started && <iframe title={text.label} src="/api/adsterra-frame" width="300" height="250"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerPolicy="origin" />}
  </div>;
}

export default function AdsterraBanner({ contentReady = false, configuration = adsterra }) {
  const { pathname } = useLocation();
  const locale = pathname.split('/')[1], text = adsterraUi(locale);
  const { choice, error, choose } = useAdChoice();
  const [width, setWidth] = useState(0);
  const ref = useRef(null);
  const allowed = validAdsterra(configuration) && contentReady && adsterraPath(pathname)
    && adsterraHost(window.location, navigator.userAgent);
  useEffect(() => {
    if (!allowed) return;
    const check = () => setWidth(ref.current?.getBoundingClientRect().width || 0);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(check) : null;
    if (ref.current) observer?.observe(ref.current);
    window.addEventListener('resize', check); check();
    return () => { observer?.disconnect(); window.removeEventListener('resize', check); };
  }, [allowed, choice?.choice]);
  if (!allowed || choice?.choice === 'denied') return null;
  const active = choice?.choice === 'allowed';
  return <aside ref={ref} className={'adsterra-banner' + (active ? ' adsterra-banner--active' : '')} aria-label={text.label} data-adsterra-banner>
    <span className="adsterra-label">{text.label}</span>
    {active ? <>
      <VisibleCreative key={pathname} text={text} canStart={width >= 300} />
      <button type="button" className="adsterra-disable" data-adsterra-disable onClick={() => choose(false)}>{text.disable}</button>
    </> : <AdChoices {...{ text, choose, error }} />}
  </aside>;
}
