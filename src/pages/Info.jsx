import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner';
import { useTranslation } from 'react-i18next'; // ✅ [추가] 다국어 지원 훅 임포트

const DEFAULT_FORM_DATA = {
  projectName: '',
  department: '',
  workLocation: '',
  workDate: '',
  managerName: '',
  workType: '정기작업',
  weather: '맑음',
  hasNewWorker: false,
  ppe: [],
  permits: [],
  equipment: '',
  additionalItems: '',
};

export default function Info() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['info']); // ✅ [추가] info 네임스페이스 로드

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [participants, setParticipants] = useState(Array(14).fill(''));

  useEffect(() => {
    const isFork = location.state?.isFork;

    if (location.state?.formData) {
      const loadedData = location.state.formData;
      
      setFormData(prev => ({
        ...prev, 
        ...loadedData, 
        ppe: loadedData.ppe || [], 
        permits: loadedData.permits || [], 
        ...(isFork ? { 
          projectName: '',
          department: '',
          workLocation: '',
          workDate: '',
          managerName: ''
        } : {})
      }));
    }

    if (isFork) {
      setParticipants(Array(14).fill(''));
    } else if (location.state?.participants) {
      const loadedParticipants = location.state.participants || [];
      setParticipants(Array(14).fill('').map((_, i) => loadedParticipants[i] || ''));
    } 
  }, [location.state]);



  const handleLogoClick = () => {
    // ✅ [수정] 경고 메시지 다국어 처리
    if (window.confirm(t('alert.confirmMain'))) {
      navigate('/');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'permits') {
      setFormData((prev) => {
        let newList;
        if (value === '일반') {
          newList = checked ? ['일반'] : [];
        } else {
          const filtered = prev.permits.filter(p => p !== '일반');
          newList = checked ? [...filtered, value] : filtered.filter(p => p !== value);
        }
        return { ...prev, permits: newList };
      });
      return;
    }

    if (name === 'ppe') {
      setFormData((prev) => {
        const list = prev[name];
        return {
          ...prev,
          [name]: checked ? [...list, value] : list.filter((item) => item !== value),
        };
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleParticipantChange = (index, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

const handleNext = () => {
    if (!formData.projectName.trim()) {
      // ✅ [수정] 필수 입력 경고 다국어 처리
      alert(t('alert.projectNameRequired'));
      return;
    }

    navigate('/procedure', {
      state: {
        formData,
        participants,
        procedures: location.state?.procedures,
        analysisData: location.state?.analysisData,
        isFork: location.state?.isFork,
        parentId: location.state?.parentId, 
        originalAnalysisData: location.state?.originalAnalysisData 
      },
    });
  };


  const ppeOptions = ['안전모', '안전화', '보안경', '장갑', '귀마개', '방진복', '방진마스크'];
  const permitOptions = ['일반', '화기', '밀폐', '정전', '굴착', '방사선', '고소', '중량물', '가연성가스'];

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgWrapper}>
        <div style={styles.bgImage} />
        <div style={styles.dimOverlay} />
      </div>

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={handleLogoClick}>
          Smart JSA Bridge
        </h1>
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
          <nav style={styles.stepper}>
            {/* ✅ [수정] 단계별 텍스트 다국어 처리 */}
            <div style={styles.stepItemActive}>
              <div style={styles.stepBadgeActive}>1</div>
              <span style={styles.stepTextActive}>{t('step.basicInfo')}</span>
            </div>
            <div style={styles.stepLine} />

            <div style={styles.stepItem}><div style={styles.stepBadge}>2</div><span style={styles.stepText}>{t('step.procedure')}</span></div>
            <div style={styles.stepLine} />
            <div style={styles.stepItem}><div style={styles.stepBadge}>3</div><span style={styles.stepText}>{t('step.riskAnalysis')}</span></div>
            <div style={styles.stepLine} />
            <div style={styles.stepItem}><div style={styles.stepBadge}>4</div><span style={styles.stepText}>{t('step.moduleConfig')}</span></div>
            <div style={styles.stepLine} />
            <div style={styles.stepItem}><div style={styles.stepBadge}>5</div><span style={styles.stepText}>{t('step.tableConfig')}</span></div>
            <div style={styles.stepLine} />
            <div style={styles.stepItem}><div style={styles.stepBadge}>6</div><span style={styles.stepText}>{t('step.finalOutput')}</span></div>
          </nav>

            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>{t('form.title')}</h2> {/* ✅ [수정] 헤더 타이틀 다국어 처리 */}
            </div>

            <div style={styles.scrollArea}>
              <div style={styles.warningBox}>
                <p style={styles.warningText}>
                  {/* ✅ [수정] 안내 경고문 다국어 처리 */}
                  ⚠️ <strong>{t('warning.title')}</strong> {t('warning.text')}
                </p>
              </div>

              <div style={styles.formGrid}>
                <section style={styles.leftSection}>
                  <div style={styles.row}>
                    <div style={{ ...styles.flexItem, flex: 2 }}>
                      <label style={styles.label}>
                        {/* ✅ [수정] 라벨 다국어 처리 */}
                        {t('form.projectName')} <span style={{ color: '#ff4d4d' }}>{t('form.required')}</span>
                      </label>
                      <input
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                    <div style={{ ...styles.flexItem, flex: 1.2 }}>
                      <label style={styles.label}>{t('form.department')}</label> {/* ✅ [수정] 라벨 다국어 처리 */}
                      <input
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('form.workLocation')}</label> {/* ✅ [수정] 라벨 다국어 처리 */}
                    <input
                      name="workLocation"
                      value={formData.workLocation}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.row}>
                    <div style={styles.flexItem}>
                      <label style={styles.label}>{t('form.workDate')}</label> {/* ✅ [수정] 라벨 다국어 처리 */}
                      <input
                        type={formData.workDate ? "date" : "text"}
                        name="workDate"
                        value={formData.workDate}
                        placeholder="YYYY-MM-DD"
                        onFocus={(e) => (e.target.type = "date")}
                        onBlur={(e) => {
                          if (!e.target.value) e.target.type = "text";
                        }}
                        onChange={handleChange}
                        style={styles.inputDate}
                      />
                    </div>

                    <div style={styles.flexItem}>
                      <label style={styles.label}>{t('form.managerName')}</label> {/* ✅ [수정] 라벨 다국어 처리 */}
                      <input
                        name="managerName"
                        value={formData.managerName}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={{ ...styles.row, alignItems: 'flex-end' }}>
                    <div style={styles.flexItem}>
                      <label style={styles.label}>{t('form.weather')}</label> {/* ✅ [수정] 라벨 다국어 처리 */}
                      <select
                        name="weather"
                        value={formData.weather}
                        onChange={handleChange}
                        style={styles.selectInput}
                      >
                        {/* ✅ [수정] 옵션 렌더링 텍스트 다국어 처리 (value는 기존 한국어 유지) */}
                        <option value="맑음">{t('weather.sunny')}</option>
                        <option value="흐림">{t('weather.cloudy')}</option>
                        <option value="비">{t('weather.rain')}</option>
                        <option value="눈">{t('weather.snow')}</option>
                        <option value="강풍">{t('weather.wind')}</option>
                        <option value="폭염">{t('weather.heatwave')}</option>
                        <option value="한파">{t('weather.coldwave')}</option>
                      </select>
                    </div>
                    <div style={styles.flexItem}>
                      <label style={styles.checkLabelHighlight}>
                        <input
                          type="checkbox"
                          name="hasNewWorker"
                          checked={formData.hasNewWorker}
                          onChange={handleChange}
                          style={styles.checkboxSmall}
                        />
                        <span style={{ 
                          color: formData.hasNewWorker ? '#ff4d4d' : '#888', 
                          fontWeight: 'bold',
                          transition: 'color 0.2s',
                          fontSize: '0.9rem'
                        }}>
                          {t('form.hasNewWorker')} {/* ✅ [수정] 라벨 다국어 처리 */}
                        </span>
                      </label>
                    </div>
                  </div>
                </section>

                <section style={styles.rightSection}>
                  <label style={styles.label}>{t('form.participants')}</label> {/* ✅ [수정] 라벨 다국어 처리 */}
                  <div style={styles.participantGrid}>
                    {participants.map((p, i) => (
                      <div key={i} style={styles.participantBox}>
                        <span style={styles.pNumber}>{String(i + 1).padStart(2, '0')}</span>
                        <input
                          value={p}
                          onChange={(e) => handleParticipantChange(i, e.target.value)}
                          style={styles.pInput}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <hr style={styles.divider} />

              <div style={styles.safetyGrid}>
                <section style={styles.safetySection}>
                  <label style={styles.label}>{t('form.ppe')}</label> {/* ✅ [수정] 라벨 다국어 처리 */}
                  <div style={styles.checkGrid}>
                    {ppeOptions.map((item) => (
                      <label key={item} style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          name="ppe"
                          value={item}
                          checked={formData.ppe.includes(item)}
                          onChange={handleChange}
                        />
                        {t(`ppe.${item}`)} {/* ✅ [수정] 옵션 렌더링 텍스트 다국어 처리 */}
                      </label>
                    ))}
                  </div>
                </section>

                <section style={styles.safetySection}>
                  <label style={styles.label}>{t('form.permits')}</label> {/* ✅ [수정] 라벨 다국어 처리 */}
                  <div style={styles.checkGrid}>
                    {permitOptions.map((item) => {
                      const isGeneralSelected = formData.permits.includes('일반');
                      const isOthersSelected = formData.permits.some(p => p !== '일반');
                      const isDisabled = (item === '일반' && isOthersSelected) || (item !== '일반' && isGeneralSelected);

                      return (
                        <label key={item} style={{
                          ...styles.checkLabel,
                          opacity: isDisabled ? 0.3 : 1,
                          cursor: isDisabled ? 'not-allowed' : 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            name="permits"
                            value={item}
                            checked={formData.permits.includes(item)}
                            onChange={handleChange}
                            disabled={isDisabled}
                          />
                          {t(`permit.${item}`)} {/* ✅ [수정] 옵션 렌더링 텍스트 다국어 처리 */}
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div style={styles.inputGroupFull}>
                <label style={styles.label}>{t('form.equipment')}</label> {/* ✅ [수정] 라벨 다국어 처리 */}
                <input
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroupFull}>
                <label style={styles.label}>{t('form.additionalItems')}</label> {/* ✅ [수정] 라벨 다국어 처리 */}
                <textarea
                  name="additionalItems"
                  value={formData.additionalItems}
                  onChange={handleChange}
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={handleLogoClick}>
                {t('btn.home')} {/* ✅ [수정] 버튼 텍스트 다국어 처리 */}
              </button>
              <button style={styles.nextBtn} onClick={handleNext}>
                {t('btn.next')} {/* ✅ [수정] 버튼 텍스트 다국어 처리 */}
              </button>
            </div>
          </div>
        </main>

        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.footerArea}>
        <div style={styles.bottomAdWrapper}>
          <AdBanner slot="1284119169" style={{ width: '728px', height: '90px' }} format="horizontal" />
        </div>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', overflowX: 'hidden' },
  bgWrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem 20px', gap: '4rem', zIndex: 10, overflow: 'visible' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }, 
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1440px', height: '78vh', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '2rem 2.5rem', boxShadow: '0 40px 80px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '1rem' },
  warningBox: { backgroundColor: 'rgba(255, 77, 77, 0.08)', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '8px', padding: '1rem 1.2rem', marginBottom: '1.5rem' },
  warningText: { fontSize: '0.82rem', color: '#ff7675', margin: 0, lineHeight: '1.6', fontWeight: '500' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.8rem' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.3 },
  stepBadgeActive: { width: '22px', height: '22px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', boxShadow: '0 0 10px rgba(0,123,255,0.6)' },
  stepBadge: { width: '22px', height: '22px', backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#aaa' },
  stepTextActive: { fontSize: '0.85rem', color: '#fff', fontWeight: '700' },
  stepText: { fontSize: '0.85rem', color: '#aaa' },
  stepLine: { width: '30px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  formHeader: { marginBottom: '1.2rem', borderLeft: '5px solid #007bff', paddingLeft: '1rem' },
  formTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#fff' },
  formGrid: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2.5rem', marginBottom: '0.5rem' },
  leftSection: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  rightSection: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  divider: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1.5rem 0' },
  safetyGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '1.5rem' },
  safetySection: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem 0.4rem', backgroundColor: '#161616', padding: '1rem', borderRadius: '8px' },
  checkLabel: { color: '#ddd', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  checkLabelHighlight: { color: '#ddd', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer', backgroundColor: '#161616', padding: '0 1rem', borderRadius: '6px', border: '1px solid #333', height: '45px', boxSizing: 'border-box' },
  label: { fontSize: '0.8rem', color: '#888', fontWeight: '700' },
  input: { height: '45px', padding: '0 1rem', backgroundColor: '#1d1d1d', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  inputDate: { height: '45px', padding: '0 1rem', backgroundColor: '#1d1d1d', border: '1px solid #333', borderRadius: '6px', color: '#fff', colorScheme: 'dark', width: '100%', boxSizing: 'border-box' },
  selectInput: { height: '45px', padding: '0 1rem', backgroundColor: '#1d1d1d', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' },
  textarea: { padding: '0.8rem 1rem', backgroundColor: '#1d1d1d', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', minHeight: '80px', outline: 'none', resize: 'none' },
  row: { display: 'flex', gap: '1rem' },
  flexItem: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 },
  participantGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' },
  participantBox: { display: 'flex', alignItems: 'center', backgroundColor: '#1d1d1d', border: '1px solid #333', borderRadius: '6px', paddingLeft: '10px', height: '40px' },
  pNumber: { fontSize: '0.7rem', color: '#555', fontWeight: '800', width: '20px' },
  pInput: { flex: 1, padding: '0.7rem', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', outline: 'none' },
  checkboxSmall: { width: '1.1rem', height: '1.1rem', cursor: 'pointer' },
  btnArea: { marginTop: '1.5rem', display: 'flex', gap: '1.2rem' },
  prevBtn: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtn: { flex: 2, padding: '1rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' },
  footerArea: { width: '100%', zIndex: 10, position: 'relative', padding: '1.5rem 5rem', backgroundColor: 'transparent', display: 'flex', justifyContent: 'center' },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  inputGroupFull: { display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.5rem' },
};