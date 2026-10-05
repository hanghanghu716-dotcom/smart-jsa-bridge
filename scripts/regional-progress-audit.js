import fs from 'node:fs';
import process from 'node:process';
import assert from 'node:assert/strict';
import { terminologyText, terminologyHash } from './regional-terminology-fingerprint.js';
import { formFingerprint } from './regional-form-fingerprint.js';
import { taskFingerprint } from './regional-task-fingerprint.js';
import { reviewLedger } from './regional-review-ledger.js';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { taskReview } from '../src/utils/regionalTaskReview.js';
import { TASK_SAFETY_LANGUAGES, TASK_SAFETY_TEXT } from '../src/locales/taskSafetyText.js';
import { regionalFieldTranslations } from '../src/locales/regionalWorkText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';

// This is a newly defined, equal-weight CHECKPOINT metric, not an estimate of
// remaining hours, legal compliance, or the number of defective translations.
// Keep the existing ledger's overallCompletionPercent unknown: that field
// measures full item closure, which historical records do not establish.
const ledger = reviewLedger();
const closures = JSON.parse(fs.readFileSync('docs/regional-terminology-closures.json', 'utf8'));
const formClosures = JSON.parse(fs.readFileSync('docs/regional-form-closures.json', 'utf8'));
const taskClosures = JSON.parse(fs.readFileSync('docs/regional-task-closures.json', 'utf8'));
assert.equal(new Set(taskClosures.map(entry => entry.id)).size, taskClosures.length);
for (const closure of taskClosures) {
  const task = ledger.tasks.find(task => `task:${task.id}` === closure.id);
  assert.ok(task && task.sourceStatus !== 'partial-source-review', closure.id);
  assert.ok(closure.scope && closure.checkedAt && closure.evidence && closure.sourceUrls.length && closure.exclusions.length, closure.id);
  assert.deepEqual(closure.languages, TASK_SAFETY_LANGUAGES);
  assert.deepEqual(closure.checklist, ['applicability', 'controls', 'roles', 'stop-restart', 'records', 'exceptions']);
  assert.equal(taskFingerprint(closure.id), closure.sha256,
    `Task, underlying permit or renderer changed after review: ${closure.id}`);
}
assert.equal(new Set(formClosures.map(entry => entry.id)).size, formClosures.length);
for (const closure of formClosures) {
  assert.ok(ledger.forms.some(form => `form:${form.id}` === closure.id), closure.id);
  assert.ok(closure.scope && closure.checkedAt && closure.evidence && closure.sourceUrls.length, closure.id);
  assert.deepEqual(closure.languages, TASK_SAFETY_LANGUAGES);
  assert.equal(formFingerprint(closure.id), closure.sha256,
    `Form or renderer changed after field-to-source review: ${closure.id}`);
}
assert.equal(new Set(closures.map(entry => entry.id)).size, closures.length);
const vocabularyIds = new Set([...ledger.vocabulary.map(v => v.id), ...ledger.forms.map(f => `title:${f.id}`), ...ledger.tasks.map(t => `native:${t.id}`)]);
for (const closure of closures) {
  assert.ok(vocabularyIds.has(closure.id), `Closure has no current vocabulary/title item: ${closure.id}`);
  const text = terminologyText(closure.id);
  assert.ok(text && closure.scope && closure.checkedAt, closure.id);
  assert.deepEqual(closure.languages, TASK_SAFETY_LANGUAGES);
  if (closure.id.startsWith('native:')) assert.ok(closure.sourceUrls?.length && closure.reviewKind === 'native-role-meaning-and-language-preservation', closure.id);
  assert.equal(terminologyHash(text), closure.sha256,
    `Terminology changed after semantic review; re-review before retaining closure: ${closure.id}`);
}
const evidenceExists = path => fs.existsSync(`docs/${path}`);
const context = (jurisdiction, language) => ({
  jurisdiction,
  documentLocale: WORK_DOCUMENT_LANGUAGES.find(locale => locale.split('-')[0] === language),
  highRiskConstruction: 'yes',
});
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const generated = new Map();
let generatedFormChecks = 0;
let generatedTaskChecks = 0;

