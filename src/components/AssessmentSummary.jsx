import { useTranslation } from 'react-i18next';
import { assessmentProfile } from '../utils/analysisAssessment';

export default function AssessmentSummary({ value, documentLocale }) {
  const { i18n } = useTranslation('analysis');
  if (!value) return null;
  const profile = assessmentProfile(value), dimensions = `${profile.frequencyMax} × ${profile.severityMax}`;
  const t = i18n.getFixedT(documentLocale, 'analysis');
  return <div data-assessment-profile dir={i18n.dir(documentLocale)} style={{ fontSize: '10px', marginTop: '6px', whiteSpace: 'pre-wrap' }}>
    {t('review.profileLabel')}: {profile.name !== dimensions ? `${profile.name} · ` : ''}{dimensions} · {t('review.highFrom')}: {profile.highFrom}
    {profile.criteria && <div>{profile.criteria}</div>}
  </div>;
}
