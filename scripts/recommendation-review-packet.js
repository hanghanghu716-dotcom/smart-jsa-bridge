import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { compareRecommendationSystems } from './recommendation-comparison.js';
import { evaluationReviewHash } from './recommendation-evaluation.js';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const contextKeys = ['locale', 'jurisdiction', 'kind', 'task', 'step', 'hazard', 'currentControl', 'target', 'taskType', 'hazardType', 'targetType', 'conditions', 'exclusions'];
const queryMetadataKeys = ['id', 'sourceGroupId', 'partition', 'source', 'incidentSummary', 'proposedRelevant', 'proposalRationale'];
const sourceKeys = ['url', 'authority', 'document', 'publishedAt', 'section', 'doi'];
const pick = (object, keys) => Object.fromEntries(keys.filter(key => object?.[key] !== undefined).map(key => [key, structuredClone(object[key])]));
const packetInstructions = 'Read the referenced source and judge relevance to the exact task, hazard and jurisdiction. Record a rationale and your identity/date. Source checking and independence are reviewer declarations, not externally verified credentials. Do not infer a safety probability. Scores, proposed answers, label-bearing IDs and model hints are intentionally omitted.';

export function buildEvaluationReviewPacket(dataset) {
  // Reuse contextual, grouping and partition validation without creating model runs.
  compareRecommendationSystems(dataset, []);
  for (const query of dataset.queries) {
    if (Object.keys(query).some(key => !contextKeys.includes(key) && !queryMetadataKeys.includes(key))) {
      throw Error('Unsupported query field: define whether it is review context or metadata before export');
    }
  }
  const queries = new Map(dataset.queries.map(query => [query.id, query]));
  const datasetHash = hash(dataset);
  const items = dataset.samples.map(sample => {
    const query = queries.get(sample.queryId);
    if (!nonempty(query.hazard) || !nonempty(sample.candidate) || !nonempty(query.source?.url) || !nonempty(sample.source?.url)) {
      throw Error('Review packet requires the original hazard, candidate and query/candidate sources');
    }
    return {
      key: hash([datasetHash, sample.id]),
      queryKey: hash([datasetHash, query.id]),
      context: { ...pick(query, contextKeys), source: pick(query.source, sourceKeys) },
      candidate: sample.candidate,
      source: pick(sample.source, sourceKeys),
      review: { relevant: null, rationale: null, reviewer: null, reviewedAt: null, sourceChecked: false, independent: false },
    };
  }).sort((a, b) => a.queryKey.localeCompare(b.queryKey) || a.key.localeCompare(b.key));
  return { schemaVersion: 1, kind: 'independent-relevance-review', datasetHash, instructions: packetInstructions, items };
}

export function applyEvaluationReviewPacket(dataset, packet) {
  const expected = buildEvaluationReviewPacket(dataset);
  const header = value => Object.fromEntries(Object.entries(value || {}).filter(([key]) => key !== 'items'));
  if (JSON.stringify(header(packet)) !== JSON.stringify(header(expected))) {
    throw Error('Review packet header or instructions do not match the frozen dataset');
  }
  if (!Array.isArray(packet.items) || packet.items.length !== expected.items.length) throw Error('Every candidate needs one review');
  const expectedItems = new Map(expected.items.map(item => [item.key, item]));
  const decisions = new Map();
  for (const item of packet.items) {
    const original = expectedItems.get(item.key);
    if (!original || decisions.has(item.key)) throw Error('Unknown or duplicate review key');
    const view = ({ review, ...rest }) => rest;
    if (JSON.stringify(view(item)) !== JSON.stringify(view(original))) throw Error('Review context or candidate was changed');
    const review = item.review;
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(review?.reviewedAt || '')
      && Number.isFinite(Date.parse(review.reviewedAt))
      && new Date(review.reviewedAt).toISOString().slice(0, 10) === review.reviewedAt;
    if (typeof review?.relevant !== 'boolean' || !nonempty(review.rationale) || !nonempty(review.reviewer) || !validDate
      || review.sourceChecked !== true || review.independent !== true) {
      throw Error('Complete relevance, rationale, reviewer/date and source/independence declarations required');
    }
    decisions.set(item.key, review);
  }
  const result = structuredClone(dataset);
  for (const sample of result.samples) {
    const decision = decisions.get(hash([expected.datasetHash, sample.id]));
    sample.relevant = decision.relevant;
    sample.review = {
      status: 'approved', reviewer: decision.reviewer, reviewedAt: decision.reviewedAt, rationale: decision.rationale,
      sourceChecked: true, independenceAttested: true, method: 'Reviewer-declared independent source review',
      packetDatasetHash: expected.datasetHash,
    };
    sample.review.contentHash = evaluationReviewHash(sample);
  }
  return result;
}

async function main(args) {
  const [mode, input, packetPath, reviewedOutput] = args;
  if (!['export', 'import'].includes(mode) || !input || !packetPath || (mode === 'import' && !reviewedOutput)) {
    throw Error('Usage: node scripts/recommendation-review-packet.js export dataset.json packet.json | import dataset.json reviewed-packet.json new-reviewed-dataset.json');
  }
  const dataset = JSON.parse(await fs.readFile(input, 'utf8'));
  const result = mode === 'export' ? buildEvaluationReviewPacket(dataset)
    : applyEvaluationReviewPacket(dataset, JSON.parse(await fs.readFile(packetPath, 'utf8')));
  const output = mode === 'export' ? packetPath : reviewedOutput;
  // Never overwrite the source dataset or an existing packet/reviewed output.
  await fs.writeFile(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ mode, candidates: result.items?.length ?? result.samples.length, modelRunsCreated: 0, databaseWrites: 0 }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
