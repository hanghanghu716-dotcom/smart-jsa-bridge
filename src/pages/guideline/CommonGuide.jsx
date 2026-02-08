import React from 'react';

// 법적 고지 컴포넌트
const LegalDisclaimer = () => (
  <div style={styles.disclaimer}>
    <p style={styles.disclaimerText}>
      ⚠️ [주의] 본 견본은 참고용 자료이며, 위험성평가는 각 사업장의 공정 특성 및 환경에 맞게 반드시 실제 점검을 바탕으로 작성되어야 합니다. <br />
      Smart JSA Bridge는 본 자료의 활용으로 발생하는 법적 결과에 대해 책임을 지지 않습니다.
    </p>
  </div>
);

export default function CommonGuide() {
  // COMMON-01 PDF 데이터 요약 (10단계 공정)
  const stepSummary = [
    { step: "01", task: "작업 전 TBM 및 개인보호구 점검", hazard: "작업 범위 미숙지, 보호구 오착용" },
    { step: "02", task: "추락 방지 시설 점검", hazard: "구명줄 고정점 파손, 악천후 실족" },
    { step: "03", task: "가연물 격리 및 화재 예방", hazard: "용접 불꽃 비산, 잔류 가스 폭발" },
    { step: "04", task: "인양 장비 및 줄걸이 셋팅", hazard: "지반 지지력 부족, 줄걸이 파단" },
    { step: "05", task: "가스 농도 측정 및 환기", hazard: "산소 결핍, 유독가스 체류 질식" },
    { step: "06", task: "지하 매설물 탐지 및 붕괴 방지", hazard: "매설물 파손 폭발, 사면 붕괴 매몰" },
    { step: "07", task: "LOTO 체결 및 무전압 확인", hazard: "임의 전원 투입 감전, 잔류 전하 감전" },
    { step: "08", task: "구획 설정 및 피폭 방지", hazard: "일반인 무단 진입, 방사선 피폭" },
    { step: "09", task: "설비 시운전 및 루프 테스트", hazard: "인터록 해제 가동, 고압 누출" },
    { step: "10", task: "작업 후 정리정돈 및 LOTO 해제", hazard: "잔류 공구 방치, 단락 사고" }
  ];

  return (
    <div style={styles.wrapper}>
      <LegalDisclaimer />
      
      <section style={styles.section}>
        <div style={styles.headerBox}>
          <span style={styles.categoryTag}>COMMON SAFETY STANDARD</span>
          <h2 style={styles.title}>현장 통합 안전 관리 JSA 가이드</h2>
          <p style={styles.description}>
            현장 내 공통적으로 적용되는 10대 핵심 공정 및 고위험 작업 전 준비사항에 대한 표준 데이터입니다.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.jsaId}>COMMON-01</span>
            <h4 style={styles.jsaTitle}>현장 통합 안전 관리 및 고위험작업 작업 전 준비사항</h4>
          </div>

          <div style={styles.summaryGrid}>
            <div style={styles.summaryTitle}>주요 공정 및 위험요인 요약</div>
            <div style={styles.stepContainer}>
              {stepSummary.map((item) => (
                <div key={item.step} style={styles.stepRow}>
                  <span style={styles.stepNum}>{item.step}</span>
                  <div style={styles.stepContent}>
                    <strong>{item.task}</strong>
                    <p>{item.hazard}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 이미지 경로 적용: /assets/pdf/COMMON-01/COMMON-01.jpg */}
          <div style={styles.imageWrapper}>
            <p style={styles.previewLabel}>JSA 리포트 미리보기 (Internal Preview)</p>
            <img 
              src="/assets/pdf/COMMON-01/COMMON-01.jpg"
              alt="COMMON-01 JSA Worksheet Preview"
              style={styles.previewImage}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <div style={styles.cardFooter}>
            <a 
              href="/assets/pdf/COMMON-01/COMMON-01.pdf" 
              download 
              style={styles.downloadBtn}
            >
              COMMON-01 원본 PDF 다운로드
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#fcfcfc', color: '#1c1b1f', width: '100%', minHeight: '100vh' },
  disclaimer: { backgroundColor: '#fff4f4', padding: '20px', borderBottom: '1px solid #ffcccc', textAlign: 'center' },
  disclaimerText: { color: '#d32f2f', fontSize: '0.9rem', fontWeight: '800', margin: 0 },
  section: { padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' },
  headerBox: { textAlign: 'center', marginBottom: '60px' },
  categoryTag: { color: '#6200ee', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2.5px' },
  title: { fontSize: '2.5rem', fontWeight: '900', margin: '15px 0', color: '#111' },
  description: { color: '#666', fontSize: '1.1rem', lineHeight: '1.6', wordBreak: 'keep-all' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' },
  cardHeader: { borderBottom: '2px solid #6200ee', paddingBottom: '20px', marginBottom: '30px' },
  jsaId: { color: '#6200ee', fontWeight: '900', fontSize: '1rem' },
  jsaTitle: { fontSize: '1.8rem', fontWeight: '800', marginTop: '10px', wordBreak: 'keep-all' },
  summaryGrid: { marginBottom: '40px', backgroundColor: '#f9f9ff', padding: '30px', borderRadius: '16px' },
  summaryTitle: { fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', color: '#333' },
  stepContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  stepRow: { display: 'flex', gap: '15px', alignItems: 'flex-start' },
  stepNum: { backgroundColor: '#6200ee', color: '#fff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 8px', borderRadius: '4px' },
  stepContent: { fontSize: '0.85rem' },
  imageWrapper: { border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f9f9f9' },
  previewLabel: { fontSize: '0.75rem', color: '#aaa', padding: '10px 20px', margin: 0, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 'auto', display: 'block' },
  cardFooter: { marginTop: '40px', textAlign: 'center' },
  downloadBtn: { display: 'inline-block', padding: '16px 50px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none' }
};