import { workContext, sameWorkContext } from './workJurisdiction.js';
import { regionalText } from '../locales/regionalWorkText.js';
import { REGIONAL_CATALOG } from './regionalCatalog.js';
import { REGIONAL_REVIEW_SOURCES, REGIONAL_REVIEW_VERSION, REGIONAL_REVIEW_SCOPE } from './regionalReview.js';
import { taskReviewBlocks, TASK_REVIEW_VERSION } from './regionalTaskReview.js';
import { taskSafetyText } from '../locales/taskSafetyText.js';
import { REGIONAL_FORM_SOURCES } from './regionalFormSources20261005.js';

// These are editable starter forms, not regulator-issued or certified forms.
export const TEMPLATE_VERSION = '2026-10-05.8';
const BASE_SOURCES = {
  ...Object.fromEntries(Object.entries(REGIONAL_CATALOG).map(([id, p]) => [id, p.sources])),
  KR: [{ title: '고용노동부 · 작업 전 안전점검회의(TBM) 가이드', url: 'https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20230200455' }],
  GB: [{ title: 'HSE · Risk assessment', url: 'https://www.hse.gov.uk/simple-health-safety/risk/risk-assessment-template-and-examples.htm' }, { title: 'HSE · Method statements', url: 'https://www.hse.gov.uk/construction/safetytopics/admin.htm' }, { title: 'HSE · Permit to work', url: 'https://www.hse.gov.uk/humanfactors/topics/ptw.htm' }],
  AU: [{ title: 'Safe Work Australia · High risk construction work and SWMS', url: 'https://www.safeworkaustralia.gov.au/duties-tool/construction/hazards-information/high-risk-construction-work-requiring-swms' }, { title: 'WorkSafe Victoria · SWMS', url: 'https://www.worksafe.vic.gov.au/safe-work-method-statements-swms' }],
  SG: [{ title: 'MOM · Risk management', url: 'https://www.mom.gov.sg/workplace-safety-and-health/safety-and-health-management-systems/risk-management' }, { title: 'MOM · Safety and health management systems', url: 'https://www.mom.gov.sg/workplace-safety-and-health/safety-and-health-management-systems' }],
};
export const REGIONAL_SOURCES = Object.fromEntries(Object.entries(BASE_SOURCES).map(([jurisdiction, sources]) => [jurisdiction,
  [...new Map([...sources, ...REGIONAL_REVIEW_SOURCES[jurisdiction]].map(s => [s.url, s])).values()],
]));
const names = {
  KR: { risk_assessment: ['위험성평가', 'Risk Assessment'], permit_to_work: ['작업허가서', 'Work Permit'], toolbox_talk: ['작업 전 안전점검회의(TBM)', 'Toolbox Meeting (TBM)'], inspection: ['안전점검표', 'Safety Inspection Checklist'] },
  GB: { risk_assessment: ['위험성평가 (Risk Assessment)', 'Risk Assessment'], method_statement: ['작업방법서 (Method Statement)', 'Method Statement'], permit_to_work: ['작업허가서 (PTW)', 'Permit to Work (PTW)'], toolbox_talk: ['작업 전 안전회의 (Toolbox Talk)', 'Toolbox Talk'], inspection: ['점검표 (Inspection Checklist)', 'Inspection Checklist'] },
  AU: { risk_assessment: ['위험성평가 (Risk Assessment)', 'Risk Assessment'], method_statement: ['안전작업방법서 (SWMS)', 'Safe Work Method Statement (SWMS)'], permit_to_work: ['작업허가서 (Permit)', 'Permit to Work'], toolbox_talk: ['작업 전 안전회의 (Pre-start / Toolbox)', 'Pre-start / Toolbox Talk'], inspection: ['작업 전 점검표 (Pre-start Inspection)', 'Pre-start Inspection Checklist'] },
  SG: { risk_assessment: ['위험성평가 (RA)', 'Risk Assessment (RA)'], method_statement: ['안전작업절차서 (SWP)', 'Safe Work Procedure (SWP)'], permit_to_work: ['작업허가서 (PTW)', 'Permit to Work (PTW)'], toolbox_talk: ['작업 전 안전회의 (Toolbox Meeting)', 'Toolbox Meeting'], inspection: ['안전점검표 (Safety Inspection)', 'Safety Inspection Checklist'] },
};
export function regionalTemplates(value) {
  const c = workContext(value);
  if (!c.jurisdiction || !c.documentLocale) return [];
  const p = REGIONAL_CATALOG[c.jurisdiction];
  const general = { risk_assessment: ['위험성평가', 'Risk Assessment'], method_statement: ['안전작업절차서', 'Safe Work Procedure'], permit_to_work: ['작업허가서', 'Permit to Work'], toolbox_talk: ['작업 전 안전회의', 'Toolbox Talk'], inspection: ['안전점검표', 'Inspection Checklist'] };
  return Object.entries(p ? p.titles : names[c.jurisdiction]).map(([kind, title]) => ({
    kind, title: p ? (c.documentLocale.split('-')[0] === p.language ? title : `${regionalText(c.documentLocale, general[kind][1], general[kind][0])} · ${title}`)
      : (['ko', 'en'].includes(c.documentLocale.split('-')[0]) ? title[c.documentLocale === 'ko' ? 0 : 1] : `${regionalText(c.documentLocale, general[kind][1], general[kind][0])} · ${title[1]}`),
    available: !(c.jurisdiction === 'AU' && kind === 'method_statement' && c.highRiskConstruction !== 'yes'),
    // Permits must be selected against site procedures, never automatically required.
    recommended: kind !== 'permit_to_work' && !(c.jurisdiction === 'AU' && kind === 'method_statement' && c.highRiskConstruction !== 'yes'),
  }));
}
const id = () => crypto.randomUUID();
const lines = values => [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))].join('\n');
export function jsaWorkRows(source) {
  return (source?.analysisData || []).flatMap((step, index) => {
    const risks = step.risks?.length ? step.risks : [{}];
    return risks.map(risk => ({
      step: `${index + 1}. ${step.proc?.stepTitle || ''}`,
      procedure: step.proc?.stepDetail || '',
      hazard: risk.factor || '',
      controls: lines([risk.current_measure, risk.measure]),
      further: risk.recommend_measure || '',
      // Keep the source score; do not relabel it as a new/residual assessment.
      sourceRisk: [step.frequency, step.severity, step.riskLevel].map(v => v == null ? '' : String(v)).join(' / '),
    }));
  });
}
export function createRegionalTemplate(kind, value, source = null, options = {}) {
  const context = workContext(value), entry = regionalTemplates(context).find(t => t.kind === kind);
  if (!entry?.available) throw Error('WORK_TEMPLATE_UNAVAILABLE');
  const txt = (k, e) => regionalText(context.documentLocale, e, k);
  const reviewedText = key => taskSafetyText(context.documentLocale, key);
  const field = (key, label, fieldKind = 'text', mode = 'runtime', content = '') => ({
    id: id(), type: 'field', field: { id: id(), key, label, kind: fieldKind, mode, value: mode === 'standard' ? String(content) : '' },
  });
  const col = (key, label, kind = 'text', mode = 'standard') => ({ id: id(), key, label, kind, mode, value: '' });
  const table = (title, columns, data = [{}]) => ({
    id: id(), type: 'table', title, columns,
    rows: (data.length ? data : [{}]).map(row => ({ id: id(), values: Object.fromEntries(columns.filter(c => c.mode === 'standard').map(c => [c.id, String(row[c.key] || '')])) })),
  });
  const rows = jsaWorkRows(source);
  const scope = field('scope', txt('작업 범위와 내용', 'Work scope'), 'text', 'standard', lines([source?.formData?.projectName, context.activity]));
  const equipment = field('equipment', txt('사용 장비·공구', 'Plant, equipment and tools'), 'text', 'standard', source?.formData?.equipment || '');
  const ppe = field('ppe', txt('개인보호구', 'Personal protective equipment'), 'text', 'standard', lines(source?.formData?.ppe || []));
  const emergency = field('emergency', txt('이번 현장의 비상연락·대피·구조 계획', 'Site emergency contacts, evacuation and rescue arrangements'));
  const verification = field('verification', txt('현장 확인 및 변경 사항', 'Site checks and changes'), 'verification');
  const signature = (key, title) => field(key, title, 'worker', 'blank');
  const sequence = table(txt('작업 순서 및 안전조치', 'Work sequence and control measures'), [
    col('step', txt('작업단계', 'Work step')), col('procedure', txt('작업방법', 'Procedure')),
    col('hazard', txt('위험요인', 'Hazards')), col('controls', txt('현재 대책', 'Existing controls')),
    col('further', txt('추가 대책', 'Additional controls')), col('responsible', txt('이번 작업의 책임자', 'Person responsible'), 'worker', 'runtime'),
  ], rows);
  let blocks;
  if (kind === 'risk_assessment') {
    blocks = [scope, table(txt('위험요인과 대책 — 원본 평가값은 재평가 없이 유지', 'Hazards and controls — source scores retained without reassessment'), [
      col('step', txt('작업단계', 'Activity')), col('hazard', txt('위험요인', 'Hazard')),
      col('persons', txt('영향받는 사람·예상되는 부상 및 건강장해', 'People at risk and possible harm'), 'text', 'runtime'), col('controls', txt('현재 대책', 'Existing controls')),
      col('further', txt('추가 대책', 'Further controls')), col('sourceRisk', txt('원본 빈도 / 강도 / 위험도', 'Source likelihood / severity / risk')),
      col('residual', txt('현장 기준으로 재평가한 위험도', 'Reassessed risk under site criteria'), 'verification', 'runtime'),
      col('owner', txt('조치 담당자·기한', 'Action owner and due date'), 'worker', 'runtime'),
    ], rows), field('matrix', txt('사용한 평가기준·행렬·재평가 설명', 'Assessment criteria, matrix and reassessment notes')),
    field('assessmentDate', txt('평가·개정일', 'Assessment / revision date'), 'date'),
    field('reviewPlan', context.jurisdiction === 'SG'
      ? txt('싱가포르: 3년 이내 재검토, 변경·사고 시 조기 재검토', 'SG review: within 3 years, or earlier after changes or incidents')
      : txt('다음 재검토일·조기 재검토 사유', 'Next review date and early review triggers'), 'verification'),
    field('consultationRecord', txt('근로자 참여·잔여 위험 전달 기록', 'Worker consultation and communication of remaining risks'), 'verification'),
    field('controlReview', txt('대책 우선순위·실행 및 효과 확인', 'Control hierarchy, implementation and effectiveness'), 'verification'), verification,
    signature('assessor', txt('평가 참여자·검토자 서명', 'Assessment team / reviewer signatures'))];
    if (['GB', 'US', 'CA'].includes(context.jurisdiction)) blocks.push(field('actionCloseout', reviewedText('actionCloseout'), 'verification'));
    if (context.jurisdiction === 'US') blocks.push(field('hazardScenario', reviewedText('hazardScenario'), 'verification'));
    if (context.jurisdiction === 'CA') blocks.push(signature('approval', txt('작성·검토·승인 서명', 'Prepared / reviewed / authorised signatures')));
    if (context.jurisdiction === 'KR') blocks.splice(1, 0, field('assessmentBasis', txt('평가 종류·허용 가능한 위험성 기준', 'Assessment type and risk acceptance criteria'), 'verification'));
    if (context.jurisdiction === 'SG') blocks.push(field('assessmentApproval', txt('평가팀장·승인 책임자', 'Assessment team leader and approving manager'), 'worker'));
    if (context.jurisdiction === 'SG') {
      const hazards = blocks.find(b => b.type === 'table');
      // Keep imported scores as evidence. Fresh site evaluations have their own
      // table so the first table does not grow into an unreadable nine columns.
      hazards.columns = hazards.columns.filter(c => c.key !== 'residual');
      blocks.splice(blocks.indexOf(hazards) + 1, 0, table(reviewedText('sgRiskEvaluation'), [
        col('step', txt('작업단계', 'Activity')), col('hazard', txt('위험요인', 'Hazard')),
        col('sgInitialRisk', reviewedText('sgInitialRisk'), 'verification', 'runtime'),
        col('sgResidualRisk', reviewedText('sgResidualRisk'), 'verification', 'runtime'),
      ], rows));
      blocks.splice(1, 0, field('sgAssessmentRegister', reviewedText('sgAssessmentRegister'), 'verification'));
      blocks.push(signature('sgApprovalRecord', reviewedText('sgApprovalRecord')),
        field('actionCloseout', reviewedText('actionCloseout'), 'verification'));
      for (const key of ['sgRiskScope', 'sgRiskCommunication', 'sgRiskRecord']) {
        blocks.push(field(key, taskSafetyText(context.documentLocale, key), 'verification'));
      }
    }
    if (context.jurisdiction === 'JP') blocks.push(field('riskPriority', txt('조치 우선순위·전달할 잔여 위험', 'Action priority and remaining risks to communicate'), 'verification'));
    if (['FR','ES','BR'].includes(context.jurisdiction)) blocks.splice(1, 0, field('exposureGroups', txt('작업 단위·노출 및 영향받는 집단', 'Work unit, exposure and affected groups'), 'verification'));
    if (context.jurisdiction === 'CA-QC') blocks.push(field('preventionProgramme', txt('관련 예방 프로그램·실행계획', 'Related prevention programme or action plan'), 'verification'));
    if (['SG','CA-AB'].includes(context.jurisdiction)) blocks.push(field('recordCustodian', txt('기록 관리책임자·보존 방법', 'Records custodian and retention arrangements'), 'worker'));
  } else if (kind === 'method_statement') {
    blocks = [scope, equipment, ppe, sequence];
    if (context.jurisdiction === 'AU') blocks.splice(1, 0, field('hrcw', txt('해당 고위험 건설작업 종류·현장 조건', 'Applicable high risk construction work and site conditions')));
    blocks.push(field('competency', txt('역할·교육·역량·자격 확인', 'Roles, training and competency checks'), 'verification'), emergency,
      field('monitoring', context.jurisdiction === 'AU' ? txt('조치 실행·모니터링·검토 및 작업중지 기준', 'Implementation, monitoring, review and stop-work arrangements') : txt('작업 전 준비·작업중지 및 변경 시 검토', 'Preparations, stop-work and change review arrangements')),
      signature('consultation', txt('작업자 협의·설명 및 확인 서명', 'Worker consultation, briefing and acknowledgement signatures')),
      signature('approval', txt('작성·검토·승인 서명', 'Prepared / reviewed / authorised signatures')));
    if (['AU','FR','IT'].includes(context.jurisdiction)) blocks.splice(1, 0, field('contractorCoordination', `${txt('발주자·도급업체 및 작업 조정 기록', 'Contracting parties and coordination record')}${context.jurisdiction === 'IT' ? ' · DUVRI' : context.jurisdiction === 'FR' ? ' · Plan de prévention' : ' · PCBU / principal contractor'}`, 'verification'));
    if (context.jurisdiction === 'GB') blocks.splice(1, 0, field('contractorCoordination', txt('발주자·도급업체 및 작업 조정 기록', 'Contracting parties and coordination record'), 'verification'));
    if (context.jurisdiction === 'RU') blocks.push(field('safeCompletion', txt('안전한 작업 종료·설비 복구', 'Safe completion and return to service'), 'verification'));
    if (context.jurisdiction === 'SG') blocks.push(field('sgProcedureReview', reviewedText('sgProcedureReview'), 'verification'));
  } else if (kind === 'permit_to_work') {
    blocks = [scope, field('permitType', txt('허가 종류·번호·작업구역', 'Permit type, number and work area')),
      field('permitProcedure', txt('해당 작업에 적용하는 허가서 양식·절차 참조', 'Reference to the applicable permit form and procedure'), 'verification'),
      field('validity', txt('허가 유효 시작·종료 시각', 'Permit valid from / until'), 'date'),
      table(txt('위험요인 및 사전 안전조치', 'Hazards and precautions'), [col('hazard', txt('위험요인', 'Hazards')), col('controls', txt('현재 대책', 'Existing controls')), col('further', txt('추가 대책', 'Additional controls'))], rows),
      field('isolation', txt('차단·잠금·표지 및 관련 허가 확인', 'Isolation, lockout / tagout and linked permit checks'), 'verification'), ppe,
      table(txt('필요 시 현장 측정 기록', 'Site measurements where applicable'), [col('item', txt('측정항목·위치', 'Test / location'), 'text', 'runtime'), col('reading', txt('실측값·단위', 'Reading / unit'), 'measurement', 'runtime'), col('time', txt('측정시각', 'Test time'), 'measuredAt', 'runtime'), col('tester', txt('측정자', 'Tester'), 'measuredBy', 'runtime')]), emergency,
      signature('applicant', txt('허가 신청자·작업 책임자', 'Permit applicant / work supervisor')),
      signature('siteVerifier', txt('현장 안전조치 확인자', 'Site precautions verified by')),
      signature('issue', txt('허가 발행자', 'Permit issuer')),
      signature('acceptance', txt('작업팀 인수·확인', 'Work team acceptance')),
      field('suspension', txt('작업 중단·재허가·교대 인계', 'Suspension, revalidation and shift handover'), 'verification'),
      signature('handover', txt('작업 종료·인계·허가 종료 확인', 'Completion, handback and permit closure'))];
    if (context.jurisdiction === 'GB') blocks.splice(3, 0,
      field('competency', txt('역할·교육·역량·자격 확인', 'Roles, training and competency checks'), 'verification'),
      field('permitCoordination', reviewedText('permitCoordination'), 'verification'));
  } else if (kind === 'toolbox_talk') {
    blocks = [scope, table(txt('오늘 공유할 위험요인과 대책', 'Hazards and controls to discuss'), [col('step', txt('작업단계', 'Activity')), col('hazard', txt('위험요인', 'Hazards')), col('controls', txt('현재 대책', 'Existing controls')), col('further', txt('추가 대책', 'Additional controls'))], rows),
      field('changes', txt('당일 변경 사항·최근 사건·작업자 의견', 'Changes, recent incidents and worker feedback'), 'verification'), emergency,
      field('actions', txt('논의 결과·추가 조치 및 담당자', 'Agreed actions and persons responsible')),
      table(txt('참여자 확인', 'Attendance and acknowledgement'), [col('name', txt('성명', 'Name'), 'worker', 'blank'), col('signature', txt('서명', 'Signature'), 'worker', 'blank')], [{}, {}, {}, {}]),
      signature('leader', txt('진행자·실시시각', 'Briefing leader and time'))];
    if (['GB', 'CA', 'SG'].includes(context.jurisdiction)) {
      blocks.splice(1, 0, field('briefingScope', reviewedText('notice'), 'text', 'standard', reviewedText('briefingScope')));
      blocks.splice(blocks.findIndex(b => b.field?.key === 'actions') + 1, 0, field('briefingFollowup', reviewedText('briefingFollowup'), 'verification'));
    }
    if (context.jurisdiction === 'SG') blocks.splice(blocks.findIndex(b => b.field?.key === 'changes') + 1, 0,
      field('sgBriefingReadiness', reviewedText('sgBriefingReadiness'), 'verification'),
      field('sgBriefingUnderstanding', reviewedText('sgBriefingUnderstanding'), 'verification'));
  } else {
    const checks = rows.flatMap(row => [row.controls, row.further].filter(Boolean).map(control => ({ item: `${row.step}\n${control}` })));
    blocks = [scope, table(txt('점검 항목 및 결과', 'Inspection items and findings'), [col('item', txt('확인할 조치·항목', 'Control / item to check')), col('result', txt('결과·실측값', 'Finding / measurement'), 'verification', 'runtime'), col('action', txt('미흡 사항·개선 조치', 'Defect / corrective action'), 'verification', 'runtime'), col('owner', txt('담당자·완료기한', 'Owner / due date'), 'worker', 'runtime')], checks),
      signature('inspector', txt('점검자·점검시각·후속 확인', 'Inspector, time and follow-up verification'))];
    if (['CA', 'SG'].includes(context.jurisdiction)) {
      const findings = blocks.find(b => b.type === 'table');
      findings.columns.splice(1, 0, col('inspectionLocation', reviewedText('inspectionLocation'), 'verification', 'runtime'));
      findings.columns.push(col('inspectionPriority', reviewedText('inspectionPriority'), 'verification', 'runtime'), col('actionCloseout', reviewedText('actionCloseout'), 'verification', 'runtime'));
      blocks.splice(1, 0, field('inspectionPlan', reviewedText('inspectionPlan'), 'verification'));
      blocks.push(field('inspectionLimits', reviewedText('inspectionLimits'), 'verification'), field('inspectionReview', reviewedText('inspectionReview'), 'verification'));
    }
  }
  const profile = REGIONAL_CATALOG[context.jurisdiction];
  if (profile?.extra) blocks.splice(1, 0, field('jurisdictionReview', regionalText(context.documentLocale, profile.extra, {
    'Worker consultation and reassessment triggers': '작업자 협의와 재평가 조건',
    'Local procedures, interfaces and responsible roles': '현장 절차·동시작업 조정·역할 분담',
    'Worksite conditions and lone work arrangements': '현장 조건과 단독작업 대책',
    'Prevention plan reference and follow-up': '예방계획 참조 및 후속 확인',
    'Effectiveness checks and review date': '대책의 효과 확인과 검토일',
    'Priority hazards and team action commitments': '중점 위험요인과 팀 행동목표',
    'Work unit and related prevention documents': '작업 단위와 관련 예방관리 문서',
  }[profile.extra]), 'verification'));
  if (profile?.organisationRecord && kind === 'risk_assessment') blocks.splice(2, 0, field('organisationRecord', `${txt('관련 사업장 전체 관리문서 (이 작업용 양식으로 대체되지 않음)', 'Related organisation-wide record (not replaced by this task form)')} · ${profile.organisationRecord}`));
  if (context.jurisdiction === 'IT' && kind === 'risk_assessment') blocks.push(field('interferenceRecord', `${txt('발주자·도급업체 및 작업 조정 기록', 'Contracting parties and coordination record')} · DUVRI`, 'verification'));
  if (context.jurisdiction === 'RU' && ['method_statement','toolbox_talk'].includes(kind)) blocks.push(field('localAuthorisations', txt('적용 절차·교육 및 작업 자격 확인', 'Applicable procedures, training and work authorisations'), 'verification'));
  const baseScope = { GB: 'gbScope', US: 'usBaseScope', CA: 'caScope' }[context.jurisdiction];
  if (baseScope) blocks.splice(1, 0, field('baseScope', reviewedText('notice'), 'text', 'standard', reviewedText(baseScope)));
  const taskChecks = kind === 'permit_to_work'
    ? taskReviewBlocks(context, options.taskTypes, { field, table, col, txt }) : { blocks: [], reviews: [] };
  // Put task-specific preparation and measurements before permit signatures.
  if (taskChecks.blocks.length) blocks.splice(blocks.findIndex(b => b.field?.key === 'applicant'), 0, ...taskChecks.blocks);
  return {
    id: id(), type: 'form', canonicalType: kind, formType: kind === 'permit_to_work' ? 'ptw' : kind === 'toolbox_talk' ? 'tbm' : kind === 'inspection' ? 'checklist' : 'custom',
    enabled: true, title: entry.title, orientation: ['risk_assessment', 'method_statement'].includes(kind) || (['CA', 'SG'].includes(context.jurisdiction) && kind === 'inspection') ? 'landscape' : 'portrait', blocks,
    regional: { templateId: `${context.jurisdiction}.${kind}`, version: taskChecks.reviews.length ? TASK_REVIEW_VERSION : context.jurisdiction === 'SG' && kind !== 'permit_to_work' ? '2026-10-05.9' : TEMPLATE_VERSION, context, status: 'site-review-draft', review: { version: REGIONAL_REVIEW_VERSION, scope: REGIONAL_REVIEW_SCOPE, status: 'official-source-desk-review' },
      ...(taskChecks.reviews.length ? { taskReviews: taskChecks.reviews } : {}),
      sourcesCheckedAt: '2026-10-03', sources: [...new Map([...structuredClone(REGIONAL_SOURCES[context.jurisdiction]), ...structuredClone(REGIONAL_FORM_SOURCES[`${context.jurisdiction}.${kind}`] || []), ...taskChecks.reviews.flatMap(r => r.sources)].map(s => [s.url, s])).values()], sourceJsaId: source?.sourceId || null, sourceJsaTitle: source?.title || '', sourceImportedAt: source ? new Date().toISOString() : null },
  };
}
export function regionalContextMismatch(documents, context) {
  return documents.some(doc => doc.enabled && doc.regional && !sameWorkContext(doc.regional.context, context));
}
