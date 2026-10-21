import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getProcedureDocumentUi } from '../locales/procedureDocumentUi';
import { procedureRows } from '../utils/procedureDocument';
import { normalizePaperSize, paperPreviewWidth } from '../utils/paperFormat';
import '../styles/procedure-document.css';
import { getPublicDocumentUi } from '../locales/publicDocumentUi';

export default function ProcedureDocument({ document: data, uiLocale, inline = false, id }) {
  const { i18n, t } = useTranslation('common');
  const dialog = useRef(null), paper = useRef(null), pending = useRef(false);
  const [opened, setOpened] = useState(false), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const heading = useId();
  const ui = getProcedureDocumentUi(uiLocale || i18n.language);
  const locale = data?.locale || uiLocale || i18n.language;
  const doc = getProcedureDocumentUi(locale), labels = i18n.getFixedT(locale, 'export');
  const rows = procedureRows(data?.procedures);
  const form = data?.formData || {}, size = normalizePaperSize(data?.paperSize);
  const title = form.projectName || data?.title || '';
  async function output(print) {
    if (pending.current || !paper.current || !rows.length) return;
    pending.current = true; setBusy(true); setFailed(false);
    try {
      await document.fonts.ready;
      const { createReportPdf, downloadBlob, printReportImages } = await import('../utils/reportPdf');
      const result = await createReportPdf([{ element: paper.current, orientation: 'portrait', paperSize: size }]);
      if (print) await printReportImages(result.images);
      else downloadBlob(result.blob, `${title || doc.title} - ${doc.title}`.replace(/[\\/:*?"<>|]/g, '_') + '.pdf');
    } catch { setFailed(true); }
    finally { pending.current = false; setBusy(false); }
  }
  if (!data) return null;
  const PaperTitle = inline ? 'h3' : 'h1';
  const content = <>
      <div className="procedure-document-toolbar">
        <h2 id={heading}>{inline ? getPublicDocumentUi(uiLocale || locale).procedurePreview : ui.title}</h2>
        <button type="button" data-procedure-pdf disabled={busy} onClick={() => output(false)}>{busy ? '…' : ui.download}</button>
        {!inline && <button type="button" data-procedure-print disabled={busy} onClick={() => output(true)}>{ui.print}</button>}
        {!inline && <button type="button" onClick={() => dialog.current.close()}>{ui.close}</button>}
      </div>
      {failed && <p role="alert">{t('saveFlow.failed')}</p>}
      {(inline || opened) && <div className="procedure-document-scroll" tabIndex={0} role="region" aria-label={ui.title}>
        <article ref={paper} className="procedure-document-paper" lang={locale} dir={i18n.dir(locale)} style={{ width: paperPreviewWidth(size, 'portrait') }}>
          <PaperTitle>{doc.title}</PaperTitle>
          <dl>{[[labels('header.projectName'), title], [labels('header.workDate'), form.workDate], [labels('header.workLocation'), form.workLocation], [labels('header.department'), form.department]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{typeof value === 'string' ? value : ''}</dd></div>)}</dl>
          <table><colgroup><col style={{ width: '7%' }} /><col style={{ width: '27%' }} /><col style={{ width: '66%' }} /></colgroup>
            <thead><tr><th>{doc.number}</th><th>{doc.step}</th><th>{doc.detail}</th></tr></thead>
            <tbody>{rows.map((row, index) => <tr key={index}><td>{index + 1}</td><td dir="auto">{row.stepTitle}</td><td dir="auto">{row.stepDetail}</td></tr>)}</tbody>
          </table>
        </article>
      </div>}
  </>;
  return inline ? <section id={id} className="procedure-document-access procedure-document-inline" aria-labelledby={heading}>{content}</section> : <div className="procedure-document-access">
    <button type="button" data-procedure-document-open disabled={!rows.length} onClick={() => { setOpened(true); setFailed(false); dialog.current.showModal(); }}>{ui.open}</button>
    <dialog ref={dialog} className="procedure-document-dialog" aria-labelledby={heading} onClose={() => setOpened(false)}>{content}</dialog>
  </div>;
}
