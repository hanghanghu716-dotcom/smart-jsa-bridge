import DocumentTemplateManager from '../components/DocumentTemplateManager';
import ThemeSwitcher from '../components/ThemeSwitcher';
import DocumentContent from '../components/DocumentContent';
import { normalizeDocumentBlocks, defaultColumns, moveItem, templateLayout } from '../utils/documentLayout';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageNavigate } from '../hooks/useLanguage';
import SEO from '../components/SEO';
import DraftSaveStatus from '../components/DraftSaveStatus';
import useJsaDraftAutosave from '../hooks/useJsaDraftAutosave';
import useJsaDraftRecovery from '../hooks/useJsaDraftRecovery';

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

const FIELD_TYPES = ['text', 'number', 'date', 'checkbox', 'dropdown'];

export default function DocumentDesigner() {
  const location = useLocation();
  const { t } = useTranslation('common');
  const navigate = useLanguageNavigate();
  const { draft, status } = useJsaDraftRecovery(!location.state?.formData);
  if (!location.state?.formData && status !== 'ready') return <div className="theme-workspace" style={{ padding: 40, background: 'var(--app-bg)', minHeight: '100vh' }}>
    <p role="status">{t(status === 'error' ? 'draftSave.error' : status === 'empty' ? 'designer.noWorkSteps' : 'draftSave.pending')}</p>
    <button onClick={() => navigate('/analysis')}>{t('designer.back')}</button>
  </div>;
  return <DesignerEditor recoveredDraft={draft} />;
}

