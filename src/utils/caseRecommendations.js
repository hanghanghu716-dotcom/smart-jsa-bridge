import { selectReviewedRecommendations } from './reviewedRecommendationPolicy.js';
import { CASE_SOURCE_FIELDS, caseSourceFingerprint } from './caseSource.js';
import { newJourneyState } from './regionalJourney.js';
import { workContext } from './workJurisdiction.js';

const approved = item => item.status === 'reviewed' && ['technicalStatus', 'regionalStatus', 'translationStatus']
  .every(key => item.review?.[key] === 'approved') && item.mappingReview?.status === 'approved';
// Project display names may change without changing the performed work or site applicability.
export const caseWorkSignature = formData => JSON.stringify(workContext(formData.context));
const sameScope = (a, b) => ['taskType', 'hazardType', 'targetType'].every(key => a?.[key] === b?.[key]);
const scopeKey = item => JSON.stringify([item.task, item.step, item.hazard, item.applicability?.taskType, item.applicability?.hazardType, item.applicability?.targetType]);

export function caseCandidates(manifest, post, fingerprint, context) {
  if (manifest?.schemaVersion !== 1 || !manifest.releaseId || !fingerprint || !post) return [];
  return (manifest.candidates || []).filter(item => approved(item) && item.caseGroupId === post.post_group_id
    && item.locale === post.language_code && item.locale === context.documentLocale
    && item.jurisdiction === context.jurisdiction && item.sourceFingerprint === fingerprint);
}

export function caseStepOptions(candidates) {
  const steps = new Map();
  for (const unit of candidates.filter(item => item.kind === 'current')) {
    const key = JSON.stringify([unit.task, unit.step]);
    if (!steps.has(key)) steps.set(key, { key, task: unit.task, step: unit.step, units: [] });
    steps.get(key).units.push(unit);
  }
  return [...steps.values()];
}

export function eligibleCaseUnits(manifest, candidates, context, conditions) {
  return candidates.filter(unit => unit.kind === 'current' && selectReviewedRecommendations(manifest, {
    ...unit.applicability, ...context, conditions, kind: 'current',
  }).some(item => item.id === unit.id));
}

export function caseJourneyState(manifest, candidates, selectedSteps, conditions, context, paperSize) {
  const state = newJourneyState(context, paperSize);
  const selected = new Set(selectedSteps);
  const eligible = eligibleCaseUnits(manifest, candidates, context, conditions);
  const steps = caseStepOptions(candidates).filter(step => selected.has(step.key));
  if (!steps.length || steps.some(step => step.units.some(unit => !eligible.includes(unit)))) return null;
  state.formData.caseJourney = { releaseId: manifest.releaseId, conditions: [...conditions] };
  state.procedures = steps.map(step => ({ stepTitle: step.step, stepDetail: step.task }));
  state.analysisData = steps.map((step, id) => {
    const unique = [...new Map(step.units.map(unit => [scopeKey(unit), unit])).values()];
    return { id, proc: state.procedures[id], frequency: null, severity: null, riskLevel: null,
      risks: unique.map(unit => ({ id: `case:${unit.id}`, source: 'case', factor: unit.hazard,
        current_measure: '', recommend_measure: '', measure: '', current_measure_confirmed: false,
        contentLocale: unit.locale, caseContext: { unitId: unit.id, releaseId: manifest.releaseId,
          caseGroupId: unit.caseGroupId, sourceFingerprint: unit.sourceFingerprint,
          conditions: [...conditions], workSignature: caseWorkSignature(state.formData), proc: state.procedures[id] } })) };
  });
  return state;
}

export function selectCaseRecommendations(manifest, { risk, type, formData, proc, fingerprint }) {
  const origin = risk.caseContext, context = workContext(formData.context);
  if (!origin || origin.releaseId !== manifest.releaseId || origin.sourceFingerprint !== fingerprint
    || origin.workSignature !== caseWorkSignature(formData)
    || JSON.stringify([...(origin.conditions || [])].sort()) !== JSON.stringify([...(formData.caseJourney?.conditions || [])].sort())
    || ['stepTitle', 'stepDetail'].some(key => origin.proc?.[key] !== proc?.[key])) return [];
  const anchor = manifest.candidates.find(item => item.id === origin.unitId && item.kind === 'current');
  if (!anchor || !approved(anchor) || anchor.hazard !== risk.factor) return [];
  const candidates = caseCandidates(manifest, { post_group_id: origin.caseGroupId, language_code: context.documentLocale }, fingerprint, context);
  if (!candidates.includes(anchor)) return [];
  if (type === 'advanced') {
    const ref = risk.current_measure_reference;
    const current = candidates.find(item => item.id === ref?.id && item.kind === 'current');
    if (risk.current_measure_confirmed !== true || ref?.kind !== 'knowledge' || ref.releaseId !== manifest.releaseId
      || !current || current.control !== risk.current_measure || current.hazard !== anchor.hazard
      || current.task !== anchor.task || current.step !== anchor.step || !sameScope(current.applicability, anchor.applicability)
      || !eligibleCaseUnits(manifest, candidates, context, origin.conditions).includes(current)) return [];
  }
  return selectReviewedRecommendations(manifest, { ...anchor.applicability, ...context,
    kind: type, conditions: origin.conditions, currentControlId: risk.current_measure_reference?.id })
    .filter(item => candidates.some(candidate => candidate.id === item.id && candidate.kind === item.kind)
      && item.hazard === anchor.hazard && item.task === anchor.task && item.step === anchor.step)
    .map(item => ({ display: item.control, similarity_score: item.score.value, score_kind: item.score.kind,
      reference: { kind: 'knowledge', id: item.id, releaseId: manifest.releaseId, locale: item.locale },
      review_status: 'reviewed', evidence: { hazard: item.hazard, currentControl: type === 'advanced' ? risk.current_measure : null,
        dataLocale: item.locale, jurisdiction: item.jurisdiction, regionReviewed: true, sourceType: 'reviewed_case',
        task: item.task, step: item.step, conditions: item.conditions, exclusions: item.exclusions,
        verification: item.verification, sources: item.sources, review: item.review, sourceRevision: item.sourceRevision,
        sourceFingerprint: item.sourceFingerprint, mappingVersion: manifest.releaseId, score: item.score } }));
}

export async function loadCaseRecommendations(client, manifest, args) {
  if (!args.risk.caseContext) return [];
  const origin = args.risk.caseContext;
  const { data, error } = await client.from('case_studies').select(CASE_SOURCE_FIELDS.join(','))
    .eq('post_group_id', origin.caseGroupId).eq('language_code', workContext(args.formData.context).documentLocale);
  if (error) throw error;
  if (data?.length !== 1) return [];
  return selectCaseRecommendations(manifest, { ...args, fingerprint: await caseSourceFingerprint(data[0]) });
}
