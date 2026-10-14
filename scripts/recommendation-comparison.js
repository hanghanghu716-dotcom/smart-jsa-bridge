import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { evaluateRecommendationRanking, evaluationReviewHash, validateEvaluationSplits } from './recommendation-evaluation.js';

const approved = sample => sample.groupVerified && typeof sample.relevant === 'boolean'
  && sample.review?.status === 'approved' && sample.review.reviewer && sample.review.reviewedAt
  && sample.review.contentHash === evaluationReviewHash(sample);
export const evaluationQueryHash = query => createHash('sha256').update(JSON.stringify(query)).digest('hex');
const median = values => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

// Compare explicit outputs, including empty/error responses, on the same frozen queries.
// No model calls, generated scores, or assumed ground truth are performed here.
export function compareRecommendationSystems(dataset, runs) {
  if (dataset?.schemaVersion !== 1 || !Array.isArray(dataset.samples) || !Array.isArray(dataset.queries)) throw Error('Frozen queries and samples required');
  const queries = new Map(dataset.queries.map(query => [query.id, query]));
  if (queries.size !== dataset.queries.length || [...queries.values()].some(query => !query.id || !query.locale || !query.jurisdiction || !query.sourceGroupId || !query.task || !['development', 'tuning', 'held_out'].includes(query.partition))) throw Error('Unique contextual query IDs and explicit partitions required');
  const samples = new Map();
  for (const sample of dataset.samples) {
    const query = queries.get(sample.queryId);
    if (!sample.id || samples.has(sample.id) || !query || query.sourceGroupId !== sample.sourceGroupId || query.locale !== sample.locale || query.jurisdiction !== sample.jurisdiction || query.task !== sample.task || query.partition !== sample.partition || sample.queryContextHash !== evaluationQueryHash(query)) throw Error('Sample must belong to exactly one matching query context and partition');
    samples.set(sample.id, sample);
  }
  const partitions = Object.groupBy(dataset.samples, sample => sample.partition || 'unassigned');
  if (Object.keys(partitions).some(key => !['development', 'tuning', 'held_out'].includes(key))) throw Error('Explicit evaluation partition required');
  validateEvaluationSplits(partitions);
  const heldQueries = [...queries.values()].filter(query => query.partition === 'held_out');
  if (heldQueries.some(query => !dataset.samples.some(sample => sample.queryId === query.id && sample.partition === query.partition))) throw Error('Held-out query has no corresponding candidate labels');
  const held = new Set(heldQueries.map(query => query.id));
  const systemIds = new Set();
  if (!Array.isArray(runs)) throw Error('System runs array required');
  const systems = runs.map(run => {
    if (!run.id || systemIds.has(run.id) || !run.version || !Array.isArray(run.responses) || !Array.isArray(run.trainingSourceGroups) || !Array.isArray(run.tuningSourceGroups)) throw Error('Unique versioned system and declared training/tuning groups required');
    systemIds.add(run.id);
    if ([...run.trainingSourceGroups, ...run.tuningSourceGroups].some(group => heldQueries.some(query => query.sourceGroupId === group))) throw Error('Held-out source group leaked into model development');
    const responses = new Map();
    for (const response of run.responses) {
      if (!held.has(response.queryId) || responses.has(response.queryId) || !['ok', 'error'].includes(response.status) || !Array.isArray(response.predictions)) throw Error('One explicit response per held-out query required');
      if (response.status === 'error' && response.predictions.length) throw Error('Failed query cannot contain successful predictions');
      if (response.latencyMs != null && (!Number.isFinite(response.latencyMs) || response.latencyMs < 0)) throw Error('Invalid latency');
      if (response.costUsd != null && (!Number.isFinite(response.costUsd) || response.costUsd < 0)) throw Error('Invalid cost');
      for (const prediction of response.predictions) {
        const sample = samples.get(prediction.sampleId);
        if (!sample || sample.queryId !== response.queryId || sample.partition !== 'held_out') throw Error('Prediction refers to a foreign or non-held-out candidate');
      }
      responses.set(response.queryId, response);
    }
    if (responses.size !== held.size) throw Error('Missing system responses; record empty results and errors explicitly');
    const responseList = [...responses.values()];
    const predictions = responseList.flatMap(response => response.predictions.map(item => ({ ...item, queryId: response.queryId })));
    const quality = evaluateRecommendationRanking(dataset.samples, predictions);
    const judgedQueries = heldQueries.filter(query => {
      const labels = dataset.samples.filter(sample => sample.queryId === query.id);
      return labels.length > 0 && labels.every(approved);
    });
    const positiveQueries = judgedQueries.filter(query => dataset.samples.some(sample => sample.queryId === query.id && sample.relevant));
    const missed = positiveQueries.filter(query => ![...responses.get(query.id).predictions].sort((a, b) => b.score - a.score).slice(0, 3)
      .some(item => samples.get(item.sampleId).relevant));
    return { id: run.id, version: run.version, queries: heldQueries.length,
      returnedQueries: responseList.filter(response => response.status === 'ok' && response.predictions.length).length,
      emptyQueries: responseList.filter(response => response.status === 'ok' && !response.predictions.length).length,
      failedQueries: responseList.filter(response => response.status === 'error').length,
      missingReviewSamples: dataset.samples.filter(sample => held.has(sample.queryId) && !approved(sample)).length,
      ...quality, fullyReviewedPositiveQueries: positiveQueries.length,
      missedPositiveQueries: positiveQueries.length ? missed.length : null,
      relevantQueryRecallAt3: positiveQueries.length ? 1 - missed.length / positiveQueries.length : null,
      medianLatencyMs: median(responseList.map(response => response.latencyMs).filter(Number.isFinite)),
      latencyObservations: responseList.filter(response => Number.isFinite(response.latencyMs)).length,
      costUsd: responseList.length && responseList.every(response => Number.isFinite(response.costUsd)) ? responseList.reduce((sum, response) => sum + response.costUsd, 0) : null,
      costObservations: responseList.filter(response => Number.isFinite(response.costUsd)).length };
  });
  return { schemaVersion: 1, datasetHash: createHash('sha256').update(JSON.stringify(dataset)).digest('hex'),
    comparisonReady: systems.length >= 2 && systems.every(system => system.missingReviewSamples === 0 && system.queries > 0), systems,
    limitations: 'Judged candidate pool only, not exhaustive hazard recall. Source-group separation does not prove independence from pretrained model corpora. Similarity percentages are not safety probabilities.' };
}

async function main(args) {
  const [datasetFile, runsFile, output] = args;
  if (!output) throw Error('Usage: node scripts/recommendation-comparison.js dataset.json runs.json output.json');
  const [dataset, runs] = await Promise.all([datasetFile, runsFile].map(async file => JSON.parse(await fs.readFile(file, 'utf8'))));
  const report = compareRecommendationSystems(dataset, runs);
  await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ comparisonReady: report.comparisonReady, systems: report.systems.length }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
