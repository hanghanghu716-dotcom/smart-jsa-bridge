import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adsterra, adsterraPlacements, ADSTERRA_FRAME_ORIGIN } from '../config/adsterra.js';
import { adsterraUi } from '../locales/adsterraUi.js';
import { ADSTERRA_CHANGE_EVENT, ADSTERRA_MAX_AGE, adsterraChoice, storeAdsterraChoice, validAdsterra, adsterraHost, adsterraPath, adsterraCanLoad, createAdsterraPolicyLoader } from '../utils/adsterra.js';
import './AdsterraBanner.css';

let unsavedDenial = null;
function readChoice() { if (unsavedDenial) return unsavedDenial; try { return adsterraChoice(window.localStorage); } catch { return null; } }
const loadPolicy = createAdsterraPolicyLoader();
function useAdPolicy() {
  const { pathname } = useLocation();
  const eligible = adsterraPath(pathname) && adsterraHost(window.location, navigator.userAgent);
  const [policy, setPolicy] = useState(null);
  useEffect(() => {
    if (!eligible) return;
    let live = true;
    loadPolicy().then(value => { if (live) setPolicy(value); });
    return () => { live = false; };
  }, [eligible]);
  return policy;
}
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
    if (!choice || choice.choice === 'denied') return;
    const remaining = choice.time + ADSTERRA_MAX_AGE - Date.now();
    const timer = setTimeout(() => setChoice(readChoice()), Math.max(0, Math.min(remaining, 2147483647)));
    return () => clearTimeout(timer);
  }, [choice]);
  function choose(allow) {
    try {
      const saved = storeAdsterraChoice(window.localStorage, allow);
      unsavedDenial = null; setChoice(saved); setError(false);
      window.dispatchEvent(new Event(ADSTERRA_CHANGE_EVENT));
     } catch {
      // A failed opt-out write must never turn automatic ads back on in this tab.
      unsavedDenial = { choice: 'denied', time: Date.now() };
      setChoice(unsavedDenial); setError(true);
      window.dispatchEvent(new Event(ADSTERRA_CHANGE_EVENT));
    }
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
  const text = adsterraUi(locale), { error, choose } = useAdChoice();
  if (!validAdsterra(configuration)) return null;
  return <section id="advertising-preferences" className="adsterra-settings" aria-label={text.settings}>
    <h3>{text.settings}</h3>
    <AdChoices {...{ text, choose, error }} />
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
 const {pathname}=useLocation(),{choice,error,choose}=useAdChoice(),text=adsterraUi(pathname.split('/')[1]),policy=useAdPolicy();
 if(!policy||policy.blocked||navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||choice||!adsterraPath(pathname)||!adsterraHost(window.location,navigator.userAgent))return null;
 if(policy.requiresConsent===false)return <aside className="adsterra-notice adsterra-notice--inline" aria-label={text.settings}>{text.notice} <Link to={'/'+pathname.split('/')[1]+'/privacy#advertising-preferences'}>{text.settings}</Link></aside>;
 return <aside className="adsterra-consent" aria-label={text.settings}><AdChoices {...{text,error,choose}}/></aside>;
}

export default function AdsterraBanner({contentReady=false,placement='mobile',configuration}) {
 const {pathname}=useLocation(),text=adsterraUi(pathname.split('/')[1]),{choice}=useAdChoice(),policy=useAdPolicy();
 const config=configuration||adsterraPlacements[placement];
 if(!contentReady||!validAdsterra(config)||!adsterraPath(pathname)||!adsterraHost(window.location,navigator.userAgent)||!adsterraCanLoad(choice,policy,navigator))return null;
 return <aside className={'adsterra-banner adsterra-banner--'+placement} data-adsterra-banner data-placement={placement} aria-label={text.label}>
  <span className="adsterra-label">{text.label}</span>
  <VisibleCreative key={pathname+':'+placement} text={text} canStart={true} config={config} placement={placement}/>
 </aside>;
}

export function AdsterraBottom({contentReady=true}) {
 const {pathname}=useLocation(),{choice}=useAdChoice(),policy=useAdPolicy(),text=adsterraUi(pathname.split('/')[1]);
 if(!contentReady||!adsterraCanLoad(choice,policy,navigator)||!adsterraPath(pathname)||!adsterraHost(window.location,navigator.userAgent))return null;
 return <div className="adsterra-bottom"><div className="adsterra-bottom-wide"><AdsterraBanner placement="bottom" contentReady={contentReady}/></div><div className="adsterra-bottom-small"><AdsterraBanner placement="mobile" contentReady={contentReady}/></div><p className="adsterra-notice">{text.notice} <Link to={'/'+pathname.split('/')[1]+'/privacy#advertising-preferences'}>{text.settings}</Link></p></div>;
}
export function AdsterraPageAds({contentReady=false}) {
 return <><div className="adsterra-side adsterra-side-left"><AdsterraBanner placement="left" contentReady={contentReady}/></div><div className="adsterra-side adsterra-side-right"><AdsterraBanner placement="right" contentReady={contentReady}/></div><AdsterraBottom contentReady={contentReady}/></>;
}

export function AdsterraRouteBottom(){const {pathname}=useLocation();return /\/(?:profile|layoutbuilder|layout-module|layout-table)$/.test(pathname)?<AdsterraBottom/>:null;}
