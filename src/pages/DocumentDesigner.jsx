import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageNavigate } from '../hooks/useLanguage';
import SEO from '../components/SEO';
import DraftSaveStatus from '../components/DraftSaveStatus';
import useJsaDraftAutosave from '../hooks/useJsaDraftAutosave';
import useJsaDraftRecovery from '../hooks/useJsaDraftRecovery';

const DEFAULT_BLOCKS = [
  { id: 'PROJECT_INFO', enabled: true },
  { id: 'SAFETY', enabled: true },
  { id: 'JSA_TABLE', enabled: true },
  { id: 'PARTICIPANTS', enabled: true },
  { id: 'APPROVAL', enabled: true }
];

const COLUMN_META = {
  DATA_STEP_NO: { fallback: 'No.', width: 2 },
  DATA_STEP_TITLE: { fallback: 'Work Step', width: 4 },
  DATA_PHOTO: { fallback: 'Photo', width: 3 },
  DATA_HAZARD: { fallback: 'Hazard', flex: true },
  DATA_CURRENT_MEASURE: { fallback: 'Current Control', flex: true },
  DATA_RECOMMEND_MEASURE: { fallback: 'Recommended Control', flex: true },
  DATA_FREQUENCY: { fallback: 'Frequency', width: 3 },
  DATA_SEVERITY: { fallback: 'Severity', width: 3 },
  DATA_RISK: { fallback: 'Risk', width: 3 }
};

const DEFAULT_COLUMNS = [
  'DATA_STEP_NO',
  'DATA_STEP_TITLE',
  'DATA_HAZARD',
  'DATA_RECOMMEND_MEASURE',
  'DATA_FREQUENCY',
  'DATA_SEVERITY',
  'DATA_RISK'
];

const moveItem = (items, from, to) => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

