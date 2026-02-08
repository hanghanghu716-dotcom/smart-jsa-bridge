// src/components/JsaPreviewModal.jsx
import React from 'react';

export default function JsaPreviewModal({ isOpen, onClose, data, category }) {
  if (!isOpen || !data) return null;

  // 실제 이미지가 저장될 경로 (예: public/assets/images/construction/const-01_preview.jpg)
  const imagePath = `/assets/images/${category}/${data.id.toLowerCase()}_preview.jpg`;
  // PDF 다운로드 경로
  const pdfPath = `/assets/pdf/${category}/${data.id.toLowerCase()}.pdf`;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <h3 style={styles.title}>{data.id}. {data.title}</h3>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </header>
        
        <div style={styles.disclaimerBanner}>
          ⚠️ 본 견본은 참고용이며, 실제 위험성평가는 각 사업장 상황에 맞게 재작성되어야 합니다.
        </div>

        <div style={styles.contentBody}>
          {/* JSA 견본 이미지 영역 */}
          <div style={styles.imageWrapper}>
            <img 
              src={imagePath} 
              alt={`${data.title} 미리보기`} 
              style={styles.previewImage} 
              onError={(e) => {e.target.src='https://placehold.co/800x1000?text=JSA+Preview+Image+Not+Found'}} // 이미지 없을 시 대체
            />
          </div>
        </div>

        {/* 수익화를 위한 애드센스 광고 슬롯 영역 (선택 사항) */}
        <div style={{ padding: '15px', backgroundColor: '#f8f9fa', textAlign: 'center', borderTop: '1px solid #eee' }}>
           <p style={{fontSize: '0.8rem', color: '#999'}}>광고 배너 영역 (Google AdSense)</p>
           {/* 여기에 실제 애드센스 코드를 삽입하십시오 */}
        </div>

        <footer style={styles.footer}>
          <a href={pdfPath} download style={styles.downloadBtn}>PDF 파일 다운로드 (소장용)</a>
          <button style={styles.closeTextBtn} onClick={onClose}>닫기</button>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  backdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { width: '90%', maxWidth: '900px', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '20px 25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#1c1b1f' },
  closeBtn: { background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#999' },
  disclaimerBanner: { backgroundColor: '#fff4f4', padding: '10px', textAlign: 'center', fontSize: '0.85rem', color: '#d32f2f', fontWeight: 'bold', borderBottom: '1px solid #ffcccc' },
  contentBody: { flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f0f2f5' },
  imageWrapper: { backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  previewImage: { width: '100%', height: 'auto', display: 'block' },
  footer: { padding: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#fff' },
  downloadBtn: { padding: '10px 20px', backgroundColor: '#1c1b1f', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' },
  closeTextBtn: { padding: '10px 20px', backgroundColor: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }
};