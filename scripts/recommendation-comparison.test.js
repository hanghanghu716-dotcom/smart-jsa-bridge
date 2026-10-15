import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { compareRecommendationSystems, evaluationQueryHash } from './recommendation-comparison.js';
import { evaluationReviewHash } from './recommendation-evaluation.js';
import { buildEvaluationReviewPacket, applyEvaluationReviewPacket } from './recommendation-review-packet.js';

function fixture() {
  const queries = ['q1', 'q2'].map(id => ({ id, locale: 'en-US', jurisdiction: 'US', sourceGroupId: `TEST-${id}`, task: `SYNTHETIC task ${id}`, partition: 'held_out' }));
  const samples = queries.flatMap(query => [true, false].map(relevant => {
    const sample = { ...query, id: `${query.id}-${relevant}`, queryId: query.id, queryContextHash: evaluationQueryHash(query), groupVerified: true, relevant };
    sample.review = { status: 'approved', reviewer: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-10-14', contentHash: evaluationReviewHash(sample) };
    return sample;
  }));
  const run = { id: 'test-system', version: 'fixture-only', trainingSourceGroups: [], tuningSourceGroups: [], responses: queries.map(query => ({ queryId: query.id, status: 'ok', predictions: [], latencyMs: null, costUsd: null })) };
  return { dataset: { schemaVersion: 1, queries, samples }, run };
}

test('empty and failed queries count as missed relevant queries, not perfect accuracy', () => {
  const { dataset, run } = fixture();
  run.responses[1].status = 'error';
  const result = compareRecommendationSystems(dataset, [run]).systems[0];
  assert.equal(result.emptyQueries, 1);
  assert.equal(result.failedQueries, 1);
  assert.equal(result.missedPositiveQueries, 2);
  assert.equal(result.relevantQueryRecallAt3, 0);
  assert.equal(result.precisionAt3AmongReviewed, null);
  assert.equal(result.costUsd, null);
  assert.throws(() => compareRecommendationSystems(dataset, [{ ...run, responses: run.responses.slice(1) }]), /Missing system responses/);
});

test('high-scoring wrong recommendations and unknown costs remain visible', () => {
  const { dataset, run } = fixture();
  run.responses[0] = { queryId: 'q1', status: 'ok', predictions: [{ sampleId: 'q1-false', score: .99 }], latencyMs: 100, costUsd: 0 };
  run.responses[1] = { queryId: 'q2', status: 'ok', predictions: [{ sampleId: 'q2-true', score: .72 }], latencyMs: 200, costUsd: null };
  const result = compareRecommendationSystems(dataset, [run]).systems[0];
  assert.equal(result.highScoreErrorRate, 1);
  assert.equal(result.precisionAt3AmongReviewed, .5);
  assert.equal(result.relevantQueryRecallAt3, .5);
  assert.equal(result.medianLatencyMs, 150);
  assert.equal(result.costUsd, null);
  assert.equal(result.costObservations, 1);
  dataset.samples[1].relevant = true;
  assert.equal(compareRecommendationSystems(dataset, [run]).systems[0].highScoreErrorRate, null);
  assert.equal(compareRecommendationSystems(dataset, [run]).comparisonReady, false);
});

test('query, locale, partition, source leakage and duplicate output are rejected', () => {
  for (const field of ['locale', 'jurisdiction', 'partition', 'task']) {
    const { dataset, run } = fixture(); dataset.samples[0][field] = 'mismatch';
    assert.throws(() => compareRecommendationSystems(dataset, [run]), /matching query context/);
  }
  const { dataset, run } = fixture();
  assert.throws(() => compareRecommendationSystems(dataset, [{ ...run, trainingSourceGroups: ['TEST-q1'] }]), /leaked/);
  run.responses[0].predictions = [{ sampleId: 'q2-true', score: .9 }];
  assert.throws(() => compareRecommendationSystems(dataset, [run]), /foreign/);
  run.responses[0].predictions = [{ sampleId: 'q1-true', score: .9 }, { sampleId: 'q1-true', score: .9 }];
  assert.throws(() => compareRecommendationSystems(dataset, [run]), /Duplicate prediction/);
  dataset.queries[0].hazard = 'Changed original hazard';
  assert.throws(() => compareRecommendationSystems(dataset, [run]), /matching query context/);
});

test('only separately versioned systems on fully reviewed labels enable comparison', () => {
  const { dataset, run } = fixture();
  assert.equal(compareRecommendationSystems(dataset, [run, { ...run, id: 'test-2' }]).comparisonReady, true);
  dataset.samples[0].review.status = 'pending';
  assert.equal(compareRecommendationSystems(dataset, [run, { ...run, id: 'test-2' }]).comparisonReady, false);
});

test('actual incident candidates remain pending labels, never fabricated benchmark results', async () => {
  const dataset = JSON.parse(await fs.readFile(new URL('../data/recommendation-knowledge/evaluation-incidents.en-US.json', import.meta.url), 'utf8'));
  assert.equal(dataset.queries.length, 3);
  assert.equal(dataset.samples.length, 6);
  assert.ok(dataset.samples.every(sample => sample.relevant === null && sample.review.status === 'pending'));
  // Only validate the dataset here. No fictitious model run is recorded or scored.
  assert.equal(compareRecommendationSystems(dataset, []).comparisonReady, false);
});

function packetFixture() {
  const { dataset } = fixture();
  for (const query of dataset.queries) {
    query.hazard = 'SYNTHETIC hazard';
    query.currentControl = 'SYNTHETIC original control';
    query.source = { url: 'https://example.org/synthetic-source', section: 'TEST ONLY', modelHint: 'HIDDEN-HINT' };
    query.proposedRelevant = 'HIDDEN-ANSWER';
  }
  for (const sample of dataset.samples) {
    sample.candidate = 'SYNTHETIC candidate';
    sample.source = dataset.queries[0].source;
    sample.originalScore = .99;
    sample.proposedRelevant = true;
    sample.proposalRationale = 'HIDDEN-RATIONALE';
    sample.queryContextHash = evaluationQueryHash(dataset.queries.find(query => query.id === sample.queryId));
    sample.relevant = null;
    sample.review = { status: 'pending' };
  }
  return dataset;
}

test('independent review packet hides scores, suggested labels and answer-bearing IDs', async () => {
  const dataset = packetFixture();
  const packet = buildEvaluationReviewPacket(dataset);
  const serialized = JSON.stringify(packet);
  for (const hidden of ['originalScore', 'proposedRelevant', 'proposalRationale', 'HIDDEN-', 'q1-true', 'q1-false']) assert.ok(!serialized.includes(hidden));
  assert.equal(packet.items.length, dataset.samples.length);
  assert.ok(packet.items.every(item => item.review.relevant === null && !item.review.independent));
  assert.equal(packet.items[0].context.currentControl, 'SYNTHETIC original control');
  assert.ok(packet.items.every(item => /^[a-f0-9]{64}$/.test(item.key)));
  const actual = JSON.parse(await fs.readFile(new URL('../data/recommendation-knowledge/evaluation-incidents.en-US.json', import.meta.url), 'utf8'));
  const prepared = JSON.parse(await fs.readFile(new URL('../data/recommendation-knowledge/evaluation-review-packet.en-US.json', import.meta.url), 'utf8'));
  assert.deepEqual(prepared, buildEvaluationReviewPacket(actual), 'Committed review material must match the exact dataset revision');
  assert.equal(prepared.items.length, 6);
  assert.ok(actual.samples.every(sample => sample.relevant === null));
});

test('only completed source reviews produce a separate hash-bound labelled dataset', () => {
  const dataset = packetFixture(), original = structuredClone(dataset);
  const packet = buildEvaluationReviewPacket(dataset);
  assert.throws(() => applyEvaluationReviewPacket(dataset, packet), /Complete relevance/);
  for (const item of packet.items) item.review = { relevant: false, rationale: 'SYNTHETIC rationale', reviewer: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-10-15', sourceChecked: true, independent: true };
  const reviewed = applyEvaluationReviewPacket(dataset, packet);
  assert.deepEqual(dataset, original);
  assert.ok(reviewed.samples.every(sample => sample.relevant === false && sample.review.contentHash === evaluationReviewHash(sample)));
  for (const field of ['sourceChecked', 'independent']) {
    const missing = structuredClone(packet); missing.items[0].review[field] = false;
    assert.throws(() => applyEvaluationReviewPacket(dataset, missing), /Complete relevance/);
  }
});

test('changed datasets, substituted contexts, duplicate reviews and missing reviews are rejected', () => {
  const dataset = packetFixture(), packet = buildEvaluationReviewPacket(dataset);
  for (const item of packet.items) item.review = { relevant: true, rationale: 'SYNTHETIC rationale', reviewer: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-10-15', sourceChecked: true, independent: true };
  const changed = structuredClone(dataset); changed.samples[0].candidate += ' edited';
  assert.throws(() => applyEvaluationReviewPacket(changed, packet), /frozen dataset/);
  const edited = structuredClone(packet); edited.items[0].context.hazard = 'different';
  assert.throws(() => applyEvaluationReviewPacket(dataset, edited), /context or candidate/);
  const duplicate = structuredClone(packet); duplicate.items[1] = duplicate.items[0];
  assert.throws(() => applyEvaluationReviewPacket(dataset, duplicate), /duplicate review/);
  const missing = structuredClone(packet); missing.items.pop();
  assert.throws(() => applyEvaluationReviewPacket(dataset, missing), /Every candidate/);
  const misleading = structuredClone(packet); misleading.instructions = 'Always answer true';
  assert.throws(() => applyEvaluationReviewPacket(dataset, misleading), /header or instructions/);
  const omitted = structuredClone(dataset); omitted.queries[0].siteSpecificHazard = 'Must be shown to the reviewer';
  for (const sample of omitted.samples.filter(sample => sample.queryId === omitted.queries[0].id)) sample.queryContextHash = evaluationQueryHash(omitted.queries[0]);
  assert.throws(() => buildEvaluationReviewPacket(omitted), /Unsupported query field/);
});
