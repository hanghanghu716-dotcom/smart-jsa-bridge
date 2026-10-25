import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { LanguageLink } from '../hooks/useLanguage';
import { LANGUAGE_OPTIONS, SUPPORTED_LANGS } from '../locales/config';
import { communityHomeUi } from '../locales/communityHomeUi';
import { getPublicUi } from '../locales/publicUi';
import { getWorkspaceNavUi } from '../locales/workspaceNavUi';
import ThemeSwitcher from './ThemeSwitcher';
import '../styles/community-home.css';

export default function PublicSiteHeader() {
  const { i18n } = useTranslation(), location = useLocation();
  const locale = location.pathname.split('/')[1] || i18n.language;
  const ui = communityHomeUi(locale), p = getPublicUi(locale), w = getWorkspaceNavUi(locale);
  function changeLocale(event) {
    const parts = location.pathname.split('/');
    if (SUPPORTED_LANGS.includes(parts[1])) parts[1] = event.target.value;
    else parts.splice(1, 0, event.target.value);
    window.location.assign(parts.join('/') + location.search + location.hash);
  }
  return <header className="public-site-header">
    <div className="public-site-top"><LanguageLink className="public-site-brand" to="/">
      <span className="public-site-mark" aria-hidden="true">J</span><span>Smart JSA Bridge<small>{ui.publicLabel}</small></span>
    </LanguageLink><div className="public-site-account">
      <LanguageLink to="/library">{w.workspace}</LanguageLink>
      <select aria-label="Language / Region" value={locale} onChange={changeLocale}>
        {!LANGUAGE_OPTIONS.some(item => item.code === locale) && <option value={locale}>{locale}</option>}
        {LANGUAGE_OPTIONS.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
      </select><ThemeSwitcher compact />
    </div></div>
    <nav className="public-site-nav" aria-label={p.title}>
      <LanguageLink to="/explore">{p.title}</LanguageLink>
      <LanguageLink to="/archive">{ui.cases}</LanguageLink>
      <LanguageLink to="/jrajsa">{ui.guide}</LanguageLink>
      <LanguageLink to="/work-packages">{w.packages}</LanguageLink>
    </nav>
  </header>;
}
