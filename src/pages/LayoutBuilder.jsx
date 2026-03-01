import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner';

/**
 * [LayoutBuilder 컴포넌트]
 * 역할: Step 4. 병합 해제 및 데이터 보존 로직이 강화된 정밀 양식 빌더입니다.
 * 에디터 위치: src/pages/LayoutBuilder.jsx
 */

const BASE_CELL_SIZE = 20; 
const ROWS = 60; 
const BINDING_ROW_HEIGHT = 3; 

const TAG_META = {
  'DATA_STEP_NO': { label: '작업번호', color: '#6c757d', width: 2, align: 'center' },
  'DATA_STEP_TITLE': { label: '작업단계', color: '#0d6efd', width: 5, align: 'left' },
  'DATA_PHOTO': { label: '관련사진', color: '#6f42c1', width: 3, align: 'center' },
  'DATA_HAZARD': { label: '유해위험요인', color: '#dc3545', isFlex: true, align: 'left' },
  'DATA_CURRENT_MEASURE': { label: '현재 안전대책', color: '#fd7e14', isFlex: true, align: 'left' },
  'DATA_RECOMMEND_MEASURE': { label: '감소권고대책', color: '#198754', isFlex: true, align: 'left' },
  'DATA_SEVERITY': { label: '중대성', color: '#20c997', width: 2, align: 'center' },
  'DATA_FREQUENCY': { label: '가능성', color: '#20c997', width: 2, align: 'center' },
  'DATA_RISK': { label: '위험성', color: '#e83e8c', width: 2, align: 'center' },
};

