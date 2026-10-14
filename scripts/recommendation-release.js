import { createHash } from 'node:crypto';
import { validateKnowledgeBank, knowledgeContentHash } from './recommendation-knowledge.js';
export const mappingContentHash = mapping => createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(mapping).filter(([key]) => key !== 'review')))).digest('hex');

// Pure build step: callers store the result in a separate release. Never writes to a database.
export function compileRecommendationRelease(bank, mappings, { releaseId, sourceFingerprints } = {}) {
  const errors = validateKnowledgeBank(bank, { forPublication: true });
  if (errors.length) throw Error(`Unreviewed or invalid knowledge: ${errors.map(x => x.id).join(', ')}`);
  if (!releaseId || !Array.isArray(mappings) || !sourceFingerprints) throw Error('Release ID, mappings and current source fingerprints required');
  const byId = new Map(bank.units.map(unit => [unit.id, unit]));
  if (byId.size !== bank.units.length) throw Error('Release unit IDs must be unique across locales and revisions');
  const seen = new Set();
  const candidates = mappings.map(mapping => {
    const unit = byId.get(mapping.unitId), score = mapping.score;
    if (!unit || sourceFingerprints[unit.id] !== unit.sourceFingerprint) throw Error('Missing or changed source revision');
    const scope = unit.applicability;
    if (!scope || !['taskType', 'hazardType', 'targetType'].every(key => typeof scope[key] === 'string' && scope[key]) || !Array.isArray(scope.conditionsRequired) || !scope.conditionsRequired.length || !Array.isArray(scope.excludedConditions)) throw Error('Reviewed applicability required');
    if (!['current', 'advanced'].includes(mapping.kind) || (mapping.kind === 'advanced' && !mapping.currentControlId)) throw Error('Explicit control chain required');
    if (score?.kind !== 'text_similarity' || !Number.isFinite(score.value) || score.value < 0 || score.value > 1 || score.locale !== unit.locale || !score.model || !score.modelVersion || !score.generatedAt) throw Error('Score provenance required; similarity is not probability');
    if (mapping.review?.status !== 'approved' || !mapping.review.reviewer || !mapping.review.reviewedAt || mapping.review.contentHash !== knowledgeContentHash(unit) || mapping.review.mappingHash !== mappingContentHash(mapping)) throw Error('Reviewed mapping required');
    if (mapping.kind === 'advanced') {
      const current = byId.get(mapping.currentControlId);
      if (!current || current.locale !== unit.locale || current.jurisdiction !== unit.jurisdiction || ['taskType', 'hazardType', 'targetType'].some(key => current.applicability?.[key] !== scope[key])) throw Error('Control chain has incompatible context');
    }
    const key = JSON.stringify([unit.id, mapping.kind, mapping.currentControlId || null]);
    if (seen.has(key)) throw Error('Duplicate mapping');
    seen.add(key);
    return { ...unit, kind: mapping.kind, currentControlId: mapping.currentControlId || null, score, mappingReview: mapping.review };
  });
  const contentHash = createHash('sha256').update(JSON.stringify(candidates)).digest('hex');
  return { schemaVersion: 1, releaseId, contentHash, candidates };
}
