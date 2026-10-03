import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { getCommunityPolicy } from '../locales/communityPolicy';
import { getCommunityUi } from '../locales/communityUi';
export default function CommunityFooter(){const {i18n}=useTranslation();const ui=getCommunityUi(i18n.language);return <footer className="community-footer"><LanguageLink to="/community">{getCommunityPolicy(i18n.language).support}</LanguageLink><p>{ui.freeCore}</p></footer>;}
