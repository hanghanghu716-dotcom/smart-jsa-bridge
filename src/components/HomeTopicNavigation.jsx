import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { getLanguageTag } from '../locales/config';
import { archiveUi } from '../locales/archiveUi';
import { browseTags, TAG_GROUPS } from '../utils/tagBrowser';
import { localeCountry } from '../utils/publicCountry';
import { exploreSearch } from '../utils/discovery';
import ExploreSearchInput from './ExploreSearchInput';

export default function HomeTopicNavigation({ locale }) {
 const { t } = useTranslation('explore'), ui = archiveUi(locale);
 const [search, setSearch] = useState(''), [group, setGroup] = useState('');
 const rail = useRef(null), tags = browseTags(locale, search, group);
 const move = direction => { const el = rail.current; el?.scrollBy({ left: direction * el.clientWidth * .8 * (locale.startsWith('ar') ? -1 : 1), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); };
 return <section className="home-topic-section home-tag-browser" aria-labelledby="home-topics-title">
  <div className="tag-browser-heading"><div><h2 id="home-topics-title">{ui.tagTitle}</h2><p>{ui.tagHint}</p></div>
   <div className="tag-search"><span aria-hidden="true">#</span><ExploreSearchInput value={search} onSearch={setSearch} label={ui.tagSearch}/></div>
  </div>
  <div className="tag-browser-toolbar"><div className="tag-groups" role="group" aria-label={ui.tagTitle}>
   {[[ '', ui.all ], ...TAG_GROUPS.map(([id,label]) => [id,t(label)])].map(([id,label]) => <button key={id} type="button" aria-pressed={group === id} onClick={() => {setGroup(id);rail.current?.scrollTo({left:0});}}>{label}</button>)}
  </div><div className="tag-rail-controls"><span aria-live="polite">{tags.length.toLocaleString(getLanguageTag(locale))}</span><button type="button" aria-label={ui.previous} onClick={() => move(-1)}>‹</button><button type="button" aria-label={ui.next} onClick={() => move(1)}>›</button></div></div>
  <nav className="home-tag-rail" ref={rail} aria-label={ui.tagTitle} tabIndex={0}>
   {tags.map(({tag,label}) => <LanguageLink className="home-tag-link" key={tag} to={'/explore' + exploreSearch({tags:[tag], country:localeCountry(locale)})}><span aria-hidden="true">#</span>{label}<span aria-hidden="true">↗</span></LanguageLink>)}
  </nav>
  {!tags.length && <p role="status">{ui.noTags}</p>}
 </section>;
}
