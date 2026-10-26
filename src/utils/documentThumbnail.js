import { excerptText } from './explorePresentation.js';
import { archiveUi } from '../locales/archiveUi.js';
const e = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Only bounded excerpts from the already-sanitized public view; no names, signatures, images or full form data.
export function documentThumbnailRows(row) {
 return (row.analysis_data || []).slice(0,3).map(step => {
  const risk = (step.risks || []).find(item=>item.factor) || {};
  return {step:excerptText(step.proc?.stepTitle,80),hazard:excerptText(risk.factor,100),control:excerptText(risk.current_measure || risk.measure || risk.recommend_measure,100)};
 });
}
export function renderDocumentThumbnail(card, locale) {
 const ui = archiveUi(locale);
 return '<div class="document-thumbnail" aria-hidden="true"><div class="document-paper document-paper--summary" lang="'+e(card.locale || locale)+'" dir="auto"><div class="document-paper-heading"><b>JSA</b></div><strong>'+e(card.title)+'</strong><p>'+e(card.excerpt || '')+'</p><div class="document-paper-rule"></div></div><span class="document-preview-badge">'+e(ui.documentPreview)+'</span></div>';
}
