import React from 'react';
import { actionPlan, isActionVerified, updateActionPlan } from '../utils/actionPlan';
import { assessedScore, assessmentProfile } from '../utils/analysisAssessment';
import { getActionPlanUi } from '../locales/actionPlanUi';
import '../styles/action-plan.css';

export default function ActionPlanEditor({ step, jsaType, assessment, locale, onChange }) {
  const ui = getActionPlanUi(locale), plan = actionPlan(step.actionPlan), profile = assessmentProfile(assessment);
  const score = assessedScore(plan.residualFrequency, plan.residualSeverity, profile);
  const set = (key, value) => onChange(updateActionPlan(plan, key, value));
  const input = (key, type = 'text') => <label key={key}>{ui[key]}<input data-action-field={key} type={type} value={plan[key]} onChange={e => set(key, e.target.value)} /></label>;
  const select = (key, options) => <label>{ui[key]}<select data-action-field={key} value={plan[key]} onChange={e => set(key, e.target.value)}><option value="" />{options.map(value => <option key={value} value={value}>{ui[value]}</option>)}</select></label>;
  return <section className="action-plan" data-action-plan>
    <h3>{ui.title}</h3><p>{ui.flowHelp}</p>
    {jsaType === '2-step' && <label>{ui.additionalControls}<textarea data-action-field="additionalControls" rows={3} value={plan.additionalControls} onChange={e => set('additionalControls', e.target.value)} /></label>}
    <div className="action-plan-grid">{input('owner')}{input('dueDate', 'date')}
      {select('status', ['planned', 'inProgress', 'implemented'])}{input('completedOn', 'date')}
      {input('verifiedBy')}{input('verifiedOn', 'date')}{select('effectiveness', ['effective', 'ineffective'])}
    </div>
    <fieldset><legend>{ui.residualRisk}</legend><div className="action-plan-grid">
      {['Frequency', 'Severity'].map((field, i) => <label key={field}>{i ? ui.severity : ui.frequency}<select data-action-field={'residual' + field} value={plan['residual' + field]} onChange={e => set('residual' + field, e.target.value === '' ? '' : Number(e.target.value))}>
        <option value="" />{Array.from({ length: i ? profile.severityMax : profile.frequencyMax }, (_, n) => <option key={n + 1} value={n + 1}>{n + 1}</option>)}</select></label>)}
      <output data-residual-score aria-live="polite">{score == null ? '' : `${plan.residualFrequency} × ${plan.residualSeverity} = ${score} · ${isActionVerified(plan) ? ui.verified : ui.provisional}`}</output>
    </div></fieldset><p>{ui.reviewHelp}</p>
  </section>;
}
