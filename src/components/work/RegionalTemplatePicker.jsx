import { useEffect, useState } from 'react';
import { ownJsa } from '../../services/workPackageService';
import { importJsa } from '../../utils/workPackages';
import { workContextUi } from '../../utils/workJurisdiction';
import { createRegionalTemplate, regionalTemplates, REGIONAL_SOURCES } from '../../utils/regionalWorkTemplates';
import { TASK_TYPES, taskLabel, taskReview } from '../../utils/regionalTaskReview';
import { taskSafetyText } from '../../locales/taskSafetyText';
export default function RegionalTemplatePicker({ context, jsas = [], onAdd, locale, disabled, errorText }) {
  const ui = workContextUi(locale), entries = regionalTemplates(context);
  const [sourceId, setSourceId] = useState(''), [source, setSource] = useState(null), [error, setError] = useState(false);
  const [taskTypes, setTaskTypes] = useState([]);
  const taskText = key => taskSafetyText(locale, key);
  useEffect(() => setTaskTypes([]), [context.jurisdiction]);
  useEffect(() => {
    let active = true;
    setSource(null); setError(false);
    if (sourceId) ownJsa(sourceId).then(row => { if (active) setSource({ id: sourceId, doc: importJsa(row) }); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [sourceId]);
  const waiting = Boolean(sourceId && source?.id !== sourceId);
  const add = kinds => onAdd(kinds.map(kind => createRegionalTemplate(kind, context, sourceId ? source.doc : null, { taskTypes })));
  const taskSources = entries.length ? taskTypes.flatMap(topic => taskReview(context, topic).sources) : [];
  return <section className="work-section regional-catalog">
    <h2>{ui.catalog}</h2>
    {!entries.length ? <p>{ui.empty}</p> : <>
      <p>{ui.draft}</p>
      {context.jurisdiction === 'GB' && <p>Risk Assessment + Method Statement (RAMS)</p>}
      {context.jurisdiction === 'AU' && <p>{ui.swms}</p>}
      <label>{ui.source}<select disabled={disabled} value={sourceId} onChange={e => setSourceId(e.target.value)}>
        <option value="">{ui.blank}</option>{jsas.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
      </select></label>
      {error && <p role="alert">{errorText}</p>}
      <fieldset className="regional-task-checks" disabled={disabled}>
        <legend>{taskText('select')}</legend>
        <p>{taskText('help')} {taskText('copy')}</p>
        <div>{TASK_TYPES.map(topic => <label key={topic}>
          <input type="checkbox" value={topic} checked={taskTypes.includes(topic)} onChange={e => setTaskTypes(current => e.target.checked ? [...current, topic] : current.filter(t => t !== topic))} />
          <span>{taskLabel(context, topic, locale)}</span>
        </label>)}</div>
      </fieldset>
      <div className="work-tools regional-template-actions">
        <button className="jsa-primary" disabled={disabled || waiting} onClick={() => add(entries.filter(e => e.available && e.recommended).map(e => e.kind))}>{ui.addPack}</button>
        {entries.map(e => <button key={e.kind} disabled={disabled || waiting || !e.available} onClick={() => add([e.kind])}>{e.title} +</button>)}
      </div>
      <details><summary>{ui.sources}</summary><ul>{[...new Map([...REGIONAL_SOURCES[context.jurisdiction], ...taskSources].map(s => [s.url, s])).values()].map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul></details>
    </>}
  </section>;
}
