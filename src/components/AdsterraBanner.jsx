import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adsterra, adsterraPlacements, ADSTERRA_FRAME_ORIGIN } from '../config/adsterra.js';
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


function VisibleCreative({ text, canStart, config, placement }) {
 const ref=useRef(null),[started,setStarted]=useState(false);
 useEffect(()=>{
  const el=ref.current;const check=()=>{const r=el?.getBoundingClientRect();if(canStart&&r&&r.width>=config.width&&r.height>=config.height&&document.visibilityState==='visible'&&r.top<innerHeight&&r.bottom>0&&r.left>=0&&r.right<=innerWidth)setStarted(true);};
  const io=new IntersectionObserver(check),ro=new ResizeObserver(check);if(el){io.observe(el);ro.observe(el);}
  window.addEventListener('resize',check);window.addEventListener('scroll',check,{passive:true});document.addEventListener('visibilitychange',check);check();
  return()=>{io.disconnect();ro.disconnect();window.removeEventListener('resize',check);window.removeEventListener('scroll',check);document.removeEventListener('visibilitychange',check);};
 },[canStart,config]);
 return <div ref={ref} className="adsterra-creative" style={{width:config.width,height:config.height,display:canStart?undefined:'none'}}>
  {started&&<iframe title={text.label+' '+placement} src={ADSTERRA_FRAME_ORIGIN+'/api/adsterra-frame?placement='+placement} width={config.width} height={config.height}
   sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerPolicy="origin"/>}
 </div>;
}

export function AdsterraConsent() {
 const {pathname}=useLocation(),{choice,error,choose}=useAdChoice(),text=adsterraUi(pathname.split('/')[1]);
 if(choice||!adsterraPath(pathname)||!adsterraHost(window.location,navigator.userAgent))return null;
 return <aside className="adsterra-consent" aria-label={text.settings}><AdChoices {...{text,error,choose}}/></aside>;
}

export default function AdsterraBanner({contentReady=false,placement='mobile',configuration}) {
 const {pathname}=useLocation(),text=adsterraUi(pathname.split('/')[1]),{choice,choose}=useAdChoice();
 const config=configuration||adsterraPlacements[placement];
 if(!contentReady||!validAdsterra(config)||!adsterraPath(pathname)||!adsterraHost(window.location,navigator.userAgent)||choice?.choice!=='allowed')return null;
 return <aside className={'adsterra-banner adsterra-banner--'+placement} data-adsterra-banner data-placement={placement} aria-label={text.label}>
  <span className="adsterra-label">{text.label}</span>
  <VisibleCreative key={pathname+':'+placement} text={text} canStart={true} config={config} placement={placement}/>
  <button type="button" className="adsterra-disable" data-adsterra-disable onClick={()=>choose(false)}>{text.disable}</button>
 </aside>;
}

export function AdsterraBottom({contentReady=true}) {
 return <div className="adsterra-bottom"><div className="adsterra-bottom-wide"><AdsterraBanner placement="bottom" contentReady={contentReady}/></div><div className="adsterra-bottom-small"><AdsterraBanner placement="mobile" contentReady={contentReady}/></div></div>;
}
export function AdsterraPageAds({contentReady=false}) {
 return <><div className="adsterra-side adsterra-side-left"><AdsterraBanner placement="left" contentReady={contentReady}/></div><div className="adsterra-side adsterra-side-right"><AdsterraBanner placement="right" contentReady={contentReady}/></div><AdsterraBottom contentReady={contentReady}/></>;
}

export function AdsterraRouteBottom(){const {pathname}=useLocation();return /\/(?:profile|layoutbuilder|layout-module|layout-table)$/.test(pathname)?<AdsterraBottom/>:null;}
