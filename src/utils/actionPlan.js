// Per-step follow-up: initial assessment remains a separate historical value.
const text = value => typeof value === 'string' ? value : '';
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value ? value : '';
export function actionPlan(value = {}) {
  value = value && typeof value === 'object' ? value : {};
  return { additionalControls: text(value.additionalControls), owner: text(value.owner), dueDate: date(value.dueDate),
    status: ['planned', 'inProgress', 'implemented'].includes(value.status) ? value.status : '',
    completedOn: date(value.completedOn), verifiedBy: text(value.verifiedBy), verifiedOn: date(value.verifiedOn),
    effectiveness: ['effective', 'ineffective'].includes(value.effectiveness) ? value.effectiveness : '',
    residualFrequency: value.residualFrequency ?? '', residualSeverity: value.residualSeverity ?? '' };
}
export function clearActionVerification(value) {
  return { ...actionPlan(value), status: '', completedOn: '', verifiedBy: '', verifiedOn: '', effectiveness: '', residualFrequency: '', residualSeverity: '' };
}
export function reusableActionPlan(value) {
  return { additionalControls: actionPlan(value).additionalControls };
}
export function reusableActionStep(step) {
  return step?.actionPlan ? { ...step, actionPlan: reusableActionPlan(step.actionPlan) } : step;
}
export function isActionVerified(value) {
  const p = actionPlan(value);
  return p.status === 'implemented' && Boolean(p.completedOn && p.verifiedBy.trim() && p.verifiedOn)
    && p.verifiedOn >= p.completedOn && p.effectiveness === 'effective';
}
export function updateActionPlan(value, field, next) {
  let p = actionPlan(value);
  if (['additionalControls', 'owner', 'dueDate'].includes(field) && p[field] !== next) p = clearActionVerification(p);
  if (field === 'status' && next !== 'implemented') p = clearActionVerification(p);
  return actionPlan({ ...p, [field]: next });
}
const basis = step => JSON.stringify([step?.proc?.stepTitle, step?.proc?.stepDetail, step?.risks, step?.frequency, step?.severity]);
export function reconcileActionPlans(before, after) {
  return after.map((step, index) => step.actionPlan && basis(before[index]) !== basis(step)
    ? { ...step, actionPlan: clearActionVerification(step.actionPlan) } : step);
}
export const ACTION_COLUMNS = {
  DATA_ADDITIONAL_CONTROLS: { width: 10, align: 'left', actionKey: 'additionalControls' },
  DATA_ACTION_OWNER: { width: 5, align: 'left', actionKey: 'ownerDue' },
  DATA_ACTION_CHECK: { width: 7, align: 'left', actionKey: 'implementationVerification' },
  DATA_RESIDUAL_RISK: { width: 5, align: 'center', actionKey: 'residualRisk' },
};
export function actionColumnLabel(key, ui) {
  const aliases = { DATA_KRAS_AFTER: 'residualRisk', DATA_KRAS_SCHED: 'dueDate', DATA_KRAS_COMP: 'completedOn', DATA_KRAS_MANAGER: 'owner' };
  return ui[ACTION_COLUMNS[key]?.actionKey || aliases[key]];
}
export function actionColumnValue(key, step, ui, score) {
  const p = actionPlan(step.actionPlan);
  const labelled = (label, value) => value ? `${label}: ${value}` : '';
  if (key === 'DATA_ADDITIONAL_CONTROLS') return p.additionalControls;
  if (key === 'DATA_ACTION_OWNER') return [p.owner, p.dueDate].filter(Boolean).join('\n');
  if (key === 'DATA_ACTION_CHECK') return [p.status && ui[p.status], labelled(ui.completedOn, p.completedOn),
    labelled(ui.verifiedBy, p.verifiedBy), labelled(ui.verifiedOn, p.verifiedOn), p.effectiveness && ui[p.effectiveness]].filter(Boolean).join('\n');
  if (key === 'DATA_RESIDUAL_RISK' || key === 'DATA_KRAS_AFTER') return score == null ? ''
    : `${p.residualFrequency} × ${p.residualSeverity} = ${score}\n${isActionVerified(p) ? ui.verified : ui.provisional}`;
  if (key === 'DATA_KRAS_SCHED') return p.dueDate;
  if (key === 'DATA_KRAS_COMP') return p.completedOn;
  if (key === 'DATA_KRAS_MANAGER') return p.owner;
  return null;
}
