import { resourceHubUi } from '../locales/resourceHubUi';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { allPagesLabel } from '../locales/allPagesUi';
import { communityHomeUi } from '../locales/communityHomeUi';
import { getGuideTitle } from '../locales/discoveryUi';
import { discoveryToolsUi } from '../locales/discoveryToolsUi';

export default function PublicSiteMenu({ locale }) {
  const { i18n } = useTranslation('main'), t = i18n.getFixedT(locale, 'main');
  const ui = communityHomeUi(locale);
  const close = event => event.currentTarget.closest('details')?.removeAttribute('open');
  const links = items => items.map(([to, label]) => <LanguageLink key={to} to={to} onClick={close}>{label}</LanguageLink>);
  return <details className="public-site-all-menu" onKeyDown={event => {
    if (event.key === 'Escape') {
      event.currentTarget.removeAttribute('open');
      event.currentTarget.querySelector('summary')?.focus();
    }
  }}>
    <summary>{allPagesLabel(locale)}</summary>
    <nav className="public-site-menu-panel" aria-label={allPagesLabel(locale)}>
      <section><h2>{ui.guide}</h2>{links([
        ['/regulation', t('navRegulation')], ['/jrajsa', t('navProcess')],
        ['/protectiveequipment', t('navPPE')], ['/riskclassification', t('navRiskClass')],
        ['/dictionary', t('navDB')],
      ])}</section>
      <section><h2>{discoveryToolsUi(locale).topics}</h2>{links(
        ['common','construction','manufacturing','chemical','high-risk','general'].map(key => ['/guideline/' + key, getGuideTitle(key, locale)])
      )}</section>
      <section><h2>Smart JSA Bridge</h2>{links([
        ['/search', resourceHubUi(locale).search], ['/resources', resourceHubUi(locale).title],
        ['/explore', t('navExplore')], ['/archive', ui.cases], ['/about', ui.about],
        ['/community', ui.contact], ['/privacy', ui.privacy], ['/terms', ui.terms],
      ])}</section>
    </nav>
  </details>;
}
