import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

test('published progress agrees with inventory and validates terminology closure hashes', () => {
  // --check validates every reviewed string hash and both generated reports.
  // Translation presence alone cannot satisfy the final-verification checkpoint.
  const result = JSON.parse(execFileSync(process.execPath,
    ['scripts/regional-progress-audit.js', '--check'], { encoding: 'utf8' }));
  assert.equal(result.stage2.pendingSourceResolution, 13);
  assert.equal(result.stage2.pendingFinalVerification, 161);
  assert.equal(result.stage3.reviewGroups - result.stage3.pendingFinalVerification, 249);
  assert.equal(result.combined.completed + result.combined.pending, result.combined.checkpoints);
});
