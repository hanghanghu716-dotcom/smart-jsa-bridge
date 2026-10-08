import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageLink, useLanguageNavigate } from '../hooks/useLanguage';
import { clearActiveDraft } from '../services/jsaDraftService';
import { WORK_JURISDICTIONS, WORK_DOCUMENT_LANGUAGES, workContext, workContextUi, jurisdictionLabel, documentLanguageLabel, documentDirection } from '../utils/workJurisdiction';
import { journeyContext, journeyDocumentTitle, newJourneyState } from '../utils/regionalJourney';
import { defaultPaperSize, paperPreviewWidth } from '../utils/paperFormat';
import { defaultColumns } from '../utils/documentLayout';
import { regionalJourneyUi } from '../locales/regionalJourneyUi';
import PaperSizeSelect from './PaperSizeSelect';
import DocumentContent from './DocumentContent';
import '../styles/regional-journey.css';

export default function RegionalStartActions({ locale, activity = '' }) {
  const { i18n } = useTranslation();
  const navigate = useLanguageNavigate();
  const [context, setContext] = useState(() => journeyContext(locale, activity));
  const [paperSize, setPaperSize] = useState(() => defaultPaperSize(context.jurisdiction));
  const [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const paper = useRef(null), lock = useRef(false);
  const ui = regionalJourneyUi(locale), regionUi = workContextUi(locale);
  const changeCountry = jurisdiction => {
    // Language stays independent, including US + Spanish or Canada + French.
    setContext(current => workContext({ ...current, jurisdiction, region: '' }));
    setPaperSize(defaultPaperSize(jurisdiction));
  };
  const state = newJourneyState(context, paperSize);
  const documentT = i18n.getFixedT(context.documentLocale, 'common');
  const downloadBlank = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(false);
    try {
      const { createReportPdf, downloadBlob } = await import('../utils/reportPdf');
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await document.fonts.ready;
      const { blob } = await createReportPdf([{ element: paper.current, orientation: 'landscape', paperSize }]);
      downloadBlob(blob, `blank-${context.jurisdiction}-${context.documentLocale}-${paperSize}.pdf`);
    } catch { setError(true); }
    finally { lock.current = false; setBusy(false); }
  };
  return <section className="regional-journey" dir={documentDirection(locale)} aria-busy={busy}>
    <div className="regional-journey-heading"><div><span className="regional-journey-country">{jurisdictionLabel(WORK_JURISDICTIONS.find(j => j.id === context.jurisdiction), locale)}</span><h2>{ui.startTitle}</h2></div><p>{journeyDocumentTitle(context)}</p></div>
    <p>{ui.startHelp}</p>
    {activity && <p className="regional-journey-activity" dir="auto">{activity}</p>}
    <fieldset disabled={busy} className="regional-journey-fields"><legend className="regional-visually-hidden">{regionUi.title}</legend>
      <label>{regionUi.country}<select value={context.jurisdiction} onChange={event => changeCountry(event.target.value)}>{WORK_JURISDICTIONS.map(j => <option key={j.id} value={j.id}>{jurisdictionLabel(j, locale)}</option>)}</select></label>
      <label>{regionUi.language}<select value={context.documentLocale} onChange={event => setContext(current => workContext({ ...current, documentLocale: event.target.value }))}>{WORK_DOCUMENT_LANGUAGES.map(l => <option key={l} value={l}>{documentLanguageLabel(l)}</option>)}</select></label>
      <PaperSizeSelect value={paperSize} onChange={setPaperSize} locale={locale}/>
    </fieldset>
    <div className="regional-journey-actions">
      <button type="button" className="regional-journey-primary" disabled={busy} onClick={() => { clearActiveDraft({ preserveGuest: true }); navigate('/info', { state }); }}>{ui.start} →</button>
      <button type="button" disabled={busy} onClick={downloadBlank}>{busy ? ui.creating : ui.blankPdf} ↓</button>
      <LanguageLink to="/work-packages" state={{ regionalStartContext: context }}>{regionUi.catalog} →</LanguageLink>
    </div>
    {error && <p role="alert">{ui.error}</p>}
    {busy && <div aria-hidden="true" className="regional-blank-host"><div ref={paper} className="regional-blank-paper" style={{ width: paperPreviewWidth(paperSize) }} dir={documentDirection(context.documentLocale)}>
      <DocumentContent documentLocale={context.documentLocale} formData={state.formData} participants={[]}
        analysisData={Array.from({ length: 6 }, () => ({ proc: {}, risks: [], frequency: ' ', severity: ' ', riskLevel: ' ' }))}
        layout={{ ...state, savedActiveOrder: defaultColumns(), savedColumnOverrides: context.documentLocale.startsWith('ar') ? { DATA_STEP_NO: { width: 4 } } : {}, savedSignatureRows: 1, appr1: documentT('designer.appr1'), appr2: documentT('designer.appr2'), appr3: documentT('designer.appr3') }}/>
    </div></div>}
  </section>;
}
