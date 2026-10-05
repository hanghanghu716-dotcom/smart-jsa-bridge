import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { WORK_JURISDICTIONS } from '../src/utils/workJurisdiction.js';
import { regionalTemplates } from '../src/utils/regionalWorkTemplates.js';
import { TASK_TYPES, taskReview } from '../src/utils/regionalTaskReview.js';
import { TASK_SAFETY_LANGUAGES, TASK_SAFETY_TEXT } from '../src/locales/taskSafetyText.js';
import { regionalFieldTranslations } from '../src/locales/regionalWorkText.js';
import { REGIONAL_REVIEW_SOURCES } from '../src/utils/regionalReview.js';
import { REGIONAL_FORM_SOURCES, INSPECTION_FORM_IDS } from '../src/utils/regionalFormSources20261005.js';

// Review inventory, not product approval metadata. Do not promote source presence
// or translation presence to a completed legal/terminology review.
export function reviewLedger() {
  const forms = WORK_JURISDICTIONS.flatMap(p => regionalTemplates({
    jurisdiction: p.id, documentLocale: p.locale, highRiskConstruction: 'yes',
  }).map(form => ({
    id: `${p.id}.${form.kind}`, jurisdiction: p.id, kind: form.kind,
    title: form.title, reviewLevel: REGIONAL_FORM_SOURCES[`${p.id}.${form.kind}`] ? 'field-source-comparison-recorded' : 'baseline-source-review',
    evidence: REGIONAL_FORM_SOURCES[`${p.id}.${form.kind}`] ? (INSPECTION_FORM_IDS.includes(`${p.id}.${form.kind}`) ? 'regional-inspection-form-review-20261005.md' : ['AU', 'JP'].includes(p.id) ? 'regional-au-jp-form-review-20261005.md' : p.id === 'SG' ? 'regional-singapore-form-review-20261005.md' : 'regional-form-review-20261005.md') : p.id === 'SG' && form.kind === 'risk_assessment' ? 'regional-title-core-review-20261005.md' : 'regional-document-review.md',
    sourceUrls: [...new Set([...REGIONAL_REVIEW_SOURCES[p.id], ...(REGIONAL_FORM_SOURCES[`${p.id}.${form.kind}`] || [])].map(s => s.url))],
    remaining: REGIONAL_FORM_SOURCES[`${p.id}.${form.kind}`] ? 'Generic starter-form field scope compared; pinned final verification in progress audit. Site and sector applicability remain separate, as originally scoped.' : 'Individual form field-to-source and complete terminology closure not recorded.',
  })));
  const tasks = WORK_JURISDICTIONS.flatMap(p => TASK_TYPES.map(topic => {
    const r = taskReview({ jurisdiction: p.id, documentLocale: p.locale }, topic);
    return {
      id: `${p.id}.${topic}`, jurisdiction: p.id, topic, terms: r.terms,
      reviewLevel: r.requirements ? 'clause-supplement-recorded' : 'baseline-source-review',
      sourceStatus: r.status, checkedAt: r.requirements?.checkedAt || r.checkedAt,
      evidence: r.requirements?.evidence || (r.requirements?.checkedAt === '2026-10-05'
        ? 'regional-requirements-review-20261005.md' : r.requirements
          ? 'regional-requirements-review-20261004.md' : 'regional-task-review.md'),
      findings: r.requirements?.sources.map(s => ({ url: s.url, scope: s.scope, basis: s.basis, checkedAt: s.checkedAt })) || [],
      fieldKeys: r.requirements?.fields || [],
      fieldLabels: r.requirements?.fieldLabels || {},
      resolvedIssues: r.requirements?.resolvedIssues || [],
      // A narrow supplement cannot close the whole topic's applicability,
      // controls, roles, stop/restart, records and exceptions checklist.
      remaining: r.requirements?.remaining || (r.status === 'partial-source-review'
        ? 'Source currency/framework/sector limitations remain; see dated evidence.'
        : r.requirements ? 'Complete topic checklist closure remains beyond the recorded clauses.'
          : 'Clause-level applicability, role, lifecycle and record review not yet recorded.'),
    };
  }));
  const vocabulary = [
    ...Object.keys(regionalFieldTranslations.de).sort().map(key => ({
      id: `base:${key}`, requiredLanguages: TASK_SAFETY_LANGUAGES,
      dictionaryLanguages: Object.keys(regionalFieldTranslations),
      inlineLanguages: ['ko', 'en'],
      reviewLevel: 'baseline-language-review', evidence: 'regional-document-review.md',
    })),
    ...Object.keys(TASK_SAFETY_TEXT).sort().map(key => ({
      id: `task:${key}`, languages: Object.keys(TASK_SAFETY_TEXT[key]),
      reviewLevel: 'translated-and-scoped-review', evidence: 'regional-task-review.md',
    })),
  ];
  const supplemented = tasks.filter(t => t.reviewLevel === 'clause-supplement-recorded').length;
  return {
    inventoryVersion: '2026-10-05.11',
    scope: 'Work Packages starter forms, task prompts and their document vocabulary; excludes Case Study, guideline articles, full site UI and site-specific legal compliance.',
    completionCriteria: [
      'Current primary source and applicable sector/jurisdiction identified.',
      'Existing fields compared with applicability, controls, roles, stop/restart and records; exceptions documented.',
      'All changed terminology reviewed in ten document languages; native legal roles do not follow screen language.',
      'Relevant runtime reset, independent copy, snapshot and jurisdiction-isolation checks pass.',
      'Every outstanding issue within the declared item scope resolved or explicitly excluded with evidence.',
    ],
    summary: {
      jurisdictionProfiles: WORK_JURISDICTIONS.length, languages: TASK_SAFETY_LANGUAGES.length,
      baseForms: forms.length, taskCombinations: tasks.length,
      clauseSupplements: supplemented, baselineOnlyTasks: tasks.length - supplemented,
      sourceLimitedTasks: tasks.filter(t => t.sourceStatus === 'partial-source-review').length,
      clauseSupplementCoveragePercent: Math.round(supplemented / tasks.length * 1000) / 10,
      supplementFields: tasks.reduce((n, t) => n + t.fieldKeys.length, 0),
      baseVocabularyKeys: vocabulary.filter(v => v.id.startsWith('base:')).length,
      taskVocabularyKeys: Object.keys(TASK_SAFETY_TEXT).length,
      overallCompletionPercent: null,
      explanation: 'Supplement coverage is not completion. Older reports have no item-by-item closure record; no inferred completion percentage.',
    }, forms, tasks, vocabulary,
  };
}

