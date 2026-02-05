import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RiskClassification() {
  const navigate = useNavigate();

  // 고위험 작업 9대 유형 데이터
  const highRiskTasks = [
    { t: "고소 작업", c: "추락 위험이 있는 2m 이상의 높은 장소 작업" },
    { t: "밀폐공간 작업", c: "산소결핍, 유해가스 체류 위험이 있는 공간" },
    { t: "화기 작업", c: "용접, 용단 등 불꽃이나 열이 발생하는 작업" },
    { t: "중량물 취급", c: "크레인, 지게차 등을 이용한 화물 인양 작업" },
    { t: "전기 작업", c: "특고압/저압 선로 근접 및 활선 관련 작업" },
    { t: "굴착 작업", c: "지반 붕괴 및 매설물 파손 위험이 있는 작업" },
    { t: "방사선 작업", c: "비파괴 검사 등 방사선 노출 위험 작업" },
    { t: "화학물질 취급", c: "독성, 인화성 물질의 충전 및 이송 작업" },
    { t: "정비/보수 작업", c: "설비 가동 중지 후 내부 점검 및 수리 작업" }
  ];

  // 이미지 2의 데이터 기반 라벨 정의
  const frequencyLabels = { 5: "빈번함", 4: "높음", 3: "있음", 2: "낮음", 1: "거의없음" };
  const severityLabels = { 1: "영향없음", 2: "경미한 불휴업", 3: "경미한 휴업", 4: "중대재해" };

  // 위험도 등급별 색상 및 라벨 매핑
  const getRiskConfig = (score) => {
    if (score >= 16) return { bg: '#FFF1F1', color: '#D32F2F', label: '허용불가', border: '#FFCDD2' };
    if (score >= 12) return { bg: '#FFF8F1', color: '#E65100', label: '중대한 위험', border: '#FFE0B2' };
    if (score >= 9) return { bg: '#FFFDF1', color: '#F57F17', label: '상당한 위험', border: '#FFF9C4' };
    if (score === 8) return { bg: '#F9FBE7', color: '#827717', label: '경미한 위험', border: '#F0F4C3' };
    if (score >= 4) return { bg: '#F1F8E9', color: '#388E3C', label: '미미한 위험', border: '#DCEDC8' };
    return { bg: '#F5F5F5', color: '#616161', label: '무시 가능', border: '#E0E0E0' };
  };

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.container}>
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={styles.heroSection}>
        <div style={styles.container}>
          <span style={styles.m3Tag}>KOSHA & MOEL STANDARD</span>
          <h2 style={styles.mainTitle}>위험도 분류 및 리스크 매트릭스 가이드</h2>
          <p style={styles.subTitle}>
            고용노동부 지침에 따른 빈도와 강도의 정밀 조합을 통해<br />
            과학적이고 객관적인 안전 관리 체계를 수립하십시오.
          </p>
        </div>
      </section>

      {/* SECTION 1: DEFINITION */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>1. 작업 성격에 따른 기본 정의</h3>
          <div style={styles.splitRow}>
            <div style={styles.cardHalf}>
              <h4 style={{...styles.itemHeader, color: '#666'}}>일반작업 (General Work)</h4>
              <p style={styles.itemContent}>
                상시 발생하는 반복적 작업으로, 기존 표준작업절차서(SOP) 내에서 위험 요인이 충분히 통제되는 작업을 의미합니다.
              </p>
            </div>
            <div style={styles.cardHalfHighlight}>
              <h4 style={styles.itemHeader}>고위험작업 (High-Risk Work)</h4>
              <p style={styles.itemContent}>
                단 한 번의 실수가 중대재해(사망, 불능)로 직결될 수 있는 에너지를 다루거나, 비일상적으로 수행되는 고난도 작업을 의미합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: RISK MATRIX */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>2. 정량적 분류 기준 (Risk Matrix)</h3>
          
          <div style={styles.mathCardNormal}>
            <div style={styles.mathDisplay}>
              <span style={styles.mathVar}>Risk Score</span>
              <span style={styles.mathOp}>=</span>
              <span style={styles.mathVar}>Frequency</span>
              <span style={styles.mathOp}>×</span>
              <span style={styles.mathVar}>Severity</span>
            </div>
          </div>

          <div style={styles.matrixContainer}>
            <h4 style={styles.matrixTitle}>리스크 매트릭스 (5단계 빈도 × 4단계 강도)</h4>
            <table style={styles.matrixTable}>
              <thead>
                <tr>
                  <th colSpan="2" rowSpan="2" style={styles.matrixCorner}>빈도 \ 강도</th>
                  <th colSpan="4" style={styles.matrixMainHeader}>강도 (Severity)</th>
                </tr>
                <tr>
                  {[1, 2, 3, 4].map(s => (
                    <th key={s} style={styles.matrixSubHeader}>
                      <div style={styles.headerNum}>{s}</div>
                      <div style={styles.headerLabel}>{severityLabels[s]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[5, 4, 3, 2, 1].map((f) => (
                  <tr key={f}>
                    {f === 5 && (
                      <td rowSpan="5" style={styles.matrixAxisY}>
                        <div style={styles.verticalText}>빈도 (Frequency)</div>
                      </td>
                    )}
                    <td style={styles.matrixSideHeader}>
                      <div style={styles.sideNum}>{f}</div>
                      <div style={styles.sideLabel}>{frequencyLabels[f]}</div>
                    </td>
                    {[1, 2, 3, 4].map((s) => {
                      const score = f * s;
                      const config = getRiskConfig(score);
                      return (
                        <td key={s} style={{...styles.matrixCell, backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}`}}>
                          <div style={styles.scoreNum}>{score}</div>
                          <div style={styles.scoreLabel}>{config.label}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.th}>위험도 점수</th>
                  <th style={styles.th}>위험 수준</th>
                  <th style={styles.th}>관리 및 조치 기준</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={styles.tdBold}>16 ~ 20</td><td style={{...styles.td, color: '#D32F2F', fontWeight: '800'}}>허용불가 위험</td><td style={styles.td}>즉시 작업중단 및 즉시 개선 실행 필수</td></tr>
                <tr><td style={styles.tdBold}>9 ~ 15</td><td style={{...styles.td, color: '#E65100', fontWeight: '800'}}>중대한 위험</td><td style={styles.td}>긴급 임시안전대책 수립 후 작업, 계획된 정비 시 근본 대책 수립</td></tr>
                <tr><td style={styles.tdBold}>8</td><td style={{...styles.td, color: '#827717', fontWeight: '800'}}>경미한 위험</td><td style={styles.td}>위험 표지 부착, 작업절차 표지 등 관리적 대책 필요</td></tr>
                <tr><td style={styles.tdBold}>4 ~ 6</td><td style={{...styles.td, color: '#388E3C', fontWeight: '800'}}>미미한 위험</td><td style={styles.td}>안전정보 제공 및 주기적 표준작업안전 교육 실시</td></tr>
                <tr><td style={styles.tdBold}>1 ~ 3</td><td style={{...styles.td, color: '#616161', fontWeight: '800'}}>무시 가능 위험</td><td style={styles.td}>현재의 안전대책 유지</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 3: 9 HIGH RISK TASKS */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>3. 현장 9대 고위험 작업 유형</h3>
          <p style={styles.para}>다음 작업군은 점수와 관계없이 원칙적으로 '고위험군'으로 분류하여 관리해야 합니다.</p>
          <div style={styles.flowGrid}>
            {highRiskTasks.map((task, i) => (
              <div key={i} style={styles.flowCard}>
                <h4 style={styles.flowT}>{task.t}</h4>
                <p style={styles.flowC}>{task.c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <p>© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', lineHeight: '1.7', fontFamily: 'Pretendard, -apple-system, sans-serif' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 40px' },
  header: { padding: '1.5rem 0', borderBottom: '1px solid #eee' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' },
  heroSection: { padding: '80px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  m3Tag: { color: '#448AFF', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px', wordBreak: 'keep-all', lineHeight: '1.3' },
  subTitle: { fontSize: '1.1rem', opacity: 0.8, lineHeight: '1.8' },
  m3Section: { padding: '80px 0' },
  sectionTitle: { fontSize: '2rem', fontWeight: '800', marginBottom: '40px', letterSpacing: '-0.5px' },
  para: { fontSize: '1.1rem', color: '#333', marginBottom: '35px' },
  
  splitRow: { display: 'flex', gap: '24px', marginBottom: '40px' },
  cardHalf: { flex: 1, padding: '30px', backgroundColor: '#f8f9fa', borderRadius: '16px', border: '1px solid #eee' },
  cardHalfHighlight: { flex: 1, padding: '30px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', borderTop: '6px solid #FF5252', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  itemHeader: { fontSize: '1.3rem', fontWeight: '800', marginBottom: '15px' },
  itemContent: { fontSize: '1rem', color: '#555' },
  
  mathCardNormal: { padding: '40px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #eee', textAlign: 'center', marginBottom: '50px' },
  mathDisplay: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' },
  mathVar: { fontSize: '2rem', fontWeight: '700', color: '#111', fontStyle: 'italic' },
  mathOp: { fontSize: '1.5rem', color: '#bbb' },
  
  matrixContainer: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #eee', marginBottom: '40px', overflowX: 'auto' },
  matrixTitle: { fontSize: '1.5rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center' },
  matrixTable: { width: '100%', borderCollapse: 'separate', borderSpacing: '8px', minWidth: '800px' },
  matrixCorner: { fontSize: '0.85rem', color: '#999', fontWeight: '600' },
  matrixMainHeader: { padding: '12px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '8px', fontSize: '1rem' },
  matrixSubHeader: { padding: '12px', backgroundColor: '#F5F5F5', borderRadius: '8px', minWidth: '120px' },
  headerNum: { fontSize: '1.2rem', fontWeight: '800', color: '#333' },
  headerLabel: { fontSize: '0.8rem', color: '#666' },
  
  matrixAxisY: { width: '50px', backgroundColor: '#1c1b1f', color: '#fff', textAlign: 'center', borderRadius: '8px' },
  verticalText: { writingMode: 'vertical-rl', fontWeight: '800', fontSize: '0.95rem', letterSpacing: '3px', margin: '0 auto' },
  
  matrixSideHeader: { padding: '12px', backgroundColor: '#F5F5F5', borderRadius: '8px', textAlign: 'center', minWidth: '50px' },
  sideNum: { fontSize: '1.2rem', fontWeight: '800', color: '#333' },
  sideLabel: { fontSize: '0.8rem', color: '#666' },

  matrixCell: { padding: '20px', textAlign: 'center', borderRadius: '12px' },
  scoreNum: { fontSize: '1.8rem', fontWeight: '900' },
  scoreLabel: { fontSize: '0.85rem', fontWeight: '800' },

  tableWrapper: { marginTop: '30px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeadRow: { backgroundColor: '#f8f9fa', borderTop: '2px solid #111' },
  th: { padding: '18px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: '800', fontSize: '1.1rem' },
  td: { padding: '18px', borderBottom: '1px solid #eee', fontSize: '1rem' },
  tdBold: { padding: '18px', borderBottom: '1px solid #eee', fontWeight: '800', textAlign: 'center', backgroundColor: '#fafafa' },

  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  flowCard: { padding: '25px', backgroundColor: '#fff', borderRadius: '16px', borderTop: '4px solid #448AFF', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  flowT: { fontSize: '1.2rem', fontWeight: '800', marginBottom: '10px' },
  flowC: { fontSize: '0.95rem', color: '#666', lineHeight: '1.6' },

  finalFooter: { padding: '50px 0', backgroundColor: '#1c1b1f', color: '#fff', textAlign: 'center', fontSize: '0.9rem' }
};