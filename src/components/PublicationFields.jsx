import { useTranslation } from 'react-i18next';
import { getCommunityUi } from '../locales/communityUi';
import { LanguageLink } from '../hooks/useLanguage';
import { getVisibilityUi } from '../locales/visibilityUi';
import '../styles/community.css';
export default function PublicationFields({consent,onConsent,context,onContext}) {
 const {i18n}=useTranslation(),ui=getCommunityUi(i18n.language),sharing=getVisibilityUi(i18n.language);
 return <fieldset className="publication-context" dir={i18n.dir()}><legend>{sharing.publicSharingTitle}</legend><p>{sharing.publicSharingHint}</p>
 <label className="publication-consent"><input type="checkbox" checked={consent} onChange={e=>onConsent(e.target.checked)}/><span>{ui.consent} <LanguageLink to="/community">{ui.hub} ↗</LanguageLink></span></label>
 <details><summary>{sharing.publicContext}</summary><p>{ui.contextHint}</p>
 {['scope','region','limitations','sources'].map(key=><label key={key}>{ui[key]}<textarea maxLength={key==='region'?120:1800} value={context[key]||''} onChange={e=>onContext({...context,[key]:e.target.value})}/></label>)}
 </details></fieldset>;
}
