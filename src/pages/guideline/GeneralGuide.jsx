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

export default function ChemicalGasGuide() {
  // 화공·가스 작업 JSA 10종 상세 데이터 (업로드 PDF 분석 기반)
  const chemicalJsaList = [
    { 
      id: "CHEM-01", 
      title: "다관식 열교환기(Shell & Tube) 개방 검사 및 고압 워터젯 세척 작업", 
      hazard: "고압수 분출에 의한 조직 관통, 잔류 유체 노출에 의한 화학적 화상 [cite: 201]",
      measure: "워터젯 전용 보호복 착용, 드레인 밸브 완전 개방 및 LOTO 준수 [cite: 201]",
      pages: 1 
    },
    { 
      id: "CHEM-02", 
      title: "수소생산 설비 내 고압 수소 압축기(Compressor) 패킹 교체 작업", 
      hazard: "잔류 수소 누출로 인한 폭발, 질소 치환 후 산소 결핍 질식 [cite: 218]",
      measure: "휴대용 측정기 수소 0% 확인, 제전복 착용 및 비점폭 공구 사용 [cite: 218]",
      pages: 1 
    },
    { 
      id: "CHEM-03", 
      title: "유독성 화학물질 이송 배관 밸브 및 가스켓 노후 교체 작업", 
      hazard: "플랜지 해체 시 잔류액 비산 화상, 유독 가스 흡입 중독 [cite: 236]",
      measure: "전면형 방독마스크 착용, 몸 반대 방향으로 볼트 순차적 이완 [cite: 236]",
      pages: 1 
    },
    { 
      id: "CHEM-04", 
      title: "플레어 스택(Flare Stack) 상부 팁 교체 및 점화 계통 정기 보수", 
      hazard: "강풍에 의한 추락, 상부 잔류 가스 점화 시 화염 피폭 [cite: 252]",
      measure: "풍속 모니터링(10m/s 초과 시 금지), 안전대 2중 체결 및 DCS 차단 확인 [cite: 252]",
      pages: 1 
    },
    { 
      id: "CHEM-05", 
      title: "화공 플랜트 비상 방재 설비(소방 펌프 및 가스 감지기) 기능 점검", 
      hazard: "고압 소방수 방사 시 호스 이탈 타격, 테스트용 가스 흡입 중독 [cite: 270]",
      measure: "호스 안전 핀 체결 확인, 바람을 등지고 작업 및 전용 캡 사용 [cite: 270]",
      pages: 1 
    },
    { 
      id: "CHEM-06", 
      title: "가스정제(PSA) 설비 흡착탑 하부 자동 밸브 점검 및 누설 확인", 
      hazard: "자동 밸브 불시 작동 협착, 흡착제 미세 분진 흡입 호흡기 질환 [cite: 287]",
      measure: "공압 잔압 제거 및 LOTO 실시, 특급 방진마스크 필수 착용 [cite: 287]",
      pages: 1 
    },
    { 
      id: "CHEM-07", 
      title: "고압 수소 저장 탱크 내부 육안 검사 및 비파괴 시험(NDT) 작업", 
      hazard: "탱크 내 산소 결핍 질식, 탱크 내부 조명 누전에 의한 폭발 [cite: 306]",
      measure: "상/중/하 농도 측정 및 강제 환기, 24V 이하 방폭형 저전압 조명 사용 [cite: 306]",
      pages: 1 
    },
    { 
      id: "CHEM-08", 
      title: "고압 수소 탱크로리 하역 및 충전 베이 연결 작업", 
      hazard: "차량 밀림에 의한 협착, 정전기 방전에 의한 수소 가스 폭발 [cite: 323]",
      measure: "고임목 2개 이상 설치, 접지 클램프 우선 체결 및 저항 확인 [cite: 323]",
      pages: 1 
    },
    { 
      id: "CHEM-09", 
      title: "공정 제어 시스템(DCS/PLC) 패널 점검 및 현장 전송기 교정 작업", 
      hazard: "인터록 미해제로 인한 공정 불시 정지, 충전부 접촉 감전 [cite: 341]",
      measure: "DCS 바이패스 상태 이중 확인, 절연 장갑 및 제전복 착용 점검 [cite: 341]",
      pages: 1 
    },
    { 
      id: "CHEM-10", 
      title: "냉각수 계통 살균제(Biocide) 및 부식억제제 화학약품 보충 작업", 
      hazard: "서로 다른 약품 혼합 시 가스 폭발, 용기 개봉 시 약품 분출 [cite: 359]",
      measure: "약품 라벨 이중 확인 및 이격 보관, 안면보호구 착용 후 내압 제거 [cite: 359]",
      pages: 1 
    }
  ];

  return (
    <div style={styles.wrapper}>
      <LegalDisclaimer />
      
      <section style={styles.section}>
        <div style={styles.headerBox}>
          <span style={styles.categoryTag}>CHEMICAL & GAS SAFETY</span>
          <h2 style={styles.title}>화공·가스 작업 JSA 견본 가이드 (10종)</h2>
          <p style={styles.description}>
            플랜트 내 고압 가스 및 유독성 화학물질 취급 공정의 표준 위험 분석 데이터입니다. <br />
            스크롤을 통해 상세 이미지를 확인하시고 하단 버튼으로 원본을 다운로드하십시오.
          </p>
        </div>

        <div style={styles.listContainer}>
          {chemicalJsaList.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.jsaId}>{item.id}</span>
                <h4 style={styles.jsaTitle}>{item.title}</h4>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <strong style={styles.labelRed}>⚠ 중대위험 요인</strong>
                  <p style={styles.infoText}>{item.hazard}</p>
                </div>
                <div style={styles.infoBox}>
                  <strong style={styles.labelBlue}>🛡 필수 안전대책</strong>
                  <p style={styles.infoText}>{item.measure}</p>
                </div>
              </div>

              {/* 이미지 폴더 구조 반영 영역 */}
              <div style={styles.imageContainer}>
                <p style={styles.previewLabel}>JSA 리포트 미리보기 (Internal Preview)</p>
                {Array.from({ length: item.pages || 1 }, (_, i) => (
                  <img 
                    key={i}
                    src={`/assets/pdf/chem/${item.id}/${item.id}_00${i + 1}.jpg`}
                    alt={`${item.title} 미리보기 ${i + 1}`}
                    style={styles.previewImage}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>

              <div style={styles.cardFooter}>
                <a 
                  href={`/assets/pdf/chem/${item.id}.pdf`} 
                  download 
                  style={styles.downloadBtn}
                >
                  원본 PDF 전문 다운로드
                </a>
              </div>

              <div style={styles.adSpace}>AD BANNER SPACE (GOOGLE ADSENSE)</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#fcfcfc', color: '#1c1b1f', width: '100%', minHeight: '100vh' },
  disclaimer: { backgroundColor: '#fff4f4', padding: '20px', borderBottom: '1px solid #ffcccc', textAlign: 'center' },
  disclaimerText: { color: '#d32f2f', fontSize: '0.9rem', fontWeight: '800', margin: 0, wordBreak: 'keep-all' },
  section: { padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' },
  headerBox: { textAlign: 'center', marginBottom: '60px' },
  categoryTag: { color: '#e91e63', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2.5px' },
  title: { fontSize: '2.5rem', fontWeight: '900', margin: '15px 0', color: '#111' },
  description: { color: '#666', fontSize: '1.1rem', lineHeight: '1.6' },
  
  listContainer: { display: 'flex', flexDirection: 'column', gap: '50px' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' },
  cardHeader: { borderBottom: '1px solid #f8f8f8', paddingBottom: '20px', marginBottom: '25px' },
  jsaId: { color: '#e91e63', fontWeight: '900', fontSize: '0.9rem' },
  jsaTitle: { fontSize: '1.6rem', fontWeight: '800', marginTop: '10px' },
  
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
  infoBox: { padding: '20px', borderRadius: '12px', backgroundColor: '#fffafb', border: '1px solid #ffeff2' },
  labelRed: { color: '#d32f2f', fontSize: '0.85rem', display: 'block', marginBottom: '8px' },
  labelBlue: { color: '#e91e63', fontSize: '0.85rem', display: 'block', marginBottom: '8px' },
  infoText: { fontSize: '0.95rem', color: '#333', margin: 0, fontWeight: '600', lineHeight: '1.5' },

  imageContainer: { marginTop: '20px', border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f9f9f9' },
  previewLabel: { fontSize: '0.75rem', color: '#aaa', padding: '10px 20px', margin: 0, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 'auto', display: 'block', marginBottom: '5px' },

  cardFooter: { marginTop: '30px', textAlign: 'center' },
  downloadBtn: { display: 'inline-block', padding: '14px 45px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem' },
  adSpace: { marginTop: '50px', height: '100px', backgroundColor: '#f9f9f9', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ccc', borderRadius: '12px', border: '1px dashed #ddd' }
};