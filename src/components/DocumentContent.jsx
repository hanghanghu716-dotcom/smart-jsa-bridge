import React from 'react';
import { useTranslation } from 'react-i18next';
import { columnPercentages } from '../utils/documentLayout';
const TAG_META = {
  'DATA_STEP_NO': { label: '작업\n번호', color: '#6c757d', width: 2, align: 'center' },
  'DATA_STEP_TITLE': { label: '작업단계', color: '#0d6efd', width: 4, align: 'left' },
  'DATA_PHOTO': { label: '관련사진', color: '#6f42c1', width: 3, align: 'center' },
  'DATA_HAZARD': { label: '유해위험요인', color: '#dc3545', isFlex: true, align: 'left' },
  'DATA_CURRENT_MEASURE': { label: '현재 안전대책', color: '#fd7e14', isFlex: true, align: 'left' },
  'DATA_RECOMMEND_MEASURE': { label: '감소권고대책', color: '#198754', isFlex: true, align: 'left' },
  'DATA_FREQUENCY': { label: '가능성(빈도)', color: '#20c997', width: 3, align: 'center' },
  'DATA_SEVERITY': { label: '중대성(강도)', color: '#20c997', width: 3, align: 'center' },
  'DATA_RISK': { label: '위험성', color: '#e83e8c', width: 3, align: 'center' },
  'DATA_KRAS_STEP': { label: '세부 작업 내용', color: '#0d6efd', width: 4, align: 'center' },
  'DATA_KRAS_HAZARD_CLASS': { label: '위험 분류', color: '#dc3545', width: 3, align: 'center' },
  'DATA_KRAS_HAZARD_DETAIL': { label: '위험발생 상황 및 결과', color: '#dc3545', isFlex: true, align: 'left' },
  'DATA_KRAS_BASIS': { label: '관련근거(법적기준)', color: '#6c757d', width: 3, align: 'center' },
  'DATA_KRAS_CURRENT': { label: '현재의 안전보건조치', color: '#fd7e14', isFlex: true, align: 'left' },
  'DATA_KRAS_RECOMMEND': { label: '위험성 감소대책', color: '#198754', isFlex: true, align: 'left' },
  'DATA_KRAS_AFTER': { label: '개선후 위험성', color: '#17a2b8', width: 4, align: 'center' },
  'DATA_KRAS_SCHED': { label: '개선 예정일', color: '#ffc107', width: 4, align: 'center' },
  'DATA_KRAS_COMP': { label: '완료일', color: '#28a745', width: 3, align: 'center' },
  'DATA_KRAS_MANAGER': { label: '담당자', color: '#6610f2', width: 3, align: 'center' },
};

const COLUMN_GROUPS = [
  { label: '유해 위험요인 파악', children: ['DATA_KRAS_HAZARD_CLASS', 'DATA_KRAS_HAZARD_DETAIL'] },
  { label: '위험성', children: ['DATA_FREQUENCY', 'DATA_SEVERITY', 'DATA_RISK'] }
];


