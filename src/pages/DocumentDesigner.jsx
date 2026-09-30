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
  { id: 'APPROVAL', enabled: true },
  { id: 'NOTES', enabled: false }
];

const SYSTEM_COLUMNS = {
  DATA_STEP_NO: { fallback: 'No.', width: 2, align: 'center' },
  DATA_STEP_TITLE: { fallback: 'Work Step', width: 4, align: 'left' },
  DATA_PHOTO: { fallback: 'Photo', width: 3, align: 'center' },
  DATA_HAZARD: { fallback: 'Hazard', width: 10, isFlex: true, align: 'left' },
  DATA_CURRENT_MEASURE: { fallback: 'Current Control', width: 10, isFlex: true, align: 'left' },
  DATA_RECOMMEND_MEASURE: { fallback: 'Recommended Control', width: 10, isFlex: true, align: 'left' },
  DATA_FREQUENCY: { fallback: 'Frequency', width: 3, align: 'center' },
  DATA_SEVERITY: { fallback: 'Severity', width: 3, align: 'center' },
  DATA_RISK: { fallback: 'Risk', width: 3, align: 'center' },
  DATA_KRAS_STEP: { fallback: 'Detailed Work', width: 4, align: 'center' },
  DATA_KRAS_HAZARD_CLASS: { fallback: 'Hazard Class', width: 3, align: 'center' },
  DATA_KRAS_HAZARD_DETAIL: { fallback: 'Hazard Situation & Result', width: 10, isFlex: true, align: 'left' },
  DATA_KRAS_BASIS: { fallback: 'Basis', width: 3, align: 'center' },
  DATA_KRAS_CURRENT: { fallback: 'Current H&S Measure', width: 10, isFlex: true, align: 'left' },
  DATA_KRAS_RECOMMEND: { fallback: 'Risk Reduction Measure', width: 10, isFlex: true, align: 'left' },
  DATA_KRAS_AFTER: { fallback: 'Residual Risk', width: 4, align: 'center' },
  DATA_KRAS_SCHED: { fallback: 'Due Date', width: 4, align: 'center' },
  DATA_KRAS_COMP: { fallback: 'Completed', width: 3, align: 'center' },
  DATA_KRAS_MANAGER: { fallback: 'Owner', width: 3, align: 'center' }
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

const FIELD_TYPES = ['text', 'number', 'date', 'checkbox', 'dropdown'];

const moveItem = (items, from, to) => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

export default function DocumentDesigner() {
  const navigate = useLanguageNavigate();
  const location = useLocation();
  const { t } = useTranslation(['common', 'tablebuilder']);

  const { draft: recoveredDraft } = useJsaDraftRecovery(!location.state?.formData);
  const state = location.state || {};
  const recoveredLayout = recoveredDraft?.layout_data || {};

  const existingId = state.existingId ?? recoveredDraft?.source_project_id ?? null;
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
  const [columnOverrides, setColumnOverrides] = useState(
    state.savedColumnOverrides || recoveredLayout.savedColumnOverrides || {}
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
  const [notesText, setNotesText] = useState(
    state.documentNotes ?? recoveredLayout.documentNotes ?? formData.additionalItems ?? ''
  );
  const [selectedBlock, setSelectedBlock] = useState('JSA_TABLE');
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);

  const layoutData = {
    documentBlocks: blocks,
    savedActiveOrder: activeOrder,
    savedUserColumns: userColumns,
    savedColumnOverrides: columnOverrides,
    savedOrientation: orientation,
    savedSignatureRows: signatureRows,
    docTitle,
    appr1,
    appr2,
    appr3,
    documentNotes: notesText
  };

  const draftSave = useJsaDraftAutosave({
    enabled: Boolean(state.formData || recoveredDraft),
    stage: 'table',
    formData,
    participants,
    procedures,
    analysisData,
    layoutData,
    sourceProjectId: state.parentId || recoveredDraft?.source_project_id || existingId || null
  });

  const visibleColumns = useMemo(
    () => activeOrder.filter(key => SYSTEM_COLUMNS[key] || userColumns.some(col => col.id === key)),
    [activeOrder, userColumns]
  );

  const getSystemLabel = key =>
    columnOverrides[key]?.label
    || t('tablebuilder:tags.' + key, SYSTEM_COLUMNS[key]?.fallback || key);

  const getColumnMeta = key => {
    const custom = userColumns.find(col => col.id === key);
    if (custom) return custom;
    return { ...SYSTEM_COLUMNS[key], ...(columnOverrides[key] || {}) };
  };

  const toggleBlock = id => {
    setBlocks(prev => prev.map(block => block.id === id ? { ...block, enabled: !block.enabled } : block));
  };

  const toggleColumn = key => {
    setActiveOrder(prev => prev.includes(key)
      ? prev.filter(item => item !== key)
      : [...prev, key]);
  };

  const updateSystemColumn = (key, patch) => {
    setColumnOverrides(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...patch }
    }));
  };

  const resetSystemColumn = key => {
    setColumnOverrides(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addCustomColumn = () => {
    const id = 'USER_' + Date.now();
    const next = {
      id,
      label: t('designer.newColumn'),
      width: 5,
      isFlex: false,
      fieldType: 'text',
      options: []
    };
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

  const moveColumn = (from, to) => {
    setActiveOrder(prev => {
      const visible = prev.filter(key => SYSTEM_COLUMNS[key] || userColumns.some(col => col.id === key));
      const hidden = prev.filter(key => !visible.includes(key));
      return [...moveItem(visible, from, to), ...hidden];
    });
  };

  const goToExport = () => {
    navigate('/export', {
      state: {
        ...state,
        existingId,
        formData,
        participants,
        procedures,
        analysisData,
        ...layoutData
      }
    });
  };

  const goBack = () => navigate('/analysis', {
    state: {
      ...state,
      existingId,
      formData,
      participants,
      procedures,
      analysisData
    }
  });

  const renderGlobalSettings = () => (
    <div style={styles.globalSettings}>
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
    </div>
  );

  const renderTableSettings = () => (
    <>
      <h3 style={styles.sideTitle}>{t('designer.tableSettings')}</h3>
      <div style={styles.columnToggleGrid}>
        {Object.keys(SYSTEM_COLUMNS).map(key => (
          <button
            type="button"
            key={key}
            style={activeOrder.includes(key) ? styles.toggleActive : styles.toggle}
            onClick={() => toggleColumn(key)}
          >
            {getSystemLabel(key)}
          </button>
        ))}
      </div>

      <button type="button" style={styles.addBtn} onClick={addCustomColumn}>
        + {t('designer.addColumn')}
      </button>

      <div style={styles.columnOrder}>
        {visibleColumns.map((key, index) => {
          const custom = userColumns.find(col => col.id === key);
          const meta = getColumnMeta(key);
          return (
            <div
              key={key}
              draggable
              onDragStart={() => setDraggedColumn(index)}
              onDragOver={event => {
                event.preventDefault();
                if (draggedColumn === null || draggedColumn === index) return;
                moveColumn(draggedColumn, index);
                setDraggedColumn(index);
              }}
              onDragEnd={() => setDraggedColumn(null)}
              style={styles.columnEditor}
            >
              <div style={styles.columnEditorTop}>
                <span style={styles.drag}>☰</span>
                <span style={styles.columnKey}>{custom ? t('designer.customColumn') : t('designer.systemColumn')}</span>
                {!custom && Object.keys(columnOverrides[key] || {}).length > 0 && (
                  <button type="button" style={styles.resetBtn} onClick={() => resetSystemColumn(key)}>
                    {t('designer.reset')}
                  </button>
                )}
                {custom && (
                  <button type="button" style={styles.removeBtn} onClick={() => removeCustomColumn(custom.id)}>×</button>
                )}
              </div>

              <div style={styles.twoCol}>
                <input
                  value={custom ? custom.label : getSystemLabel(key)}
                  onChange={e => custom
                    ? updateCustomColumn(custom.id, { label: e.target.value })
                    : updateSystemColumn(key, { label: e.target.value })}
                  style={styles.inlineInput}
                  aria-label={t('designer.columnLabel')}
                />
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={meta?.width ?? 5}
                  onChange={e => {
                    const width = Math.max(1, Math.min(24, Number(e.target.value) || 1));
                    custom
                      ? updateCustomColumn(custom.id, { width, isFlex: false })
                      : updateSystemColumn(key, { width, isFlex: false });
                  }}
                  style={styles.widthInput}
                  aria-label={t('designer.columnWidth')}
                />
              </div>

              {custom && (
                <>
                  <select
                    value={custom.fieldType || 'text'}
                    onChange={e => updateCustomColumn(custom.id, { fieldType: e.target.value })}
                    style={styles.select}
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type} value={type}>{t('designer.fieldTypes.' + type)}</option>
                    ))}
                  </select>
                  {custom.fieldType === 'dropdown' && (
                    <input
                      value={(custom.options || []).join(', ')}
                      onChange={e => updateCustomColumn(custom.id, {
                        options: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                      })}
                      placeholder={t('designer.dropdownOptions')}
                      style={styles.input}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  const renderSelectedSettings = () => {
    if (selectedBlock === 'JSA_TABLE') return renderTableSettings();

    if (selectedBlock === 'PARTICIPANTS') {
      return (
        <>
          <h3 style={styles.sideTitle}>{t('designer.participantSettings')}</h3>
          <div style={styles.counter}>
            <button type="button" onClick={() => setSignatureRows(Math.max(1, signatureRows - 1))}>−</button>
            <strong>{signatureRows}</strong>
            <button type="button" onClick={() => setSignatureRows(Math.min(10, signatureRows + 1))}>+</button>
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

    if (selectedBlock === 'NOTES') {
      return (
        <>
          <h3 style={styles.sideTitle}>{t('designer.notesSettings')}</h3>
          <textarea
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            style={styles.textarea}
            rows={8}
            placeholder={t('designer.notesPlaceholder')}
          />
        </>
      );
    }

    return (
      <>
        <h3 style={styles.sideTitle}>{t('designer.blockSettings')}</h3>
        <p style={styles.sideHint}>{t('designer.blockSettingsHint')}</p>
      </>
    );
  };

  const renderBlockPreview = block => {
    if (block.id === 'PROJECT_INFO') {
      return (
        <div style={styles.mockGrid}>
          <span>{formData.projectName || t('designer.projectFallback')}</span>
          <span>{formData.workLocation || '—'}</span>
          <span>{formData.department || '—'}</span>
          <span>{formData.workDate || '—'}</span>
        </div>
      );
    }

    if (block.id === 'SAFETY') {
      return (
        <div style={styles.mockText}>
          <b>{t('designer.ppeLabel')}</b> {(formData.ppe || []).join(' · ') || '—'}
          <br />
          <b>{t('designer.permitLabel')}</b> {(formData.permits || []).join(' · ') || '—'}
        </div>
      );
    }

    if (block.id === 'JSA_TABLE') {
      return (
        <div style={styles.columnPreview}>
          {visibleColumns.map(key => {
            const custom = userColumns.find(col => col.id === key);
            return (
              <span key={key} style={styles.columnChip}>
                {custom?.label || getSystemLabel(key)}
              </span>
            );
          })}
        </div>
      );
    }

    if (block.id === 'PARTICIPANTS') {
      return <div style={styles.mockText}>{t('designer.signatureRows', { count: signatureRows })}</div>;
    }

    if (block.id === 'APPROVAL') {
      return <div style={styles.approvalPreview}><span>{appr1}</span><span>{appr2}</span><span>{appr3}</span></div>;
    }

    if (block.id === 'NOTES') {
      return <div style={styles.mockText}>{notesText || t('designer.notesEmpty')}</div>;
    }

    return null;
  };

  return (
    <div style={styles.wrapper}>
      <SEO />
      <DraftSaveStatus status={draftSave.status} lastSavedAt={draftSave.lastSavedAt} />

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
            <button type="button" style={styles.secondaryBtn} onClick={goBack}>
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
                <span>{t('designer.blocks.' + block.id)}</span>
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
                    <strong>{t('designer.blocks.' + block.id)}</strong>
                    <span style={block.enabled ? styles.enabledBadge : styles.disabledBadge}>
                      {block.enabled ? t('designer.enabled') : t('designer.disabled')}
                    </span>
                  </div>
                  {renderBlockPreview(block)}
                </article>
              ))}
            </div>
          </section>

          <aside style={styles.rightPanel}>
            {renderGlobalSettings()}
            <div style={styles.divider} />
            {renderSelectedSettings()}
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
  workspace: { display: 'grid', gridTemplateColumns: '220px minmax(0,1fr) 320px', gap: '14px', height: 'calc(100vh - 156px)', minHeight: '590px' },
  leftPanel: { border: '1px solid #222', background: '#0d0d0d', borderRadius: '10px', padding: '12px', overflowY: 'auto' },
  rightPanel: { border: '1px solid #222', background: '#0d0d0d', borderRadius: '10px', padding: '14px', overflowY: 'auto' },
  canvasPanel: { border: '1px solid #222', background: '#0b0b0b', borderRadius: '10px', padding: '12px', overflow: 'auto' },
  sideTitle: { margin: '0 0 10px', fontSize: '0.82rem' },
  sideHint: { color: '#666', fontSize: '0.65rem', lineHeight: 1.45, marginBottom: '12px' },
  globalSettings: { display: 'flex', flexDirection: 'column' },
  divider: { height: '1px', background: '#242424', margin: '14px 0' },
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
  mockGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '4px', fontSize: '0.62rem' },
  mockText: { fontSize: '0.62rem', color: '#555', lineHeight: 1.5 },
  columnPreview: { display: 'flex', flexWrap: 'wrap', gap: '3px' },
  columnChip: { padding: '3px 5px', background: '#f1f3f5', borderRadius: '3px', fontSize: '0.58rem' },
  approvalPreview: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px', fontSize: '0.62rem', textAlign: 'center' },
  label: { display: 'block', margin: '10px 0 5px', color: '#777', fontSize: '0.65rem' },
  input: { width: '100%', boxSizing: 'border-box', background: '#121212', color: '#fff', border: '1px solid #303030', borderRadius: '6px', padding: '8px', marginBottom: '7px' },
  textarea: { width: '100%', boxSizing: 'border-box', resize: 'vertical', background: '#121212', color: '#fff', border: '1px solid #303030', borderRadius: '6px', padding: '8px' },
  select: { width: '100%', boxSizing: 'border-box', background: '#121212', color: '#ddd', border: '1px solid #303030', borderRadius: '5px', padding: '6px', marginTop: '6px' },
  orientationGroup: { display: 'flex', gap: '6px' },
  toggle: { padding: '6px 8px', borderRadius: '5px', border: '1px solid #303030', background: '#151515', color: '#777', cursor: 'pointer', fontSize: '0.62rem' },
  toggleActive: { padding: '6px 8px', borderRadius: '5px', border: '1px solid #007bff', background: 'rgba(0,123,255,.12)', color: '#64adff', cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800 },
  columnToggleGrid: { display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' },
  addBtn: { width: '100%', padding: '8px', background: '#151515', color: '#aaa', border: '1px dashed #3a3a3a', borderRadius: '6px', cursor: 'pointer', marginBottom: '10px' },
  columnOrder: { display: 'flex', flexDirection: 'column', gap: '7px' },
  columnEditor: { padding: '7px', background: '#131313', border: '1px solid #262626', borderRadius: '6px' },
  columnEditorTop: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' },
  columnKey: { flex: 1, color: '#555', fontSize: '0.55rem', textTransform: 'uppercase' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 58px', gap: '5px' },
  inlineInput: { width: '100%', minWidth: 0, boxSizing: 'border-box', background: '#0f0f0f', color: '#ddd', border: '1px solid #2d2d2d', borderRadius: '4px', padding: '6px', fontSize: '0.66rem' },
  widthInput: { width: '100%', boxSizing: 'border-box', background: '#0f0f0f', color: '#ddd', border: '1px solid #2d2d2d', borderRadius: '4px', padding: '6px', fontSize: '0.66rem', textAlign: 'center' },
  resetBtn: { border: 0, background: 'transparent', color: '#777', fontSize: '0.55rem', cursor: 'pointer' },
  removeBtn: { border: 0, background: 'transparent', color: '#ff6666', cursor: 'pointer' },
  counter: { display: 'grid', gridTemplateColumns: '36px 1fr 36px', gap: '6px', alignItems: 'center', textAlign: 'center' }
};
