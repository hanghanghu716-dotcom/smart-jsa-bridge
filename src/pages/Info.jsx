import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner';

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

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [participants, setParticipants] = useState(Array(10).fill(''));

  useEffect(() => {
    if (location.state?.formData) {
      setFormData(location.state.formData);
    }
    if (location.state?.participants) {
      setParticipants(location.state.participants);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'ppe' || name === 'permits') {
      setFormData((prev) => {
        const list = prev[name];
        return {
          ...prev,
          [name]: checked
            ? [...list, value]
            : list.filter((item) => item !== value),
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
    navigate('/procedure', {
      state: {
        formData,
        participants,
        analysisData: location.state?.analysisData,
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
        <h1 style={styles.logo} onClick={() => navigate('/')}>
          Smart JSA Bridge
        </h1>
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="2000000001" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper}>
              <div style={styles.stepItemActive}>
                <div style={styles.stepBadgeActive}>1</div>
                <span style={styles.stepTextActive}>기본 정보</span>
              </div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}>
                <div style={styles.stepBadge}>2</div>
                <span style={styles.stepText}>작업 절차</span>
              </div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}>
                <div style={styles.stepBadge}>3</div>
                <span style={styles.stepText}>위험 분석</span>
              </div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}>
                <div style={styles.stepBadge}>4</div>
                <span style={styles.stepText}>최종 출력</span>
              </div>
            </nav>

            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>01. 작업 기본 정보 및 안전 요건</h2>
            </div>

            <div style={styles.scrollArea}>
              <div style={styles.formGrid}>
                <section style={styles.leftSection}>
                  <div style={styles.row}>
                    <div style={{ ...styles.flexItem, flex: 2 }}>
                      <label style={styles.label}>프로젝트명</label>
                      <input
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                    <div style={{ ...styles.flexItem, flex: 1.2 }}>
                      <label style={styles.label}>수행 부서</label>
                      <input
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>작업 위치</label>
                    <input
                      name="workLocation"
                      value={formData.workLocation}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.row}>
                    <div style={styles.flexItem}>
                      <label style={styles.label}>작업 예정일</label>
                      <input
                        type="date"
                        name="workDate"
                        value={formData.workDate}
                        onChange={handleChange}
                        style={styles.inputDate}
                      />
                    </div>
                    <div style={styles.flexItem}>
                      <label style={styles.label}>현장 책임자</label>
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
                      <label style={styles.label}>현장 날씨</label>
                      <select
                        name="weather"
                        value={formData.weather}
                        onChange={handleChange}
                        style={styles.selectInput}
                      >
                        <option value="맑음">맑음</option>
                        <option value="흐림">흐림</option>
                        <option value="비">비 (우천)</option>
                        <option value="눈">눈 (강설)</option>
                        <option value="강풍">강풍</option>
                        <option value="폭염">폭염/고온</option>
                        <option value="한파">한파/저온</option>
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
                          신입/미숙련 작업자 포함
                        </span>
                      </label>
                    </div>
                  </div>
                </section>

                <section style={styles.rightSection}>
                  <label style={styles.label}>평가 참여자 명단</label>
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
                  <label style={styles.label}>개인보호구</label>
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
                        {item}
                      </label>
                    ))}
                  </div>
                </section>

                <section style={styles.safetySection}>
                  <label style={styles.label}>허가 대상 작업</label>
                  <div style={styles.checkGrid}>
                    {permitOptions.map((item) => (
                      <label key={item} style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          name="permits"
                          value={item}
                          checked={formData.permits.includes(item)}
                          onChange={handleChange}
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              <div style={styles.inputGroupFull}>
                <label style={styles.label}>필요 장비</label>
                <input
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroupFull}>
                <label style={styles.label}>추가 요청 사항</label>
                <textarea
                  name="additionalItems"
                  value={formData.additionalItems}
                  onChange={handleChange}
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={() => navigate('/')}>
                처음으로
              </button>
              <button style={styles.nextBtn} onClick={handleNext}>
                작업 절차 정의 단계로 이동
              </button>
            </div>
          </div>
        </main>

        <aside style={styles.sideAd}>
          <AdBanner slot="2000000002" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.footerArea}>
        <div style={styles.bottomAdWrapper}>
          <AdBanner slot="2000000003" style={{ width: '728px', height: '90px' }} format="horizontal" />
        </div>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bgWrapper: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 },
  bgImage: { position: 'absolute', width: '100%', height: '100%', backgroundImage: 'url(/images/image1.jpg)', backgroundSize: 'cover', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  header: { padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', gap: '4rem', zIndex: 10, overflow: 'hidden' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }, 
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1440px', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '2rem 2.5rem', boxShadow: '0 40px 80px rgba(0,0,0,0.9)', maxHeight: '78vh', display: 'flex', flexDirection: 'column' },
  scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '1rem' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.8rem' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadgeActive: { width: '22px', height: '22px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', boxShadow: '0 0 10px rgba(0,123,255,0.6)' },
  stepTextActive: { fontSize: '0.85rem', color: '#fff', fontWeight: '700' },
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
  checkLabel: { color: '#ddd', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
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
  footerArea: { width: '100%', padding: '0.5rem 5rem 1.5rem', zIndex: 10 },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  inputGroupFull: { display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.5rem' },
};