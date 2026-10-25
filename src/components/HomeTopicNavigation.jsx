import { LanguageLink } from '../hooks/useLanguage';
import { homeTopicsUi } from '../locales/homeTopicsUi';
import { publicTagLabel } from '../locales/publicTagLabels';
import { localeCountry } from '../utils/publicCountry';
import { exploreSearch } from '../utils/discovery';

const topics = [
  ['정비/보수', 'M14 6a5 5 0 0 0-6 6L3 17l4 4 5-5a5 5 0 0 0 6-6l-3 3-4-4 3-3Z'],
  ['건축공사', 'M4 21V5h10v16M14 10h6v11M8 9h2M8 13h2M8 17h2M17 14h1M17 18h1M2 21h20'],
  ['용접(아크)', 'M5 6h9v9H5zM8 9h3v3H8zM14 9l4 4M18 3v3M21 8h-3M19 18l2 2M14 18v3M5 15v6'],
  ['전기정전작업', 'M13 2 4 14h7l-1 8 10-13h-8l1-7Z'],
  ['식품제조', 'M4 3v6a3 3 0 0 0 6 0V3M7 3v18M17 3v18M17 3c5 2 5 9 0 9'],
];

export default function HomeTopicNavigation({ locale }) {
  const ui = homeTopicsUi(locale);
  return <section className="home-topic-section" aria-labelledby="home-topics-title">
    <h2 id="home-topics-title">{ui.title}</h2>
    <nav className="home-topics" aria-label={ui.title}>
      {topics.map(([tag, shape], index) => <LanguageLink className="home-topic-card" key={tag} to={'/explore' + exploreSearch({ tags: [tag], country: localeCountry(locale) })}>
        <span className="home-topic-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={shape}/></svg></span>
        <span className="home-topic-title">{publicTagLabel(tag, locale)} <span aria-hidden="true">›</span></span>
        <span className="home-topic-description">{ui.descriptions[index]}</span>
      </LanguageLink>)}
    </nav>
  </section>;
}