for (const form of ledger.forms) {
  const forms = TASK_SAFETY_LANGUAGES.map(language => {
    const doc = createRegionalTemplate(form.kind, context(form.jurisdiction, language));
    assert.equal(doc.regional.templateId, form.id);
    assert.ok(nonempty(doc.title) && doc.blocks.length > 0);
    for (const block of doc.blocks) {
      if (block.field) assert.ok(nonempty(block.field.label), `${form.id}: ${block.field.key}`);
      if (block.columns) {
        assert.ok(nonempty(block.title));
        assert.ok(block.columns.every(column => nonempty(column.label)));
      }
    }
    generatedFormChecks++;
    return doc;
  });
  generated.set(form.id, forms);
}

for (const task of ledger.tasks) {
  for (const language of TASK_SAFETY_LANGUAGES) {
    const doc = createRegionalTemplate('permit_to_work', context(task.jurisdiction, language), null, { taskTypes: [task.topic] });
    for (const key of task.fieldKeys) {
      assert.ok(doc.blocks.some(block => block.field?.key === `${task.topic}.${key}`), `${task.id}: ${key}`);
    }
    const role = doc.blocks.find(block => block.field?.key === `${task.topic}.roles`);
    assert.ok(nonempty(task.terms) && role?.field.label.includes(task.terms), `${task.id}: native terms`);
    assert.equal(doc.regional.taskReviews.length, 1);
    assert.equal(doc.regional.taskReviews[0].jurisdiction, task.jurisdiction);
    generatedTaskChecks++;
  }
}