export default function DocumentContent({ formData = {}, participants = [], analysisData = [], layout = {}, stepPhotos = {}, onPhotoClick }) {
  const { t, i18n } = useTranslation(['export', 'common']);
  const isEnglish = i18n.language?.startsWith('en');
  const jsaType = formData.jsaType || '2-step';
  const { documentBlocks = [], savedActiveOrder = [], savedUserColumns = [], savedColumnOverrides = {}, docTitle = '', appr1 = '', appr2 = '', appr3 = '', documentNotes = '' } = layout;
  const savedSignatureRows = Math.max(Number(layout.savedSignatureRows) || 1, Math.ceil(participants.length / 8));
  const renderSignatureTable = () => {
    const commonTdStyle = { border: '1px solid #888', padding: '2px 6px 10px 6px', fontSize: isEnglish ? '9px' : '10px', textAlign: 'center', verticalAlign: 'middle', color: '#000', wordBreak: 'break-word' };
    const labelTdStyle = { ...commonTdStyle, border: '1px solid #888', backgroundColor: '#f2f2f2', fontWeight: 'bold', width: '10%', whiteSpace: isEnglish ? 'normal' : 'nowrap' };
    const sigRows = Array.from({ length: savedSignatureRows }, (_, i) => i);
    const cols = Array.from({ length: 8 }, (_, i) => i);
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #888', tableLayout: 'fixed', marginTop: '-1px', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
        <tbody>
          <tr>
            <td rowSpan={savedSignatureRows} style={labelTdStyle}>{t('signature.participants')}</td>
            {cols.map(c => {
              const pName = participants?.[c] || '';
              return (
                <td key={`sig-0-${c}`} style={{...commonTdStyle, width: '11.25%', height: '28px', textAlign: 'right', paddingRight: '4px', verticalAlign: 'middle', color: '#000'}}>
                  {pName && <span style={{float: 'left', paddingLeft: '4px', fontWeight: 'bold'}}>{pName}</span>}
                  <span style={{color: '#888'}}>{t('signature.sign')}</span>
                </td>
              );
            })}
          </tr>
          {sigRows.slice(1).map(r => (
            <tr key={`sig-row-${r}`}>
              {cols.map(c => {
                const pIdx = r * 8 + c;
                const pName = participants?.[pIdx] || '';
                return (
                  <td key={`sig-${r}-${c}`} style={{...commonTdStyle, height: '28px', textAlign: 'right', paddingRight: '4px', verticalAlign: 'middle', color: '#000'}}>
                    {pName && <span style={{float: 'left', paddingLeft: '4px', fontWeight: 'bold'}}>{pName}</span>}
                    <span style={{color: '#888'}}>{t('signature.sign')}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const getColumnMeta = (key) => {
    const custom = savedUserColumns.find(u => u.id === key);
    if (custom) return custom;
    const system = TAG_META[key];
    if (!system) return null;
    return { ...system, ...(savedColumnOverrides[key] || {}) };
  };

  const getColumnLabel = (key, meta) => {
    if (key.startsWith('USER_')) return meta?.label || key;
    if (savedColumnOverrides[key]?.label) return savedColumnOverrides[key].label;
    return t(`tags.${key}`, meta?.label || key);
  };

  const renderDesignerProjectInfo = () => {
    const td = { border: '1px solid #888', padding: '5px 7px', color: '#000', fontSize: isEnglish ? '9px' : '10px' };
    const label = { ...td, background: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' };
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: '6px' }}>
        <tbody>
          <tr>
            <td colSpan={4} style={{ ...td, fontSize: isEnglish ? '16px' : '18px', fontWeight: 'bold', textAlign: 'center' }}>{docTitle}</td>
          </tr>
          <tr>
            <td style={label}>{t('header.projectName')}</td><td style={td}>{formData?.projectName || ''}</td>
            <td style={label}>{t('header.workDate')}</td><td style={td}>{formData?.workDate || ''}</td>
          </tr>
          <tr>
            <td style={label}>{t('header.workLocation')}</td><td style={td}>{formData?.workLocation || ''}</td>
            <td style={label}>{t('header.department')}</td><td style={td}>{formData?.department || ''}</td>
          </tr>
        </tbody>
      </table>
    );
  };

  const translatePpe = value => ({
    '안전모': t('ppe.helmet'),
    '안전화': t('ppe.shoes'),
    '보안경': t('ppe.glasses'),
    '장갑': t('ppe.gloves'),
    '방진마스크': t('ppe.mask')
  }[value] || value);

  const translatePermit = value => ({
    '화기': t('permit.hotWork'),
    '밀폐': t('permit.confinedSpace'),
    '정전': t('permit.electrical'),
    '고소': t('permit.highElevation'),
    '중량물': t('permit.heavyLifting'),
    '굴착': t('permit.excavation')
  }[value] || value);

  const renderDesignerSafety = () => {
    const td = { border: '1px solid #888', padding: '5px 7px', height: '32px', color: '#000', fontSize: isEnglish ? '9px' : '10px' };
    const label = { ...td, background: '#f2f2f2', fontWeight: 'bold', width: '15%' };
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: '6px' }}>
        <tbody>
          <tr>
            <td style={label}>{t('header.ppe')}</td>
            <td style={td}>{(formData?.ppe || []).map(translatePpe).join(' · ')}</td>
          </tr>
          <tr>
            <td style={label}>{t('header.highRiskWork')}</td>
            <td style={td}>{(formData?.permits || []).map(translatePermit).join(' · ')}</td>
          </tr>
        </tbody>
      </table>
    );
  };

  const renderDesignerApproval = () => {
    const td = { border: '1px solid #888', padding: '5px', color: '#000', fontSize: isEnglish ? '9px' : '10px', textAlign: 'center' };
    return (
      <table style={{ width: '360px', maxWidth: '100%', marginLeft: 'auto', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: '6px' }}>
        <colgroup><col style={{ width: '42px' }} /><col /><col /><col /></colgroup>
        <tbody>
          <tr>
            <td rowSpan={2} style={{ ...td, background: '#f2f2f2', fontWeight: 'bold', verticalAlign: 'middle' }}>{t('header.approval')}</td>
            <td style={td}>{appr1}</td><td style={td}>{appr2}</td><td style={td}>{appr3}</td>
          </tr>
          <tr>
            <td style={{ ...td, height: '42px' }}></td><td style={td}></td><td style={td}></td>
          </tr>
        </tbody>
      </table>
    );
  };

  const renderDesignerNotes = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: '6px' }}>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #888', background: '#f2f2f2', fontWeight: 'bold', color: '#000', width: '15%', padding: '6px', fontSize: '10px' }}>
            {t('common:designer.blocks.NOTES', 'Notes')}
          </td>
          <td style={{ border: '1px solid #888', color: '#000', padding: '7px', whiteSpace: 'pre-wrap', fontSize: '10px', minHeight: '42px' }}>
            {documentNotes || '—'}
          </td>
        </tr>
      </tbody>
    </table>
  );

  const renderDataTable = () => {
      const isEuroLang = ['en', 'fr', 'de'].some(lang => i18n.language?.startsWith(lang));

      const commonTdStyle = {
        border: '1px solid #888',
        padding: '4px 4px 12px 4px',
        // 👇 [수정] 유럽권 언어일 경우 폰트 크기를 9px로 일괄 축소하여 공간 확보
        fontSize: isEuroLang ? '9px' : '10.5px',
        verticalAlign: 'middle',
        lineHeight: '1.2',
        wordBreak: 'keep-all',
        overflowWrap: 'anywhere',
        // 👇 [기능 추가] 긴 단어 자동 하이픈 처리 (브라우저 지원 시)
        hyphens: 'auto'
      };
    if (!savedActiveOrder || savedActiveOrder.length === 0) return null;
    const currentItems = savedActiveOrder.filter(key => getColumnMeta(key));
    const widths = columnPercentages(currentItems.map(getColumnMeta));
    let groups = []; let currentGroup = null;
    currentItems.forEach(key => {
      const groupDef = COLUMN_GROUPS.find(g => g.children.includes(key));
      if (groupDef) {
        if (currentGroup && currentGroup.label === groupDef.label) { currentGroup.keys.push(key); }
        else { if (currentGroup) groups.push(currentGroup); currentGroup = { label: groupDef.label, keys: [key], isGroup: true }; }
      } else { if (currentGroup) { groups.push(currentGroup); currentGroup = null; } groups.push({ label: null, keys: [key], isGroup: false }); }
    });
    if (currentGroup) groups.push(currentGroup);
    const hasGroups = groups.some(g => g.isGroup);
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', tableLayout: 'fixed' }}>
        <colgroup>{currentItems.map(key => {
            const pct = widths[currentItems.indexOf(key)];
            return <col key={key} style={{ width: `${pct}%` }} />;
          })}</colgroup>
        <thead>
          <tr>{groups.map((group, idx) => {
              if (group.isGroup) {
                const groupLabel = group.label === '유해 위험요인 파악' ? t('groups.hazard') : t('groups.risk');
                return ( <th key={`th-group-${idx}`} colSpan={group.keys.length} style={{ ...commonTdStyle, backgroundColor: '#f0f0f0', textAlign: 'center', fontWeight: 'bold' }}>{groupLabel}</th> );
              }
              else {
                const key = group.keys[0]; const meta = getColumnMeta(key);
                let label = getColumnLabel(key, meta);
                if (!savedColumnOverrides[key]?.label && key === 'DATA_FREQUENCY') label = t('preview.freqBreak');
                if (!savedColumnOverrides[key]?.label && key === 'DATA_SEVERITY') label = t('preview.sevBreak');
                if (!savedColumnOverrides[key]?.label && key === 'DATA_KRAS_AFTER') label = t('preview.afterBreak');
                if (!savedColumnOverrides[key]?.label && key === 'DATA_KRAS_SCHED') label = t('preview.schedBreak');
                return ( <th key={`th-${key}`} rowSpan={hasGroups ? 2 : 1} style={{ ...commonTdStyle, backgroundColor: '#f0f0f0', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{label}</th> );
              }
            })}</tr>
          {hasGroups && (
            <tr>
              {groups.filter(g => g.isGroup).flatMap(group =>
                group.keys.map(key => {
                  const meta = getColumnMeta(key);
                  let label = getColumnLabel(key, meta);
                  if (!savedColumnOverrides[key]?.label && key === 'DATA_FREQUENCY') label = t('preview.freqBreak');
                  if (!savedColumnOverrides[key]?.label && key === 'DATA_SEVERITY') label = t('preview.sevBreak');
                  if (!savedColumnOverrides[key]?.label && key === 'DATA_KRAS_AFTER') label = t('preview.afterBreak');
                  if (!savedColumnOverrides[key]?.label && key === 'DATA_KRAS_SCHED') label = t('preview.schedBreak');
                return (
                    <th key={`th-sub-${key}`} style={{
                      ...commonTdStyle,
                      backgroundColor: '#f9f9f9',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'keep-all',
                      fontSize: isEuroLang ? '8px' : '10.5px'                    }}>
                      {label}
                    </th>
                  );
                })
              )}
            </tr>
          )}
        </thead>
        <tbody>
        <tr style={{ height: 0, visibility: 'hidden', border: 'none' }}>
            {currentItems.map(key => {
              const pct = widths[currentItems.indexOf(key)];
              return <td key={`ghost-${key}`} style={{ width: `${pct}%`, height: 0, padding: 0, margin: 0, border: 'none' }}></td>;
            })}
          </tr>

          {analysisData.map((stepData, stepIdx) => (
            <tr key={`tr-${stepIdx}`}>
              {currentItems.map((key) => {
                const meta = getColumnMeta(key); let content = "";
                if (key === 'DATA_STEP_NO') content = String(stepIdx + 1);
                else if (key === 'DATA_STEP_TITLE' || key === 'DATA_KRAS_STEP') content = stepData.proc?.stepTitle || "";
                else if (key === 'DATA_HAZARD' || key === 'DATA_KRAS_HAZARD_DETAIL') content = (stepData.risks || []).map(r => `• ${r.factor}`).join('\n');
                else if (key === 'DATA_CURRENT_MEASURE' || key === 'DATA_KRAS_CURRENT') content = (stepData.risks || []).map(r => `• ${jsaType === '2-step' ? r.measure : r.current_measure}`).join('\n');
                else if (key === 'DATA_RECOMMEND_MEASURE' || key === 'DATA_KRAS_RECOMMEND') content = (stepData.risks || []).map(r => `• ${jsaType === '2-step' ? r.measure : r.recommend_measure}`).join('\n');
                else if (key === 'DATA_SEVERITY' || key === 'DATA_KRAS_SEV') content = String(stepData.severity || "-");
                else if (key === 'DATA_FREQUENCY' || key === 'DATA_KRAS_FREQ') content = String(stepData.frequency || "-");
                else if (key === 'DATA_RISK' || key === 'DATA_KRAS_RISK') content = String(stepData.riskLevel || "-");
                else if (key === 'DATA_KRAS_HAZARD_CLASS') content = stepData.risks?.[0]?.category || "";
                else if (key.startsWith('USER_')) {
                  const raw = stepData.customFields?.[key];
                  if (raw !== undefined && raw !== null) content = typeof raw === 'boolean' ? (raw ? '☑' : '☐') : String(raw);
                  else if (meta.fieldType === 'checkbox') content = '☐';
                  else content = '';
                }
                if (key === 'DATA_PHOTO') { return ( <td key={`td-${key}-${stepIdx}`} onClick={() => onPhotoClick?.(stepIdx)} style={{ border: '1px solid #000', padding: '0', textAlign: 'center', verticalAlign: 'middle', cursor: onPhotoClick ? 'pointer' : 'default', overflow: 'hidden' }}> {stepPhotos[stepIdx] ? <img src={stepPhotos[stepIdx]} style={{width:'100%', height:'100%', objectFit:'contain', display: 'block'}} alt="Photo" /> : <span style={{color:'#ccc', fontSize:'10px'}}>+ {t('table.addPhoto')}</span>} </td> ); }
                return ( <td key={`td-${key}-${stepIdx}`} style={{ ...commonTdStyle, textAlign: meta.align || 'center', whiteSpace: 'pre-wrap' }}>{content}</td> );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderBlock = id => {
    if (id === 'PROJECT_INFO') return renderDesignerProjectInfo();
    if (id === 'SAFETY') return renderDesignerSafety();
    if (id === 'JSA_TABLE') return renderDataTable();
    if (id === 'PARTICIPANTS') return renderSignatureTable();
    if (id === 'APPROVAL') return renderDesignerApproval();
    if (id === 'NOTES') return renderDesignerNotes();
    return null;
  };
  return <div className="document-content" style={{ color: '#111', background: '#fff' }}>
    {documentBlocks.filter(block => block.enabled).map(block => <div key={block.id} data-document-block={block.id}>{renderBlock(block.id)}</div>)}
  </div>;
}
