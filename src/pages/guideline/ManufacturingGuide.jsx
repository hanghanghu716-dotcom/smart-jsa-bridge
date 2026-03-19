import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdBanner from '../../AdBanner';

// 법적 고지 컴포넌트: 부모 패딩의 영향을 받지 않도록 최상위에 배치됨
const LegalDisclaimer = () => (
  <div style={{...styles.disclaimer, width: '100%', margin: 0}} className="max-lg:!px-6 max-lg:!py-4">
    <p style={styles.disclaimerText} className="text-[12px] lg:text-[0.9rem]">
      ⚠️ [주의] 본 견본은 참고용 자료이며, 위험성평가는 각 사업장의 공정 특성 및 환경에 맞게 반드시 실제 점검을 바탕으로 작성되어야 합니다. <br className="hidden lg:block" />
      Smart JSA Bridge는 본 자료의 활용으로 발생하는 법적 결과에 대해 책임을 지지 않습니다.
    </p>
  </div>
);

export default function ManufacturingGuide() {
  const navigate = useNavigate();

  // 제조업 JSA 10종 상세 데이터
  const manufacturingJsaList = [
    { id: "MANUF-01", title: "도금조 유해화학물질 보충 및 금속 표면 산세 작업", hazard: "산성 가스 체류에 의한 질식, 약품 비산에 의한 화학적 화상", measure: "국소배기장치 가동 확인, 불침투성 화학 보호복 및 장갑 착용", pages: 1 },
    { id: "MANUF-02", title: "사출 성형기 노즐 폐쇄 해소 및 내외부 탄화물 제거 작업", hazard: "고온 수지 분출에 의한 화상, 유닛 이동 중 신체 협착", measure: "내열 보호구 착용, LOTO 실시 및 저속/저압 퍼징 실시", pages: 1 },
    { id: "MANUF-03", title: "산업용 원형톱을 이용한 원목 절단 및 가공 작업", hazard: "회전 톱날에 장갑 말림(협착), 목재 반발(Kickback) 타격", measure: "밀착형 작업복 착용, 전용 밀대(Push Stick) 사용 준수", pages: 1 },
    { id: "MANUF-04", title: "생산 라인 컨베이어 벨트 구동부 정기 점검 및 정비", hazard: "점검 중 롤러 사이 손가락 끼임, 불시 가동에 의한 협착", measure: "개인별 잠금장치(LOTO) 부착, 설비 정지 상태에서만 점검", pages: 1 },
    { id: "MANUF-05", title: "용해로 금속 원료 투입 및 용탕 주조 작업", hazard: "수분 유입 시 수증기 폭발(Splash), 복사열에 의한 화상", measure: "원료 예열 건조 실시, 차광 내열 안면보호구 상시 착용", pages: 1 },
    { id: "MANUF-06", title: "자동차 차체 스팟 용접 로봇 정비 및 용접 팁(Tip) 교체 작업", hazard: "로봇 오동작에 의한 충돌, 고온 팁 접촉 시 화상", measure: "셀 진입 통제 및 LOTO 실시, 팁 리무버 전용 도구 사용", pages: 1 },
    { id: "MANUF-07", title: "제조 공정 내 프레스 금형 교체 및 셋업 작업", hazard: "금형 하강 시 베드 사이 협착, 중량물 인양 중 충돌", measure: "규격 안전 블록 설치, 수직 인양 및 유도 로프 사용", pages: 1 },
    { id: "MANUF-08", title: "SMT 생산 라인 운영 및 리플로우 오븐(Reflow Oven) 유지보수", hazard: "고온 히터 접촉 화상, 솔더 내 납/플럭스 중독", measure: "설비 냉각 후 작업, 유기화합물용 방독마스크 착용", pages: 1 },
    { id: "MANUF-09", title: "대형 식품 교반기(Mixer) 내부 정밀 세척 및 살균 소독 작업", hazard: "탱크 내 산소 결핍 질식, 교반날 불시 회전 협착", measure: "산소 농도 측정 및 외부 감시인 배치, 주전원 LOTO 실시", pages: 1 },
    { id: "MANUF-10", title: "대형 오프셋 인쇄기 롤러 정기 점검 및 유기용제 세척 작업", hazard: "롤러 틈새(Nip Point) 손가락 협착, 용제 증기 화재", measure: "인칭(Inch) 모드 사용, 정전기 제거 장치 가동 확인", pages: 1 }
  ];

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.container}>
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>

      <LegalDisclaimer />
      
      <div style={styles.mainLayout}>
        {/* 좌측 광고 */}
        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <div style={styles.centerContent}>
          <section style={styles.section} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.headerBox}>
              <span style={styles.categoryTag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">MANUFACTURING JSA SAMPLES</span>
              <h2 style={{...styles.title, fontSize: undefined}} className="text-[24px] lg:text-[2.5rem] font-extrabold leading-tight mb-6">
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">제조업 JSA</span>
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">견본 가이드 (10종)</span>
              </h2>
              <p style={styles.description} className="text-[14px] lg:text-[1.1rem]">
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">기계 끼임, 고온 화상, 화학물질 노출 등 제조업 핵심</span>
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">위험요인을 확인하십시오. 상세 이미지를 확인해 보세요.</span>
              </p>
            </div>

            <div style={styles.listContainer}>
              {manufacturingJsaList.map((item) => (
                <div key={item.id} style={styles.card} className="max-lg:!p-6 max-lg:!rounded-2xl">
                  <div style={styles.cardHeader}>
                    <span style={styles.jsaId}>{item.id}</span>
                    <h4 style={styles.jsaTitle} className="text-[18px] lg:text-[1.6rem]">{item.title}</h4>
                  </div>

                  <div style={styles.infoGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
                    <div style={styles.infoBox} className="max-lg:!p-4">
                      <strong style={styles.labelRed}>⚠ 핵심위험</strong>
                      <p style={styles.infoText}>{item.hazard}</p>
                    </div>
                    <div style={styles.infoBox} className="max-lg:!p-4">
                      <strong style={styles.labelBlue}>🛡 감소대책</strong>
                      <p style={styles.infoText}>{item.measure}</p>
                    </div>
                  </div>

                  <div style={styles.imageContainer}>
                    <p style={styles.previewLabel}>미리보기 견본 (이미지)</p>
                    {Array.from({ length: item.pages || 1 }, (_, i) => (
                      <img 
                        key={i}
                        src={`/assets/pdf/manuf/${item.id}/${item.id}_00${i + 1}.jpg`}
                        alt={`${item.title} 미리보기`}
                        style={styles.previewImage}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ))}
                  </div>

                  <div style={styles.cardFooter}>
                    <a href={`/assets/pdf/manuf/${item.id}.pdf`} download style={styles.downloadBtn} className="max-lg:!w-full max-lg:!text-sm">
                      원본 PDF 견본 다운로드
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 우측 광고 */}
        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.finalFooter} className="max-lg:!py-12">
        <div style={styles.container} className="max-lg:!px-6 text-center">
          <p className="m-0 text-sm opacity-60">© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#f9f9f9', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  header: { padding: '2.5rem 0', zIndex: 10, borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', color: '#111' },
  
  /* 사이드 광고 레이아웃 시스템 */
  mainLayout: { position: 'relative', display: 'flex', alignItems: 'flex-start', padding: '0 5rem', gap: '4rem', zIndex: 10, justifyContent: 'center' },
  sideAd: { width: '160px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' },
  centerContent: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1000px', alignItems: 'center' },

  disclaimer: { backgroundColor: '#fff4f4', padding: '20px', borderBottom: '1px solid #ffcccc', textAlign: 'center' },
  disclaimerText: { color: '#d32f2f', fontWeight: '800', margin: 0, wordBreak: 'keep-all', lineHeight: '1.6' },
  section: { padding: '60px 0', width: '100%' },
  headerBox: { textAlign: 'left', marginBottom: '60px', width: '100%' },
  categoryTag: { color: '#28a745', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', display: 'block', marginBottom: '20px' },
  title: { fontWeight: '900', color: '#111' },
  description: { color: '#666', lineHeight: '1.6', wordBreak: 'keep-all' },
  
  listContainer: { display: 'flex', flexDirection: 'column', gap: '50px', width: '100%' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  cardHeader: { borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '25px' },
  jsaId: { color: '#28a745', fontWeight: '900', fontSize: '0.85rem' },
  jsaTitle: { fontWeight: '800', marginTop: '10px', wordBreak: 'keep-all' },
  
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
  infoBox: { padding: '20px', borderRadius: '12px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0' },
  labelRed: { color: '#d32f2f', fontSize: '0.8rem', display: 'block', marginBottom: '8px' },
  labelBlue: { color: '#28a745', fontSize: '0.8rem', display: 'block', marginBottom: '8px' },
  infoText: { fontSize: '0.95rem', color: '#333', margin: 0, fontWeight: '500', lineHeight: '1.5', wordBreak: 'keep-all' },

  imageContainer: { marginTop: '20px', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f0f0f0', width: '100%' },
  previewLabel: { fontSize: '0.7rem', color: '#999', padding: '10px 15px', margin: 0, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 'auto', display: 'block' },

  cardFooter: { marginTop: '30px', textAlign: 'center' },
  downloadBtn: { display: 'inline-block', padding: '14px 40px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};