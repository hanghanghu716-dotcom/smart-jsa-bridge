import assert from 'node:assert/strict';
import {knowledgeContentHash} from './recommendation-knowledge.js';

// Reconstruct the immediately preceding content for immutable historical review tests.
// Every current field and both hashes must match; this never accepts a stale review
// as a review of changed content.
export function reverseReviewCorrections(units, corrections) {
  const previous = structuredClone(units);
  for (const correction of corrections) {
    const unit = previous.find(u => u.id === correction.unitId);
    assert.ok(unit, correction.unitId);
    assert.equal(knowledgeContentHash(unit), correction.contentHash);
    assert.equal(unit.sourceFingerprint, correction.sourceFingerprint);
    for (const [field, change] of Object.entries(correction.changes)) {
      assert.deepEqual(unit[field], change.after);
      unit[field] = structuredClone(change.before);
    }
    assert.equal(knowledgeContentHash(unit), correction.previousContentHash);
    assert.equal(unit.sourceFingerprint, correction.previousSourceFingerprint);
  }
  return previous;
}
