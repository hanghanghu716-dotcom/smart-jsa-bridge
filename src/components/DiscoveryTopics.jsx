import { LanguageLink } from '../hooks/useLanguage';
import { discoveryToolsUi } from '../locales/discoveryToolsUi';
import { discoveryTopics } from '../utils/discoveryTopics';
export default function DiscoveryTopics({rows=[],locale,query={}}){
 return <nav className="discovery-topic-nav" aria-label={discoveryToolsUi(locale).topics}><details><summary>{discoveryToolsUi(locale).topics}</summary>
  <ul>{discoveryTopics(rows,locale,query).map(item=><li key={item.href}><LanguageLink to={item.href}>{item.label}</LanguageLink></li>)}</ul>
 </details></nav>;
}
