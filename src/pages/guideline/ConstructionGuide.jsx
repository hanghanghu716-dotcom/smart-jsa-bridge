import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 법적 고지 컴포넌트
const LegalDisclaimer = () => (
  <div style={styles.disclaimer}>
    <p style={styles.disclaimerText}>
      ⚠️ [주의] 본 견본은 참고용 자료이며, 위험성평가는 각 사업장의 공정 특성 및 환경에 맞게 반드시 실제 점검을 바탕으로 작성되어야 합니다. <br />
      Smart JSA Bridge는 본 자료의 활용으로 발생하는 법적 결과에 대해 책임을 지지 않습니다.
    </p>
  </div>
);

export default function ConstructionGuide() {
  const navigate = useNavigate();
  
  // 건설업 JSA 10종 데이터 (폴더 구조 및 페이지 수 반영)
  const constructionJsaList = [
    { 
      id: "CONST-01", 
      title: "실내 인테리어 천장 틀 설치 및 석고보드 취부", 
      hazard: "사다리 힌지 미체결 추락, 타카 오발 사고",
      measure: "잠금 고리 체결 육안 확인, 내절단 장갑 및 보안경 착용",
      pages: 1 // 실제 폴더 내 이미지 장수에 맞게 수정 가능
    },
    { 
      id: "CONST-02", 
      title: "지하 기계실 주배관 용접 및 펌프 연결 설치", 
      hazard: "용접 스패터 화재, 배관 내압 시험 중 파열",
      measure: "화재감시자 배치, 설계 압력 1.1배 이내 단계적 가압",
      pages: 1
    },
    { 
      id: "CONST-03", 
      title: "현장 내 배수관로 매설 터파기 및 굴착 작업", 
      hazard: "지하매설물 파손 폭발, 법면 붕괴 매몰",
      measure: "지장물 탐지 및 인력 굴착 병행, 안전 기울기 준수",
      pages: 1
    },
    { 
      id: "CONST-04", 
      title: "건물 옥상 우레탄 방수 및 외벽 수성도장", 
      hazard: "옥상 단부 실족 추락, 유기용제 증기 질식",
      measure: "안전대 생명줄 체결, 송풍기 활용 강제 환기 실시",
      pages: 1
    },
    { 
      id: "CONST-05", 
      title: "건물 외벽 유지보수 및 고소 설비 설치", 
      hazard: "로프 파단 추락, 고소작업대(렌탈) 협착",
      measure: "수직구명줄 별도 설치, 과상승방지장치 점검",
      pages: 1
    },
    { 
      id: "CONST-06", 
      title: "외벽 작업용 시스템 비계 설치 및 해체", 
      hazard: "비계 구조물 전체 붕괴, 부재 낙하 피폭",
      measure: "벽이음 규격 준수 설치, 하부 통제 구역 설정",
      pages: 1
    },
    { 
      id: "CONST-07", 
      title: "철근 가공 및 크레인 양중 작업", 
      hazard: "줄걸이 용구 파단 자재 낙하, 가공기 협착",
      measure: "2줄 걸이 준수, 가공 시 전용 밀대 사용",
      pages: 1
    },
    { 
      id: "CONST-08", 
      title: "건축물 슬래브 및 보 콘크리트 타설 작업", 
      hazard: "펌프카 전도, 압송관 이탈 및 요동 타격",
      measure: "아웃트리거 지반 보강, 연결 핀 및 고리 점검",
      pages: 1
    },
    { 
      id: "CONST-09", 
      title: "노후 저층 건축물 구조 해체 및 폐기물 반출", 
      hazard: "해체 중 갑작스러운 붕괴, 석면 노출 위험",
      measure: "상부→하부 해체 원칙 준수, 사전 석면 조사 확인",
      pages: 1
    },
    { 
      id: "CONST-10", 
      title: "상업빌딩 내 천장 전기 배선 및 소방 설비 설치", 
      hazard: "활선 접촉 감전, 사다리 위 신체 과확장 전도",
      measure: "분전반 LOTO 실시, 검전기 무전압 확인",
      pages: 1
    }
  ];

  return (
    <div style={styles.wrapper}>
      <LegalDisclaimer />
      
      <section style={styles.section}>
        <div style={styles.headerBox}>
          <span style={styles.categoryTag}>CONSTRUCTION JSA SAMPLES</span>
          <h2 style={styles.title}>건설업 JSA 견본 가이드 (10종)</h2>
          <p style={styles.description}>
            각 공정별 핵심 위험요인과 대책을 확인하십시오. <br />
            이미지를 확인하신 후 하단의 버튼을 통해 PDF 파일을 다운로드할 수 있습니다.
          </p>
        </div>

        <div style={styles.listContainer}>
          {constructionJsaList.map((item) => (
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
                    // 경로 규칙: /assets/pdf/const/ID폴더/ID_001.jpg
                    src={`/assets/pdf/const/${item.id}/${item.id}_00${i + 1}.jpg`}
                    alt={`${item.title} 미리보기 ${i + 1}`}
                    style={styles.previewImage}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>

              <div style={styles.cardFooter}>
                <a 
                  href={`/assets/pdf/const/${item.id}.pdf`} 
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
  /* 사용자 원본 스타일 규격 절대 보존 + 사이드바 스크롤 최적화 */
  wrapper: { backgroundColor: '#f9f9f9', color: '#1c1b1f', width: '100%', minHeight: '100vh' },
  disclaimer: { backgroundColor: '#fff4f4', padding: '20px', borderBottom: '1px solid #ffcccc', textAlign: 'center' },
  disclaimerText: { color: '#d32f2f', fontSize: '0.9rem', fontWeight: '800', margin: 0, wordBreak: 'keep-all' },
  section: { padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' },
  headerBox: { textAlign: 'center', marginBottom: '60px' },
  categoryTag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px' },
  title: { fontSize: '2.5rem', fontWeight: '900', margin: '15px 0', color: '#111' },
  description: { color: '#666', fontSize: '1.1rem', lineHeight: '1.6' },
  
  listContainer: { display: 'flex', flexDirection: 'column', gap: '50px' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  cardHeader: { borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '25px' },
  jsaId: { color: '#007bff', fontWeight: '900', fontSize: '0.9rem' },
  jsaTitle: { fontSize: '1.6rem', fontWeight: '800', marginTop: '10px' },
  
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
  infoBox: { padding: '20px', borderRadius: '12px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0' },
  labelRed: { color: '#d32f2f', fontSize: '0.85rem', display: 'block', marginBottom: '8px' },
  labelBlue: { color: '#007bff', fontSize: '0.85rem', display: 'block', marginBottom: '8px' },
  infoText: { fontSize: '0.95rem', color: '#333', margin: 0, fontWeight: '500' },

  imageContainer: { marginTop: '20px', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f0f0f0' },
  previewLabel: { fontSize: '0.75rem', color: '#999', padding: '10px 15px', margin: 0, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 'auto', display: 'block', marginBottom: '5px' },

  cardFooter: { marginTop: '30px', textAlign: 'center' },
  downloadBtn: { display: 'inline-block', padding: '14px 40px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem' },
  adSpace: { marginTop: '50px', height: '100px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#bbb', fontSize: '0.8rem', borderRadius: '12px', border: '1px dashed #ccc' }
};