const finalCheck = {
  status: 'needs-final-verification',
  reason: 'No individual full-scope closure established by the dated reports. This does not mean all previous review must be repeated.',
};
function item(id, firstPass, evidence, note) {
  const closure = [...closures, ...formClosures, ...taskClosures].find(entry => entry.id === id);
  if (closure) evidence = [...new Set([...evidence, closure.evidence])];
  assert.ok(evidence.every(evidenceExists), id);
  return {
    id, evidence, note: closure ? closure.scope : note,
    checkpoints: {
      scopedComparison: { status: firstPass ? 'recorded' : 'needs-source-resolution' },
      implementation: { status: 'verified-in-code' },
      finalVerification: closure ? { status: 'verified-with-evidence', ...closure } : { ...finalCheck },
    },
  };
}
const stage2 = [
  ...ledger.forms.map(form => item(`form:${form.id}`, true, [form.evidence],
    'Country-level baseline comparison recorded; generated form checked in all ten languages. Detailed field-by-field closure remains unverified.')),
  ...ledger.tasks.map(task => item(`task:${task.id}`, task.sourceStatus !== 'partial-source-review', [task.evidence], task.remaining)),
];
const stage3 = [
  ...ledger.vocabulary.map(word => {
    const [type, ...parts] = word.id.split(':');
    const key = parts.join(':');
    if (type === 'task') assert.ok(TASK_SAFETY_LANGUAGES.every(language => nonempty(TASK_SAFETY_TEXT[key][language])), word.id);
    else assert.ok(Object.values(regionalFieldTranslations).every(dictionary => nonempty(dictionary[key])), word.id);
    return item(word.id, true, [word.evidence],
      'Baseline/scoped language review recorded at report level. Code coverage is checked separately and is not a semantic sign-off for this key.');
  }),
  ...ledger.forms.map(form => {
    assert.equal(generated.get(form.id).length, TASK_SAFETY_LANGUAGES.length);
    return item(`title:${form.id}`, true, [form.evidence],
      'Country document names covered by baseline report; title generation checked. Individual final terminology closure remains unverified.');
  }),
  ...ledger.tasks.map(task => {
    assert.equal(taskReview(context(task.jurisdiction, 'en'), task.topic).terms, task.terms);
    return item(`native:${task.id}`, true, ['regional-task-review.md', task.evidence],
      'Native role/term distinctions covered by country/task reports; preservation in generated forms checked. Specialist final closure remains unverified.');
  }),
];
const round = n => Math.round(n * 10) / 10;
function summarize(items) {
  assert.equal(new Set(items.map(entry => entry.id)).size, items.length);
  const checkpoints = items.flatMap(entry => Object.values(entry.checkpoints));
  const completed = checkpoints.filter(checkpoint => ['recorded', 'verified-in-code', 'verified-with-evidence'].includes(checkpoint.status)).length;
  const sourceResolution = checkpoints.filter(checkpoint => checkpoint.status === 'needs-source-resolution').length;
  const finalVerification = checkpoints.filter(checkpoint => checkpoint.status === 'needs-final-verification').length;
  assert.equal(completed + sourceResolution + finalVerification, checkpoints.length);
  return {
    reviewGroups: items.length, checkpoints: checkpoints.length, completed,
    pending: sourceResolution + finalVerification,
    pendingSourceResolution: sourceResolution, pendingFinalVerification: finalVerification,
    completionPercent: round(completed / checkpoints.length * 100),
    remainingPercent: round((sourceResolution + finalVerification) / checkpoints.length * 100),
  };
}
const s2 = summarize(stage2), s3 = summarize(stage3);
const combined = summarize([...stage2.map(entry => ({ ...entry, id: `s2:${entry.id}` })), ...stage3.map(entry => ({ ...entry, id: `s3:${entry.id}` }))]);
const audit = {
  auditDate: '2026-10-06', evidenceVersion: ledger.inventoryVersion,
  metric: 'equal-weight documented checkpoints, first defined 2026-10-05 for progress reporting',
  checkpointsPerGroup: ['scoped comparison record', 'implementation verified in code', 'issues resolved and individual full-scope final verification'],
  limitations: [
    'This is not a historical or independently measured overall completion rate; equal checkpoint weights are an explicit reporting convention.',
    'Groups differ in size. Ten-language wording, one document title and one native role bundle each count as one group. Combined rate is checkpoint-weighted, not an average of the two stage rates.',
    'Pending final verification includes both missing closure evidence and remaining substantive review. It is not a count of known errors or an estimate of time to finish.',
    'Prior report-level baseline/scoped review counts only toward the first checkpoint, never full terminology or legal closure.',
    'No new official-source investigation or complete semantic review was performed by this accounting script.',
  ],
  checked: { generatedFormChecks, generatedTaskChecks, fieldVocabularyGroups: ledger.vocabulary.length },
  summary: { stage2: s2, stage3: s3, combined }, stage2, stage3,
};
const markdown = `# ②·③ 진행률 — 확인 단계 기준\n\n` +
  `집계일: ${audit.auditDate}. 근거 버전: ${audit.evidenceVersion}.\n\n` +
  `**합산 잔여 ${combined.remainingPercent}%**는 이번에 정의한 확인 단계의 집계입니다. 실제 남은 시간이나 미검수 문구의 비율을 측정한 값은 아닙니다. 기존의 전체 항목 종결률을 알아낸 것으로 해석하지 않습니다.\n\n` +
  `## 계산 기준\n\n` +
  `각 검수 대상에 같은 비중의 세 단계를 둡니다: (1) 범위를 명시한 1차 근거·의미 대조 기록, (2) 코드 반영 확인, (3) 미해결 사항 해소·항목별 최종 확인. 기존 보고서는 1단계 증거이며 3단계 완료 증거로 승격하지 않습니다. ②의 부분 근거 ${s2.pendingSourceResolution}개는 1단계도 미완료로 보수적으로 셉니다.\n\n` +
  `| 단계 | 대상 수 | 확인 단계 수 | 기록·코드로 확인 | 남은 확인 | 완료 | 잔여 |\n|---|---:|---:|---:|---:|---:|---:|\n` +
  `| ② 요건·양식 | ${s2.reviewGroups} | ${s2.checkpoints} | ${s2.completed} | ${s2.pending} | ${s2.completionPercent}% | ${s2.remainingPercent}% |\n` +
  `| ③ 전문용어 | ${s3.reviewGroups} | ${s3.checkpoints} | ${s3.completed} | ${s3.pending} | ${s3.completionPercent}% | ${s3.remainingPercent}% |\n` +
  `| 합산 | ${combined.reviewGroups} | ${combined.checkpoints} | ${combined.completed} | ${combined.pending} | ${combined.completionPercent}% | ${combined.remainingPercent}% |\n\n` +
  `②: 기본 양식 ${ledger.forms.length}개 + 작업 조합 ${ledger.tasks.length}개. 1차 대조 ${s2.reviewGroups - s2.pendingSourceResolution}, 코드 반영 ${s2.reviewGroups}, 최종 확인 ${s2.reviewGroups - s2.pendingFinalVerification}건. 남은 ${s2.pending}단계는 부분 근거 ${s2.pendingSourceResolution}건과 최종 확인 ${s2.pendingFinalVerification}건입니다.\n\n` +
  `③: 기본 문구 ${ledger.summary.baseVocabularyKeys} + 작업 문구 ${ledger.summary.taskVocabularyKeys} + 국가별 문서명 ${ledger.forms.length} + 원어 용어 묶음 ${ledger.tasks.length} = ${s3.reviewGroups}개. 보고서 범위의 1차 대조 ${s3.reviewGroups}, 코드 반영 ${s3.reviewGroups}, 항목별 최종 확인 ${s3.reviewGroups - s3.pendingFinalVerification}건. 남은 최종 확인 ${s3.pendingFinalVerification}건에는 완료 기록 누락과 실제 추가 검수 필요분이 함께 포함됩니다. 이를 전부 미번역 문구로 취급하지 않습니다.\n\n` +
  `이번 변경: 독일·프랑스 작업 8조합의 현재 확인란 57개와 새 문구 6개 × 10언어를 보완했습니다. 기본 양식 최종 확인 ${formClosures.length}건, 작업 조합 ${taskClosures.length}건, 전문용어 ${closures.length}건입니다. 기존 555개 문구·89개 기본 양식·32개 작업 해시는 유지했습니다. 부분 근거 13건과 러시아 원어 3묶음은 여전히 열려 있습니다. [검수 근거](regional-de-fr-task-review-20261006.md).\n\n` +
  `## 이번 확인과 한계\n\n` +
  `- 기본 양식 ${generatedFormChecks}건(89종 × 10언어)과 작업 조합 ${generatedTaskChecks}건(72종 × 10언어)을 생성하여 제목·필드·국가별 용어 보존을 확인했습니다. 이것은 코드 연결 확인이며 의미 정확성 검수 완료가 아닙니다.\n` +
  `- 모든 항목의 완료 기록 부재를 기존 작업 전체 미완료로 계산하지 않고, 최종 확인 단계만 남깁니다. 실제 추가 수정량·소요시간의 백분율은 이 지표로 주장하지 않습니다.\n` +
  `- 문구 그룹·문서명·용어 묶음의 분량은 다릅니다. 합산은 확인 단계 수 기준이며 두 단계의 단순 평균이 아닙니다.\n` +
  `- 집계 스크립트 자체는 의미 검수를 수행하지 않습니다. 새 원문·번역 검수는 별도 근거 보고서와 문자열 해시가 있는 기록만 인정합니다. 전체 문구 전수 검수·배포·Case Study 작업은 완료 주장에 포함하지 않습니다.\n\n` +
  `항목별 근거·상태는 [집계 JSON](regional-progress-audit.json)에 있습니다. 재집계: \`node scripts/regional-progress-audit.js\`.\n`;
for (const [path, content] of Object.entries({
  'docs/regional-progress-audit.json': JSON.stringify(audit, null, 2) + '\n',
  'docs/regional-progress-audit.md': markdown,
})) {
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n'), content, path);
  else fs.writeFileSync(path, content);
}
console.log(JSON.stringify({ ...audit.summary, checked: audit.checked }, null, 2));
