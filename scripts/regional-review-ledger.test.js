import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reviewLedger, ledgerMarkdown } from './regional-review-ledger.js';
import { REQUIREMENT_REVIEW_ROWS } from '../src/locales/requirementReviewText.js';
import { REQUIREMENT_REVIEW_ROWS_20261005 } from '../src/locales/requirementReviewText20261005.js';

test('review inventory enumerates all forms and topics without promoting partial evidence to completion', () => {
  const ledger = reviewLedger();
  assert.equal(ledger.forms.length, 89);
  assert.equal(ledger.tasks.length, 72);
  assert.equal(new Set(ledger.forms.map(f => f.id)).size, 89);
  assert.equal(new Set(ledger.tasks.map(f => f.id)).size, 72);
  assert.equal(ledger.summary.clauseSupplements, 35);
  assert.equal(ledger.summary.supplementFields, 81);
  assert.deepEqual(ledger.tasks.find(t => t.id === 'JP.electrical').fieldLabels, { disconnect: 'jpIsolationChoice' });
  assert.equal(ledger.summary.overallCompletionPercent, null);
  assert.ok(ledger.forms.every(f => f.remaining && f.sourceUrls.length));
  assert.ok(ledger.tasks.every(t => t.remaining));
  assert.equal(ledger.tasks.find(t => t.id === 'SG.height').sourceStatus, 'partial-source-review');
  assert.equal(ledger.tasks.find(t => t.id === 'US.confined').checkedAt, '2026-10-04');
  assert.equal(ledger.tasks.find(t => t.id === 'US.hot').checkedAt, '2026-10-05');
  assert.deepEqual(JSON.parse(fs.readFileSync('docs/regional-review-ledger.json', 'utf8')), ledger);
  assert.equal(fs.readFileSync('docs/regional-review-ledger.md', 'utf8').replace(/\r\n/g, '\n'), ledgerMarkdown(ledger));
});

test('dated terminology batches cannot silently overwrite existing keys or lose a document language', () => {
  const rows = [REQUIREMENT_REVIEW_ROWS, REQUIREMENT_REVIEW_ROWS_20261005].flatMap(s => s.trim().split('\n'));
  assert.equal(new Set(rows.map(r => r.split('|')[0])).size, rows.length);
  for (const row of rows) {
    const [key, ...values] = row.split('|');
    assert.equal(values.length, 10, key);
    assert.ok(values.every(v => v.trim().length > 0), key);
  }
});
