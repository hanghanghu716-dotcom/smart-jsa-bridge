import { useEffect, useRef, useState } from 'react';
import { previewPdfUrl } from '../utils/archiveDiscovery';
import { resolvePublicSupabaseConfig } from '../config/supabase';
import { archiveUi } from '../locales/archiveUi';
export default function PdfThumbnail({ url, title, summary, locale }) {
 const element = useRef(null), [image,setImage] = useState(null), ui = archiveUi(locale);
 const safeUrl = previewPdfUrl(url,resolvePublicSupabaseConfig(import.meta.env).url);
 useEffect(() => {
  if (!safeUrl || !window.IntersectionObserver) return;
  const controller = new AbortController();
  const observer = new IntersectionObserver(entries => {if (!entries.some(entry => entry.isIntersecting)) return;observer.disconnect();
   import('../utils/pdfThumbnail').then(({pdfThumbnail}) => pdfThumbnail(safeUrl,controller.signal)).then(value => {if(!controller.signal.aborted && value)setImage({url:safeUrl,value});}).catch(() => {});
  },{rootMargin:'60px'});
  observer.observe(element.current);
  return () => {observer.disconnect();controller.abort();};
 },[safeUrl]);
 const src = image?.url === safeUrl ? image.value : '';
 return <div ref={element} className="archive-thumbnail" aria-hidden="true">
  {src ? <img src={src} alt="" width="720" height="510"/> : <div className="document-paper document-paper--summary"><strong>{title}</strong><p>{summary}</p><div className="document-paper-rule"/><small>JSA</small></div>}
  <span className="document-preview-badge">{src ? ui.pdfPreview : ui.documentPreview}</span>
 </div>;
}
