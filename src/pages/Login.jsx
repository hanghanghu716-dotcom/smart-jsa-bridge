import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdSenseUnit from '../components/AdSenseUnit';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation('login');

  // 애드센스 설정 정보
  const PUBLISHER_ID = 'ca-pub-9791625990220699'; 
  const LEFT_SIDEBAR_SLOT_ID = '3978298367'; 
  const RIGHT_SIDEBAR_SLOT_ID = '3978298367';

  const [mode, setMode] = useState('login'); 
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [sector, setSector] = useState('');

  const [val, setVal] = useState({
    nick: { msg: '', isOk: false, color: '#666' },
    pwComplexity: { msg: '', isOk: false, color: '#666' },
    pwMatch: { msg: '', isOk: false, color: '#666' }
  });

  useEffect(() => {
    const validateNick = async () => {
      if (!nickname) {
        setVal(p => ({ ...p, nick: { msg: '', isOk: false, color: '#666' } }));
        return;
      }
      
      const forbiddenDB = ['관리자', '운영자', '어드민', 'admin', 'root', 'system'];
      const hasBadWord = forbiddenDB.some(word => nickname.toLowerCase().includes(word));
      const hasSpecial = /[^a-zA-Z0-9가-힣]/.test(nickname);

      if (hasBadWord) {
        setVal(p => ({ ...p, nick: { msg: t('val.nickBadWord'), isOk: false, color: '#ff4d4d' } }));
        return;
      }
      if (hasSpecial) {
        setVal(p => ({ ...p, nick: { msg: t('val.nickNoSpecial'), isOk: false, color: '#ff4d4d' } }));
        return;
      }

      const { data } = await supabase.from('profiles').select('username').eq('username', nickname).maybeSingle();

      if (data) {
        setVal(p => ({ ...p, nick: { msg: t('val.nickInUse'), isOk: false, color: '#ff4d4d' } }));
      } else {
        setVal(p => ({ ...p, nick: { msg: t('val.nickAvailable'), isOk: true, color: '#007bff' } }));
      }
    };
    const timer = setTimeout(validateNick, 400); 
    return () => clearTimeout(timer);
  }, [nickname, t]);

  useEffect(() => {
    if (!password) {
      setVal(p => ({ ...p, pwComplexity: { msg: '', isOk: false, color: '#666' } }));
      return;
    }
    const isOk = /[a-zA-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*()]/.test(password) && password.length >= 8;
    setVal(p => ({ ...p, pwComplexity: { 
      msg: isOk ? t('val.pwSafe') : t('val.pwRule'), 
      isOk, 
      color: isOk ? '#007bff' : '#ff4d4d' 
    } }));
  }, [password, t]);

  useEffect(() => {
    if (confirmPassword.length > 0) {
      const isMatch = password === confirmPassword;
      setVal(p => ({ ...p, pwMatch: { 
        msg: isMatch ? t('val.pwMatch') : t('val.pwMismatch'), 
        isOk: isMatch, 
        color: isMatch ? '#007bff' : '#ff4d4d' 
      } }));
    } else {
      setVal(p => ({ ...p, pwMatch: { msg: '', isOk: false, color: '#666' } }));
    }
  }, [password, confirmPassword, t]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/');
    };
    checkSession();
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (mode === 'reset') {
      if (!email) return;
      setLoading(true);
      try {
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        alert(t('alert.resetSent'));
        setMode('login');
      } catch (err) { alert(err.message); } finally { setLoading(false); }
      return;
    }

    if (mode === 'signup') {
      if (!val.nick.isOk || !val.pwComplexity.isOk || !val.pwMatch.isOk) return alert(t('alert.checkInput'));
      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { username: nickname, display_name: nickname, company_name: sector, default_publicity: true },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        alert(t('alert.signupSuccess'));
        setMode('login');
      } catch (err) { alert(err.message); } finally { setLoading(false); }
      return;
    }

    if (mode === 'login') {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } catch (err) { alert(err.message); } finally { setLoading(false); }
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>

      {/* [데스크탑 전용]: 왼쪽 사이드바 광고 추가 */}
      <aside className="max-lg:hidden" style={styles.adSlotFixedLeft}>
        <div style={styles.adPlaceholderBox}>
          <span style={styles.adLabel}>AD (LEFT)</span>
          <AdSenseUnit 
            client={PUBLISHER_ID} 
            slot={LEFT_SIDEBAR_SLOT_ID} 
            format="vertical" 
            style={{ width: '160px', height: '600px' }} 
          />
        </div>
      </aside>

      {/* [데스크탑 전용]: 오른쪽 사이드바 광고 추가 */}
      <aside className="max-lg:hidden" style={styles.adSlotFixedRight}>
        <div style={styles.adPlaceholderBox}>
          <span style={styles.adLabel}>AD (RIGHT)</span>
          <AdSenseUnit 
            client={PUBLISHER_ID} 
            slot={RIGHT_SIDEBAR_SLOT_ID} 
            format="vertical" 
            style={{ width: '160px', height: '600px' }} 
          />
        </div>
      </aside>

      <div style={styles.mainLayout}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>
              {mode === 'signup' ? t('ui.titleSignup') : mode === 'reset' ? t('ui.titleReset') : t('ui.titleLogin')}
            </h2>
          </div>

          <p style={styles.guideText}>
            {mode === 'signup' ? t('ui.guideSignup') : mode === 'reset' ? t('ui.guideReset') : t('ui.guideLogin')}
          </p>

          <form onSubmit={handleAuth} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('ui.labelEmail')}</label>
              <input type="email" style={styles.input} placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {mode === 'signup' && (
              <>
                <div style={styles.row}>
                  <div style={{...styles.flexItem, flex: 1.2}}>
                    <label style={styles.label}>{t('ui.labelNickname')}</label>
                    <input type="text" style={styles.input} placeholder={t('ui.placeholderNickname')} value={nickname} onChange={e => setNickname(e.target.value)} required />
                    <span style={{...styles.valMsg, color: val.nick.color}}>{val.nick.msg}</span>
                  </div>
                  <div style={{...styles.flexItem, flex: 1}}>
                    <label style={styles.label}>{t('ui.labelSector')}</label>
                    {/* ✅ 종사 분야 드롭다운 확장 및 정렬 교정 */}
                    <select style={styles.selectInput} value={sector} onChange={e => setSector(e.target.value)} required>
                      <option value="">{t('ui.selectDefault')}</option>
                      <option value="건설 / 토목 / 건축">{t('sector.construction')}</option>
                      <option value="제조 / 플랜트 / 화학">{t('sector.manufacturing')}</option>
                      <option value="에너지 / 전기 / 가스">{t('sector.energy')}</option>
                      <option value="운송 / 물류 / 창고">{t('sector.logistics')}</option>
                      <option value="안전관리 / 전문 컨설팅">{t('sector.safety')}</option>
                      <option value="IT / 시스템 / 엔지니어링">{t('sector.it')}</option>
                      <option value="공공기관 / 교육 / 보건">{t('sector.public')}</option>
                      <option value="기타 산업군">{t('sector.others')}</option>
                    </select>
                  </div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>{t('ui.labelPassword')}</label>
                  <input type="password" style={styles.input} placeholder={t('ui.placeholderPassword')} value={password} onChange={e => setPassword(e.target.value)} required />
                  <span style={{...styles.valMsg, color: val.pwComplexity.color}}>{val.pwComplexity.msg}</span>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>{t('ui.labelPasswordConfirm')}</label>
                  <input type="password" style={styles.input} placeholder={t('ui.placeholderPasswordConfirm')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  <span style={{...styles.valMsg, color: val.pwMatch.color}}>{val.pwMatch.msg}</span>
                </div>
              </>
            )}

            {mode === 'login' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>{t('ui.labelPassword')}</label>
                <input type="password" style={styles.input} placeholder={t('ui.placeholderPasswordLogin')} value={password} onChange={e => setPassword(e.target.value)} required />
                <div style={styles.forgotPasswordArea}>
                  <button type="button" style={styles.textLinkBtn} onClick={() => setMode('reset')}>{t('ui.btnForgotPw')}</button>
                </div>
              </div>
            )}

            <button type="submit" style={styles.primaryBtn} disabled={loading || (mode === 'signup' && (!val.nick.isOk || !val.pwComplexity.isOk || !val.pwMatch.isOk))}>
              {loading ? t('ui.btnProcessing') : mode === 'signup' ? t('ui.btnSubmitSignup') : mode === 'reset' ? t('ui.btnSubmitReset') : t('ui.btnSubmitLogin')}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div style={styles.dividerContainer}><div style={styles.line} /><span style={styles.dividerText}>{t('ui.dividerOr')}</span><div style={styles.line} /></div>
              {/* ✅ 구글 로그인 이미지 에셋 복구 */}
              <button onClick={() => supabase.auth.signInWithOAuth({provider: 'google'})} style={styles.googleBtn}>
                <img src="https://www.google.com/favicon.ico" alt="" style={{width:'18px'}} />
                <span>{t('ui.btnGoogleLogin')}</span>
              </button>
            </>
          )}

          <div style={styles.switchModeArea}>
            <button style={styles.secondaryBtn} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? t('ui.btnSwitchSignup') : t('ui.btnSwitchLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1 },
  header: { padding: '1.5rem 4rem', zIndex: 10 },
  logo: { fontSize: '1.2rem', fontWeight: '900', color: '#fff', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
  mainLayout: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, padding: '20px' },
  formCard: { width: '100%', maxWidth: '440px', backgroundColor: 'rgba(15, 15, 15, 0.95)', border: '1px solid #222', borderRadius: '12px', padding: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' },
  formHeader: { marginBottom: '10px', borderLeft: '4px solid #007bff', paddingLeft: '12px' },
  formTitle: { fontSize: '1.3rem', fontWeight: '800', color: '#fff', margin: 0 },
  guideText: { color: '#666', fontSize: '0.8rem', marginBottom: '30px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  row: { display: 'flex', gap: '10px', marginBottom: '20px' },
  flexItem: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.75rem', color: '#888', fontWeight: 'bold', paddingLeft: '2px' },
  input: { height: '48px', padding: '0 14px', backgroundColor: '#000', border: '1px solid #222', borderRadius: '6px', color: '#fff', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box', width: '100%' },
  // ✅ 드롭다운 돌출 방지를 위한 boxSizing 명시 및 패딩 조정
  selectInput: { height: '48px', padding: '0 10px', backgroundColor: '#000', border: '1px solid #222', borderRadius: '6px', color: '#fff', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', width: '100%', cursor: 'pointer' },
  valMsg: { fontSize: '0.7rem', marginTop: '4px', fontWeight: 'bold' },
  forgotPasswordArea: { textAlign: 'right', marginTop: '6px' },
  textLinkBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'underline' },
  primaryBtn: { width: '100%', height: '52px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '900', fontSize: '1rem', marginTop: '10px' },
  googleBtn: { width: '100%', height: '52px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  secondaryBtn: { width: '100%', height: '52px', backgroundColor: 'transparent', color: '#666', border: '1px solid #222', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' },
  dividerContainer: { display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' },
  line: { flex: 1, height: '1px', backgroundColor: '#222' },
  dividerText: { color: '#444', fontSize: '0.7rem', fontWeight: '900' },
  switchModeArea: { marginTop: '12px' },
  form: { display: 'flex', flexDirection: 'column' },
  
  // 기능 추가: 광고 플레이스홀더 및 레이아웃 스타일
  adPlaceholderBox: { width: '160px', minHeight: '600px', backgroundColor: '#f5f5f5', border: '1px dashed #ddd', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' },
  adLabel: { fontSize: '11px', color: '#ccc', fontWeight: 'bold', marginBottom: '10px' },

  adSlotFixedLeft: { 
    position: 'fixed',
    top: '50%',
    left: 'calc(50% - 220px - 160px - 20px)', 
    transform: 'translateY(-50%)',
    width: '160px', 
    minHeight: '600px', 
    zIndex: 100
  },
  adSlotFixedRight: { 
    position: 'fixed',
    top: '50%',
    right: 'calc(50% - 220px - 160px - 20px)', 
    transform: 'translateY(-50%)',
    width: '160px', 
    minHeight: '600px', 
    zIndex: 100
  }
};