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

export default function ManufacturingGuide() {
  // 제조업 JSA 10종 상세 데이터 (업로드된 PDF 분석 기반)
  const manufacturingJsaList = [
    { 
      id: "MANUF-01", 
      title: "도금조 유해화학물질 보충 및 금속 표면 산세 작업", 
      hazard: "산성 가스 체류에 의한 질식, 약품 비산에 의한 화학적 화상 [cite: 18]",
      measure: "국소배기장치 가동 확인, 불침투성 화학 보호복 및 장갑 착용 [cite: 18]",
      pages: 1 
    },
    { 
      id: "MANUF-02", 
      title: "사출 성형기 노즐 폐쇄 해소 및 내외부 탄화물 제거 작업", 
      hazard: "고온 수지 분출에 의한 화상, 유닛 이동 중 신체 협착 [cite: 36]",
      measure: "내열 보호구 착용, LOTO 실시 및 저속/저압 퍼징 실시 [cite: 36]",
      pages: 1
    },
    { 
      id: "MANUF-03", 
      title: "산업용 원형톱을 이용한 원목 절단 및 가공 작업", 
      hazard: "회전 톱날에 장갑 말림(협착), 목재 반발(Kickback) 타격 [cite: 54]",
      measure: "밀착형 작업복 착용, 전용 밀대(Push Stick) 사용 준수 [cite: 54]",
      pages: 1
    },
    { 
      id: "MANUF-04", 
      title: "생산 라인 컨베이어 벨트 구동부 정기 점검 및 정비", 
      hazard: "점검 중 롤러 사이 손가락 끼임, 불시 가동에 의한 협착 [cite: 72]",
      measure: "개인별 잠금장치(LOTO) 부착, 설비 정지 상태에서만 점검 [cite: 72]",
      pages: 1
    },
    { 
      id: "MANUF-05", 
      title: "용해로 금속 원료 투입 및 용탕 주조 작업", 
      hazard: "수분 유입 시 수증기 폭발(Splash), 복사열에 의한 화상 [cite: 91]",
      measure: "원료 예열 건조 실시, 차광 내열 안면보호구 상시 착용 [cite: 91]",
      pages: 1
    },
    { 
      id: "MANUF-06", 
      title: "자동차 차체 스팟 용접 로봇 정비 및 용접 팁(Tip) 교체 작업", 
      hazard: "로봇 오동작에 의한 충돌, 고온 팁 접촉 시 화상 [cite: 110]",
      measure: "셀 진입 통제 및 LOTO 실시, 팁 리무버 전용 도구 사용 [cite: 110]",
      pages: 1
    },
    { 
      id: "MANUF-07", 
      title: "제조 공정 내 프레스 금형 교체 및 셋업 작업", 
      hazard: "금형 하강 시 베드 사이 협착, 중량물 인양 중 충돌 [cite: 128]",
      measure: "규격 안전 블록 설치, 수직 인양 및 유도 로프 사용 [cite: 128]",
      pages: 1
    },
    { 
      id: "MANUF-08", 
      title: "SMT 생산 라인 운영 및 리플로우 오븐(Reflow Oven) 유지보수", 
      hazard: "고온 히터 접촉 화상, 솔더 내 납/플럭스 중독 [cite: 146]",
      measure: "설비 냉각 후 작업, 유기화합물용 방독마스크 착용 [cite: 146]",
      pages: 1
    },
    { 
      id: "MANUF-09", 
      title: "대형 식품 교반기(Mixer) 내부 정밀 세척 및 살균 소독 작업", 
      hazard: "탱크 내 산소 결핍 질식, 교반날 불시 회전 협착 [cite: 164]",
      measure: "산소 농도 측정 및 외부 감시인 배치, 주전원 LOTO 실시 [cite: 164]",
      pages: 1
    },
    { 
      id: "MANUF-10", 
      title: "대형 오프셋 인쇄기 롤러 정기 점검 및 유기용제 세척 작업", 
      hazard: "롤러 틈새(Nip Point) 손가락 협착, 용제 증기 화재 [cite: 182]",
      measure: "인칭(Inch) 모드 사용, 정전기 제거 장치 가동 확인 [cite: 182]",
      pages: 1
    }
  ];

  return (
    <div style={styles.wrapper}>
      <LegalDisclaimer />
      
      <section style={styles.section}>
        <div style={styles.headerBox}>
          <span style={styles.categoryTag}>MANUFACTURING JSA SAMPLES</span>
          <h2 style={styles.title}>제조업 JSA 견본 가이드 (10종)</h2>
          <p style={styles.description}>
            기계 끼임, 고온 화상, 화학물질 노출 등 제조업 핵심 위험요인을 확인하십시오. <br />
            이미지를 확인하신 후 하단의 버튼을 통해 PDF 파일을 다운로드할 수 있습니다.
          </p>
        </div>

        <div style={styles.listContainer}>
          {manufacturingJsaList.map((item) => (
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

              {/* 이미지 직노출 영역: 사용자 폴더 구조(ID/ID_001.jpg) 반영 */}
              <div style={styles.imageContainer}>
                <p style={styles.previewLabel}>미리보기 견본 (이미지)</p>
                {Array.from({ length: item.pages || 1 }, (_, i) => (
                  <img 
                    key={i}
                    src={`/assets/pdf/manuf/${item.id}/${item.id}_00${i + 1}.jpg`}
                    alt={`${item.title} 미리보기 ${i + 1}`}
                    style={styles.previewImage}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>

              <div style={styles.cardFooter}>
                <a 
                  href={`/assets/pdf/manuf/${item.id}.pdf`} 
                  download 
                  style={styles.downloadBtn}
                >
                  원본 PDF 견본 다운로드
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
  /* 건설업 양식과 100% 동일하게 유지 + 제조업 포인트 컬러 적용 */
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
  infoText: { fontSize: '0.95rem', color: '#333', margin: 0, fontWeight: '500' },

  imageContainer: { marginTop: '20px', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f0f0f0' },
  previewLabel: { fontSize: '0.75rem', color: '#999', padding: '10px 15px', margin: 0, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 'auto', display: 'block', marginBottom: '5px' },

  cardFooter: { marginTop: '30px', textAlign: 'center' },
  downloadBtn: { display: 'inline-block', padding: '14px 40px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem' },
  adSpace: { marginTop: '50px', height: '100px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#bbb', fontSize: '0.8rem', borderRadius: '12px', border: '1px dashed #ccc' }
};