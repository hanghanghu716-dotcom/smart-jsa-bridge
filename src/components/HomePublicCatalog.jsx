import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { communityHomeUi } from '../locales/communityHomeUi';
import { getPublicUi } from '../locales/publicUi';
import { getOperatorUi } from '../locales/operatorUi';
import { getLanguageTag } from '../locales/config';
import { localeCountry, countryLabel } from '../utils/publicCountry';
import { homePublicCards, homeResourceImage } from '../utils/homePublicCatalog';
import { isStaticContentBuild } from '../utils/caseListBootstrap';
import { listPublicJsa, publicExclusions } from '../services/publicJsaService';

export default function HomePublicCatalog() {
  const { i18n } = useTranslation(), locale = i18n.language;
  const ui = communityHomeUi(locale), p = getPublicUi(locale);
  const [state, setState] = useState(() => window.__HOME_PUBLIC__?.locale === locale ? window.__HOME_PUBLIC__ : null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (isStaticContentBuild() || navigator.userAgent.includes('ReactSnap')) return;
    let active = true;
    const refresh = async () => {
      try {
        const exclusions = await publicExclusions();
        const result = await listPublicJsa({ country: localeCountry(locale), ...exclusions });
        if (active) setState({ locale, cards: homePublicCards(result.rows, locale) });
      } catch { if (active) setState({ locale, cards: [], error: true }); }
    };
    refresh(); window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [locale, attempt]);
  const current = state?.locale === locale ? state : null;
  return <section className="home-public-section" aria-labelledby="home-public-title">
    <div className="home-section-heading"><h2 id="home-public-title">{ui.latest}</h2><LanguageLink to="/explore">{ui.all} <span aria-hidden="true">→</span></LanguageLink></div>
    <div data-live-public-list="home">
      {!current && <p role="status">{p.title} …</p>}
      {current?.error && <p role="alert">{p.error} <button onClick={() => setAttempt(n => n + 1)}>{p.retry}</button></p>}
      {current && !current.error && !current.cards.length && <p>{p.empty}</p>}
      <div className="home-public-grid">{current?.cards.map(card => <article className="home-resource-card" key={card.id}>
        <div className="home-card-media" aria-hidden="true">{homeResourceImage(card.tags) && <img src={homeResourceImage(card.tags)} alt="" loading="lazy" decoding="async" width="2048" height="868"/>}<span>JSA</span></div>
        <div className="home-card-body">
        <div className="home-card-meta"><span className={card.operator ? 'home-source home-source--operator' : 'home-source'}>{card.operator ? getOperatorUi(locale).badge : ui.member}</span><span>{countryLabel(card.country, locale)} · {p.steps} {card.steps}{card.variant && <> · {getOperatorUi(locale)[card.variant]}</>}</span></div>
        <h3 lang={getLanguageTag(card.locale)} dir="auto"><LanguageLink to={'/public-jsa/' + card.id}>{card.title}</LanguageLink></h3>
        <p className="home-card-excerpt" lang={getLanguageTag(card.locale)} dir="auto">{card.excerpt}</p>
        <div className="home-card-tags">{card.tags.map(({ tag, label }) => <LanguageLink key={tag} to={'/explore?' + new URLSearchParams({ tag, country: card.country || '' })}>#{label}</LanguageLink>)}</div>
        <div className="home-card-bottom"><time dateTime={card.date || undefined}>{card.date?.slice(0, 10)}</time><LanguageLink to={'/public-jsa/' + card.id}>{ui.read} <span aria-hidden="true">↗</span></LanguageLink></div>
        </div>
      </article>)}</div>
    </div>
  </section>;
}
