import { SUPPORTED_LANGS, normalizeLocale } from '../locales/config.js';

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();

export function getPublicJsaLocale(project) {
  const locale = normalizeLocale(project?.form_data?.contentLocale || '');
  return SUPPORTED_LANGS.includes(locale) ? locale : null;
}

export function assessPublicJsaQuality(project) {
  const analysis = Array.isArray(project?.analysis_data) ? project.analysis_data : [];
  const validSteps = analysis.filter(step =>
    clean(step?.proc?.stepTitle).length >= 2 &&
    clean(step?.proc?.stepDetail).length >= 4
  );
  const risks = validSteps.flatMap(step => Array.isArray(step?.risks) ? step.risks : []);
  const hazards = risks.filter(risk => clean(risk?.factor || risk?.risk_factor).length >= 2);
  const controls = risks.filter(risk =>
    clean(risk?.measure || risk?.current_measure || risk?.recommend_measure).length >= 2
  );
  const locale = getPublicJsaLocale(project);
  const titleLength = clean(project?.title).length;

  const reasons = [];
  if (!locale) reasons.push('missing-locale');
  if (titleLength < 6) reasons.push('short-title');
  if (validSteps.length < 3) reasons.push('few-steps');
  if (hazards.length < 3) reasons.push('few-hazards');
  if (controls.length < 3) reasons.push('few-controls');

  return {
    indexable: reasons.length === 0,
    locale,
    validSteps: validSteps.length,
    hazards: hazards.length,
    controls: controls.length,
    reasons
  };
}

export function publicJsaDescription(project, maxLength = 155) {
  const steps = Array.isArray(project?.analysis_data) ? project.analysis_data : [];
  const pieces = [
    clean(project?.title),
    ...steps.slice(0, 3).map(step => clean(step?.proc?.stepTitle)),
    ...steps.flatMap(step => (step?.risks || []).slice(0, 1).map(risk => clean(risk?.factor || risk?.risk_factor)))
  ].filter(Boolean);
  const text = pieces.join(' · ');
  return text.length > maxLength ? text.slice(0, maxLength - 1).trimEnd() + '…' : text;
}
