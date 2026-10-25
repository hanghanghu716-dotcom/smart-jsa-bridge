import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { getCommunityUi } from '../locales/communityUi';
import { communityHomeUi } from '../locales/communityHomeUi';
import '../styles/community-home.css';
export default function CommunityFooter() {
  const { i18n } = useTranslation(), ui = getCommunityUi(i18n.language), home = communityHomeUi(i18n.language);
  return <footer className="community-footer public-site-footer">
    <nav><LanguageLink to="/">Smart JSA Bridge</LanguageLink>{[['about', home.about], ['community', home.contact], ['privacy', home.privacy], ['terms', home.terms]].map(([route, label]) => <LanguageLink key={route} to={'/' + route}>{label}</LanguageLink>)}</nav>
    <p>{ui.freeCore}</p><p>© 2026 Smart JSA Bridge</p>
  </footer>;
}
