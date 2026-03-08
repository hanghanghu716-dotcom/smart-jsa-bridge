import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../supabaseClient'; 
import AdBanner from '../AdBanner';

/**
 * [Export 컴포넌트 - 6단계 개편 및 모듈/KRAS 양식 반영본]
 * 역할: Step 6. 양식 설정 단계에서 구성한 모듈과 데이터 표를 실제 흑백 출력용 PDF로 렌더링합니다.
 * 에디터 위치: src/pages/Export.jsx
 */

const TAG_META = {
  // 일반 JSA 태그
  'DATA_STEP_NO': { label: '작업번호', color: '#6c757d', width: 2, align: 'center' },
  'DATA_STEP_TITLE': { label: '작업단계', color: '#0d6efd', width: 5, align: 'left' },
  'DATA_PHOTO': { label: '관련사진', color: '#6f42c1', width: 3, align: 'center' },
  'DATA_HAZARD': { label: '유해위험요인', color: '#dc3545', isFlex: true, align: 'left' },
  'DATA_CURRENT_MEASURE': { label: '현재 안전대책', color: '#fd7e14', isFlex: true, align: 'left' },
  'DATA_RECOMMEND_MEASURE': { label: '감소권고대책', color: '#198754', isFlex: true, align: 'left' },
  'DATA_SEVERITY': { label: '중대성', color: '#20c997', width: 2, align: 'center' },
  'DATA_FREQUENCY': { label: '가능성', color: '#20c997', width: 2, align: 'center' },
  'DATA_RISK': { label: '위험성', color: '#e83e8c', width: 2, align: 'center' },

  // KRAS 표준 양식 전용 태그
  'DATA_KRAS_STEP': { label: '세부 작업 내용', color: '#0d6efd', width: 4, align: 'left' },
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

const COLUMN_GROUPS = [
  { label: '유해 위험요인 파악', children: ['DATA_KRAS_HAZARD_CLASS', 'DATA_KRAS_HAZARD_DETAIL'] },
  { label: '위험성', children: ['DATA_KRAS_FREQ', 'DATA_KRAS_SEV', 'DATA_KRAS_RISK'] }
];

export default function Export() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState(null); 
  
  const { 
    existingId = null, 
    analysisData = [], 
    formData = {}, 
    participants = [], 
    procedures = [], 
    savedHeaderPreset = 'h_kras',
    savedFooterPreset = 'f_none',
    savedModules = [],
    savedActiveOrder = [],
    savedUserColumns = [],
    savedOrientation = 'landscape' 
  } = location.state || {};

  const jsaType = formData.jsaType || '2-step';
  const COLS = savedOrientation === 'landscape' ? 56 : 40; 
  const PAPER_WIDTH = savedOrientation === 'landscape' ? '1080px' : '750px';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('username, signature_url').eq('id', user.id).single();
          setUserProfile(data);
        }
      } catch (err) { console.error("Profile fetch error:", err); }
    };
    fetchProfile();
  }, []);

  const [stepPhotos, setStepPhotos] = useState({});
  const [activePhotoRow, setActivePhotoRow] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setStepPhotos(prev => ({ ...prev, [activePhotoRow]: event.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleLogoClick = () => { if (window.confirm("메인 화면으로 이동하시겠습니까?")) navigate('/'); };

  const handleCloudAction = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("로그인이 필요한 서비스입니다.");
      const autoTags = [formData.projectName, ...(analysisData.map(d => d.proc?.stepTitle))].filter(Boolean);
      const projectData = { 
        user_id: user.id, 
        project_name: formData.projectName, 
        form_data: formData, 
        analysis_data: analysisData, 
        custom_layout: { savedHeaderPreset, savedFooterPreset, savedModules, savedActiveOrder, savedUserColumns, savedOrientation }, 
        auto_tags: autoTags, 
        updated_at: new Date() 
      };
      const { error } = await supabase.from('jsa_projects').upsert(projectData);
      if (error) throw error;
      alert("클라우드 저장 및 자동 태깅이 완료되었습니다.");
    } catch (err) { alert("저장 중 오류 발생: " + err.message); } finally { setIsProcessing(false); }
  };

  // [기능 추가] 헤더 프리셋 렌더링
  const renderHeader = () => {
    switch(savedHeaderPreset) {
      case 'h_kras':
        return (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>■ &lt;서식 11&gt;</div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '24px', borderBottom: '2px solid #000', paddingBottom: '4px', display: 'inline-block' }}>KRAS(표준 위험성평가) 양식</h2>
                <div style={{ color: '#000', fontSize: '14px', marginTop: '4px', fontWeight: 'bold' }}>(http://kras.kosha.or.kr)</div>
              </div>
              <table style={{ borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
                <tbody>
                  <tr>
                    <td rowSpan={2} style={{ border: '1px solid #000', padding: '5px', writingMode: 'vertical-rl', textAlign: 'center' }}>결재</td>
                    <td style={{ border: '1px solid #000', width: '60px', height: '20px', textAlign: 'center' }}>작성</td>
                    <td style={{ border: '1px solid #000', width: '60px', textAlign: 'center' }}>검토</td>
                    <td style={{ border: '1px solid #000', width: '60px', textAlign: 'center' }}>승인</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', height: '50px' }}></td>
                    <td style={{ border: '1px solid #000' }}></td>
                    <td style={{ border: '1px solid #000' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'h_standard':
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', border: '2px solid #000', padding: '10px', marginBottom: '15px' }}>
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
          <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px', textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>위험성 평가표</h2>
          </div>
        );
      default: return null;
    }
  };

  // [기능 추가] 푸터 프리셋 렌더링
  const renderFooter = () => {
    switch(savedFooterPreset) {
      case 'f_standard':
        return (
          <div style={{ marginTop: '15px', borderTop: '2px solid #000', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <div>* 본 문서는 작업 전 현장 근로자에게 내용을 숙지시키고 서명을 받아 보관해야 합니다.</div>
            <div>현장 책임자 서명: ____________________ (인)</div>
          </div>
        );
      case 'f_notice':
        return (
          <div style={{ marginTop: '15px', border: '1px solid #000', padding: '10px', fontSize: '11px' }}>
            <strong>[위험성 평가 범례]</strong><br/>
            - 중대성(Severity): 1(경미), 2(주의), 3(심각) / 가능성(Frequency): 1(드묾), 2(보통), 3(빈번)<br/>
            - 위험성(Risk) = 중대성 x 가능성
          </div>
        );
      default: return null;
    }
  };

  // [기능 추가] 부가 PTW 모듈 렌더링
  const renderModules = () => {
    if (!savedModules || savedModules.length === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
        {savedModules.includes('mod_job_info') && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', width: '15%', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>작업명</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '35%' }}>{formData.projectName || ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '15%', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>수행부서</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '35%' }}></td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>작업지역</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>수행일자</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}></td>
              </tr>
            </tbody>
          </table>
        )}

        {savedModules.includes('mod_ppe') && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', width: '15%', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>개인보호구</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '85%' }}>
                  [ ]안전모 [ ]안전화 [ ]보안경 [ ]안전대 [ ]방진마스크 [ ]방독마스크 [ ]송기마스크 [ ]내화복 [ ]기타( )
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {savedModules.includes('mod_high_risk') && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', width: '15%', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>고위험작업</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '85%' }}>
                  [ ]화기작업 [ ]밀폐공간 [ ]정전/활선 [ ]고소작업 [ ]중량물취급 [ ]굴착작업 [ ]방사선작업 [ ]기타( )
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {savedModules.includes('mod_loto') && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td rowSpan="2" style={{ border: '1px solid #000', padding: '8px', width: '15%', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>LOTO 격리</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>차단 개소 / 밸브 번호</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>자물쇠/태그 번호</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>확인자 서명</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '12px' }}></td>
                <td style={{ border: '1px solid #000', padding: '12px' }}></td>
                <td style={{ border: '1px solid #000', padding: '12px' }}></td>
              </tr>
            </tbody>
          </table>
        )}
        
        {savedModules.includes('mod_gas') && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td rowSpan="2" style={{ border: '1px solid #000', padding: '8px', width: '15%', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>가스 농도</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>측정 시간</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>산소 (O2)</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>가연성 (LEL)</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>독성 (H2S, CO 등)</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>측정자</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px' }}></td>
                <td style={{ border: '1px solid #000', padding: '10px' }}></td>
                <td style={{ border: '1px solid #000', padding: '10px' }}></td>
                <td style={{ border: '1px solid #000', padding: '10px' }}></td>
                <td style={{ border: '1px solid #000', padding: '10px' }}></td>
              </tr>
            </tbody>
          </table>
        )}

        {savedModules.includes('mod_watcher') && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', width: '15%', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>작업 감시인</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '85%' }}>
                  역할: [ ]화재감시 [ ]밀폐감시 [ ]신호수 [ ]기타( ) &nbsp;&nbsp;|&nbsp;&nbsp; 성명: ________________ (서명)
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {savedModules.includes('mod_simops') && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', width: '15%', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>SIMOPS 간섭</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '85%' }}>
                  인접 타 작업 유무: [ ]있음 [ ]없음 &nbsp;&nbsp;|&nbsp;&nbsp; 조치사항: __________________________________________________
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {savedModules.includes('mod_tbm') && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px', marginTop: '10px' }}>
            <tbody>
              <tr>
                <td rowSpan="4" style={{ border: '1px solid #000', padding: '8px', width: '15%', backgroundColor: '#f2f2f2', fontWeight: 'bold', textAlign: 'center' }}>TBM 명부</td>
                <td colSpan="5" style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9f9f9', fontWeight: 'bold' }}>전달 및 교육사항 요약:</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9', width: '15%' }}>소속/업체</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9', width: '15%' }}>직책</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9', width: '20%' }}>성명</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9', width: '20%' }}>서명</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', backgroundColor: '#f9f9f9', width: '15%' }}>비고</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '12px' }}></td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '12px' }}></td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // [기능 추가] 다단 헤더 및 데이터 바인딩 테이블 렌더링
  const renderDataTable = () => {
    if (!savedActiveOrder || savedActiveOrder.length === 0) return null;

    const currentItems = savedActiveOrder.filter(key => TAG_META[key] || savedUserColumns.find(u => u.id === key));
    const fixedWidth = currentItems.reduce((sum, key) => {
      const meta = TAG_META[key] || savedUserColumns.find(u => u.id === key);
      return sum + (meta?.isFlex ? 0 : (parseInt(meta?.width) || 5));
    }, 0);
    
    const flexItems = currentItems.filter(key => (TAG_META[key]?.isFlex || savedUserColumns.find(u => u.id === key)?.isFlex));
    const remaining = COLS - fixedWidth;

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

    // 헤더 렌더링
    const tableHeader = (
      <div style={{ display: 'flex', borderBottom: '1px solid #000', borderTop: '2px solid #000' }}>
        {groups.map((group, idx) => {
          if (group.isGroup) {
            let groupFlexBasis = 0;
            let groupHasFlex = false;
            let groupStyles = group.keys.map(key => {
               const meta = TAG_META[key] || savedUserColumns.find(u => u.id === key);
               const isFlex = meta?.isFlex;
               const basisPercent = isFlex ? (remaining / flexItems.length / COLS) * 100 : (meta.width / COLS) * 100;
               if (isFlex) groupHasFlex = true;
               groupFlexBasis += basisPercent;
               return { key, meta, isFlex, basisPercent };
            });

            return (
              <div key={`th-group-${idx}`} style={{
                flex: groupHasFlex ? '1 1 auto' : `0 0 ${groupFlexBasis}%`,
                width: groupHasFlex ? 'auto' : `${groupFlexBasis}%`,
                display: 'flex', flexDirection: 'column',
                borderRight: '1px solid #000'
              }}>
                <div style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #000', backgroundColor: '#f0f0f0' }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flex: 1 }}>
                  {groupStyles.map((item, i) => (
                    <div key={item.key} style={{
                      flex: item.isFlex ? '1 1 auto' : `0 0 ${(item.basisPercent / groupFlexBasis) * 100}%`,
                      width: item.isFlex ? 'auto' : `${(item.basisPercent / groupFlexBasis) * 100}%`,
                      padding: '6px 4px',
                      borderRight: i === groupStyles.length - 1 ? 'none' : '1px solid #000',
                      textAlign: 'center', fontWeight: 'bold', fontSize: '11px', backgroundColor: '#f9f9f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {item.meta.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          } else {
            const key = group.keys[0];
            const meta = TAG_META[key] || savedUserColumns.find(u => u.id === key);
            let flexBasis = meta.isFlex ? `${(remaining / flexItems.length / COLS) * 100}%` : `${(meta.width / COLS) * 100}%`;

            return (
              <div key={`th-${key}`} style={{
                flex: meta.isFlex ? '1 1 auto' : `0 0 ${flexBasis}`,
                width: meta.isFlex ? 'auto' : flexBasis,
                padding: '6px 4px',
                borderRight: '1px solid #000',
                textAlign: 'center', fontWeight: 'bold', fontSize: '11px', backgroundColor: '#f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {meta.label}
              </div>
            );
          }
        })}
      </div>
    );

    // 본문 데이터 렌더링
    const tableBody = analysisData.map((stepData, stepIdx) => {
      return (
        <div key={`tr-${stepIdx}`} style={{ display: 'flex', borderBottom: '1px solid #000' }}>
          {currentItems.map((key) => {
            const meta = TAG_META[key] || savedUserColumns.find(u => u.id === key);
            let flexBasis = meta.isFlex ? `${(remaining / flexItems.length / COLS) * 100}%` : `${(meta.width / COLS) * 100}%`;
            
            let content = "";
            if (key === 'DATA_STEP_NO') content = String(stepIdx + 1);
            else if (key === 'DATA_STEP_TITLE' || key === 'DATA_KRAS_STEP') content = stepData.proc?.stepTitle || "";
            else if (key === 'DATA_HAZARD' || key === 'DATA_KRAS_HAZARD_DETAIL') content = stepData.risks.map(r => `• ${r.factor}`).join('\n');
            else if (key === 'DATA_CURRENT_MEASURE' || key === 'DATA_KRAS_CURRENT') content = stepData.risks.map(r => `• ${jsaType === '2-step' ? r.measure : r.current_measure}`).join('\n');
            else if (key === 'DATA_RECOMMEND_MEASURE' || key === 'DATA_KRAS_RECOMMEND') content = stepData.risks.map(r => `• ${jsaType === '2-step' ? r.measure : r.recommend_measure}`).join('\n');
            else if (key === 'DATA_SEVERITY' || key === 'DATA_KRAS_SEV') content = String(stepData.severity || "-");
            else if (key === 'DATA_FREQUENCY' || key === 'DATA_KRAS_FREQ') content = String(stepData.frequency || "-");
            else if (key === 'DATA_RISK' || key === 'DATA_KRAS_RISK') content = String(stepData.riskLevel || "-");
            else if (key === 'DATA_KRAS_HAZARD_CLASS') content = stepData.risks[0]?.category || "";
            else if (key === 'DATA_PHOTO') {
              return (
                <div key={`td-${key}-${stepIdx}`} onClick={() => { setActivePhotoRow(stepIdx); fileInputRef.current.click(); }} style={{ flex: `0 0 ${flexBasis}`, width: flexBasis, borderRight: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}> 
                  {stepPhotos[stepIdx] ? <img src={stepPhotos[stepIdx]} style={{width:'100%', height:'100%', objectFit:'contain'}} alt="Photo" /> : <span style={{color:'#ccc', fontSize:'10px'}}>+ 사진</span>} 
                </div>
              );
            }

            const hasBullet = content.includes('•');

            return (
              <div key={`td-${key}-${stepIdx}`} style={{
                flex: meta.isFlex ? '1 1 auto' : `0 0 ${flexBasis}`,
                width: meta.isFlex ? 'auto' : flexBasis,
                padding: '6px 4px',
                borderRight: '1px solid #000',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: meta.align || 'center',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                paddingLeft: hasBullet ? '12px' : '4px'
              }}>
                {content}
              </div>
            );
          })}
        </div>
      );
    });

    return (
      <div style={{ width: '100%', borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>
        {tableHeader}
        {tableBody}
      </div>
    );
  };

  const generatePDF = async () => {
    setIsProcessing(true);
    const paper = document.querySelector('.reportPaper');
    if (!paper) return setIsProcessing(false);

    try {
      const canvas = await html2canvas(paper, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;

      const doc = new jsPDF(savedOrientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const pxToMm = contentWidth / imgWidthPx;
      const contentHeightMm = imgHeightPx * pxToMm;

      let leftHeightMm = contentHeightMm;
      let positionMm = 0;

      while (leftHeightMm > 0) {
        let maxPageHeightMm = pageHeight - (margin * 2);
        let sliceHeightMm = leftHeightMm > maxPageHeightMm ? maxPageHeightMm : leftHeightMm;

        const sourceY = positionMm / pxToMm;
        const sourceH = sliceHeightMm / pxToMm;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgWidthPx;
        tempCanvas.height = sourceH;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, sourceY, imgWidthPx, sourceH, 0, 0, imgWidthPx, sourceH);
        
        doc.addImage(tempCanvas.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, sliceHeightMm);
        
        leftHeightMm -= sliceHeightMm;
        positionMm += sliceHeightMm;

        if (leftHeightMm > 0) {
          doc.addPage();
        }
      }

      doc.save(`JSA_Report_${formData.projectName || 'final'}.pdf`);
    } catch (error) { alert("PDF 생성 실패"); } finally { setIsProcessing(false); }
  };

  return (
    <div style={styles.wrapper}>
      {isProcessing && <div style={styles.modalOverlay}><div style={styles.loaderText}>데이터 처리 중...</div></div>}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handlePhotoChange} />
      <div style={styles.bgWrapper} className="no-print"><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header} className="no-print"><h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1></header>
      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}><AdBanner slot="5000000001" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            
            {/* 6단계 Stepper */}
            <nav style={styles.stepper} className="no-print">
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>위험 분석</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>모듈 구성</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>표 구성</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>6</div><span style={styles.stepTextActive}>최종 출력</span></div>
            </nav>
            
            <div style={styles.formHeader}><h2 style={styles.formTitle}>| 06. 최종 출력</h2></div>
            <div style={styles.previewArea}>
              <div className="reportPaper" style={{...styles.reportPaper, width: PAPER_WIDTH}}>
                {renderHeader()}
                {renderModules()}
                {renderDataTable()}
                {renderFooter()}
              </div>
            </div>
            <div style={styles.btnArea} className="no-print">
              <button style={styles.prevBtn} onClick={() => navigate('/layout-table', { state: location.state })}>테이블 구성 수정</button>
              <button style={{...styles.nextBtn, backgroundColor: '#007bff', color: '#fff'}} onClick={handleCloudAction}>클라우드 저장 (자동 태깅)</button>
              <button style={styles.nextBtn} onClick={generatePDF}>PDF 파일 생성 및 저장</button>
            </div>
          </div>
        </main>
        <aside style={styles.sideAd}><AdBanner slot="5000000002" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' },
  bgWrapper: { position: 'fixed', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image4.jpg)', backgroundSize: 'cover', filter: 'brightness(0.12)', backgroundPosition: 'center' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: '#fff', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', padding: '0 5rem 60px', zIndex: 10, gap: '3rem', overflow: 'hidden', alignItems: 'center' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1550px', height: '82vh', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '1.5rem 2.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.9)' },
  
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', gap: '0.4rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  stepBadgeDone: { width: '18px', height: '18px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem' },
  stepTextDone: { fontSize: '0.75rem', color: '#4caf50', fontWeight: '700' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  stepBadgeActive: { width: '18px', height: '18px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' },
  stepTextActive: { fontSize: '0.75rem', color: '#fff', fontWeight: '700' },
  stepLineActive: { width: '20px', height: '1px', backgroundColor: '#4caf50' },
  
  formHeader: { marginBottom: '1.2rem', borderLeft: '5px solid #007bff', paddingLeft: '1rem' },
  formTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#fff' },
  previewArea: { flex: 1, overflowY: 'auto', backgroundColor: '#111', borderRadius: '10px', padding: '3rem', display: 'flex', justifyContent: 'center', border: '1px solid #333' },
  
  reportPaper: { 
    color: '#000', 
    backgroundColor: '#fff', 
    height: 'auto', 
    display: 'flex',
    flexDirection: 'column',
    padding: '40px', 
    boxShadow: '0 10px 40px rgba(0,0,0,0.8)', 
    boxSizing: 'border-box', 
    fontFamily: '"Malgun Gothic", sans-serif' 
  },
  
  btnArea: { display: 'flex', gap: '1.2rem', marginTop: '1.5rem' },
  prevBtn: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtn: { flex: 2, padding: '1rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  loaderText: { color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }
};

if (typeof document !== 'undefined') {
  const styleId = "jsa-bridge-global-style";
  let styleTag = document.getElementById(styleId);
  if (!styleTag) { styleTag = document.createElement("style"); styleTag.id = styleId; document.head.appendChild(styleTag); }
  styleTag.innerHTML = ` html, body, #root { min-height: 100%; margin: 0; padding: 0; background-color: #000 !important; overflow-y: auto !important; } * { -ms-overflow-style: none !important; scrollbar-width: none !important; outline: none !important; } *::-webkit-scrollbar { display: none !important; } `;
}