import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { headerAccountUi } from '../locales/headerAccountUi';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { LanguageLink } from '../hooks/useLanguage';
import { LANGUAGE_OPTIONS, SUPPORTED_LANGS } from '../locales/config';
import { communityHomeUi } from '../locales/communityHomeUi';
import { getPublicUi } from '../locales/publicUi';
import { getWorkspaceNavUi } from '../locales/workspaceNavUi';
import ThemeSwitcher from './ThemeSwitcher';
import '../styles/community-home.css';

export default function PublicSiteHeader({ community = false }) {
  const { i18n } = useTranslation(), location = useLocation();
  const locale = location.pathname.split('/')[1] || i18n.language;
  const ui = communityHomeUi(locale), p = getPublicUi(locale), w = getWorkspaceNavUi(locale);
  const { user } = useContext(AuthContext);
  const account = headerAccountUi(locale);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const loginPath = '/login?next=' + encodeURIComponent(location.pathname + location.search + location.hash);
  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    setLogoutError(false);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch {
      setLogoutError(true);
    } finally {
      setSigningOut(false);
    }
  }
  function changeLocale(event) {
    const parts = location.pathname.split('/');
    if (SUPPORTED_LANGS.includes(parts[1])) parts[1] = event.target.value;
    else parts.splice(1, 0, event.target.value);
    window.location.assign(parts.join('/') + location.search + location.hash);
  }
  return <header className={'public-site-header' + (community ? ' public-site-header--community' : '')}>
    <div className="public-site-masthead"><div className="public-site-top"><LanguageLink className="public-site-brand" to="/">
      <span className="public-site-mark public-site-logo" aria-hidden="true"><svg viewBox="250 135 300 300" width="42" height="42" focusable="false"><image href="/logo.png" width="800" height="800" /></svg></span><span>Smart JSA Bridge<small>{ui.tagline}</small></span>
    </LanguageLink><div className="public-site-settings">
      <select aria-label="Language / Region" value={locale} onChange={changeLocale}>
        {!LANGUAGE_OPTIONS.some(item => item.code === locale) && <option value={locale}>{locale}</option>}
        {LANGUAGE_OPTIONS.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
      </select><ThemeSwitcher compact />
    </div></div></div>
    <div className="public-site-nav-shell"><div className="public-site-nav-row"><nav className="public-site-nav" aria-label={p.title}>
      <LanguageLink to="/explore">{p.title}</LanguageLink>
      <LanguageLink to="/archive">{ui.cases}</LanguageLink>
      <LanguageLink to="/jrajsa">{ui.guide}</LanguageLink>
      <LanguageLink to="/work-packages">{w.packages}</LanguageLink>
    </nav>
      <nav className="public-site-account-nav" aria-label={account.account}>
        <LanguageLink className="public-site-workspace" to="/library">{w.workspace}</LanguageLink>
        {user ? <>
          <LanguageLink to="/profile">{account.profile}</LanguageLink>
          <button type="button" onClick={logout} disabled={signingOut} aria-busy={signingOut}>{signingOut ? account.signingOut : account.logout}</button>
        </> : <LanguageLink className="public-site-login" to={loginPath}>{account.login}</LanguageLink>}
      </nav>
    </div>{logoutError && <p className="public-site-account-error" role="alert">{account.error}</p>}</div>
  </header>;
}
