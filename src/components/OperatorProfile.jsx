import { LanguageLink } from '../hooks/useLanguage';
import { getOperatorProfileUi, operatorDisplayName } from '../locales/operatorProfileUi';
import OperatorContact from './OperatorContact';
import '../styles/operator-profile.css';

export default function OperatorProfile({ locale, compact = false }) {
  const ui = getOperatorProfileUi(locale);
  return <section className={'operator-profile' + (compact ? ' operator-profile-compact' : '')} data-operator-profile={compact ? 'compact' : 'full'} dir={locale?.startsWith('ar') ? 'rtl' : 'ltr'}>
    <h2>{ui.title}</h2>
    <p className="operator-name"><bdi dir="ltr">{operatorDisplayName(locale)}</bdi></p>
    <p className="operator-role">{ui.role}</p>
    <p>{ui.summary}</p>
    {compact ? <LanguageLink to="/about">{ui.more} →</LanguageLink> : <>
      <h3>{ui.experienceTitle}</h3>
      <ul data-operator-experience>{ui.experience.map((item, index) => <li key={index}>{item}</li>)}</ul>
      <p className="operator-scope">{ui.scope}</p>
      <p>{ui.independence}</p>
      <OperatorContact locale={locale} embedded />
    </>}
  </section>;
}
