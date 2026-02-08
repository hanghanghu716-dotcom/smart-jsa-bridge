import React from 'react';

// 법적 고지 컴포넌트 (상단 고정)
const LegalDisclaimer = () => (
  <div style={styles.disclaimer}>
    <p style={styles.disclaimerText}>
      ⚠️ [주의] 본 견본은 참고용 자료이며, 위험성평가는 각 사업장의 공정 특성 및 환경에 맞게 반드시 실제 점검을 바탕으로 작성되어야 합니다. <br />
      Smart JSA Bridge는 본 자료의 활용으로 발생하는 법적 결과에 대해 책임을 지지 않습니다.
    </p>
  </div>
);

export default function HighRiskGuide() {
  // 고위험 특수작업 7종 데이터 (폴더 구조 및 페이지 수 반영)
  const highRiskList = [
    { 
      id: "HR-01", 
      title: "노후 배관 구간 교체 및 플랜지 용접 보수 작업", 
      hazard: "잔류 인화성 가스 폭발, 용접 불꽃에 의한 화재", 
      measure: "LEL 0% 확인 후 작업, 11m 이내 가연물 격리 및 화재감시자 배치",
      pages: 1 
    },
    { 
      id: "HR-02", 
      title: "변전실 고압 수배전반 정기 점검 및 케이블 교체 공사", 
      hazard: "차단기 오조작 감전, 잔류 전하에 의한 아크 발생", 
      measure: "개인별 LOTO 실시, 검전기 활용 무전압 확인 및 접지봉 방전",
      pages: 1 
    },
    { 
      id: "HR-03", 
      title: "배관로 매설을 위한 터파기 및 흙막이 지보공 설치", 
      hazard: "기존 지하매설물 파손 폭발, 법면 붕괴로 인한 매몰", 
      measure: "지장물 탐지 및 인력 굴착 병행, 안전 기울기 준수 및 계측기 모니터링",
      pages: 1 
    },
    { 
      id: "HR-04", 
      title: "신규 배관 용접부 품질 검사용 방사선 투과시험(RT)", 
      hazard: "방사선 피폭, 야간 작업 시 통제 구역 무단 침범", 
      measure: "안전거리 산출 후 경계 로프 설치, 전담 감시인 배치 및 서베이 미터 휴대",
      pages: 1 
    },
    { 
      id: "HR-05", 
      title: "질소 치환 탱크 내부 정밀 점검 및 잔류물 제거 작업", 
      hazard: "잔류 질소에 의한 산소 결핍 질식, 밀폐공간 고립", 
      measure: "진입 전/중 강제 환기 및 산소 농도 측정, 외부 감시인 배치 필수",
      pages: 1 
    },
    { 
      id: "HR-06", 
      title: "고중량 설비 설치를 위한 크레인 인양 및 이동 작업", 
      hazard: "지반 지지력 부족으로 인한 장비 전도, 화물 낙하 협착", 
      measure: "아웃트리거 깔판 보강, 2줄 걸이 준수 및 10cm 시험 인양 실시",
      pages: 1 
    },
    { 
      id: "HR-07", 
      title: "공장 지붕 판넬 보수 및 고소작업대(렌탈) 운용 작업", 
      hazard: "지붕 판넬 부식 부위 파손 추락, 고압선 접촉 감전", 
      measure: "하중 분산용 발판 설치, 안전대 2중 체결 및 전력선 이격 거리 확보",
      pages: 1 
    }
  ];

  return (
    <div style={styles.wrapper}>
      <LegalDisclaimer />
      
      <section style={styles.section}>
        <div style={styles.headerBox}>
          <span style={styles.categoryTag}>HIGH RISK SPECIALIST</span>
          <h2 style={styles.title}>고위험 특수작업 JSA 가이드 (7종)</h2>
          <p style={styles.description}>
            생명과 직결된 고위험 공종의 표준 위험 분석 데이터입니다. <br />
            스크롤을 내려 이미지를 확인하신 후 원본 PDF를 다운로드 하십시오.
          </p>
        </div>

        <div style={styles.listContainer}>
          {highRiskList.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.jsaId}>{item.id}</span>
                <h4 style={styles.jsaTitle}>{item.title}</h4>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <strong style={styles.labelRed}>⚠ 중대위험</strong>
                  <p style={styles.infoText}>{item.hazard}</p>
                </div>
                <div style={styles.infoBox}>
                  <strong style={styles.labelBlue}>🛡 필수대책</strong>
                  <p style={styles.infoText}>{item.measure}</p>
                </div>
              </div>

              {/* 이미지 폴더 구조 반영 영역: highrisk/ID/ID_001.jpg */}
              <div style={styles.imageContainer}>
                <p style={styles.previewLabel}>JSA 리포트 미리보기 (Internal Preview)</p>
                {Array.from({ length: item.pages || 1 }, (_, i) => (
                  <img 
                    key={i}
                    src={`/assets/pdf/highrisk/${item.id}/${item.id}_00${i + 1}.jpg`}
                    alt={`${item.title} 미리보기 ${i + 1}`}
                    style={styles.previewImage}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>

              <div style={styles.cardFooter}>
                <a 
                  href={`/assets/pdf/highrisk/${item.id}.pdf`} 
                  download 
                  style={styles.downloadBtn}
                >
                  원본 PDF 전문 다운로드
                </a>
              </div>

              <div style={styles.adSpace}>AD BANNER SPACE</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = {
  /* 건설업 양식과 동일하되 고위험 테마에 맞춰 포인트 컬러(Red) 적용 */
  wrapper: { backgroundColor: '#f9f9f9', color: '#1c1b1f', width: '100%', minHeight: '100vh' },
  disclaimer: { backgroundColor: '#fff4f4', padding: '20px', borderBottom: '1px solid #ffcccc', textAlign: 'center' },
  disclaimerText: { color: '#d32f2f', fontSize: '0.9rem', fontWeight: '800', margin: 0, wordBreak: 'keep-all' },
  section: { padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' },
  headerBox: { textAlign: 'center', marginBottom: '60px' },
  categoryTag: { color: '#d32f2f', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px' },
  title: { fontSize: '2.5rem', fontWeight: '900', margin: '15px 0', color: '#111' },
  description: { color: '#666', fontSize: '1.1rem', lineHeight: '1.6' },
  
  listContainer: { display: 'flex', flexDirection: 'column', gap: '50px' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  cardHeader: { borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '25px' },
  jsaId: { color: '#d32f2f', fontWeight: '900', fontSize: '0.9rem' },
  jsaTitle: { fontSize: '1.6rem', fontWeight: '800', marginTop: '10px' },
  
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
  infoBox: { padding: '20px', borderRadius: '12px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0' },
  labelRed: { color: '#d32f2f', fontSize: '0.85rem', display: 'block', marginBottom: '8px' },
  labelBlue: { color: '#d32f2f', fontSize: '0.85rem', display: 'block', marginBottom: '8px' },
  infoText: { fontSize: '0.95rem', color: '#333', margin: 0, fontWeight: '500', lineHeight: '1.5' },

  imageContainer: { marginTop: '20px', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f0f0f0' },
  previewLabel: { fontSize: '0.75rem', color: '#999', padding: '10px 15px', margin: 0, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 'auto', display: 'block', marginBottom: '10px' },

  cardFooter: { marginTop: '30px', textAlign: 'center' },
  downloadBtn: { display: 'inline-block', padding: '14px 40px', backgroundColor: '#d32f2f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem' },
  adSpace: { marginTop: '50px', height: '100px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#bbb', fontSize: '0.8rem', borderRadius: '12px', border: '1px dashed #ccc' }
};