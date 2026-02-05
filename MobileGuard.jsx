import React from 'react';

const MobileGuard = ({ children }) => {
  return (
    <>
      {/* 모바일 차단 레이어 */}
      <div className="mobile-block-view" style={guardStyles.overlay}>
        <div style={guardStyles.icon}>⚠️</div>
        <h2 style={guardStyles.title}>PC 환경 접속 권장</h2>
        <p style={guardStyles.text}>
          Smart JSA Bridge는 정밀한 데이터 분석을 위해<br/>
          <strong>데스크탑 환경</strong>에 최적화되어 있습니다.
        </p>
      </div>
      {/* 실제 콘텐츠 */}
      <div className="main-app-content">
        {children}
      </div>
    </>
  );
};

const guardStyles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 9999, display: 'none', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem' },
  icon: { fontSize: '3rem', marginBottom: '1rem' },
  title: { color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' },
  text: { color: '#888', lineHeight: '1.6', fontSize: '0.9rem' }
};

export default MobileGuard;