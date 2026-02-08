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

export default function GeneralGuide() {
  // 기타 일반작업 JSA 10종 상세 데이터
  const generalJsaList = [
    { 
      id: "GEN-01", 
      title: "물류 창고 내 지게차 파레트 화물 적재 및 이송 작업", 
      hazard: "급회전 시 지게차 전도, 전방 시야 미확보로 인한 보행자 충돌 협착",
      measure: "사내 제한속도(10km/h) 준수, 유도자 배치 및 마스트 틸팅 안착 확인",
      pages: 1 
    },
    { 
      id: "GEN-02", 
      title: "병동 내 환자 거동 보조 및 의료폐기물 취급 작업", 
      hazard: "환자 이송 중 낙상 사고, 주사침 자상(Needle-stick)에 의한 감염",
      measure: "휠체어/침대 바퀴 잠금 확인, 사용한 주사침 리캡(Re-capping) 절대 금지",
      pages: 1 
    },
    { 
      id: "GEN-03", 
      title: "사업장 내 녹지대 예초 작업 및 수목 전지 정비 공사", 
      hazard: "예초기 칼날 파손 비래물 타격, 인근 고압선 접촉에 의한 감전",
      measure: "망사형 안면보호구 착용, 전기시설물 이격 거리(2m) 확보 및 접근 통제",
      pages: 1 
    },
    { 
      id: "GEN-04", 
      title: "취약지역 도보 순찰 및 출입 차량 유도·통제 작업", 
      hazard: "진입 차량과의 충돌 사고, 야간 순찰 중 거동수상자 폭행 상해",
      measure: "고휘도 반사조끼 착용, 2인 1조 순찰 원칙 준수 및 호신용 장구 휴대",
      pages: 1 
    },
    { 
      id: "GEN-05", 
      title: "실험실 내 유해 화학 시약 조제 및 분석 장비 운용 작업", 
      hazard: "후드 성능 저하 시 유독 가스 실내 유출, 시약 비산에 의한 화학적 화상",
      measure: "흄 후드(Fume Hood) 내 작업 준수, MSDS 교육 이수 및 전용 보호구 착용",
      pages: 1 
    },
    { 
      id: "GEN-06", 
      title: "지하주차장 바닥 찌든 때 제거 및 고압 물청소 작업", 
      hazard: "통제되지 않은 주행 차량과의 충돌, 습윤 장소 전동기기 사용 중 감전",
      measure: "작업 구역 라바콘 설치, 누전차단기 경유 전원 사용 및 절연 장화 착용",
      pages: 1 
    },
    { 
      id: "GEN-07", 
      title: "폐기물 파쇄기 가동 및 투입구 이물질 제거 작업", 
      hazard: "파쇄기 개구부 신체 일부 유입, 정비 중 타 작업자의 불시 가동 협착",
      measure: "주전원 차단 후 LOTO(잠금/표지) 실시, 손 대신 전용 수공구 사용",
      pages: 1 
    },
    { 
      id: "GEN-08", 
      title: "건물 외벽 유리 세정 및 달비계 운용 작업", 
      hazard: "로프 마모 및 파단에 의한 추락, 작업 도구 낙하로 인한 보행자 타격",
      measure: "수직구명줄 별도 설치 및 안전대 체결, 하부 통제원 배치 및 경계선 설정",
      pages: 1 
    },
    { 
      id: "GEN-09", 
      title: "단체 급식소 식자재 전처리 및 대형 국솥 조리 작업", 
      hazard: "바닥 물기에 의한 미끄러짐 전도, 고온 기름/증기 접촉 시 화상",
      measure: "인증된 미끄럼 방지 조리화 착용, K급 화재 소화기 비치 및 수분 제거",
      pages: 1 
    },
    { 
      id: "GEN-10", 
      title: "데이터센터 내 서버 랙 신규 설치 및 트레이 포설 작업", 
      hazard: "중량 랙 이동 중 관성에 의한 협착, 높은 곳 작업 시 사다리 전도 추락",
      measure: "3인 1조 작업 실시, 사다리 최상단 탑승 금지 및 하부 조력자 배치",
      pages: 1 
    }
  ];

  return (
    <div style={styles.wrapper}>
      <LegalDisclaimer />
      
      <section style={styles.section}>
        <div style={styles.headerBox}>
          <span style={styles.categoryTag}>GENERAL & FACILITY SAFETY</span>
          <h2 style={styles.title}>기타·일반작업 JSA 견본 가이드 (10종)</h2>
          <p style={styles.description}>
            일상적인 시설 관리, 물류, 보건 분야에서 발생할 수 있는 잠재 위험을 분석한 데이터입니다. <br />
            스크롤을 내려 이미지를 확인하신 후 하단의 버튼을 통해 PDF 전문을 다운로드할 수 있습니다.
          </p>
        </div>

        <div style={styles.listContainer}>
          {generalJsaList.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.jsaId}>{item.id}</span>
                <h4 style={styles.jsaTitle}>{item.title}</h4>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <strong style={styles.labelRed}>⚠ 핵심위험</strong>
                  <p style={styles.infoText}>{item.hazard}</p>
                </div>
                <div style={styles.infoBox}>
                  <strong style={styles.labelBlue}>🛡 감소대책</strong>
                  <p style={styles.infoText}>{item.measure}</p>
                </div>
              </div>

              {/* 이미지 폴더 구조 반영 영역 */}
              <div style={styles.imageContainer}>
                <p style={styles.previewLabel}>JSA 리포트 미리보기 (Internal Preview)</p>
                {Array.from({ length: item.pages || 1 }, (_, i) => (
                  <img 
                    key={i}
                    src={`/assets/pdf/general/${item.id}/${item.id}_00${i + 1}.jpg`}
                    alt={`${item.title} 미리보기 ${i + 1}`}
                    style={styles.previewImage}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>

              <div style={styles.cardFooter}>
                <a 
                  href={`/assets/pdf/general/${item.id}.pdf`} 
                  download 
                  style={styles.downloadBtn}
                >
                  원본 PDF 견본 다운로드
                </a>
              </div>

              {/* 구글 애드센스 광고 삽입 권장 위치 */}
              <div style={styles.adSpace}>AD BANNER SPACE (GOOGLE ADSENSE)</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#f9f9f9', color: '#1c1b1f', width: '100%', minHeight: '100vh' },
  disclaimer: { backgroundColor: '#fff4f4', padding: '20px', borderBottom: '1px solid #ffcccc', textAlign: 'center' },
  disclaimerText: { color: '#d32f2f', fontSize: '0.9rem', fontWeight: '800', margin: 0, wordBreak: 'keep-all' },
  section: { padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' },
  headerBox: { textAlign: 'center', marginBottom: '60px' },
  categoryTag: { color: '#28a745', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px' },
  title: { fontSize: '2.5rem', fontWeight: '900', margin: '15px 0', color: '#111' },
  description: { color: '#666', fontSize: '1.1rem', lineHeight: '1.6' },
  
  listContainer: { display: 'flex', flexDirection: 'column', gap: '50px' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  cardHeader: { borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '25px' },
  jsaId: { color: '#28a745', fontWeight: '900', fontSize: '0.9rem' },
  jsaTitle: { fontSize: '1.6rem', fontWeight: '800', marginTop: '10px' },
  
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
  infoBox: { padding: '20px', borderRadius: '12px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0' },
  labelRed: { color: '#d32f2f', fontSize: '0.85rem', display: 'block', marginBottom: '8px' },
  labelBlue: { color: '#28a745', fontSize: '0.85rem', display: 'block', marginBottom: '8px' },
  infoText: { fontSize: '0.95rem', color: '#333', margin: 0, fontWeight: '500', lineHeight: '1.5' },

  imageContainer: { marginTop: '20px', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f0f0f0' },
  previewLabel: { fontSize: '0.75rem', color: '#999', padding: '10px 15px', margin: 0, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 'auto', display: 'block', marginBottom: '10px' },

  cardFooter: { marginTop: '30px', textAlign: 'center' },
  downloadBtn: { display: 'inline-block', padding: '14px 40px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem' },
  adSpace: { marginTop: '50px', height: '100px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#bbb', fontSize: '0.8rem', borderRadius: '12px', border: '1px dashed #ccc' }
};