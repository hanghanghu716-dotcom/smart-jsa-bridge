import { escapeHtml as e, casePath } from './public-content.js';
import { archiveResults, archiveSearch, casePdf } from '../src/utils/archiveDiscovery.js';
import { archiveUi } from '../src/locales/archiveUi.js';
import { getLanguageTag } from '../src/locales/config.js';
import { cleanSummary } from '../src/utils/content.js';
import { safeCaseImage } from '../src/utils/caseThumbnail.js';
import { getPaginationUi } from '../src/locales/paginationUi.js';
import { pageWindow } from '../src/utils/pagination.js';
export function renderArchiveCatalog(rows, locale, query) {
 const result=archiveResults(rows,query,locale), ui=archiveUi(locale), p=getPaginationUi(locale);
 const cards=result.rows.map(row=>{
  const href=e(casePath(locale,row.post_group_id)), title=e(row.title), summary=e(cleanSummary(row.meta_description));
  const image=safeCaseImage(row.thumbnail);
  const preview=image?'<img class="archive-card-image" src="'+e(image)+'" alt="" loading="lazy" decoding="async" width="1536" height="1024">':'';
  const date=Number.isFinite(Date.parse(row.created_at)) ? new Intl.DateTimeFormat(getLanguageTag(locale),{timeZone:'UTC'}).format(new Date(row.created_at)) : '';
  return '<article class="archive-card"><a class="archive-card-preview" href="'+href+'" tabindex="-1" aria-hidden="true">'+preview+'</a><div class="archive-card-body"><div class="archive-card-meta"><time datetime="'+e(row.created_at)+'">'+e(date)+'</time>'+(casePdf(row)?'<span>PDF</span>':'')+'</div><h2><a href="'+href+'">'+title+'</a></h2><p>'+summary+'</p></div></article>';
 }).join('');
 const window=pageWindow(result.page,result.pages,15);
 const pages=[...new Set([1,...window.pages,result.pages])];
 const nav=result.pages>1?'<nav class="list-pagination" aria-label="'+e(p.label)+'">'+pages.map(page=>'<a class="list-pagination-control list-pagination-number" href="/'+e(locale)+'/archive'+e(archiveSearch({...query,page}))+'" aria-label="'+e(p.page.replace('{page}',page))+'"'+(page===result.page?' aria-current="page"':'')+'>'+page+'</a>').join('')+'</nav>':'';
 return '<div class="archive-results-heading"><p role="status">'+e(ui.results.replace('{count}',result.total.toLocaleString(getLanguageTag(locale))))+'</p></div>'+(!result.total?'<div class="archive-empty"><p>'+e(ui.empty)+'</p></div>':'')+'<div id="archive-results" class="archive-grid">'+cards+'</div>'+nav;
}
