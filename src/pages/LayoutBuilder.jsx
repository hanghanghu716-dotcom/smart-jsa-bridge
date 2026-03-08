import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner';
import { supabase } from '../supabaseClient';

/**
 * [LayoutBuilder 컴포넌트 - KRAS 표준 양식 추가본]
 * 역할: Step 4. 구역 분할형 모듈 빌더 (헤더 프리셋 -> 자동 도킹 데이터 테이블 -> 푸터 프리셋)
 * 에디터 위치: src/pages/LayoutBuilder.jsx
 */

const TAG_META = {
  // 기존 태그 (유지)
  'DATA_STEP_NO': { label: '작업번호', color: '#6c757d', width: 2, align: 'center' },
  'DATA_STEP_TITLE': { label: '작업단계', color: '#0d6efd', width: 5, align: 'left' },
  'DATA_PHOTO': { label: '관련사진', color: '#6f42c1', width: 3, align: 'center' },
  'DATA_HAZARD': { label: '유해위험요인', color: '#dc3545', isFlex: true, align: 'left' },
  'DATA_CURRENT_MEASURE': { label: '현재 안전대책', color: '#fd7e14', isFlex: true, align: 'left' },
  'DATA_RECOMMEND_MEASURE': { label: '감소권고대책', color: '#198754', isFlex: true, align: 'left' },
  'DATA_SEVERITY': { label: '중대성', color: '#20c997', width: 2, align: 'center' },
  'DATA_FREQUENCY': { label: '가능성', color: '#20c997', width: 2, align: 'center' },
  'DATA_RISK': { label: '위험성', color: '#e83e8c', width: 2, align: 'center' },

  // [기능 추가]: KRAS 표준 양식 전용 태그
  'DATA_KRAS_STEP': { label: '세부 작업 내용', color: '#0d6efd', width: 4, align: 'center' },
  'DATA_KRAS_HAZARD_CLASS': { label: '위험 분류', color: '#dc3545', width: 3, align: 'center' },
  'DATA_KRAS_HAZARD_DETAIL': { label: '위험발생 상황 및 결과', color: '#dc3545', isFlex: true, align: 'left' },
  'DATA_KRAS_BASIS': { label: '관련근거(법적기준)', color: '#6c757d', width: 3, align: 'center' },
  'DATA_KRAS_CURRENT': { label: '현재의 안전보건조치', color: '#fd7e14', isFlex: true, align: 'left' },
  'DATA_KRAS_FREQ': { label: '가능성(빈도)', color: '#20c997', width: 2, align: 'center' },
  'DATA_KRAS_SEV': { label: '중대성(강도)', color: '#20c997', width: 2, align: 'center' },
  'DATA_KRAS_RISK': { label: '위험성', color: '#e83e8c', width: 2, align: 'center' },
  'DATA_KRAS_RECOMMEND': { label: '위험성 감소대책', color: '#198754', isFlex: true, align: 'left' },
  'DATA_KRAS_AFTER': { label: '개선후 위험성', color: '#17a2b8', width: 3, align: 'center' },
  'DATA_KRAS_SCHED': { label: '개선 예정일', color: '#ffc107', width: 3, align: 'center' },
  'DATA_KRAS_COMP': { label: '완료일', color: '#28a745', width: 3, align: 'center' },
  'DATA_KRAS_MANAGER': { label: '담당자', color: '#6610f2', width: 2, align: 'center' },
};

// [기능 추가]: 다단 헤더 그룹핑을 위한 상수
const COLUMN_GROUPS = [
  { label: '유해 위험요인 파악', children: ['DATA_KRAS_HAZARD_CLASS', 'DATA_KRAS_HAZARD_DETAIL'] },
  { label: '위험성', children: ['DATA_KRAS_FREQ', 'DATA_KRAS_SEV', 'DATA_KRAS_RISK'] }
];

