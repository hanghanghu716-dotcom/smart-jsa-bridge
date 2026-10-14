import { createHash } from 'node:crypto';

export function evaluationGroup(groupId) {
  if (typeof groupId !== 'string' || !groupId) throw Error('Canonical source group required');
  const bucket = parseInt(createHash('sha256').update(groupId).digest('hex').slice(0, 8), 16) % 10;
  return bucket < 6 ? 'development' : bucket < 8 ? 'tuning' : 'held_out';
}
export function evaluationReviewHash(sample) {
  return createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(sample).filter(([key]) => key !== 'review')))).digest('hex');
}
export function validateEvaluationSplits(partitions) {
  const groups = new Map();
  for (const [partition, samples] of Object.entries(partitions)) for (const sample of samples) {
    if (!sample.groupVerified || !sample.sourceGroupId) throw Error('Verify canonical source groups before splitting translations or variants');
    const previous = groups.get(sample.sourceGroupId);
    if (previous && previous !== partition) throw Error('Source group leakage between partitions');
    groups.set(sample.sourceGroupId, partition);
  }
}

// Diagnostic relevance metrics, not calibration or accident-prevention probabilities.
export function evaluateRecommendationRanking(samples, predictions) {
  const labels = new Map(), seen = new Set();
  for (const sample of samples) {
    if (seen.has(sample.id)) throw Error('Duplicate evaluation label');
    seen.add(sample.id);
    if (sample.groupVerified && sample.task && typeof sample.relevant === 'boolean' && sample.review?.status === 'approved'
      && sample.review.reviewer && sample.review.reviewedAt && sample.review.contentHash === evaluationReviewHash(sample)) labels.set(sample.id, sample);
  }
  const queries = new Map(), predictionIds = new Set();
  for (const prediction of predictions) {
    if (!prediction.queryId || !Number.isFinite(prediction.score) || prediction.score < 0 || prediction.score > 1) throw Error('Valid query and score required');
    const key = `${prediction.queryId}:${prediction.sampleId}`;
    if (predictionIds.has(key)) throw Error('Duplicate prediction');
    predictionIds.add(key);
    const items = queries.get(prediction.queryId) || []; items.push(prediction); queries.set(prediction.queryId, items);
  }
  const top = [...queries.values()].flatMap(items => [...items].sort((a, b) => b.score - a.score).slice(0, 3));
  const judged = top.filter(item => labels.get(item.sampleId)?.queryId === item.queryId);
  const high = judged.filter(item => item.score >= .95);
  const bounds = [[0, .5], [.5, .7], [.7, .85], [.85, .95], [.95, 1.000000001]];
  return { predictions: top.length, reviewedPredictions: judged.length, reviewCoverage: top.length ? judged.length / top.length : null,
    precisionAt3AmongReviewed: judged.length ? judged.filter(x => labels.get(x.sampleId).relevant).length / judged.length : null,
    highScoreReviewed: high.length, highScoreErrorRate: high.length ? high.filter(x => !labels.get(x.sampleId).relevant).length / high.length : null,
    bins: bounds.map(([min, max]) => { const items = judged.filter(x => x.score >= min && x.score < max); return {
      min, max: Math.min(1, max), count: items.length, relevantRate: items.length ? items.filter(x => labels.get(x.sampleId).relevant).length / items.length : null }; }),
    interpretation: 'Reviewed subset only; unreviewed or empty observations are unknown. Scores are text similarity, not probability.' };
}