export default function DocumentDesigner() {
  const navigate = useLanguageNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');

  const { draft: recoveredDraft } = useJsaDraftRecovery(!location.state?.formData);
  const state = location.state || {};
  const recoveredLayout = recoveredDraft?.layout_data || {};

  const analysisData = state.analysisData || recoveredDraft?.analysis_data || [];
  const procedures = state.procedures || recoveredDraft?.procedures || [];
  const formData = state.formData || recoveredDraft?.form_data || {};
  const participants = state.participants || recoveredDraft?.participants || [];

  const [blocks, setBlocks] = useState(
    state.documentBlocks || recoveredLayout.documentBlocks || DEFAULT_BLOCKS
  );
  const [activeOrder, setActiveOrder] = useState(
    state.savedActiveOrder || recoveredLayout.savedActiveOrder || DEFAULT_COLUMNS
  );
  const [userColumns, setUserColumns] = useState(
    state.savedUserColumns || recoveredLayout.savedUserColumns || []
  );
  const [orientation, setOrientation] = useState(
    state.savedOrientation || recoveredLayout.savedOrientation || 'landscape'
  );
  const [signatureRows, setSignatureRows] = useState(
    state.savedSignatureRows || recoveredLayout.savedSignatureRows || 1
  );
  const [docTitle, setDocTitle] = useState(
    state.docTitle || recoveredLayout.docTitle || t('designer.defaultTitle')
  );
  const [appr1, setAppr1] = useState(state.appr1 || recoveredLayout.appr1 || t('designer.appr1'));
  const [appr2, setAppr2] = useState(state.appr2 || recoveredLayout.appr2 || t('designer.appr2'));
  const [appr3, setAppr3] = useState(state.appr3 || recoveredLayout.appr3 || t('designer.appr3'));
  const [selectedBlock, setSelectedBlock] = useState('JSA_TABLE');
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);

  const draftSave = useJsaDraftAutosave({
    enabled: Boolean(state.formData || recoveredDraft),
    stage: 'table',
    formData,
    participants,
    procedures,
    analysisData,
    layoutData: {
      documentBlocks: blocks,
      savedActiveOrder: activeOrder,
      savedUserColumns: userColumns,
      savedOrientation: orientation,
      savedSignatureRows: signatureRows,
      docTitle,
      appr1,
      appr2,
      appr3
    },
    sourceProjectId: state.parentId || recoveredDraft?.source_project_id || state.existingId || null
  });

  const visibleColumns = useMemo(
    () => activeOrder.filter(key => COLUMN_META[key] || userColumns.some(col => col.id === key)),
    [activeOrder, userColumns]
  );

  const toggleBlock = id => {
    setBlocks(prev => prev.map(block => block.id === id ? { ...block, enabled: !block.enabled } : block));
  };

  const toggleColumn = key => {
    setActiveOrder(prev => prev.includes(key)
      ? prev.filter(item => item !== key)
      : [...prev, key]);
  };

  const addCustomColumn = () => {
    const id = 'USER_' + Date.now();
    const next = { id, label: t('designer.newColumn'), width: 5, isFlex: false };
    setUserColumns(prev => [...prev, next]);
    setActiveOrder(prev => [...prev, id]);
  };

  const updateCustomColumn = (id, patch) => {
    setUserColumns(prev => prev.map(col => col.id === id ? { ...col, ...patch } : col));
  };

  const removeCustomColumn = id => {
    setUserColumns(prev => prev.filter(col => col.id !== id));
    setActiveOrder(prev => prev.filter(key => key !== id));
  };

  const goToExport = () => {
    navigate('/export', {
      state: {
        ...state,
        formData,
        participants,
        procedures,
        analysisData,
        documentBlocks: blocks,
        savedActiveOrder: activeOrder,
        savedUserColumns: userColumns,
        savedOrientation: orientation,
        savedSignatureRows: signatureRows,
        docTitle,
        appr1,
        appr2,
        appr3
      }
    });
  };

  const getBlockLabel = id => t('designer.blocks.' + id);

  const renderSettings = () => {
    if (selectedBlock === 'JSA_TABLE') {
      return (
        <>
          <h3 style={styles.sideTitle}>{t('designer.tableSettings')}</h3>
          <div style={styles.columnToggleGrid}>
            {Object.keys(COLUMN_META).map(key => (
              <button
                type="button"
                key={key}
                style={activeOrder.includes(key) ? styles.toggleActive : styles.toggle}
                onClick={() => toggleColumn(key)}
              >
                {t('designer.columns.' + key, COLUMN_META[key].fallback)}
              </button>
            ))}
          </div>
          <button type="button" style={styles.addBtn} onClick={addCustomColumn}>
            + {t('designer.addColumn')}
          </button>
          <div style={styles.columnOrder}>
            {visibleColumns.map((key, index) => {
              const custom = userColumns.find(col => col.id === key);
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => setDraggedColumn(index)}
                  onDragOver={event => {
                    event.preventDefault();
                    if (draggedColumn === null || draggedColumn === index) return;
                    setActiveOrder(prev => moveItem(prev, draggedColumn, index));
                    setDraggedColumn(index);
                  }}
                  onDragEnd={() => setDraggedColumn(null)}
                  style={styles.columnRow}
                >
                  <span style={styles.drag}>☰</span>
                  {custom ? (
                    <>
                      <input
                        value={custom.label}
                        onChange={e => updateCustomColumn(custom.id, { label: e.target.value })}
                        style={styles.inlineInput}
                      />
                      <input
                        type="number"
                        min="2"
                        max="20"
                        value={custom.width}
                        onChange={e => updateCustomColumn(custom.id, { width: Number(e.target.value) || 5 })}
                        style={styles.widthInput}
                      />
                      <button type="button" style={styles.removeBtn} onClick={() => removeCustomColumn(custom.id)}>×</button>
                    </>
                  ) : (
                    <span style={styles.columnLabel}>
                      {t('designer.columns.' + key, COLUMN_META[key]?.fallback || key)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      );
    }

    if (selectedBlock === 'PARTICIPANTS') {
      return (
        <>
          <h3 style={styles.sideTitle}>{t('designer.participantSettings')}</h3>
          <div style={styles.counter}>
            <button type="button" onClick={() => setSignatureRows(Math.max(1, signatureRows - 1))}>−</button>
            <strong>{signatureRows}</strong>
            <button type="button" onClick={() => setSignatureRows(signatureRows + 1)}>+</button>
          </div>
        </>
      );
    }

    if (selectedBlock === 'APPROVAL') {
      return (
        <>
          <h3 style={styles.sideTitle}>{t('designer.approvalSettings')}</h3>
          {[appr1, appr2, appr3].map((value, idx) => (
            <input
              key={idx}
              value={value}
              onChange={e => [setAppr1, setAppr2, setAppr3][idx](e.target.value)}
              style={styles.input}
            />
          ))}
        </>
      );
    }

    return (
      <>
        <h3 style={styles.sideTitle}>{t('designer.documentSettings')}</h3>
        <label style={styles.label}>{t('designer.documentTitle')}</label>
        <input value={docTitle} onChange={e => setDocTitle(e.target.value)} style={styles.input} />
        <label style={styles.label}>{t('designer.orientation')}</label>
        <div style={styles.orientationGroup}>
          <button
            type="button"
            style={orientation === 'landscape' ? styles.toggleActive : styles.toggle}
            onClick={() => setOrientation('landscape')}
          >{t('designer.landscape')}</button>
          <button
            type="button"
            style={orientation === 'portrait' ? styles.toggleActive : styles.toggle}
            onClick={() => setOrientation('portrait')}
          >{t('designer.portrait')}</button>
        </div>
      </>
    );
  };

  return (
    <div style={styles.wrapper}>
      <SEO />
      <DraftSaveStatus status={draftSave.status} />
      <header style={styles.header}>
        <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
      </header>

      <main style={styles.main}>
        <section style={styles.topbar}>
          <div>
            <div style={styles.eyebrow}>{t('designer.eyebrow')}</div>
            <h2 style={styles.title}>{t('designer.title')}</h2>
            <p style={styles.subtitle}>{t('designer.subtitle')}</p>
          </div>
          <div style={styles.topActions}>
            <button type="button" style={styles.secondaryBtn} onClick={() => navigate('/analysis', { state })}>
              {t('designer.back')}
            </button>
            <button type="button" style={styles.primaryBtn} onClick={goToExport}>
              {t('designer.next')}
            </button>
          </div>
        </section>

        <div style={styles.workspace}>
          <aside style={styles.leftPanel}>
            <h3 style={styles.sideTitle}>{t('designer.blocksTitle')}</h3>
            <p style={styles.sideHint}>{t('designer.blocksHint')}</p>
            {blocks.map(block => (
              <button
                type="button"
                key={block.id}
                style={selectedBlock === block.id ? styles.blockSelectorActive : styles.blockSelector}
                onClick={() => setSelectedBlock(block.id)}
              >
                <span>{getBlockLabel(block.id)}</span>
                <input
                  type="checkbox"
                  checked={block.enabled}
                  onChange={() => toggleBlock(block.id)}
                  onClick={event => event.stopPropagation()}
                />
              </button>
            ))}
          </aside>

          <section style={styles.canvasPanel}>
            <div style={styles.canvasToolbar}>
              <span>{orientation === 'landscape' ? 'A4 ↔' : 'A4 ↕'}</span>
              <strong>{docTitle}</strong>
            </div>
            <div style={{ ...styles.paper, maxWidth: orientation === 'landscape' ? '920px' : '650px' }}>
              {blocks.map((block, index) => (
                <article
                  key={block.id}
                  draggable
                  onDragStart={() => setDraggedBlock(index)}
                  onDragOver={event => {
                    event.preventDefault();
                    if (draggedBlock === null || draggedBlock === index) return;
                    setBlocks(prev => moveItem(prev, draggedBlock, index));
                    setDraggedBlock(index);
                  }}
                  onDragEnd={() => setDraggedBlock(null)}
                  onClick={() => setSelectedBlock(block.id)}
                  style={{
                    ...styles.previewBlock,
                    ...(selectedBlock === block.id ? styles.previewBlockSelected : {}),
                    ...(block.enabled ? {} : styles.previewBlockDisabled)
                  }}
                >
                  <div style={styles.previewBlockHeader}>
                    <span style={styles.drag}>☰</span>
                    <strong>{getBlockLabel(block.id)}</strong>
                    <span style={block.enabled ? styles.enabledBadge : styles.disabledBadge}>
                      {block.enabled ? t('designer.enabled') : t('designer.disabled')}
                    </span>
                  </div>

                  {block.id === 'PROJECT_INFO' && (
                    <div style={styles.mockGrid}>
                      <span>{formData.projectName || t('designer.projectFallback')}</span>
                      <span>{formData.workLocation || '—'}</span>
                      <span>{formData.department || '—'}</span>
                    </div>
                  )}
                  {block.id === 'SAFETY' && (
                    <div style={styles.mockText}>
                      {(formData.ppe || []).join(' · ') || t('designer.noPpe')}
                    </div>
                  )}
                  {block.id === 'JSA_TABLE' && (
                    <div style={styles.columnPreview}>
                      {visibleColumns.map(key => {
                        const custom = userColumns.find(col => col.id === key);
                        return <span key={key}>{custom?.label || t('designer.columns.' + key, COLUMN_META[key]?.fallback || key)}</span>;
                      })}
                    </div>
                  )}
                  {block.id === 'PARTICIPANTS' && (
                    <div style={styles.mockText}>{t('designer.signatureRows', { count: signatureRows })}</div>
                  )}
                  {block.id === 'APPROVAL' && (
                    <div style={styles.approvalPreview}><span>{appr1}</span><span>{appr2}</span><span>{appr3}</span></div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <aside style={styles.rightPanel}>
            {renderSettings()}
          </aside>
        </div>
      </main>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', background: '#070707', color: '#fff' },
  header: { height: '62px', display: 'flex', alignItems: 'center', padding: '0 32px', borderBottom: '1px solid #1d1d1d' },
  logo: { margin: 0, fontSize: '1rem', fontWeight: 900, letterSpacing: '1.5px', cursor: 'pointer' },
  main: { padding: '20px 24px 28px' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '18px', marginBottom: '18px' },
  eyebrow: { color: '#007bff', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '1.4px' },
  title: { margin: '5px 0', fontSize: '1.45rem' },
  subtitle: { margin: 0, color: '#707070', fontSize: '0.76rem' },
  topActions: { display: 'flex', gap: '8px' },
  primaryBtn: { background: '#007bff', color: '#fff', border: 0, borderRadius: '7px', padding: '10px 16px', fontWeight: 900, cursor: 'pointer' },
  secondaryBtn: { background: '#151515', color: '#aaa', border: '1px solid #303030', borderRadius: '7px', padding: '10px 14px', cursor: 'pointer' },
  workspace: { display: 'grid', gridTemplateColumns: '220px minmax(0,1fr) 290px', gap: '14px', height: 'calc(100vh - 156px)', minHeight: '590px' },
  leftPanel: { border: '1px solid #222', background: '#0d0d0d', borderRadius: '10px', padding: '12px', overflowY: 'auto' },
  rightPanel: { border: '1px solid #222', background: '#0d0d0d', borderRadius: '10px', padding: '14px', overflowY: 'auto' },
  canvasPanel: { border: '1px solid #222', background: '#0b0b0b', borderRadius: '10px', padding: '12px', overflow: 'auto' },
  sideTitle: { margin: '0 0 10px', fontSize: '0.82rem' },
  sideHint: { color: '#555', fontSize: '0.65rem', lineHeight: 1.45, marginBottom: '12px' },
  blockSelector: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px', marginBottom: '6px', borderRadius: '7px', border: '1px solid #252525', background: '#121212', color: '#777', cursor: 'pointer', textAlign: 'left' },
  blockSelectorActive: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px', marginBottom: '6px', borderRadius: '7px', border: '1px solid #007bff', background: 'rgba(0,123,255,.08)', color: '#fff', cursor: 'pointer', textAlign: 'left' },
  canvasToolbar: { display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.66rem', marginBottom: '10px' },
  paper: { margin: '0 auto', background: '#e9ecef', color: '#111', minHeight: '100%', borderRadius: '3px', padding: '18px' },
  previewBlock: { background: '#fff', border: '1px solid #cfd4da', borderRadius: '7px', marginBottom: '9px', padding: '10px', cursor: 'grab' },
  previewBlockSelected: { outline: '2px solid #007bff', outlineOffset: '1px' },
  previewBlockDisabled: { opacity: 0.36 },
  previewBlockHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', marginBottom: '9px' },
  drag: { color: '#777' },
  enabledBadge: { marginLeft: 'auto', color: '#198754', fontSize: '0.56rem', fontWeight: 900 },
  disabledBadge: { marginLeft: 'auto', color: '#888', fontSize: '0.56rem', fontWeight: 900 },
  mockGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '4px', fontSize: '0.62rem' },
  mockText: { fontSize: '0.62rem', color: '#555' },
  columnPreview: { display: 'flex', flexWrap: 'wrap', gap: '3px' },
  approvalPreview: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px', fontSize: '0.62rem', textAlign: 'center' },
  columnPreviewSpan: { padding: '3px 5px', background: '#f1f3f5' },
  label: { display: 'block', margin: '10px 0 5px', color: '#777', fontSize: '0.65rem' },
  input: { width: '100%', boxSizing: 'border-box', background: '#121212', color: '#fff', border: '1px solid #303030', borderRadius: '6px', padding: '8px', marginBottom: '7px' },
  orientationGroup: { display: 'flex', gap: '6px' },
  toggle: { padding: '6px 8px', borderRadius: '5px', border: '1px solid #303030', background: '#151515', color: '#777', cursor: 'pointer', fontSize: '0.62rem' },
  toggleActive: { padding: '6px 8px', borderRadius: '5px', border: '1px solid #007bff', background: 'rgba(0,123,255,.12)', color: '#64adff', cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800 },
  columnToggleGrid: { display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' },
  addBtn: { width: '100%', padding: '8px', background: '#151515', color: '#aaa', border: '1px dashed #3a3a3a', borderRadius: '6px', cursor: 'pointer', marginBottom: '10px' },
  columnOrder: { display: 'flex', flexDirection: 'column', gap: '5px' },
  columnRow: { minHeight: '34px', display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 7px', background: '#131313', border: '1px solid #262626', borderRadius: '5px' },
  columnLabel: { fontSize: '0.68rem', color: '#aaa' },
  inlineInput: { flex: 1, minWidth: 0, background: '#0b0b0b', color: '#ddd', border: '1px solid #292929', borderRadius: '4px', padding: '5px' },
  widthInput: { width: '46px', background: '#0b0b0b', color: '#ddd', border: '1px solid #292929', borderRadius: '4px', padding: '5px' },
  removeBtn: { background: 'transparent', color: '#ff7675', border: 0, cursor: 'pointer' },
  counter: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '20px' }
};
