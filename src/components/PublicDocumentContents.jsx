import { discoveryToolsUi } from '../locales/discoveryToolsUi';
export default function PublicDocumentContents({row,locale,onOpenPreview}) {
 const ui=discoveryToolsUi(locale);
 return <nav className="public-document-contents" aria-label={ui.navigate}>
  <div className="jsa-toolbar"><a href="#public-analysis-reading">{ui.reading}</a><a href="#public-preview-panel" onClick={onOpenPreview}>{ui.procedure} · {ui.preview}</a></div>
  <details><summary>{ui.navigate} ({row.analysis_data.length})</summary><ol>{row.analysis_data.map((step,i)=><li key={i}><a href={'#public-step-'+(i+1)} dir="auto">{step.proc.stepTitle}</a></li>)}</ol></details>
 </nav>;
}
