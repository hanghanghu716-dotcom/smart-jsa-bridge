export const LEGACY_ASSESSMENT = Object.freeze({ version: 1, name: '5 × 5', frequencyMax: 5, severityMax: 5, highFrom: 9 });
export function assessmentProfile(value = {}) {
  const integer = (v, fallback, max) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= max ? Number(v) : fallback;
  const frequencyMax = integer(value.frequencyMax, 5, 10), severityMax = integer(value.severityMax, 5, 10);
  return { version: 1, name: String(value.name || `${frequencyMax} × ${severityMax}`).trim().slice(0, 100),
    criteria: String(value.criteria || '').slice(0, 2000), frequencyMax, severityMax,
    highFrom: integer(value.highFrom, Math.min(9, frequencyMax * severityMax), frequencyMax * severityMax) };
}
export function assessedScore(frequency, severity, value) {
  const profile = assessmentProfile(value);
  const valid = (v, max) => v != null && v !== '' && Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= max;
  return valid(frequency, profile.frequencyMax) && valid(severity, profile.severityMax) ? Number(frequency) * Number(severity) : null;
}
export function changeAssessmentProfile(steps, before, after) {
  if (JSON.stringify(assessmentProfile(before)) === JSON.stringify(assessmentProfile(after))) return steps;
  return steps.map(step => ({ ...step, frequency: null, severity: null, riskLevel: null,
    previousAssessment: { frequency: step.frequency, severity: step.severity, riskLevel: step.riskLevel, profile: assessmentProfile(before) } }));
}
