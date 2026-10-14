import { caseRecommendationUi } from '../locales/caseRecommendationUi';

export default function RecommendationEvidence({ evidence, locale }) {
  const ui = caseRecommendationUi(locale);
  return <div data-reviewed-evidence style={{ fontSize: '.8rem', lineHeight: 1.5 }}>
    <p>{ui.reason}: {evidence.step}</p>
    <p>{ui.conditions}: {evidence.conditions.join(' · ')}</p>
    <p>{ui.exclusions}: {evidence.exclusions.join(' · ')}</p>
    <p>{ui.verification}: {evidence.verification}</p>
    <p>{ui.reviewed}: {evidence.review.reviewedAt} · {evidence.sourceRevision}</p>
    <p>{ui.sources}: {evidence.sources.map(source => <a key={source.url + source.section} href={source.url}
      target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>{source.section} ↗ </a>)}</p>
  </div>;
}
