import { useEffect, useState } from 'react';
import manifest from '../data/reviewed-recommendations.json';
import { caseSourceFingerprint } from '../utils/caseSource';
import { caseCandidates, caseStepOptions, caseJourneyState } from '../utils/caseRecommendations';
import { caseRecommendationUi } from '../locales/caseRecommendationUi';

export default function CaseStepPicker({ post, context, paperSize, locale, onStart }) {
  const [source, setSource] = useState(null);
  useEffect(() => {
    let active = true;
    caseSourceFingerprint(post).then(fingerprint => { if (active) setSource({ post, fingerprint }); })
      .catch(() => { if (active) setSource({ post, fingerprint: null }); });
    return () => { active = false; };
  }, [post]);
  const fingerprint = source?.post === post ? source.fingerprint : null;
  const ui = caseRecommendationUi(locale);
  if (source?.post !== post) return <p role="status">{ui.loading}</p>;
  // A new source, country or language starts with no selections.
  return <CaseChoices key={JSON.stringify([fingerprint, context])} {...{ post, fingerprint, context, paperSize, locale, onStart }} />;
}

function CaseChoices({ post, fingerprint, context, paperSize, locale, onStart }) {
  const ui = caseRecommendationUi(locale);
  const candidates = caseCandidates(manifest, post, fingerprint, context);
  const steps = caseStepOptions(candidates);
  const [selected, setSelected] = useState([]), [conditions, setConditions] = useState([]);
  const toggle = (set, value) => set(previous => previous.includes(value) ? previous.filter(item => item !== value) : [...previous, value]);
  if (!steps.length) return <p data-case-empty role="status">{ui.empty}</p>;
  const chosen = steps.filter(step => selected.includes(step.key));
  const units = candidates.filter(unit => chosen.some(step => step.task === unit.task && step.step === unit.step));
  const conditionKeys = [...new Set(units.flatMap(unit => [...unit.applicability.conditionsRequired, ...unit.applicability.excludedConditions]))];
  const labels = Object.assign({}, ...units.map(unit => unit.conditionLabels));
  const state = caseJourneyState(manifest, candidates, selected, conditions, context, paperSize);
  return <fieldset className="case-step-picker" data-case-picker><legend>{ui.title}</legend>
    <p>{ui.help}</p>
    {steps.map(step => <div key={step.key} className="case-step-option">
      <label><input type="checkbox" data-case-step checked={selected.includes(step.key)} onChange={() => toggle(setSelected, step.key)} /> {step.step}</label>
      {selected.includes(step.key) && step.units.map(unit => <dl key={unit.id}>
        <dt>{ui.hazard}</dt><dd>{unit.hazard}</dd><dt>{ui.control}</dt><dd>{unit.control}</dd>
        <dt>{ui.verification}</dt><dd>{unit.verification}</dd><dt>{ui.exclusions}</dt><dd>{unit.exclusions.join(' · ')}</dd>
        <dt>{ui.sources}</dt><dd>{unit.sources.map(source => <a key={source.url + source.section} href={source.url} target="_blank" rel="noopener noreferrer">{source.section} ↗ </a>)}</dd>
        <dt>{ui.reviewed}</dt><dd>{unit.review.reviewedAt}</dd>
      </dl>)}
    </div>)}
    {!!conditionKeys.length && <fieldset><legend>{ui.conditions}</legend>{conditionKeys.map(key => <label key={key}>
      <input data-case-condition={key} type="checkbox" checked={conditions.includes(key)} onChange={() => toggle(setConditions, key)} /> {labels[key]}
    </label>)}</fieldset>}
    <p>{ui.selectHelp}</p>
    <button type="button" data-case-start disabled={!state} onClick={() => onStart(state)}>{ui.start} →</button>
  </fieldset>;
}
