import { updateRiskValue } from './analysisRecommendations.js';
import { caseWorkSignature } from './caseRecommendations.js';

export function reconcileProcedureAnalysis(analysis, proc, id, invalidate = false) {
  const changed = invalidate || (analysis?.proc && ['stepTitle', 'stepDetail'].some(key => analysis.proc[key] !== proc[key]));
  const risks = Array.isArray(analysis?.risks) ? analysis.risks : [];
  return { ...analysis, id, proc,
    risks: changed ? risks.map(risk => ({ ...updateRiskValue(risk, 'factor', ''), factor: risk.factor, caseContext: null,
      recommendation_review_required: Boolean(risk.current_measure || risk.recommend_measure || risk.measure) })) : risks,
    frequency: changed ? null : analysis?.frequency ?? null,
    severity: changed ? null : analysis?.severity ?? null,
    riskLevel: changed ? null : analysis?.riskLevel ?? null };
}

export function reconcileWorkContextAnalysis(steps, before, after) {
  if (caseWorkSignature(before || {}) === caseWorkSignature(after || {})) return steps;
  return steps.map((step, index) => reconcileProcedureAnalysis(step, step.proc || {}, step.id ?? index, true));
}
