import '../styles/korean-source-links.css';
import {koreanSourceLinks} from '../utils/koreanSourceLinks.js';
// Direct official destinations while the Korean catalogue has no matching items.
// These are navigation links, not imported job offers or republished articles.
export default function KoreanSourceLinks({kind}) {
 const {label,description,links}=koreanSourceLinks(kind);
 return <aside className="korean-source-links" aria-label={label}>
  <p>{description}</p>
  <div>{links.map(([label,url])=><a key={url} href={url} target="_blank" rel="noopener noreferrer">{label} <span aria-hidden="true">↗</span></a>)}</div>
 </aside>;
}
