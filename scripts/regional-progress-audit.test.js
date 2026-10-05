import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import fs from 'node:fs';

test('published progress agrees with inventory and validates terminology closure hashes', () => {
  // --check validates every reviewed string hash and both generated reports.
  // Translation presence alone cannot satisfy the final-verification checkpoint.
  const result = JSON.parse(execFileSync(process.execPath,
    ['scripts/regional-progress-audit.js', '--check'], { encoding: 'utf8' }));
  assert.equal(result.stage2.pendingSourceResolution, 13);
  assert.equal(result.stage2.pendingFinalVerification, 48);
  assert.equal(result.stage3.reviewGroups - result.stage3.pendingFinalVerification, 548);
  const audit = JSON.parse(fs.readFileSync('docs/regional-progress-audit.json', 'utf8'));
  assert.deepEqual(audit.stage3.filter(row => row.checkpoints.finalVerification.status === 'needs-final-verification').map(row => row.id).sort(),
    ['native:RU.confined', 'native:RU.electrical', 'native:RU.height']);
  assert.equal(result.combined.completed + result.combined.pending, result.combined.checkpoints);
});
