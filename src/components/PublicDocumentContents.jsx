import { discoveryToolsUi } from '../locales/discoveryToolsUi';
export default function PublicDocumentContents({row,locale}) {
 const ui=discoveryToolsUi(locale);
 return <nav className="public-document-contents" aria-label={ui.navigate}>
  <div className="jsa-toolbar"><a href="#public-procedure-preview">{ui.procedure}</a><a href="#public-document-preview-title">{ui.preview}</a><a href="#public-analysis-reading">{ui.reading}</a></div>
  <details><summary>{ui.navigate} ({row.analysis_data.length})</summary><ol>{row.analysis_data.map((step,i)=><li key={i}><a href={'#public-step-'+(i+1)} dir="auto">{step.proc.stepTitle}</a></li>)}</ol></details>
 </nav>;
}