function DesignerEditor({ recoveredDraft }) {
  const navigate = useLanguageNavigate();
  const location = useLocation();
  const { t } = useTranslation(['common', 'tablebuilder']);

  const state = location.state || {};
  const recoveredLayout = recoveredDraft?.layout_data || {};

  const existingId = state.existingId ?? recoveredDraft?.source_project_id ?? null;
  const initialAnalysisData = state.analysisData || recoveredDraft?.analysis_data || [];
  const [analysisData, setAnalysisData] = useState(initialAnalysisData);
  const procedures = state.procedures || recoveredDraft?.procedures || [];
  const formData = state.formData || recoveredDraft?.form_data || {};
  const participants = state.participants || recoveredDraft?.participants || [];

  const [blocks, setBlocks] = useState(
    normalizeDocumentBlocks(state.documentBlocks || recoveredLayout.documentBlocks)
  );
  const [activeOrder, setActiveOrder] = useState(
    state.savedActiveOrder || recoveredLayout.savedActiveOrder || defaultColumns(formData.jsaType)
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
    state.savedSignatureRows || recoveredLayout.savedSignatureRows || Math.max(1, Math.ceil(participants.length / 8))
  );
  const [docTitle, setDocTitle] = useState(
    state.docTitle ?? recoveredLayout.docTitle ?? t('designer.defaultTitle')
  );
  const [appr1, setAppr1] = useState(state.appr1 ?? recoveredLayout.appr1 ?? t('designer.appr1'));
  const [appr2, setAppr2] = useState(state.appr2 ?? recoveredLayout.appr2 ?? t('designer.appr2'));
  const [appr3, setAppr3] = useState(state.appr3 ?? recoveredLayout.appr3 ?? t('designer.appr3'));
  const [notesText, setNotesText] = useState(
    state.documentNotes ?? recoveredLayout.documentNotes ?? formData.additionalItems ?? ''
  );
  const userEdited = useRef(false);
  const [selectedBlock, setSelectedBlock] = useState('JSA_TABLE');
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const canvasRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);
  useEffect(() => {
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(() => setPreviewScale(Math.min(1, (canvas.clientWidth - 28) / (orientation === 'landscape' ? 1080 : 750))));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [orientation]);

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
    documentNotes: notesText,
    stepPhotos: state.stepPhotos || recoveredLayout.stepPhotos || {},
    projectSaveContext: state.projectSaveContext || recoveredLayout.projectSaveContext
  };

  const applyTemplate = template => {
    const data = templateLayout(template?.layout_data, {
      docTitle: t('designer.defaultTitle'), appr1: t('designer.appr1'), appr2: t('designer.appr2'), appr3: t('designer.appr3'),
      savedActiveOrder: defaultColumns(formData.jsaType), savedSignatureRows: Math.max(1, Math.ceil(participants.length / 8))
    });
    setBlocks(data.documentBlocks); setActiveOrder(data.savedActiveOrder); setUserColumns(data.savedUserColumns);
    setColumnOverrides(data.savedColumnOverrides); setOrientation(data.savedOrientation); setSignatureRows(data.savedSignatureRows);
    setDocTitle(data.docTitle); setAppr1(data.appr1); setAppr2(data.appr2); setAppr3(data.appr3); setNotesText(data.documentNotes);
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
    const id = 'USER_' + crypto.randomUUID();
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

  const updateCustomFieldValue = (stepIndex, columnId, value) => {
    setAnalysisData(prev => prev.map((step, index) => index === stepIndex
      ? {
          ...step,
          customFields: {
            ...(step.customFields || {}),
            [columnId]: value
          }
        }
      : step
    ));
  };

  const renderCustomFieldEditor = custom => (
    <div style={styles.customValues}>
      <div style={styles.customValuesTitle}>{t('designer.fieldValues')}</div>
      {analysisData.length === 0 ? (
        <div style={styles.customValuesEmpty}>{t('designer.noWorkSteps')}</div>
      ) : analysisData.map((step, stepIndex) => {
        const value = step.customFields?.[custom.id];
        const label = step.proc?.stepTitle || t('designer.stepFallback', { number: stepIndex + 1 });

        if (custom.fieldType === 'checkbox') {
          return (
            <label key={stepIndex} style={styles.valueRow}>
              <span style={styles.valueStep}>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={e => updateCustomFieldValue(stepIndex, custom.id, e.target.checked)}
              />
            </label>
          );
        }

        if (custom.fieldType === 'dropdown') {
          return (
            <label key={stepIndex} style={styles.valueRow}>
              <span style={styles.valueStep}>{label}</span>
              <select
                value={value ?? ''}
                onChange={e => updateCustomFieldValue(stepIndex, custom.id, e.target.value)}
                style={styles.valueInput}
              >
                <option value="">—</option>
                {(custom.options || []).map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          );
        }

        return (
          <label key={stepIndex} style={styles.valueRow}>
            <span style={styles.valueStep}>{label}</span>
            <input
              type={custom.fieldType === 'number' ? 'number' : custom.fieldType === 'date' ? 'date' : 'text'}
              value={value ?? ''}
              onChange={e => updateCustomFieldValue(
                stepIndex,
                custom.id,
                custom.fieldType === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value
              )}
              style={styles.valueInput}
            />
          </label>
        );
      })}
    </div>
  );

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
      analysisData,
      ...layoutData
    }
  });

  const renderGlobalSettings = () => (
    <div style={styles.globalSettings}>
      <label style={styles.label}>{t('designer.documentTitle')}</label>
      <input aria-label={t('designer.documentTitle')} value={docTitle} onChange={e => setDocTitle(e.target.value)} style={styles.input} />
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
              data-column-editor={key}
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
                <button type="button" aria-label={getSystemLabel(key) + ' ↑'} disabled={index === 0} onClick={() => moveColumn(index, index - 1)}>↑</button>
                <button type="button" aria-label={getSystemLabel(key) + ' ↓'} disabled={index === visibleColumns.length - 1} onClick={() => moveColumn(index, index + 1)}>↓</button>
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
                    aria-label={t('designer.customColumn')} value={custom.fieldType || 'text'}
                    onChange={e => updateCustomColumn(custom.id, { fieldType: e.target.value })}
                    style={styles.select}
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type} value={type}>{t('designer.fieldTypes.' + type)}</option>
                    ))}
                  </select>
                  {custom.fieldType === 'dropdown' && (
                    <input
                      key={custom.id + (custom.options || []).join(',')}
                      defaultValue={(custom.options || []).join(', ')}
                      onBlur={e => updateCustomColumn(custom.id, {
                        options: [...new Set(e.target.value.split(',').map(v => v.trim()).filter(Boolean))]
                      })}
                      placeholder={t('designer.dropdownOptions')}
                      style={styles.input}
                    />
                  )}
                  {renderCustomFieldEditor(custom)}
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

    if (selectedBlock === 'PROJECT_INFO') {
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
            aria-label={t('designer.notesSettings')} value={notesText}
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

  return (
    <div className="theme-workspace designer-workspace" style={styles.wrapper}>
      <SEO />
      <DraftSaveStatus status={draftSave.status} lastSavedAt={draftSave.lastSavedAt} />

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        <ThemeSwitcher compact />
      </header>

      <main style={styles.main} onChangeCapture={() => { userEdited.current = true; }} onClickCapture={() => { userEdited.current = true; }}>
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

        <div className="designer-grid" style={styles.workspace}>
          <aside className="designer-blocks" style={styles.leftPanel}>
            <h3 style={styles.sideTitle}>{t('designer.blocksTitle')}</h3>
            <p style={styles.sideHint}>{t('designer.blocksHint')}</p>
            {blocks.map((block, index) => (
              <div key={block.id} data-block-editor={block.id} draggable
                onDragStart={() => setDraggedBlock(index)} onDragOver={event => event.preventDefault()}
                onDrop={event => { event.preventDefault(); if (draggedBlock !== null) setBlocks(prev => moveItem(prev, draggedBlock, index)); setDraggedBlock(null); }}
                onDragEnd={() => setDraggedBlock(null)}
                style={selectedBlock === block.id ? styles.blockSelectorActive : styles.blockSelector}>
                <button type="button" aria-pressed={selectedBlock === block.id} style={styles.blockName} onClick={() => setSelectedBlock(block.id)}>{t('designer.blocks.' + block.id)}</button>
                <input type="checkbox" aria-label={t('designer.blocks.' + block.id)} checked={block.enabled} onChange={() => toggleBlock(block.id)} />
                <button type="button" aria-label={t('designer.blocks.' + block.id) + ' ↑'} disabled={index === 0} onClick={() => setBlocks(prev => moveItem(prev, index, index - 1))}>↑</button>
                <button type="button" aria-label={t('designer.blocks.' + block.id) + ' ↓'} disabled={index === blocks.length - 1} onClick={() => setBlocks(prev => moveItem(prev, index, index + 1))}>↓</button>
              </div>
            ))}
          </aside>

          <section ref={canvasRef} className="designer-canvas" style={styles.canvasPanel}>
            <div style={styles.canvasToolbar}>
              <span>{orientation === 'landscape' ? 'A4 ↔' : 'A4 ↕'}</span>
              <strong>{docTitle}</strong>
            </div>

            <div className="theme-paper designer-paper" style={{ ...styles.paper, width: orientation === 'landscape' ? '1080px' : '750px', zoom: previewScale }}
              onClick={event => { const block = event.target.closest('[data-document-block]'); if (block) setSelectedBlock(block.dataset.documentBlock); }}>
              <DocumentContent formData={formData} participants={participants} analysisData={analysisData} layout={layoutData} stepPhotos={layoutData.stepPhotos} />
            </div>
          </section>

          <aside className="designer-settings" style={styles.rightPanel}>
            <DocumentTemplateManager layout={layoutData} onApply={applyTemplate} allowDefault={() => !userEdited.current && !existingId && !layoutData.projectSaveContext && !state.docTitle && !recoveredLayout.docTitle && !state.savedActiveOrder && !recoveredLayout.savedActiveOrder && !state.documentBlocks && !recoveredLayout.documentBlocks} />
            <div style={styles.divider} />
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
  wrapper: { minHeight: '100vh', background: "var(--app-bg)", color: "var(--text-primary)" },
  header: { justifyContent: 'space-between', gap: 16, height: '62px', display: 'flex', alignItems: 'center', padding: '0 32px', borderBottom: "1px solid var(--border-default)" },
  logo: { margin: 0, fontSize: '1rem', fontWeight: 900, letterSpacing: '1.5px', cursor: 'pointer' },
  main: { padding: '20px 24px 28px' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '18px', marginBottom: '18px' },
  eyebrow: { color: "var(--accent)", fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1.4px' },
  title: { margin: '5px 0', fontSize: '1.45rem' },
  subtitle: { margin: 0, color: "var(--text-muted)", fontSize: '0.76rem' },
  topActions: { display: 'flex', gap: '8px' },
  primaryBtn: { background: "var(--action-bg)", color: "var(--on-accent)", border: 0, borderRadius: '7px', padding: '10px 16px', fontWeight: 900, cursor: 'pointer' },
  secondaryBtn: { background: "var(--card-bg)", color: "var(--text-secondary)", border: "1px solid var(--border-default)", borderRadius: '7px', padding: '10px 14px', cursor: 'pointer' },
  workspace: { display: 'grid', gridTemplateColumns: '240px minmax(0,1fr) 340px', gap: '14px', height: 'calc(100vh - 156px)', minHeight: '590px' },
  leftPanel: { border: "1px solid var(--border-default)", background: "var(--panel-bg)", borderRadius: '10px', padding: '12px', overflowY: 'auto' },
  rightPanel: { border: "1px solid var(--border-default)", background: "var(--panel-bg)", borderRadius: '10px', padding: '14px', overflowY: 'auto' },
  canvasPanel: { border: "1px solid var(--border-default)", background: "var(--panel-bg)", borderRadius: '10px', padding: '12px', overflow: 'auto' },
  sideTitle: { margin: '0 0 10px', fontSize: '0.82rem' },
  sideHint: { color: "var(--text-muted)", fontSize: '0.75rem', lineHeight: 1.45, marginBottom: '12px' },
  templatePanel: { display: 'flex', flexDirection: 'column', gap: '6px' },
  templateSaveRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '5px', alignItems: 'center' },
  templateSaveBtn: { padding: '6px 8px', borderRadius: '5px', border: "1px solid var(--accent)", background: 'var(--accent-soft)', color: "var(--accent)", fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' },
  globalSettings: { display: 'flex', flexDirection: 'column' },
  divider: { height: '1px', background: "var(--border-default)", margin: '14px 0' },
  blockName: { flex: 1, textAlign: 'start', background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer' },
  blockSelector: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px', marginBottom: '6px', borderRadius: '7px', border: "1px solid var(--border-default)", background: "var(--input-bg)", color: "var(--text-muted)", cursor: 'pointer', textAlign: 'left' },
  blockSelectorActive: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px', marginBottom: '6px', borderRadius: '7px', border: "1px solid var(--accent)", background: 'var(--accent-soft)', color: "var(--text-primary)", cursor: 'pointer', textAlign: 'left' },
  canvasToolbar: { display: 'flex', justifyContent: 'space-between', color: "var(--text-muted)", fontSize: '0.75rem', marginBottom: '10px' },
  paper: { margin: '0 auto', background: '#fff', color: '#111', minHeight: '600px', padding: '40px', boxSizing: 'border-box', fontFamily: '"Malgun Gothic", sans-serif' },
  previewBlock: { background: '#fff', border: '1px solid #cfd4da', borderRadius: '7px', marginBottom: '9px', padding: '10px', cursor: 'grab' },
  previewBlockSelected: { outline: '2px solid #007bff', outlineOffset: '1px' },
  previewBlockDisabled: { opacity: 0.36 },
  previewBlockHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', marginBottom: '9px' },
  drag: { color: "var(--text-muted)" },
  enabledBadge: { marginLeft: 'auto', color: '#198754', fontSize: '0.75rem', fontWeight: 900 },
  disabledBadge: { marginLeft: 'auto', color: "var(--text-muted)", fontSize: '0.75rem', fontWeight: 900 },
  mockGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '4px', fontSize: '0.75rem' },
  mockText: { fontSize: '0.75rem', color: "var(--text-muted)", lineHeight: 1.5 },
  columnPreview: { display: 'flex', flexWrap: 'wrap', gap: '3px' },
  columnChip: { padding: '3px 5px', background: '#f1f3f5', borderRadius: '3px', fontSize: '0.75rem' },
  approvalPreview: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px', fontSize: '0.75rem', textAlign: 'center' },
  label: { display: 'block', margin: '10px 0 5px', color: "var(--text-muted)", fontSize: '0.75rem' },
  input: { width: '100%', boxSizing: 'border-box', background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: '6px', padding: '8px', marginBottom: '7px' },
  textarea: { width: '100%', boxSizing: 'border-box', resize: 'vertical', background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: '6px', padding: '8px' },
  select: { width: '100%', boxSizing: 'border-box', background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: '5px', padding: '6px', marginTop: '6px' },
  orientationGroup: { display: 'flex', gap: '6px' },
  toggle: { padding: '6px 8px', borderRadius: '5px', border: "1px solid var(--border-default)", background: "var(--card-bg)", color: "var(--text-muted)", cursor: 'pointer', fontSize: '0.75rem' },
  toggleActive: { padding: '6px 8px', borderRadius: '5px', border: "1px solid var(--accent)", background: 'rgba(0,123,255,.12)', color: "var(--accent)", cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 },
  columnToggleGrid: { display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' },
  addBtn: { width: '100%', padding: '8px', background: "var(--card-bg)", color: "var(--text-secondary)", border: "1px dashed var(--border-default)", borderRadius: '6px', cursor: 'pointer', marginBottom: '10px' },
  columnOrder: { display: 'flex', flexDirection: 'column', gap: '7px' },
  columnEditor: { padding: '7px', background: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: '6px' },
  columnEditorTop: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' },
  columnKey: { flex: 1, color: "var(--text-muted)", fontSize: '0.75rem', textTransform: 'uppercase' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 58px', gap: '5px' },
  inlineInput: { width: '100%', minWidth: 0, boxSizing: 'border-box', background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: '4px', padding: '6px', fontSize: '0.75rem' },
  widthInput: { width: '100%', boxSizing: 'border-box', background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: '4px', padding: '6px', fontSize: '0.75rem', textAlign: 'center' },
  resetBtn: { border: 0, background: 'transparent', color: "var(--text-muted)", fontSize: '0.75rem', cursor: 'pointer' },
  removeBtn: { border: 0, background: 'transparent', color: 'var(--danger)', cursor: 'pointer' },
  customValues: { marginTop: '8px', paddingTop: '7px', borderTop: "1px solid var(--border-default)", display: 'flex', flexDirection: 'column', gap: '5px' },
  customValuesTitle: { color: "var(--text-muted)", fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' },
  customValuesEmpty: { color: "var(--text-muted)", fontSize: '0.75rem', padding: '4px 0' },
  valueRow: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 110px', gap: '6px', alignItems: 'center' },
  valueStep: { color: "var(--text-muted)", fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  valueInput: { width: '100%', minWidth: 0, boxSizing: 'border-box', background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: '4px', padding: '5px', fontSize: '0.75rem' },
  counter: { display: 'grid', gridTemplateColumns: '36px 1fr 36px', gap: '6px', alignItems: 'center', textAlign: 'center' }
};
