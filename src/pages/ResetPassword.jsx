import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ useNavigate 제거
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO'; // ✅ [추가] 글로벌 SEO 컴포넌트
import { useLanguageNavigate } from '../hooks/useLanguage'; // ✅ [추가] 다국어 네비게이션 훅

/**
 * [ResetPassword 컴포넌트]
 * 역할: 사용자 비밀번호 재설정 및 보안 세션 관리 (글로벌 표준 마이그레이션 완료)
 */
export default function ResetPassword() {
  const navigate = useLanguageNavigate(); // ✅ [변경] 다국어 네비게이트 사용
  const { t } = useTranslation('login'); // login 네임스페이스 사용
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 실시간 검증 피드백 상태 (다국어 컬러/메시지 동적 적용)
  const [val, setVal] = useState({
    pwComplexity: { msg: '', isOk: false, color: '#666' },
    pwMatch: { msg: '', isOk: false, color: '#666' }
  });

  // [로직 1] 비정상 접근 차단 (세션 유효성 검사)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        alert(t('reset.alertInvalidSession')); // ✅ [다국어화]
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate, t]);

  // [로직 2] 비밀번호 복잡도 실시간 검증
  useEffect(() => {
    if (!password) {
      setVal(p => ({ ...p, pwComplexity: { msg: '', isOk: false, color: '#666' } }));
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLengthOk = password.length >= 8;

    if (hasLetter && hasNumber && hasSpecial && isLengthOk) {
      setVal(p => ({ ...p, pwComplexity: { msg: t('reset.complexityValid'), isOk: true, color: '#007bff' } })); // ✅ [다국어화]
    } else {
      setVal(p => ({ ...p, pwComplexity: { msg: t('reset.complexityInvalid'), isOk: false, color: '#ff4d4d' } })); // ✅ [다국어화]
    }
  }, [password, t]);

  // [로직 3] 비밀번호 실시간 매칭
  useEffect(() => {
    if (confirmPassword.length > 0) {
      const isMatch = password === confirmPassword;
      setVal(p => ({
        ...p,
        pwMatch: { 
          msg: isMatch ? t('reset.matchValid') : t('reset.matchInvalid'), // ✅ [다국어화]
          isOk: isMatch, 
          color: isMatch ? '#007bff' : '#ff4d4d' 
        }
      }));
    } else {
      setVal(p => ({ ...p, pwMatch: { msg: '', isOk: false, color: '#666' } }));
    }
  }, [password, confirmPassword, t]);

  // [로직 4] 비밀번호 업데이트 제출 핸들러
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!val.pwComplexity.isOk || !val.pwMatch.isOk) {
      return alert(t('reset.alertCheckFields')); // ✅ [다국어화]
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;

      alert(t('reset.alertSuccess')); // ✅ [다국어화]
      
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      alert(`${t('reset.alertFail')} ${err.message}`); // ✅ [다국어화]
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <SEO /> {/* ✅ [추가] 글로벌 SEO 태그 자동 삽입 */}
      
      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>

      <div style={styles.mainLayout}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>{t('reset.title')}</h2>
          </div>

          <p style={styles.guideText}>
            {t('reset.guide')}
          </p>

          <form onSubmit={handleUpdatePassword} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('reset.passwordLabel')}</label>
              <input 
                type="password" 
                style={styles.input} 
                placeholder={t('reset.passwordPlaceholder')} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <span style={{...styles.valMsg, color: val.pwComplexity.color}}>{val.pwComplexity.msg}</span>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('reset.confirmLabel')}</label>
              <input 
                type="password" 
                style={styles.input} 
                placeholder={t('reset.confirmPlaceholder')} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
              />
              <span style={{...styles.valMsg, color: val.pwMatch.color}}>{val.pwMatch.msg}</span>
            </div>

            <button 
              type="submit" 
              style={styles.primaryBtn} 
              disabled={loading || !val.pwComplexity.isOk || !val.pwMatch.isOk}
            >
              {loading ? t('reset.processing') : t('reset.submit')}
            </button>
          </form>

          <div style={styles.switchModeArea}>
            <button type="button" style={styles.secondaryBtn} onClick={() => navigate('/login')}>
              {t('reset.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // 기존 디자인 규격을 엄격히 보존합니다[cite: 6].
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1 },
  header: { padding: '1.5rem 4rem', zIndex: 10 },
  logo: { fontSize: '1.2rem', fontWeight: '900', color: '#fff', cursor: 'pointer' },
  mainLayout: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, padding: '20px' },
  formCard: { width: '100%', maxWidth: '440px', backgroundColor: 'rgba(25, 25, 25, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' },
  formHeader: { marginBottom: '12px', borderLeft: '4px solid #007bff', paddingLeft: '12px' },
  formTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#fff', margin: 0 },
  guideText: { color: '#888', fontSize: '0.85rem', marginBottom: '32px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  label: { fontSize: '0.8rem', color: '#aaa', fontWeight: '600', paddingLeft: '4px' },
  input: { height: '52px', padding: '0 16px', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' },
  valMsg: { fontSize: '0.75rem', marginTop: '4px', paddingLeft: '4px', fontWeight: '700' },
  primaryBtn: { width: '100%', height: '52px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1rem', marginTop: '10px' },
  secondaryBtn: { width: '100%', height: '52px', backgroundColor: 'transparent', color: '#999', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  switchModeArea: { marginTop: '12px' },
  form: { display: 'flex', flexDirection: 'column' }
};