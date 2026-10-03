import { WORK_JURISDICTIONS, WORK_DOCUMENT_LANGUAGES, workContext, workContextUi, jurisdictionLabel, documentLanguageLabel, documentDirection } from '../../utils/workJurisdiction';
import '../../styles/work-context.css';
export default function WorkContext({ value, onChange, locale = 'en-US', disabled = false }) {
  const context = workContext(value), ui = workContextUi(locale);
  const change = patch => onChange(workContext({ ...context, ...patch }));
  return <fieldset className="work-section regional-work-context" dir={documentDirection(locale)} disabled={disabled}>
    <legend>{ui.title}</legend><p className="work-section-help">{ui.help}</p>
    <div className="work-common-grid">
      <label>{ui.country}<select value={context.jurisdiction} onChange={e => change({ jurisdiction: e.target.value, region: '', highRiskConstruction: 'unknown', documentLocale: WORK_JURISDICTIONS.find(j => j.id === e.target.value)?.locale || context.documentLocale })}>
        <option value="">{ui.unspecified}</option>{WORK_JURISDICTIONS.map(j => <option key={j.id} value={j.id}>{jurisdictionLabel(j, locale)}</option>)}
      </select></label>
      <label>{ui.region}<input maxLength={100} value={context.region} onChange={e => change({ region: e.target.value })} /></label>
      <label>{ui.language}<select value={context.documentLocale} onChange={e => change({ documentLocale: e.target.value })}>
        <option value="">{ui.chooseLanguage}</option>{WORK_DOCUMENT_LANGUAGES.map(l => <option key={l} value={l}>{documentLanguageLabel(l)}</option>)}
      </select></label>
      <label>{ui.industry}<input maxLength={100} value={context.industry} onChange={e => change({ industry: e.target.value })} /></label>
      <label>{ui.activity}<input maxLength={200} value={context.activity} onChange={e => change({ activity: e.target.value })} /></label>
      {context.jurisdiction === 'AU' && <label>{ui.highRisk}<select value={context.highRiskConstruction} onChange={e => change({ highRiskConstruction: e.target.value })}>{['unknown','yes','no'].map(v => <option key={v} value={v}>{ui[v]}</option>)}</select></label>}
    </div>
  </fieldset>;
}
