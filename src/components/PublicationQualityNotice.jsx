import { useTranslation } from 'react-i18next';
import { publicationTextWarnings } from '../utils/publicationTextQuality.js';
import { getExploreQualityUi } from '../locales/exploreQualityUi.js';
import '../styles/publication-quality.css';

export default function PublicationQualityNotice({ title, analysisData, context }) {
  const { i18n } = useTranslation();
  const ui = getExploreQualityUi(i18n.language);
  const warnings = publicationTextWarnings({ title, analysisData, context });
  if (!warnings.length) return null;
  const fieldLabel = field => field === 'title' || field === 'stepTitle' ? ui.title : field === 'stepDetail' ? ui.details
    : ['factor', 'risk_factor'].includes(field) ? ui.hazard : ['measure', 'current_measure', 'recommend_measure'].includes(field) ? ui.controls : ui.context;
  return <section className="publication-quality" aria-label={ui.warningTitle} dir={i18n.dir()}>
    <h4>{ui.warningTitle}</h4><p>{ui.warningHint}</p>
    <ul>{warnings.slice(0, 5).map((warning, index) => <li key={index}>
      <strong>{[warning.step && `${ui.step} ${warning.step}`, warning.risk && `${ui.hazard} ${warning.risk}`, fieldLabel(warning.field)].filter(Boolean).join(' · ')}</strong>
      <q dir="auto">{warning.snippet}</q>
    </li>)}</ul>
    {warnings.length > 5 && <p>{ui.more.replace('{count}', warnings.length)}</p>}
  </section>;
}
