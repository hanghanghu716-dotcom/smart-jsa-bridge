import { LanguageLink } from '../hooks/useLanguage';
import { getSupportUi } from '../locales/supportUi.js';
import DiscoveryLinks from './DiscoveryLinks';
import './WorkSupportRail.css';

export default function WorkSupportRail({locale,kind,contentId,onStart,startHref,downloadHref,disabled=false,side='left'}){
 const ui=getSupportUi(locale);
 return <aside className={'work-support-rail work-support-rail--'+side} aria-label={side==='left'?ui.use:ui.explore} dir={locale?.startsWith('ar')?'rtl':'ltr'}>
  {side==='left'&&<section className="work-support-card">
   <h2>{ui.use}</h2>
   {onStart?<button type="button" disabled={disabled} onClick={onStart}>{ui.start} →</button>:startHref?<a href={startHref}>{ui.start} →</a>:<LanguageLink to="/work-packages">{ui.start} →</LanguageLink>}
   {downloadHref?<a href={downloadHref}>{ui.downloads} ↓</a>:<LanguageLink to="/work-packages">{ui.formats}</LanguageLink>}
  </section>}
  {(kind||side==='right')&&<section className="work-support-card">
   <h2>{ui.explore}</h2>
   {kind==='case'&&<DiscoveryLinks kind="case" target={contentId} compact/>}
   {kind==='ugc'&&<DiscoveryLinks id={contentId} compact/>}
   <LanguageLink to="/archive">{ui.cases} →</LanguageLink>
   <LanguageLink to="/explore">{ui.community} →</LanguageLink>
   <LanguageLink to="/jrajsa">{ui.guides} →</LanguageLink>
  </section>}
 </aside>;
}
