import { FOLLOWUP_PERMIT_ROWS } from '../src/locales/regionalPermitFollowupText20261006.js';
import { KR_ON_FORM_ROWS } from '../src/locales/regionalKrOnFormText20261005.js';
import { IT_BR_QC_FORM_ROWS } from '../src/locales/regionalItBrQcFormText20261005.js';
import { FR_ES_FORM_ROWS } from '../src/locales/regionalFrEsFormText20261005.js';
import { COUNTRY_FORM_ROWS } from '../src/locales/regionalCountryFormText20261005.js';
import { PERMIT_FORM_ROWS } from '../src/locales/regionalPermitText20261005.js';
import { INSPECTION_FORM_ROWS } from '../src/locales/regionalInspectionText20261005.js';
import { AU_JP_FORM_ROWS } from '../src/locales/regionalAuJpFormText20261005.js';
import { SINGAPORE_FORM_ROWS } from '../src/locales/singaporeFormText20261005.js';
import test from 'node:test';
import { SINGAPORE_REVIEW_ROWS } from '../src/locales/singaporeReviewText20261005.js';
import { REGIONAL_BATCH_ROWS } from '../src/locales/regionalBatchText20261005.js';
import { REGIONAL_ASSESSMENT_ROWS } from '../src/locales/regionalAssessmentText20261005.js';
import { REGIONAL_FORM_REVIEW_ROWS } from '../src/locales/regionalFormReviewText20261005.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reviewLedger, ledgerMarkdown } from './regional-review-ledger.js';
import { REQUIREMENT_REVIEW_ROWS } from '../src/locales/requirementReviewText.js';
import { REQUIREMENT_REVIEW_ROWS_20261005 } from '../src/locales/requirementReviewText20261005.js';
import { REQUIREMENT_REVIEW_REMAINING_ROWS_20261005 } from '../src/locales/requirementReviewRemainingText20261005.js';
import { REVIEW_FOLLOWUP_ROWS_20261005 } from '../src/locales/regionalReviewFollowupText20261005.js';

test('review inventory enumerates all forms and topics without promoting partial evidence to completion', () => {
  const ledger = reviewLedger();
  assert.equal(ledger.forms.length, 89);
  assert.equal(ledger.tasks.length, 72);
  assert.equal(new Set(ledger.forms.map(f => f.id)).size, 89);
  assert.equal(new Set(ledger.tasks.map(f => f.id)).size, 72);
  assert.equal(ledger.summary.clauseSupplements, 72);
  assert.equal(ledger.summary.baselineOnlyTasks, 0);
  assert.equal(ledger.summary.sourceLimitedTasks, 13);
  assert.equal(ledger.summary.supplementFields, 224);
  assert.equal(ledger.summary.taskVocabularyKeys, 283);
  assert.deepEqual(ledger.tasks.find(t => t.id === 'IT.height').resolvedIssues, ['it-2025-conversion-height-amendment', 'it-roof-specific-collective-protection']);
  assert.deepEqual(ledger.tasks.find(t => t.id === 'JP.electrical').fieldLabels, { disconnect: 'jpIsolationChoice' });
  assert.equal(ledger.summary.overallCompletionPercent, null);
  assert.ok(ledger.forms.every(f => f.remaining && f.sourceUrls.length));
  assert.ok(ledger.tasks.every(t => t.remaining));
  assert.equal(ledger.tasks.find(t => t.id === 'SG.height').sourceStatus, 'scoped-source-review');
  assert.equal(ledger.tasks.find(t => t.id === 'US.confined').checkedAt, '2026-10-04');
  assert.equal(ledger.tasks.find(t => t.id === 'US.hot').checkedAt, '2026-10-05');
  assert.deepEqual(JSON.parse(fs.readFileSync('docs/regional-review-ledger.json', 'utf8')), ledger);
  assert.equal(fs.readFileSync('docs/regional-review-ledger.md', 'utf8').replace(/\r\n/g, '\n'), ledgerMarkdown(ledger));
});

test('dated terminology batches cannot silently overwrite existing keys or lose a document language', () => {
  const rows = [REQUIREMENT_REVIEW_ROWS, REQUIREMENT_REVIEW_ROWS_20261005, REQUIREMENT_REVIEW_REMAINING_ROWS_20261005, REVIEW_FOLLOWUP_ROWS_20261005, SINGAPORE_REVIEW_ROWS, REGIONAL_BATCH_ROWS, REGIONAL_ASSESSMENT_ROWS, REGIONAL_FORM_REVIEW_ROWS, SINGAPORE_FORM_ROWS, AU_JP_FORM_ROWS, INSPECTION_FORM_ROWS, PERMIT_FORM_ROWS, COUNTRY_FORM_ROWS, FR_ES_FORM_ROWS, IT_BR_QC_FORM_ROWS, KR_ON_FORM_ROWS, FOLLOWUP_PERMIT_ROWS].flatMap(s => s.trim().split('\n'));
  assert.equal(new Set(rows.map(r => r.split('|')[0])).size, rows.length);
  for (const row of rows) {
    const [key, ...values] = row.split('|');
    assert.equal(values.length, 10, key);
    assert.ok(values.every(v => v.trim().length > 0), key);
  }
});
