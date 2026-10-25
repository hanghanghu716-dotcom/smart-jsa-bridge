import { LanguageLink } from '../hooks/useLanguage';
import { operations } from '../config/operations';
import { getOperatorProfileUi, operatorDisplayName } from '../locales/operatorProfileUi';
import '../styles/operator-profile.css';

export default function OperatorContact({ locale, embedded = false, showFormLink = true }) {
  const ui = getOperatorProfileUi(locale), Heading = embedded ? 'h3' : 'h2';
  return <section className="operator-contact" data-operator-contact dir={locale?.startsWith('ar') ? 'rtl' : 'ltr'}>
    <Heading>{ui.contactTitle}</Heading>
    {!embedded && <p className="operator-name"><bdi dir="ltr">{operatorDisplayName(locale)}</bdi></p>}
    <p>{ui.contactText}</p>
    <div className="operator-contact-links">
      <a href={'mailto:' + operations.supportEmail}><span>{ui.emailLabel}: </span><bdi dir="ltr">{operations.supportEmail}</bdi></a>
      {showFormLink && <LanguageLink to="/community">{ui.formLink} →</LanguageLink>}
    </div>
  </section>;
}