// [프리셋 정의 - 구역별] 
const HEADER_PRESETS = [
  { id: 'h_kras', label: 'KRAS 표준 (안전보건공단)' }, // [기능 추가]
  { id: 'h_none', label: '헤더 없음' },
  { id: 'h_standard', label: '일반 JSA 헤더 (결재란 포함)' },
  { id: 'h_simple', label: '간편 헤더 (문서 정보만)' }
];

const FOOTER_PRESETS = [
  { id: 'f_none', label: '푸터 없음' },
  { id: 'f_standard', label: '표준 푸터 (서명란 포함)' },
  { id: 'f_notice', label: '주의사항 및 범례' }
];

// [서비스 제공 전체 양식 프리셋 리스트]
const SERVICE_LAYOUT_PRESETS = [
  {
    // [기능 추가]: KRAS 표준 양식 데이터 세팅
    id: 'sys_01',
    name: '[국가표준] KRAS 위험성평가 양식',
    layout_data: { 
      orientation: 'landscape', 
      headerPreset: 'h_kras', 
      footerPreset: 'f_none', 
      userColumns: [], 
      activeOrder: [
        'DATA_KRAS_STEP', 'DATA_KRAS_HAZARD_CLASS', 'DATA_KRAS_HAZARD_DETAIL', 
        'DATA_KRAS_BASIS', 'DATA_KRAS_CURRENT', 'DATA_KRAS_FREQ', 'DATA_KRAS_SEV', 
        'DATA_KRAS_RISK', 'DATA_KRAS_RECOMMEND', 'DATA_KRAS_AFTER', 
        'DATA_KRAS_SCHED', 'DATA_KRAS_COMP', 'DATA_KRAS_MANAGER'
      ] 
    }
  },
  {
    id: 'sys_02',
    name: '[일반] JSA 기본 양식 (가로형)',
    layout_data: { orientation: 'landscape', headerPreset: 'h_standard', footerPreset: 'f_standard', userColumns: [], activeOrder: ['DATA_STEP_NO', 'DATA_STEP_TITLE', 'DATA_HAZARD', 'DATA_CURRENT_MEASURE', 'DATA_RECOMMEND_MEASURE', 'DATA_RISK'] }
  },
  {
    id: 'sys_03',
    name: '[일반] 심플 양식 (세로형)',
    layout_data: { orientation: 'portrait', headerPreset: 'h_simple', footerPreset: 'f_none', userColumns: [], activeOrder: ['DATA_STEP_NO', 'DATA_STEP_TITLE', 'DATA_HAZARD', 'DATA_RECOMMEND_MEASURE'] }
  }
];

