import { LanguageLink } from '../hooks/useLanguage';
import SEO from './SEO';
import PublicSiteHeader from './PublicSiteHeader';
import CommunityFooter from './CommunityFooter';
import DiscoveryTopics from './DiscoveryTopics';
import PlanOverview from './PlanOverview';
import OperatorProfile from './OperatorProfile';
import { getPlansUi } from '../locales/plansUi';
import '../styles/regional-guidance.css';
import '../styles/public-discovery-tools.css';
export default function RegionalGuidancePage({guidance}){
 const {locale,profile,text,namespace,checked}=guidance,l=text.labels;
 const section=(title,body)=><section className="regional-guidance-section"><h2>{title}</h2>{body}</section>;
 return <div className="jsa-workspace regional-guidance-page" dir={locale.startsWith('ar')?'rtl':'ltr'}>
  <SEO pageTitle={guidance.title} pageDescription={guidance.description}/>
  <PublicSiteHeader/>
  <main className="regional-guidance-main" data-regional-guidance={locale}>
   <header className="regional-guidance-hero"><p className="jsa-eyebrow">{profile.name}</p><h1>{text.titles[namespace]}</h1><p>{namespace==='about'?text.about[0]:text.intro}</p></header>
   <nav className="regional-guidance-tabs">{Object.entries(text.titles).map(([path,title])=><LanguageLink key={path} to={'/'+path} aria-current={path===namespace?'page':undefined}>{title}</LanguageLink>)}</nav>
   {namespace!=='about'&&<>
    {section(l[0],<><p>{profile.scope}</p><p className="regional-guidance-terms">{profile.terms}</p></>)}
    {section(l[1],<p>{profile.application}</p>)}
    {namespace==='jrajsa'&&section(l[2],<ol className="regional-guidance-steps">{text.steps.map((step,i)=><li key={i}>{step}</li>)}</ol>)}
    {section(l[3],<p>{text.limits}</p>)}
    <section className="regional-guidance-section" data-regional-guidance-sources><h2>{l[6]}: <time dateTime={checked}>{checked}</time></h2><ul>{profile.links.map(([title,href])=><li key={href}><a href={href} rel="noopener noreferrer">{title}</a></li>)}</ul></section>
   </>}
   {namespace==='about'&&<><OperatorProfile locale={locale}/>{section(l[4],<><p>{text.about[1]}</p><p>{text.about[2]}</p></>)}{section(l[5],<p>{text.about[3]}</p>)}{section(getPlansUi(locale).title,<><p>{getPlansUi(locale).intro}</p><PlanOverview/></>)}</>}
   <DiscoveryTopics locale={locale}/>
   <nav className="regional-guidance-tabs"><LanguageLink to="/info">{l[9]}</LanguageLink><LanguageLink to="/community">{l[7]}</LanguageLink><LanguageLink to="/privacy">{l[8]}</LanguageLink></nav>
  </main><CommunityFooter/>
 </div>;
}
