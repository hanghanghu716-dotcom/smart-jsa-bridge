import {useTranslation} from 'react-i18next';
import {LanguageLink} from '../hooks/useLanguage';
import {getPlansUi} from '../locales/plansUi';
import {getCommunityUi} from '../locales/communityUi';
import {getPublicUi} from '../locales/publicUi';
import '../styles/plans.css';
import {getVisibilityUi} from '../locales/visibilityUi';
export default function PlanOverview(){
 const {i18n}=useTranslation(),ui=getPlansUi(i18n.language),community=getCommunityUi(i18n.language);
 const plans=[['Community',ui.freeStatus,community.freeCore],['Professional',ui.proStatus,ui.proDescription]];
 return <section className="plan-overview" aria-label={ui.title}><div className="plan-grid">{plans.map(([name,status,description],index)=><article className={'plan-card'+(index===0?' plan-core':'')} key={name}><h2>{name}</h2><span className="plan-status">{status}</span><p>{description}</p>{index===1&&<p>{getVisibilityUi(i18n.language).beta}</p>}{index===0&&<LanguageLink to="/explore">{getPublicUi(i18n.language).title} →</LanguageLink>}</article>)}</div></section>;
}
