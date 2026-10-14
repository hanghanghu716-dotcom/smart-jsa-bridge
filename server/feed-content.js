import { getCommunityUi } from '../src/locales/communityUi.js';
import { getDiscoveryUi } from '../src/locales/discoveryUi.js';
import { getPublicUi } from '../src/locales/publicUi.js';
import { riskValue } from '../src/utils/discovery.js';
import { escapeHtml as escape } from './public-content.js';

// RSS description contains escaped HTML. Remove characters XML 1.0 cannot carry.
export function feedXml(value) {
  // eslint-disable-next-line no-control-regex
  return escape(String(value ?? '').toWellFormed().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, ''));
}

// Only fields already displayed on the public detail page belong in the feed.
// Never serialize form_data, participants, signatures, notes or custom fields.
export function publicFeedBody(row, locale) {
  const ui = getPublicUi(locale), community = getCommunityUi(locale), discovery = getDiscoveryUi(locale);
  const paragraph = value => value ? `<p>${escape(value).replace(/\r?\n/g, '<br>')}</p>` : '';
  const context = ['scope', 'region', 'limitations', 'sources'].filter(key => row.publication_context[key])
    .map(key => `<section><h2>${escape(community[key])}</h2>${paragraph(row.publication_context[key])}</section>`).join('');
  const steps = row.analysis_data.map(step => {
    const scores = [['frequency', 'frequency'], ['severity', 'severity'], ['riskLevel', 'risk']]
      .filter(([field]) => riskValue(step[field]) !== null)
      .map(([field, label]) => `${escape(discovery[label])}: ${riskValue(step[field])}`).join(' · ');
    const risks = step.risks.map(risk => `<li><h3>${escape(risk.factor)}</h3>${paragraph(risk.category)}${paragraph(risk.current_measure || risk.measure)}${paragraph(risk.recommend_measure)}</li>`).join('');
    return `<section><h2>${escape(step.proc.stepTitle)}</h2>${paragraph(step.proc.stepDetail)}${paragraph(scores)}<ul>${risks}</ul></section>`;
  }).join('');
  return `<article><h1>${escape(row.title)}</h1>${paragraph(ui.notice)}${context}${steps}</article>`;
}
