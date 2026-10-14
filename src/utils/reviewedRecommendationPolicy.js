// Structured applicability is reviewed data, not a semantic judgment inferred from similar words.
export function selectReviewedRecommendations(manifest, query) {
  if (manifest?.schemaVersion !== 1 || !manifest.releaseId || !Array.isArray(manifest.candidates)) return [];
  const required = ['documentLocale', 'jurisdiction', 'taskType', 'hazardType', 'targetType', 'kind'];
  if (required.some(key => typeof query?.[key] !== 'string' || !query[key])) return [];
  const conditions = new Set(Array.isArray(query.conditions) ? query.conditions : []);
  return manifest.candidates.filter(item => {
    if (item.status !== 'reviewed' || item.locale !== query.documentLocale || item.jurisdiction !== query.jurisdiction || item.kind !== query.kind) return false;
    const scope = item.applicability;
    if (!scope || ['taskType', 'hazardType', 'targetType'].some(key => scope[key] !== query[key])) return false;
    if (!Array.isArray(scope.conditionsRequired) || !scope.conditionsRequired.every(key => conditions.has(key))) return false;
    if (!Array.isArray(scope.excludedConditions) || scope.excludedConditions.some(key => conditions.has(key))) return false;
    if (query.kind === 'advanced' && (!query.currentControlId || item.currentControlId !== query.currentControlId)) return false;
    return item.score?.kind === 'text_similarity' && Number.isFinite(item.score.value) && item.score.value >= 0 && item.score.value <= 1;
  }).sort((a, b) => b.score.value - a.score.value).map(item => ({ ...item, releaseId: manifest.releaseId }));
}