export function ledgerMarkdown(ledger) {
  const s = ledger.summary;
  const rows = WORK_JURISDICTIONS.map(p => {
    const ts = ledger.tasks.filter(t => t.jurisdiction === p.id);
    return `| ${p.id} | ${ledger.forms.filter(f => f.jurisdiction === p.id).length} | ${ts.map(t => t.reviewLevel === 'clause-supplement-recorded' ? (t.sourceStatus === 'partial-source-review' ? '추가 대조·원문/범위 미해결' : '추가 조항 대조') : '기초 출처 대조').join(' | ')} |`;
  });
  return `# ②·③ 검수 목록과 집계\n\n기준: ${ledger.inventoryVersion}. 이 파일과 JSON은 scripts/regional-review-ledger.js에서 생성합니다.\n\n` +
    `대상은 작업별 서류 묶음의 **기본 양식 ${s.baseForms}개 + 관할별 작업 항목 ${s.taskCombinations}개**입니다. Case Study 본문·첨부 PDF, guideline 콘텐츠와 웹사이트 전체 UI는 포함하지 않습니다.\n\n` +
    `## 집계 해석\n\n` +
    `- ② 추가 조항 대조 기록: **${s.clauseSupplements}/${s.taskCombinations}개 (${s.clauseSupplementCoveragePercent}%)**. 이는 추가 대조가 있는 범위이며 전체 검수 완료율이 아닙니다. 추가 입력란은 ${s.supplementFields}개입니다.\n` +
    `- 기초 출처 대조만 있는 작업 항목: ${s.baselineOnlyTasks}개. 현행 원문·시행 또는 적용 범위가 미해결인 항목: **${s.sourceLimitedTasks}개**. 아래 표의 ‘원문/범위 미해결’ 및 JSON의 remaining을 확인하세요.\n` +
    `- 기본 양식 ${s.baseForms}개는 기존 국가별 기초 검수 보고서에 연결됩니다. 양식별 세부 항목 종결은 별도 기록이 필요합니다.\n` +
    `- ③ 고정 검수 목록: 기본 문서 문구 ${s.baseVocabularyKeys}개, 작업별 문구 ${s.taskVocabularyKeys}개, 원어 역할·용어 ${s.taskCombinations}개 조합, 문서 명칭 ${s.baseForms}개. 각 문구는 10개 언어를 대상으로 합니다. 번역 존재율과 전문용어 검수 완료율은 구분합니다.\n` +
    `- 기존 보고서에는 모든 항목의 종결 기록이 없으므로 전체 완료율은 **미산정**입니다. 추가 입력란 수·번역 존재 여부만으로 완료율을 만들지 않습니다.\n\n` +
    `## 완료 기준\n\n` +
    `1. 현행 공식 출처와 업종·관할 범위를 특정합니다.\n2. 적용 조건·대책·역할·중단/재개·기록·예외를 양식과 대조합니다.\n3. 변경 용어를 10개 언어로 검수하고 현지 법적 역할과 일반 번역을 구분합니다.\n4. 현장값 초기화·복제 독립성·출력 당시 근거 보존·국가 간 혼입 방지 시험을 통과합니다.\n5. 선언한 검수 범위 안의 미해결 사항을 해소하거나 근거와 함께 범위 밖으로 명시합니다.\n\n` +
    `## 국가/지역별 작업 항목\n\n| 관할 | 기본 양식 | 고소 | 밀폐 | 전기 | 화기 |\n|---|---:|---|---|---|---|\n${rows.join('\n')}\n\n` +
    `정확한 양식·문구·출처·확인일·남은 항목은 [검수 목록 JSON](regional-review-ledger.json)에 있습니다. 이번 수정은 [10월 5일 검수 기록](regional-requirements-review-20261005.md)을 참고하세요.\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  const ledger = reviewLedger();
  const files = {
    'docs/regional-review-ledger.json': JSON.stringify(ledger, null, 2) + '\n',
    'docs/regional-review-ledger.md': ledgerMarkdown(ledger),
  };
  for (const [file, content] of Object.entries(files)) {
    if (process.argv.includes('--check')) {
      if (fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== content) throw Error(`Review inventory out of date: ${file}`);
    } else fs.writeFileSync(file, content);
  }
  console.log(JSON.stringify(ledger.summary, null, 2));
}
