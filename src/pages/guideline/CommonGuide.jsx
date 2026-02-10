import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 법적 고지 컴포넌트: 모바일 폰트 및 여백 최적화
const LegalDisclaimer = () => (
    <div style={styles.disclaimer} className="max-lg:!px-6 max-lg:!py-4">
        <p style={styles.disclaimerText} className="text-[12px] lg:text-[0.9rem]">
            ⚠️ [주의] 본 견본은 참고용 자료이며, 위험성평가는 각 사업장의 공정 특성 및 환경에 맞게 반드시 실제 점검을 바탕으로 작성되어야 합니다. <br className="hidden lg:block" />
            Smart JSA Bridge는 본 자료의 활용으로 발생하는 법적 결과에 대해 책임을 지지 않습니다.
        </p>
    </div>
);

export default function CommonGuide() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            {/* HEADER: 메뉴 기능 통합 */}
            <header style={styles.header} className="max-lg:!px-6">
                <div className="flex justify-between items-center h-full">
                    <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
                    <div style={styles.menuTrigger} onClick={() => setIsMenuOpen(true)}>
                        <span style={styles.menuText} className="max-lg:hidden">MENU</span>
                        <div style={styles.hamburger}>
                            <div style={styles.bar}></div>
                            <div style={styles.bar}></div>
                        </div>
                    </div>
                </div>
            </header>

            {/* SIDE DRAWER */}
            <div style={{
                ...styles.sideDrawer,
                transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                visibility: isMenuOpen ? 'visible' : 'hidden',
                width: window.innerWidth < 1024 ? '100%' : '400px'
            }}>
                <div style={styles.drawerHeader}>
                    <div style={styles.closeBtn} onClick={() => setIsMenuOpen(false)}>✕ CLOSE</div>
                </div>
                <nav style={styles.drawerNav}>
                    <div style={styles.navCategory}>CONTENTS</div>
                    <Link to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험성평가 실시규정 가이드</Link>
                    <Link to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험성평가(JRA/JSA) 실무 프로세스</Link>
                    <Link to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>보호구에 관하여</Link>
                    <Link to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>일반 작업/고위험 작업</Link>
                </nav>
            </div>
            {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

            <LegalDisclaimer />

            <section style={styles.section} className="max-lg:!py-16 max-lg:!px-6">
                <div style={styles.headerBox}>
                    <span style={styles.categoryTag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">COMMON SAFETY STANDARD</span>
                    <h2 style={{...styles.title, fontSize: undefined}} className="text-[24px] lg:text-[2.5rem] font-extrabold leading-tight mb-6">
                        <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">현장 통합 안전 관리 및</span>
                        <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">JSA 가이드</span>
                    </h2>
                    <p style={styles.description} className="text-[14px] lg:text-[1.1rem]">
                        <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">현장 내 공통 적용되는 10대 공정 및 고위험 작업 전</span>
                        <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">준비사항에 대한 표준 데이터입니다.</span>
                    </p>
                </div>

                <div style={styles.card} className="max-lg:!p-6 max-lg:!rounded-2xl">
                    <div style={styles.cardHeader}>
                        <span style={styles.jsaId}>COMMON-01</span>
                        <h4 style={styles.jsaTitle} className="text-[18px] lg:text-[1.8rem]">
                            <span className="max-lg:block">현장 통합 안전 관리 및</span>
                            <span className="max-lg:block">고위험작업 작업 전 준비사항</span>
                        </h4>
                    </div>

                    <div style={styles.summaryGrid} className="max-lg:!p-4">
                        <div style={styles.summaryTitle} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">주요 공정 및 위험요인 요약</div>
                        {/* 그리드 2열 -> 1열 전환 핵심 부분 */}
                        <div style={styles.stepContainer} className="max-lg:!grid-cols-1 max-lg:!gap-6">
                            {stepSummary.map((item) => (
                                <div key={item.step} style={styles.stepRow}>
                                    <span style={styles.stepNum}>{item.step}</span>
                                    <div style={styles.stepContent}>
                                        <strong className="text-[14px] lg:text-[0.95rem]">{item.task}</strong>
                                        <p className="text-[13px] lg:text-[0.85rem] opacity-70">{item.hazard}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.imageWrapper}>
                        <p style={styles.previewLabel}>JSA 리포트 미리보기</p>
                        {[1, 2].map((num) => (
                            <img
                                key={num}
                                src={`/assets/pdf/COMMON-01/COMMON-01_00${num}.jpg`}
                                alt={`Preview ${num}`}
                                style={styles.previewImage}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ))}
                    </div>

                    <div style={styles.cardFooter}>
                        <a href="/assets/pdf/COMMON-01.pdf" download style={styles.downloadBtn} className="max-lg:!w-full max-lg:!text-sm">
                            원본 PDF 다운로드
                        </a>
                    </div>
                </div>
            </section>

            <footer style={styles.finalFooter} className="max-lg:!py-12">
                <div style={styles.container} className="max-lg:!px-6 text-center">
                    <p className="m-0 text-sm opacity-60">© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
                </div>
            </footer>
        </div>
    );
}

const styles = {
    /* [기존 스타일 유지 및 반응형 규격 최적화] */
    wrapper: { backgroundColor: '#fcfcfc', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
    disclaimer: { backgroundColor: '#fff4f4', padding: '20px', borderBottom: '1px solid #ffcccc', textAlign: 'center' },
    disclaimerText: { color: '#d32f2f', fontWeight: '800', margin: 0, wordBreak: 'keep-all', lineHeight: '1.6' },
    header: { padding: '2.5rem 0', zIndex: 10, borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff' },
    logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', color: '#111' },
    menuTrigger: { display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' },
    menuText: { color: '#111', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px' },
    hamburger: { display: 'flex', flexDirection: 'column', gap: '5px' },
    bar: { width: '20px', height: '2px', backgroundColor: '#111' },
    sideDrawer: { position: 'fixed', top: 0, right: 0, height: '100vh', backgroundColor: '#fff', zIndex: 1000, transition: 'transform 0.4s ease', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', padding: '60px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
    drawerHeader: { display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' },
    closeBtn: { cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800', color: '#111' },
    drawerNav: { display: 'flex', flexDirection: 'column', gap: '10px' },
    navCategory: { fontSize: '0.7rem', fontWeight: '900', color: '#888', letterSpacing: '2px', marginBottom: '20px' },
    drawerLink: { textDecoration: 'none', color: '#111', fontSize: '1.1rem', fontWeight: '700', padding: '15px 0', borderBottom: '1px solid #f0f0f0' },
    menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(8px)' },

    section: { padding: '60px 0', maxWidth: '1000px', margin: '0 auto' },
    headerBox: { textAlign: 'left', marginBottom: '60px' },
    categoryTag: { color: '#6200ee', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2.5px', display: 'block', marginBottom: '20px' },
    title: { fontWeight: '900', color: '#111' },
    description: { color: '#666', lineHeight: '1.6', wordBreak: 'keep-all' },
    card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' },
    cardHeader: { borderBottom: '2px solid #6200ee', paddingBottom: '20px', marginBottom: '30px' },
    jsaId: { color: '#6200ee', fontWeight: '900', fontSize: '1rem' },
    jsaTitle: { fontWeight: '800', marginTop: '10px', wordBreak: 'keep-all' },
    summaryGrid: { marginBottom: '40px', backgroundColor: '#f9f9ff', padding: '30px', borderRadius: '16px' },
    summaryTitle: { fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', color: '#333', display: 'block' },
    stepContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    stepRow: { display: 'flex', gap: '15px', alignItems: 'flex-start' },
    stepNum: { backgroundColor: '#6200ee', color: '#fff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', flexShrink: 0 },
    stepContent: { fontSize: '0.85rem', lineHeight: '1.4' },
    imageWrapper: { border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f9f9f9' },
    previewLabel: { fontSize: '0.75rem', color: '#aaa', padding: '10px 20px', margin: 0, backgroundColor: '#fff' },
    previewImage: { width: '100%', height: 'auto', display: 'block' },
    cardFooter: { marginTop: '40px', textAlign: 'center' },
    downloadBtn: { display: 'inline-block', padding: '16px 50px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none' },
    finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};