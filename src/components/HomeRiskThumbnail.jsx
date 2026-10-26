import { useState } from 'react';
import { renderDocumentThumbnail } from '../utils/documentThumbnail';
import { archiveUi } from '../locales/archiveUi';

// The public home never imports the PDF/canvas renderer or document bodies.
export default function HomeRiskThumbnail({ card, locale }) {
  const [failed, setFailed] = useState(null), [loaded, setLoaded] = useState(null);
  const src = card.thumbnail?.src;
  return <div className="home-risk-thumbnail">
    <div dangerouslySetInnerHTML={{ __html: renderDocumentThumbnail(card, locale) }} />
    {src && failed !== src && <div className="risk-pdf-thumbnail" style={{ opacity: loaded === src ? 1 : 0 }}>
      <img src={src} width={card.thumbnail.width} height={card.thumbnail.height} alt=""
        loading="lazy" decoding="async" onLoad={() => setLoaded(src)} onError={() => setFailed(src)} />
      <span className="document-preview-badge">{archiveUi(locale).riskPdfPreview}</span>
    </div>}
  </div>;
}
