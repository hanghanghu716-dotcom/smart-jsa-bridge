/* eslint-disable react-refresh/only-export-components -- detached image renderer, not an application route */
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import DocumentContent from '../components/DocumentContent';
import { templateLayout, defaultColumns } from './documentLayout.js';
import { captureReport } from './captureReport.js';
import { reportFirstPageHeight } from './reportFirstPage.js';
import { paperDimensions } from './paperFormat.js';
import { THUMBNAIL_MAX_BYTES } from './publicThumbnail.js';

async function captureFirstPage(element, layout, signal) {
  await document.fonts.ready;
  signal?.throwIfAborted();
  const source = await captureReport(element, { scale: 1,
    height: reportFirstPageHeight(element, layout.savedOrientation, layout.paperSize) });
  signal?.throwIfAborted();
  if (!source.width || !source.height) throw new Error('THUMBNAIL_RENDER_FAILED');
  const size = paperDimensions(layout.paperSize, layout.savedOrientation), canvas = document.createElement('canvas');
  canvas.width = 720; canvas.height = Math.round(720 * size.height / size.width);
  const context = canvas.getContext('2d'), ratio = 720 / size.width;
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
  const width = (size.width - 20) * ratio;
  context.drawImage(source, 10 * ratio, 10 * ratio, width, source.height * width / source.width);
  source.width = source.height = 0;
  try {
    for (const quality of [0.82, 0.65, 0.45]) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
      signal?.throwIfAborted();
      if (blob?.type === 'image/webp' && blob.size <= THUMBNAIL_MAX_BYTES) return { blob, width: canvas.width, height: canvas.height };
    }
    throw new Error('THUMBNAIL_TOO_LARGE');
  } finally { canvas.width = canvas.height = 0; }
}

function Paper({ row, i18n, signal, finish }) {
  const ref = useRef(null), locale = row.public_locale || i18n.language, t = i18n.getFixedT(locale, 'export');
  const layout = templateLayout(row.custom_layout, { docTitle: t('default.docTitle'), appr1: t('default.appr1'),
    appr2: t('default.appr2'), appr3: t('default.appr3'), savedActiveOrder: defaultColumns(row.form_data?.jsaType) });
  useEffect(() => {
    captureFirstPage(ref.current, layout, signal).then(value => finish(null, value), error => finish(error));
    // A detached paper renders once from its immutable persisted revision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className="risk-thumbnail-renderer" aria-hidden="true" dir={i18n.dir(locale)}>
    <div className="jsa-public-paper" ref={ref}><DocumentContent formData={row.form_data} participants={[]}
      analysisData={row.analysis_data} layout={layout} publicNotes={row.publication_context?.limitations || ''}
      documentLocale={locale} /></div>
  </div>;
}

// Serial across route changes/tabs within this app instance. No jsPDF is loaded:
// this is the same risk-assessment first-page layout captured directly to WebP.
let queue = Promise.resolve();
export function renderRiskThumbnail(row, i18n, signal) {
  const task = queue.catch(() => {}).then(async () => {
    signal?.throwIfAborted();
    const host = document.createElement('div'); document.body.appendChild(host);
    let rejectRender;
    const root = createRoot(host, { onUncaughtError: error => rejectRender?.(error) });
    try {
      return await new Promise((resolve, reject) => {
        rejectRender = reject;
        const finish = (error, value) => { if (error) reject(error); else resolve(value); };
        root.render(<I18nextProvider i18n={i18n}><Paper row={row} i18n={i18n} signal={signal} finish={finish}/></I18nextProvider>);
      });
    } finally { root.unmount(); host.remove(); }
  });
  queue = task;
  return task;
}
