import { publicationReviewHints } from '../utils/publicationDiagnostics';
import { discoveryToolsUi } from '../locales/discoveryToolsUi';
import { getCommunityUi } from '../locales/communityUi';
export default function PublicationReviewHints({row,locale}){
 const hints=publicationReviewHints(row),ui=discoveryToolsUi(locale),c=getCommunityUi(locale);
 if(!hints.repeated.length&&!hints.missing.length)return null;
 return <details className="publication-quality"><summary>{ui.warning}</summary>
  {!!hints.missing.length&&<p>{ui.missing}: {hints.missing.map(k=>c[k]).join(' · ')}</p>}
  {hints.repeated.slice(0,10).map((item,i)=><div key={i}><p>{ui.repeated} ({item.steps.join(', ')})</p><blockquote dir="auto">{item.text.slice(0,400)}</blockquote></div>)}
 </details>;
}
