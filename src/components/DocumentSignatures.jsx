import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DocumentSignatures({ participants = [], rows = 1, orientation = 'landscape', documentLocale }) {
  const { t: screenT, i18n } = useTranslation('export');
  const t = documentLocale ? i18n.getFixedT(documentLocale, 'export') : screenT;
  const columns = orientation === 'portrait' ? 4 : 8;
  const rowCount = Math.max(1, Number(rows) || 1, Math.ceil(participants.length / columns));
  const cell = { border: '1px solid #888', padding: '5px', fontSize: '10px', lineHeight: 1.35, verticalAlign: 'middle', color: '#000', overflowWrap: 'anywhere', whiteSpace: 'normal' };
  return <table data-signature-table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginTop: '-1px', marginBottom: '12px' }}>
    <colgroup><col style={{ width: '12%' }} />{Array.from({ length: columns }, (_, i) => <col key={i} style={{ width: `${88 / columns}%` }} />)}</colgroup>
    <tbody>{Array.from({ length: rowCount }, (_, row) => <tr key={row}>
      {row === 0 && <td rowSpan={rowCount} style={{ ...cell, fontSize: '9px', background: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>{t('signature.participants')}</td>}
      {Array.from({ length: columns }, (_, column) => <td key={column} data-signature-cell style={cell}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', minHeight: '26px' }}>
          <span dir="auto" style={{ flex: '1 1 0', minWidth: 0, fontWeight: 'bold' }}>{participants[row * columns + column] || ''}</span>
          <span data-signature-label style={{ flex: '0 1 auto', maxWidth: '55%', fontSize: '9px', color: '#777' }}>{t('signature.sign')}</span>
        </div>
      </td>)}
    </tr>)}</tbody>
  </table>;
}