export default function LayoutBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    existingId, analysisData = [], formData = {}, participants = [], procedures = [], 
    savedActiveOrder, savedOrientation, savedUserColumns, savedHeaderPreset, savedFooterPreset
  } = location.state || {};

  const [orientation, setOrientation] = useState(savedOrientation || 'landscape');
  const [zoom, setZoom] = useState(1.0); 
  const COLS = orientation === 'landscape' ? 56 : 40; 

  const [activeOrder, setActiveOrder] = useState(
    savedActiveOrder || Object.keys(TAG_META).filter(k => k !== 'DATA_PHOTO')
  ); 
  const [userColumns, setUserColumns] = useState(savedUserColumns || []);
  
  const [headerPreset, setHeaderPreset] = useState(savedHeaderPreset || 'h_kras'); // 기본값을 KRAS로 변경
  const [footerPreset, setFooterPreset] = useState(savedFooterPreset || 'f_none');

  const [draggedIdx, setDraggedIdx] = useState(null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false); 
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetTarget, setPresetTarget] = useState(''); 
  const [saveName, setSaveName] = useState('');
  const [savedLayouts, setSavedLayouts] = useState([]);

  const handleSaveLayout = async () => {
    if (!saveName.trim()) return alert("양식 이름을 입력해주세요.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");

    const layoutData = { orientation, activeOrder, userColumns, headerPreset, footerPreset };

    const { error } = await supabase.from('user_layouts').insert({
      user_id: user.id,
      name: saveName,
      layout_data: layoutData
    });

    if (error) {
      console.error(error);
      alert("양식 저장 중 오류가 발생했습니다.");
    } else {
      alert("양식이 저장되었습니다.");
      setShowSaveModal(false);
      setSaveName('');
    }
  };

  const fetchLayouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('user_layouts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!error && data) setSavedLayouts(data);
  };

  const openLoadModal = () => {
    fetchLayouts();
    setShowLoadModal(true);
  };

  const applyLayout = (layoutDataObj) => {
    if (!window.confirm("선택한 양식을 불러오시겠습니까? 현재 작업 내역이 덮어씌워집니다.")) return;
    setOrientation(layoutDataObj.orientation || 'landscape');
    setActiveOrder(layoutDataObj.activeOrder || []);
    setUserColumns(layoutDataObj.userColumns || []);
    setHeaderPreset(layoutDataObj.headerPreset || 'h_kras');
    setFooterPreset(layoutDataObj.footerPreset || 'f_none');
    setShowLoadModal(false);
    setShowServiceModal(false);
  };

  const deleteLayout = async (id) => {
    if (!window.confirm("이 양식을 삭제하시겠습니까?")) return;
    await supabase.from('user_layouts').delete().eq('id', id);
    fetchLayouts();
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

  const toggleTag = (key) => {
    if (activeOrder.includes(key)) {
      setActiveOrder(prev => prev.filter(k => k !== key));
    } else {
      setActiveOrder(prev => [...prev, key]);
    }
  };

  const addUserColumn = () => {
    const currentSum = userColumns.reduce((sum, c) => sum + (parseInt(c.width) || 0), 0);
    if (currentSum + 5 > 40) { alert("사용자 항목들의 총 너비 합계가 한도를 초과할 수 없습니다."); return; }
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

  const goBackToAnalysis = () => {
    navigate('/analysis', { 
      state: { 
        ...location.state, 
        savedActiveOrder: activeOrder, 
        savedOrientation: orientation, 
        savedUserColumns: userColumns,
        savedHeaderPreset: headerPreset,
        savedFooterPreset: footerPreset
      } 
    });
  };

  const goToExport = () => {
    navigate('/export', { 
      state: { 
        ...location.state, 
        savedActiveOrder: activeOrder, 
        savedOrientation: orientation, 
        savedUserColumns: userColumns,
        savedHeaderPreset: headerPreset,
        savedFooterPreset: footerPreset 
      } 
    });
  };

  const openPresetModal = (target) => {
    setPresetTarget(target);
    setShowPresetModal(true);
  };

  const selectPreset = (presetId) => {
    if (presetTarget === 'header') setHeaderPreset(presetId);
    if (presetTarget === 'footer') setFooterPreset(presetId);
    setShowPresetModal(false);
  };

  const renderHeader = () => {
    switch(headerPreset) {
      case 'h_kras': // [기능 추가]: KRAS 전용 헤더 렌더링
        return (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>■ &lt;서식 11&gt;</div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '24px', borderBottom: '2px solid #000', paddingBottom: '4px', display: 'inline-block' }}>KRAS(표준 위험성평가) 양식</h2>
                <div style={{ color: 'blue', fontSize: '14px', marginTop: '4px', fontWeight: 'bold' }}>(http://kras.kosha.or.kr)</div>
              </div>
              <table style={{ borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
                <tbody>
                  <tr>
                    <td rowSpan={2} style={{ border: '1px solid #000', padding: '5px', writingMode: 'vertical-rl', textAlign: 'center' }}>결재</td>
                    <td style={{ border: '1px solid #000', width: '60px', height: '20px' }}></td>
                    <td style={{ border: '1px solid #000', width: '60px' }}></td>
                    <td style={{ border: '1px solid #000', width: '60px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', height: '50px' }}></td>
                    <td style={{ border: '1px solid #000' }}></td>
                    <td style={{ border: '1px solid #000' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: '2px solid #000', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '10px', width: '20%', textAlign: 'left', fontWeight: 'bold' }}>작업공정명 :</td>
                  <td style={{ border: '1px solid #000', padding: '10px', fontSize: '18px', fontWeight: 'bold', width: '60%', textAlign: 'center', letterSpacing: '10px' }}>위 험 성 평 가</td>
                  <td style={{ border: '1px solid #000', padding: '10px', width: '20%', textAlign: 'left', fontWeight: 'bold' }}>평가일시 :</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'h_standard':
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', border: '2px solid #000', padding: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '24px', textAlign: 'center' }}>위험성 평가표 (Job Safety Analysis)</h2>
            </div>
            <div style={{ display: 'flex', border: '1px solid #000' }}>
              <div style={{ borderRight: '1px solid #000', padding: '5px', backgroundColor: '#f2f2f2', display: 'flex', alignItems: 'center' }}>결재</div>
              <div style={{ display: 'flex' }}>
                <div style={{ borderRight: '1px solid #000', width: '60px', height: '60px' }}></div>
                <div style={{ borderRight: '1px solid #000', width: '60px', height: '60px' }}></div>
                <div style={{ width: '60px', height: '60px' }}></div>
              </div>
            </div>
          </div>
        );
      case 'h_simple':
        return (
          <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '10px', textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>위험성 평가표</h2>
            <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#555' }}>작업명: {formData.jobName || '____________________'} | 작성일자: ____________________</p>
          </div>
        );
      default: return null;
    }
  };

  const renderFooter = () => {
    switch(footerPreset) {
      case 'f_standard':
        return (
          <div style={{ marginTop: '10px', borderTop: '2px solid #000', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <div>* 본 문서는 작업 전 현장 근로자에게 내용을 숙지시키고 서명을 받아 보관해야 합니다.</div>
            <div>현장 책임자 서명: ____________________ (인)</div>
          </div>
        );
      case 'f_notice':
        return (
          <div style={{ marginTop: '10px', border: '1px solid #000', padding: '10px', backgroundColor: '#fff9e6', fontSize: '11px' }}>
            <strong>[위험성 평가 범례]</strong><br/>
            - 중대성(Severity): 1(경미), 2(주의), 3(심각)<br/>
            - 가능성(Frequency): 1(드묾), 2(보통), 3(빈번)<br/>
            - 위험성(Risk) = 중대성 x 가능성
          </div>
        );
      default: return null;
    }
  };

  const renderDataTableHeader = () => {
    const currentItems = activeOrder.filter(key => TAG_META[key] || userColumns.find(u => u.id === key));
    const fixedWidth = currentItems.reduce((sum, key) => {
      const meta = TAG_META[key] || userColumns.find(u => u.id === key);
      return sum + (meta?.isFlex ? 0 : (parseInt(meta?.width) || 5));
    }, 0);
    
    const flexItems = currentItems.filter(key => (TAG_META[key]?.isFlex || userColumns.find(u => u.id === key)?.isFlex));
    const remaining = COLS - fixedWidth;

    // [기능 추가]: 다단 헤더 처리를 위한 그룹핑 로직
    let groups = [];
    let currentGroup = null;

    currentItems.forEach(key => {
      const groupDef = COLUMN_GROUPS.find(g => g.children.includes(key));
      if (groupDef) {
        if (currentGroup && currentGroup.label === groupDef.label) {
          currentGroup.keys.push(key);
        } else {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = { label: groupDef.label, keys: [key], isGroup: true };
        }
      } else {
        if (currentGroup) { groups.push(currentGroup); currentGroup = null; }
        groups.push({ label: null, keys: [key], isGroup: false });
      }
    });
    if (currentGroup) groups.push(currentGroup);
    
    return (
      <div style={{ display: 'flex', borderBottom: '1px solid #000', borderLeft: '1px solid #000', backgroundColor: '#fff' }}>
        {groups.map((group, idx) => {
          
          if (group.isGroup) {
            // 병합된 헤더 (다단 구조)
            let groupFlexBasis = 0;
            let groupHasFlex = false;
            let groupStyles = group.keys.map(key => {
               const meta = TAG_META[key] || userColumns.find(u => u.id === key);
               const isFlex = meta?.isFlex;
               const basisPercent = isFlex ? (remaining / flexItems.length / COLS) * 100 : (meta.width / COLS) * 100;
               if (isFlex) groupHasFlex = true;
               groupFlexBasis += basisPercent;
               return { key, meta, isFlex, basisPercent };
            });

            return (
              <div key={`group-${idx}`} style={{
                flex: groupHasFlex ? '1 1 auto' : `0 0 ${groupFlexBasis}%`,
                width: groupHasFlex ? 'auto' : `${groupFlexBasis}%`,
                display: 'flex', flexDirection: 'column',
                borderRight: '1px solid #000'
              }}>
                <div style={{ padding: '8px', textAlign: 'center', fontWeight: 'normal', fontSize: '11px', borderBottom: '1px solid #000', color: '#000' }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flex: 1 }}>
                  {groupStyles.map((item, i) => (
                    <div key={item.key} style={{
                      flex: item.isFlex ? '1 1 auto' : `0 0 ${(item.basisPercent / groupFlexBasis) * 100}%`,
                      width: item.isFlex ? 'auto' : `${(item.basisPercent / groupFlexBasis) * 100}%`,
                      padding: '8px 4px',
                      borderRight: i === groupStyles.length - 1 ? 'none' : '1px solid #000',
                      textAlign: 'center', fontWeight: 'normal', fontSize: '11px', color: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {item.meta.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          } else {
            // 단일 헤더
            const key = group.keys[0];
            const meta = TAG_META[key] || userColumns.find(u => u.id === key);
            if (!meta) return null;
            let flexBasis = meta.isFlex ? `${(remaining / flexItems.length / COLS) * 100}%` : `${(meta.width / COLS) * 100}%`;

            return (
              <div key={key} style={{
                flex: meta.isFlex ? '1 1 auto' : `0 0 ${flexBasis}`,
                width: meta.isFlex ? 'auto' : flexBasis,
                padding: '8px 4px',
                borderRight: '1px solid #000',
                textAlign: 'center', fontWeight: 'normal', fontSize: '11px', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {meta.label}
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .canvas-container { transform-origin: top center; transition: transform 0.2s ease; margin: 0 auto; background-color: #fff; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.7); width: fit-content; min-width: 800px; }
      `}</style>
      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>
      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}><AdBanner slot="4000000001" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper}><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div><div style={styles.stepLineActive} /><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div><div style={styles.stepLineActive} /><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>위험 분석</span></div><div style={styles.stepLineActive} /><div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>4</div><span style={styles.stepTextActive}>양식 설정</span></div><div style={styles.stepLine} /><div style={styles.stepItem}><div style={styles.stepBadge}>5</div><span style={styles.stepText}>최종 출력</span></div></nav>
            <div style={styles.formHeader}><h2 style={styles.formTitle}>| 04. 양식 설정 (구역 분할형)</h2></div>
            <div style={styles.builderLayout}>
              <aside style={styles.toolbarSliding}>
                
                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>양식 템플릿 로드</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button style={{...styles.miniBtn, backgroundColor: '#007bff', padding: '12px'}} onClick={() => setShowServiceModal(true)}>서비스 제공 양식 불러오기</button>
                    <button style={{...styles.miniBtn, backgroundColor: '#6f42c1', padding: '12px'}} onClick={openLoadModal}>내 스크랩 양식 불러오기</button>
                    <button style={{...styles.miniBtn, backgroundColor: '#4caf50', padding: '8px', marginTop: '4px'}} onClick={() => setShowSaveModal(true)}>현재 상태 스크랩(저장)하기</button>
                  </div>
                </div>

                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>레이아웃 설정</h3>
                  <div style={styles.buttonGroupSmall}>
                    <button style={{...styles.miniBtn, backgroundColor: orientation === 'landscape' ? '#444' : '#222'}} onClick={() => setOrientation('landscape')}>가로형</button>
                    <button style={{...styles.miniBtn, backgroundColor: orientation === 'portrait' ? '#444' : '#222'}} onClick={() => setOrientation('portrait')}>세로형</button>
                  </div>
                  <div style={styles.inputFieldCompact}><span style={{fontSize:'0.6rem', color:'#888'}}>화면 확대/축소</span><input type="range" min="0.5" max="1.5" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={styles.rangeInputCompact} /></div>
                </div>

                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>데이터 테이블 항목 구성</h3>
                  <div style={styles.tagToggleContainerCompact}>{Object.keys(TAG_META).map(key => { const isActive = activeOrder.includes(key); return ( <button key={key} onClick={() => toggleTag(key)} style={{...styles.tagBtnSmall, backgroundColor: isActive ? TAG_META[key].color : '#161616', color: isActive ? '#fff' : '#666', borderColor: TAG_META[key].color, opacity: 1}}>{TAG_META[key].label}</button> ); })}</div>
                  <div style={styles.dragScrollArea}>{activeOrder.map((key, idx) => { const meta = TAG_META[key] || userColumns.find(u => u.id === key); if (!meta) return null; const isUser = key.startsWith('USER_'); return ( <div key={key} draggable onDragStart={() => setDraggedIdx(idx)} onDragOver={(e) => handleDragOver(e, idx)} className="tag-item" style={{...styles.dragTagMini, borderColor: meta.color || '#444', backgroundColor: meta.color ? `${meta.color}33` : '#222'}}> <span style={{cursor:'grab', color:'#888', marginRight:'8px'}}>☰</span> {isUser ? ( <div style={{display:'flex', gap:'4px', flex:1, alignItems:'center'}}> <input style={styles.miniInputNoBorder} value={meta.label} onChange={(e) => setUserColumns(prev => prev.map(u => u.id === key ? {...u, label: e.target.value} : u))} /> <div style={{display:'flex', alignItems:'center', gap:'2px', backgroundColor:'rgba(0,0,0,0.5)', padding:'0 4px', borderRadius:'4px'}}><span style={{fontSize:'0.6rem', color:'#555'}}>너비비율</span><input type="number" style={styles.numInputPure} value={meta.width} onChange={(e) => handleWidthChange(key, e.target.value)} /></div> <button onClick={() => { setActiveOrder(prev => prev.filter(k=>k!==key)); setUserColumns(prev => prev.filter(u=>u.id!==key)); }} style={styles.miniDelBtnActive}>×</button> </div> ) : <span style={{flex:1, fontSize:'0.75rem', color:'#eee'}}>{meta.label}</span>} </div> ); })}</div>
                  <button style={styles.addBtnMini} onClick={addUserColumn}>+ 커스텀 항목 추가</button>
                </div>
              </aside>

              <section style={styles.gridCanvasWrapper}>
                <div style={styles.canvasScrollArea}>
                  <div className="canvas-container" style={{ transform: `scale(${zoom})`, width: orientation === 'landscape' ? '1100px' : '750px' }}>
                    
                    {/* 상단: 헤더 구역 */}
                    <div style={styles.sectionBlock}>
                      <div style={styles.sectionOverlay} onClick={() => openPresetModal('header')}>
                        <span style={styles.sectionOverlayText}>헤더(머리말) 구역 클릭하여 변경</span>
                      </div>
                      {renderHeader()}
                      {headerPreset === 'h_none' && <div style={{ padding: '20px', textAlign: 'center', color: '#ccc', border: '1px dashed #ccc' }}>헤더 없음</div>}
                    </div>

                    {/* 중단: 데이터 테이블 구역 */}
                    <div style={{...styles.sectionBlock, marginTop: '20px', marginBottom: '20px'}}>
                      {renderDataTableHeader()}
                      <div style={{ height: '200px', backgroundColor: '#fafafa', border: '1px solid #000', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>
                        (입력된 위험성 평가 데이터가 이 위치에 자동 전개됩니다)
                      </div>
                    </div>

                    {/* 하단: 푸터 구역 */}
                    <div style={styles.sectionBlock}>
                      <div style={styles.sectionOverlay} onClick={() => openPresetModal('footer')}>
                        <span style={styles.sectionOverlayText}>푸터(꼬리말) 구역 클릭하여 변경</span>
                      </div>
                      {renderFooter()}
                      {footerPreset === 'f_none' && <div style={{ padding: '20px', textAlign: 'center', color: '#ccc', border: '1px dashed #ccc' }}>푸터 없음</div>}
                    </div>

                  </div>
                </div>
              </section>
            </div>
            <div style={styles.btnAreaLayout}><button style={styles.prevBtnDark} onClick={goBackToAnalysis}>처음으로</button><button style={styles.nextBtnLight} onClick={goToExport}>최종 출력 단계로 이동</button></div>
          </div>
        </main>
        <aside style={styles.sideAd}><AdBanner slot="4000000002" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
      </div>

      {showPresetModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>{presetTarget === 'header' ? '상단 헤더(머리말) 양식 선택' : '하단 푸터(꼬리말) 양식 선택'}</h3>
            <div style={styles.layoutListWrapper}>
              {(presetTarget === 'header' ? HEADER_PRESETS : FOOTER_PRESETS).map(preset => (
                <button 
                  key={preset.id} 
                  style={{
                    ...styles.presetSelectBtn,
                    borderColor: (presetTarget === 'header' ? headerPreset : footerPreset) === preset.id ? '#007bff' : '#444'
                  }}
                  onClick={() => selectPreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div style={styles.modalBtnGroup}>
              <button style={{...styles.modalBtnSecondary, width: '100%'}} onClick={() => setShowPresetModal(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {showServiceModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>서비스 제공 양식 불러오기</h3>
            <div style={styles.layoutListWrapper}>
              {SERVICE_LAYOUT_PRESETS.map(preset => (
                <div key={preset.id} style={styles.layoutListItem}>
                  <span style={{ flex: 1, color: '#fff', fontSize: '0.9rem' }}>{preset.name}</span>
                  <button style={styles.modalBtnPrimary} onClick={() => applyLayout(preset.layout_data)}>적용</button>
                </div>
              ))}
            </div>
            <div style={styles.modalBtnGroup}>
              <button style={{...styles.modalBtnSecondary, width: '100%'}} onClick={() => setShowServiceModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>내 스크랩에 양식 추가하기</h3>
            <input style={styles.modalInput} placeholder="스크랩할 이름을 입력하세요" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
            <div style={styles.modalBtnGroup}>
              <button style={styles.modalBtnSecondary} onClick={() => setShowSaveModal(false)}>취소</button>
              <button style={styles.modalBtnPrimary} onClick={handleSaveLayout}>저장하기</button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>내 스크랩 양식 불러오기</h3>
            <div style={styles.layoutListWrapper}>
              {savedLayouts.length === 0 ? (
                <div style={{ color: '#888', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>스크랩된 양식이 없습니다.</div>
              ) : (
                savedLayouts.map(layout => (
                  <div key={layout.id} style={styles.layoutListItem}>
                    <span style={{ flex: 1, color: '#fff', fontSize: '0.85rem' }}>{layout.name}</span>
                    <button style={styles.modalBtnPrimary} onClick={() => applyLayout(layout.layout_data)}>적용</button>
                    <button style={styles.layoutDeleteBtn} onClick={() => deleteLayout(layout.id)}>삭제</button>
                  </div>
                ))
              )}
            </div>
            <div style={styles.modalBtnGroup}>
              <button style={{...styles.modalBtnSecondary, width: '100%'}} onClick={() => setShowLoadModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
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
  toolbarSliding: { width: '300px', backgroundColor: 'rgba(24, 24, 24, 0.95)', border: '1px solid #333', borderRadius: '10px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' },
  toolSectionCompact: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  toolTitleMini: { color: '#aaa', fontSize: '0.85rem', fontWeight: '900', borderLeft: '3px solid #007bff', paddingLeft: '8px' },
  buttonGroupSmall: { display: 'flex', gap: '6px' },
  miniBtn: { flex: 1, padding: '10px', backgroundColor: '#222', color: '#fff', border: '1px solid #333', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' },
  rangeInputCompact: { width: '100%', height: '4px', cursor: 'pointer', accentColor: '#007bff' },
  tagToggleContainerCompact: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  tagBtnSmall: { padding: '6px 10px', border: '1px solid #333', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  dragScrollArea: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' },
  dragTagMini: { padding: '10px', border: '1px solid', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center' },
  miniInputNoBorder: { background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', fontSize: '0.8rem', outline: 'none', flex: 1, padding: '4px 6px', borderRadius: '3px', maxWidth: '100px' },
  numInputPure: { width: '30px', background: 'none', border: 'none', color: '#007bff', fontSize: '0.85rem', textAlign: 'center', outline: 'none', fontWeight: 'bold' },
  miniDelBtnActive: { background: 'transparent', color: '#ff4d4d', border: 'none', borderRadius: '4px', width: '22px', height: '22px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', fontWeight: 'bold' },
  addBtnMini: { width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px dashed #444', color: '#aaa', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  gridCanvasWrapper: { flex: 1, backgroundColor: 'rgba(20, 20, 20, 0.8)', borderRadius: '10px', padding: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' },
  canvasScrollArea: { flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '30px' },
  sectionBlock: { position: 'relative', width: '100%' },
  sectionOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 123, 255, 0.05)', border: '2px dashed transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'all 0.2s', zIndex: 10, ':hover': { opacity: 1, borderColor: '#007bff', backgroundColor: 'rgba(0, 123, 255, 0.1)' } },
  sectionOverlayText: { backgroundColor: '#007bff', color: '#fff', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none' },
  btnAreaLayout: { marginTop: '1.5rem', display: 'flex', gap: '1rem' },
  prevBtnDark: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtnLight: { flex: 2, padding: '1rem', backgroundColor: '#fff', color: '#000', fontWeight: '800', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.05rem' },
  inputFieldCompact: { backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', border: '1px solid #333' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '2.5rem', width: '450px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' },
  modalTitle: { fontSize: '1.3rem', color: '#fff', fontWeight: 'bold', margin: 0, textAlign: 'center' },
  modalInput: { backgroundColor: '#0a0a0a', border: '1px solid #444', color: '#fff', padding: '1rem', borderRadius: '6px', fontSize: '1rem', outline: 'none' },
  modalBtnGroup: { display: 'flex', gap: '10px' },
  modalBtnPrimary: { flex: 1, backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' },
  modalBtnSecondary: { flex: 1, backgroundColor: '#333', color: '#fff', border: 'none', padding: '1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' },
  layoutListWrapper: { display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', padding: '10px 0' },
  presetSelectBtn: { padding: '1rem', backgroundColor: '#222', border: '2px solid', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', textAlign: 'left', transition: 'border-color 0.2s' },
  layoutListItem: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#222', padding: '12px', borderRadius: '6px' },
  layoutDeleteBtn: { backgroundColor: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }
};