export default function LayoutBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    existingId, analysisData = [], formData = {}, participants = [], procedures = [], 
    customLayout, savedActiveOrder, savedBindingStartRow, savedOrientation, savedUserColumns
  } = location.state || {};

  const [gridData, setGridData] = useState(customLayout || {});
  const [orientation, setOrientation] = useState(savedOrientation || 'landscape');
  const [zoom, setZoom] = useState(1.0); 
  const COLS = orientation === 'landscape' ? 56 : 40; 

  const [activeOrder, setActiveOrder] = useState(
    savedActiveOrder || Object.keys(TAG_META).filter(k => k !== 'DATA_PHOTO')
  ); 
  const [bindingStartRow, setBindingStartRow] = useState(savedBindingStartRow || 17);
  const [userColumns, setUserColumns] = useState(savedUserColumns || []);
  
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [selection, setSelection] = useState(null);
  const [isDraggingGrid, setIsDraggingGrid] = useState(false);
  const [editingCell, setEditingCell] = useState(null); 

  useEffect(() => { rebuildGrid(); }, [activeOrder, bindingStartRow, orientation, userColumns]);

  const rebuildGrid = () => {
    setGridData(prev => {
      const newGrid = { ...prev };
      Object.keys(newGrid).forEach(key => {
        if (newGrid[key]?.bindingType || newGrid[key]?.isBindingRoot || newGrid[key]?.fromBinding) delete newGrid[key];
      });

      const currentItems = activeOrder.filter(key => TAG_META[key] || userColumns.find(u => u.id === key));
      const fixedWidth = currentItems.reduce((sum, key) => {
        const meta = TAG_META[key] || userColumns.find(u => u.id === key);
        return sum + (meta?.isFlex ? 0 : (parseInt(meta?.width) || 5));
      }, 0);
      
      const flexItems = currentItems.filter(key => (TAG_META[key]?.isFlex || userColumns.find(u => u.id === key)?.isFlex));
      const remaining = COLS - fixedWidth;
      const baseFlex = flexItems.length > 0 ? Math.floor(remaining / flexItems.length) : 0;
      const remainder = remaining % flexItems.length;

      let currentCol = 0;
      currentItems.forEach((key) => {
        const meta = TAG_META[key] || userColumns.find(u => u.id === key);
        if (!meta) return;
        const isUser = key.startsWith('USER_');
        let colSpan = meta.isFlex ? baseFlex : (parseInt(meta.width) || 5);
        if (meta.isFlex && flexItems.indexOf(key) < remainder) colSpan += 1;

        const rootKey = `${bindingStartRow}-${currentCol}`;
        newGrid[rootKey] = {
          bindingType: key,
          text: isUser ? meta.label : `[${meta.label}]`, 
          color: isUser ? '#000' : (meta.color || '#999'),
          bg: isUser ? '#f1f3f5' : (meta.color ? `${meta.color}15` : '#f8f9fa'),
          border: `2px solid ${meta.color || '#adb5bd'}`,
          rowSpan: BINDING_ROW_HEIGHT,
          colSpan: colSpan,
          align: meta.align || 'center',
          bold: true,
          fontSize: '11px',
          isBindingRoot: true
        };

        for (let r = bindingStartRow; r < bindingStartRow + BINDING_ROW_HEIGHT; r++) {
          for (let c = currentCol; c < currentCol + colSpan; c++) {
            if (r === bindingStartRow && c === currentCol) continue;
            newGrid[`${r}-${c}`] = { hidden: true, fromBinding: true };
          }
        }
        currentCol += colSpan;
      });
      return newGrid;
    });
  };

  const handleDragOver = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newOrder = [...activeOrder];
    const movedItem = newOrder.splice(draggedIdx, 1)[0];
    newOrder.splice(targetIdx, 0, movedItem);
    setActiveOrder(newOrder);
    setDraggedIdx(targetIdx);
  };

  const handleCellClick = (key) => { if (gridData[key]?.bindingType) return; setEditingCell(key); };
  const handleCellChange = (key, value) => { setGridData(prev => ({ ...prev, [key]: { ...prev[key], text: value, hidden: false } })); };
  const handleMouseDown = (r, c) => { setEditingCell(null); setSelection({ minR: r, maxR: r, minC: c, maxC: c }); setIsDraggingGrid(true); };
  const handleMouseEnter = (r, c) => { if (isDraggingGrid) setSelection(prev => ({ ...prev, maxR: Math.max(prev.minR, r), maxC: Math.max(prev.minC, c), minR: Math.min(prev.minR, r), minC: Math.min(prev.minC, c) })); };
  const handleMouseUp = () => setIsDraggingGrid(false);

  useEffect(() => { window.addEventListener('mouseup', handleMouseUp); return () => window.removeEventListener('mouseup', handleMouseUp); }, []);

  // ✅ [개선] 병합 해제 시 위치 틀어짐 방지를 위해 속성 완전 삭제
  const unmergeCells = () => {
    if (!selection) return;
    setGridData(prev => {
      const newGrid = { ...prev };
      for (let r = selection.minR; r <= selection.maxR; r++) {
        for (let c = selection.minC; c <= selection.maxC; c++) {
          const key = `${r}-${c}`;
          if (newGrid[key]) {
            const cell = { ...newGrid[key] };
            delete cell.rowSpan; delete cell.colSpan; delete cell.hidden;
            newGrid[key] = cell;
          }
        }
      }
      return newGrid;
    });
  };

  const mergeCells = () => {
    if (!selection) return;
    setGridData(prev => {
      const newGrid = { ...prev };
      const rootKey = `${selection.minR}-${selection.minC}`;
      newGrid[rootKey] = { ...newGrid[rootKey], rowSpan: selection.maxR - selection.minR + 1, colSpan: selection.maxC - selection.minC + 1, hidden: false };
      for (let r = selection.minR; r <= selection.maxR; r++) {
        for (let c = selection.minC; c <= selection.maxC; c++) {
          if (r === selection.minR && c === selection.minC) continue;
          newGrid[`${r}-${c}`] = { hidden: true };
        }
      }
      return newGrid;
    });
  };

  const updateSelectionStyle = (styleKey, value) => {
    if (!selection) return;
    setGridData(prev => {
      const newGrid = { ...prev };
      for (let r = selection.minR; r <= selection.maxR; r++) {
        for (let c = selection.minC; c <= selection.maxC; c++) {
          const key = `${r}-${c}`;
          const currentCell = newGrid[key] || {};
          if (!currentCell.hidden) newGrid[key] = { ...currentCell, [styleKey]: value };
        }
      }
      return newGrid;
    });
  };

  // ✅ [개선] 'none' 설정 시 속성을 삭제하여 기본 점선 가이드가 보이도록 조치
  const setBorder = (style) => {
    if (!selection) return;
    setGridData(prev => {
      const newGrid = { ...prev };
      for (let r = selection.minR; r <= selection.maxR; r++) {
        for (let c = selection.minC; c <= selection.maxC; c++) {
          const key = `${r}-${c}`;
          if (!newGrid[key]?.hidden) {
            const currentCell = { ...(newGrid[key] || {}) };
            if (style === 'none') delete currentCell.border; 
            else currentCell.border = style;
            newGrid[key] = currentCell;
          }
        }
      }
      return newGrid;
    });
  };

  const addUserColumn = () => {
    const currentSum = userColumns.reduce((sum, c) => sum + (parseInt(c.width) || 0), 0);
    if (currentSum + 5 > 40) { alert("사용자 항목들의 총 너비 합계가 40을 초과할 수 없습니다."); return; }
    const id = `USER_${Date.now()}`;
    setUserColumns([...userColumns, { id, label: '새 항목', width: 5, isFlex: false }]);
    setActiveOrder([...activeOrder, id]);
  };

  const handleWidthChange = (id, rawValue) => {
    const numericValue = rawValue === '' ? '' : parseInt(rawValue);
    setUserColumns(prev => {
      const otherSum = prev.filter(u => u.id !== id).reduce((sum, c) => sum + (parseInt(c.width) || 0), 0);
      let finalValue = numericValue;
      if (numericValue !== '' && otherSum + numericValue > 40) finalValue = 40 - otherSum;
      return prev.map(u => u.id === id ? { ...u, width: finalValue } : u);
    });
  };

  // ✅ [수정] analysis.jsx로 돌아갈 때 모든 현재 작업 데이터를 state에 실어서 보냄
  const goBackToAnalysis = () => {
    navigate('/analysis', { 
      state: { 
        ...location.state, 
        customLayout: gridData, 
        savedActiveOrder: activeOrder, 
        savedBindingStartRow: bindingStartRow, 
        savedOrientation: orientation, 
        savedUserColumns: userColumns 
      } 
    });
  };

  const goToExport = () => navigate('/export', { state: { ...location.state, customLayout: gridData, savedActiveOrder: activeOrder, savedBindingStartRow: bindingStartRow, savedOrientation: orientation, savedUserColumns: userColumns } });

  const officialColors = ['#ffffff', '#f2f2f2', '#d9d9d9', '#e7f1ff', '#f0f8ff', '#fff9e6'];

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        .cursor { display: inline-block; width: 2px; height: 14px; background: #007bff; margin-left: 2px; animation: blink 1s step-end infinite; vertical-align: middle; }
        .tag-item { transition: transform 0.2s ease, background 0.2s; }
        input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .canvas-container { transform-origin: top center; transition: transform 0.2s ease; margin: 0 auto; background-color: #fff; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.7); width: fit-content; }
      `}</style>
      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>
      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}><AdBanner slot="4000000001" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper}><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div><div style={styles.stepLineActive} /><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div><div style={styles.stepLineActive} /><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>위험 분석</span></div><div style={styles.stepLineActive} /><div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>4</div><span style={styles.stepTextActive}>양식 설정</span></div><div style={styles.stepLine} /><div style={styles.stepItem}><div style={styles.stepBadge}>5</div><span style={styles.stepText}>최종 출력</span></div></nav>
            <div style={styles.formHeader}><h2 style={styles.formTitle}>| 04. 양식 설정</h2></div>
            <div style={styles.builderLayout}>
              <aside style={styles.toolbarSliding}>
                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>셀 편집</h3>
                  <div style={styles.buttonGroupSmall}><button style={styles.miniBtn} onClick={mergeCells}>병합</button><button style={styles.miniBtn} onClick={unmergeCells}>해제</button><button style={styles.miniBtn} onClick={()=>setBorder('1px solid #000')}>실선</button><button style={styles.miniBtn} onClick={()=>setBorder('none')}>실선 해제</button></div>
                  <div style={styles.buttonGroupSmall}><button style={{...styles.formatBtn, fontWeight:'bold'}} onClick={()=>updateSelectionStyle('bold', true)}>B</button><button style={{...styles.formatBtn, textDecoration:'underline'}} onClick={()=>updateSelectionStyle('underline', true)}>U</button><div style={styles.sizeInputBox}><span style={{fontSize:'0.65rem', color:'#555'}}>Px</span><input type="number" style={styles.numInputPure} defaultValue={11} onChange={(e)=>updateSelectionStyle('fontSize', e.target.value+'px')} /></div></div>
                  <div style={styles.buttonGroupSmall}><button style={styles.miniBtn} onClick={()=>updateSelectionStyle('align', 'left')}>Left</button><button style={styles.miniBtn} onClick={()=>updateSelectionStyle('align', 'center')}>Center</button><button style={styles.miniBtn} onClick={()=>updateSelectionStyle('align', 'right')}>Right</button></div>
                  <div style={styles.paletteContainer}>{officialColors.map(color => (<div key={color} onClick={() => updateSelectionStyle('bg', color)} style={{...styles.colorCircle, backgroundColor: color, border: color === '#ffffff' ? '1px solid #444' : 'none'}} />))}</div>
                </div>
                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>설정</h3>
                  <div style={styles.buttonGroupSmall}><button style={{...styles.miniBtn, backgroundColor: orientation === 'landscape' ? '#007bff' : '#222'}} onClick={() => setOrientation('landscape')}>가로</button><button style={{...styles.miniBtn, backgroundColor: orientation === 'portrait' ? '#007bff' : '#222'}} onClick={() => setOrientation('portrait')}>세로</button></div>
                  <div style={{display:'flex', justifyContent:'space-between', marginTop:'4px'}}><span style={styles.infoBadge}>{orientation === 'landscape' ? "가로형" : "세로형"}</span><span style={{fontSize:'0.55rem', color:'#ff4d4d', fontWeight:'bold'}}>* 출력 여백 40px 반영</span></div>
                  <div style={styles.inputFieldCompact}><span style={{fontSize:'0.6rem', color:'#888'}}>확대/축소</span><input type="range" min="0.5" max="1.5" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={styles.rangeInputCompact} /></div>
                  <div style={styles.inputFieldCompact}><span style={{fontSize:'0.6rem', color:'#888'}}>데이터 시작 행: {bindingStartRow+1}</span><input type="range" min="0" max="45" value={bindingStartRow} onChange={e => setBindingStartRow(parseInt(e.target.value))} style={styles.rangeInputCompact} /></div>
                </div>
                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>항목 관리</h3>
                  <div style={styles.tagToggleContainerCompact}>{Object.keys(TAG_META).map(key => { const isActive = activeOrder.includes(key); return ( <button key={key} onClick={() => toggleTag(key)} style={{...styles.tagBtnSmall, backgroundColor: isActive ? TAG_META[key].color : '#161616', color: isActive ? '#fff' : '#666', borderColor: TAG_META[key].color, opacity: 1}}>{TAG_META[key].label}</button> ); })}</div>
                  <div style={styles.dragScrollArea}>{activeOrder.map((key, idx) => { const meta = TAG_META[key] || userColumns.find(u => u.id === key); if (!meta) return null; const isUser = key.startsWith('USER_'); return ( <div key={key} draggable onDragStart={() => setDraggedIdx(idx)} onDragOver={(e) => handleDragOver(e, idx)} className="tag-item" style={{...styles.dragTagMini, borderColor: meta.color || '#444', backgroundColor: meta.color ? `${meta.color}33` : '#222'}}> <span style={{cursor:'grab', color:'#888', marginRight:'8px'}}>☰</span> {isUser ? ( <div style={{display:'flex', gap:'4px', flex:1, alignItems:'center'}}> <input style={styles.miniInputNoBorder} value={meta.label} onChange={(e) => setUserColumns(prev => prev.map(u => u.id === key ? {...u, label: e.target.value} : u))} /> <div style={{display:'flex', alignItems:'center', gap:'2px', backgroundColor:'rgba(0,0,0,0.5)', padding:'0 4px', borderRadius:'4px'}}><span style={{fontSize:'0.6rem', color:'#555'}}>W</span><input type="number" style={styles.numInputPure} value={meta.width} onChange={(e) => handleWidthChange(key, e.target.value)} /></div> <button onClick={() => { setActiveOrder(prev => prev.filter(k=>k!==key)); setUserColumns(prev => prev.filter(u=>u.id!==key)); }} style={styles.miniDelBtnActive}>×</button> </div> ) : <span style={{flex:1, fontSize:'0.7rem', color:'#eee'}}>{meta.label}</span>} </div> ); })}</div>
                  <button style={styles.addBtnMini} onClick={addUserColumn}>+ 항목 추가</button>
                </div>
              </aside>
              <section style={styles.gridCanvasWrapper}><div style={styles.canvasScrollArea}><div className="canvas-container" style={{ transform: `scale(${zoom})` }}><div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${BASE_CELL_SIZE}px)`, gridAutoRows: `${BASE_CELL_SIZE}px`, backgroundColor: '#fff', width: 'fit-content' }}>{Array.from({length: ROWS}).map((_, r) => Array.from({length: COLS}).map((_, c) => { const key = `${r}-${c}`; const data = gridData[key] || {}; if (data.hidden) return null; const isSelected = selection && r >= selection.minR && r <= selection.maxR && c >= selection.minC && c <= selection.maxC; const isEditing = editingCell === key; const isAuto = r >= bindingStartRow && r < bindingStartRow + BINDING_ROW_HEIGHT; return ( <div key={key} onMouseDown={()=>handleMouseDown(r, c)} onMouseEnter={()=>handleMouseEnter(r, c)} onClick={() => handleCellClick(key)} style={{ gridRow: `span ${data.rowSpan || 1}`, gridColumn: `span ${data.colSpan || 1}`, border: isSelected || isEditing ? '2px solid #007bff' : (data.border || (isAuto ? '1px dashed #fab005' : '1px dotted #eee')), background: isSelected ? 'rgba(0,123,255,0.1)' : (data.bg || (isAuto ? '#fff9db' : '#fff')), color: data.color || '#000', display: 'flex', alignItems: 'center', justifyContent: data.align || 'center', fontSize: data.fontSize || '11px', fontWeight: data.bold ? 'bold' : 'normal', textDecoration: data.underline ? 'underline' : 'none', overflow: 'hidden', position: 'relative' }}> {isEditing ? ( <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent: data.align || 'center', padding:'0 4px'}}><input autoFocus style={{width:'100%', background:'none', border:'none', outline:'none', fontSize: data.fontSize || '11px', textAlign: data.align || 'center'}} value={data.text || ""} onChange={(e)=>handleCellChange(key, e.target.value)} onBlur={()=>setEditingCell(null)} /><span className="cursor" /></div> ) : (data.text || "")} </div> ); }))}</div></div></div></section>
            </div>
            <div style={styles.btnAreaLayout}><button style={styles.prevBtnDark} onClick={goBackToAnalysis}>처음으로</button><button style={styles.nextBtnLight} onClick={goToExport}>최종 출력 단계로 이동</button></div>
          </div>
        </main>
        <aside style={styles.sideAd}><AdBanner slot="4000000002" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' },
  bgWrapper: { position: 'fixed', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image3.jpg)', backgroundSize: 'cover', filter: 'brightness(0.12)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: '#fff', cursor: 'pointer', letterSpacing: '2px' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', padding: '0 5rem 20px', zIndex: 10, gap: '3rem', overflow: 'hidden' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1550px', height: '82vh', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,0.8)' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', gap: '0.8rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadgeDone: { width: '22px', height: '22px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' },
  stepTextDone: { fontSize: '0.85rem', color: '#4caf50', fontWeight: '700' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadgeActive: { width: '22px', height: '22px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' },
  stepTextActive: { fontSize: '0.85rem', color: '#fff', fontWeight: '700' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.3 },
  stepBadge: { width: '22px', height: '22px', backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.75rem' },
  stepText: { fontSize: '0.85rem', color: '#aaa' },
  stepLine: { width: '30px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  stepLineActive: { width: '30px', height: '1px', backgroundColor: '#4caf50' },
  formHeader: { marginBottom: '1.2rem', borderLeft: '5px solid #007bff', paddingLeft: '1rem' },
  formTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#fff' },
  builderLayout: { display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden' },
  toolbarSliding: { width: '250px', backgroundColor: 'rgba(24, 24, 24, 0.95)', border: '1px solid #333', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto' },
  toolSectionCompact: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  toolTitleMini: { color: '#666', fontSize: '0.65rem', fontWeight: '900', borderLeft: '3px solid #007bff', paddingLeft: '8px' },
  buttonGroupSmall: { display: 'flex', gap: '4px' },
  miniBtn: { flex: 1, padding: '8px', backgroundColor: '#222', color: '#fff', border: '1px solid #333', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer' },
  rangeInputCompact: { width: '100%', height: '4px', cursor: 'pointer', accentColor: '#007bff' },
  tagToggleContainerCompact: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  tagBtnSmall: { padding: '5px 8px', border: '1px solid #333', borderRadius: '4px', fontSize: '0.6rem', color: '#fff', cursor: 'pointer' },
  dragScrollArea: { display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' },
  dragTagMini: { padding: '8px 10px', border: '1px solid', borderRadius: '8px', fontSize: '0.72rem', color: '#fff', display: 'flex', alignItems: 'center' },
  miniInputNoBorder: { background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', fontSize: '0.7rem', outline: 'none', flex: 1, padding: '2px 5px', borderRadius: '3px', maxWidth: '80px' },
  numInputPure: { width: '24px', background: 'none', border: 'none', color: '#007bff', fontSize: '0.75rem', textAlign: 'center', outline: 'none', fontWeight: 'bold' },
  miniDelBtnActive: { background: 'transparent', color: '#ff4d4d', border: 'none', borderRadius: '4px', width: '18px', height: '18px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', fontWeight: 'bold' },
  addBtnMini: { width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px dashed #444', color: '#888', fontSize: '0.7rem', borderRadius: '6px', cursor: 'pointer' },
  gridCanvasWrapper: { flex: 1, backgroundColor: 'rgba(20, 20, 20, 0.8)', borderRadius: '10px', padding: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' },
  canvasScrollArea: { flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '30px' },
  btnAreaLayout: { marginTop: '1.5rem', display: 'flex', gap: '1rem' },
  prevBtnDark: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtnLight: { flex: 2, padding: '1rem', backgroundColor: '#fff', color: '#000', fontWeight: '800', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.05rem' },
  inputFieldCompact: { backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', border: '1px solid #333' },
  infoBadge: { fontSize:'0.55rem', color:'#007bff', border:'1px solid #007bff', padding:'1px 4px', borderRadius:'3px', fontWeight:'bold' },
  formatBtn: { flex: 1, padding: '8px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' },
  sizeInputBox: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#000', padding: '0 8px', borderRadius: '4px', border: '1px solid #444' },
  paletteContainer: { display: 'flex', gap: '6px', padding: '8px', backgroundColor: '#111', borderRadius: '6px', flexWrap: 'wrap' },
  colorCircle: { width: '18px', height: '18px', borderRadius: '50%', cursor: 'pointer', transition: 'transform 0.1s' }
};