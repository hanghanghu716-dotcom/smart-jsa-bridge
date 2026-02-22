import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 실시간 검증 피드백 상태 (Login.jsx와 동일한 규격 적용)
  const [val, setVal] = useState({
    pwComplexity: { msg: '', isOk: false, color: '#666' },
    pwMatch: { msg: '', isOk: false, color: '#666' }
  });

  // [로직 1] 비정상 접근 차단 (세션 유효성 검사)
  useEffect(() => {
    const checkSession = async () => {
      // 이메일 링크를 통해 부여된 일시적 복구 세션이 존재하는지 확인
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        alert("유효하지 않거나 만료된 접근입니다. 비밀번호 재설정 링크를 다시 발급받아 주십시오.");
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate]);

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
      setVal(p => ({ ...p, pwComplexity: { msg: '✓ 사용 가능한 비밀번호입니다.', isOk: true, color: '#007bff' } }));
    } else {
      setVal(p => ({ ...p, pwComplexity: { msg: '영문, 숫자, 특수기호를 모두 포함해 8자 이상 입력해 주십시오.', isOk: false, color: '#ff4d4d' } }));
    }
  }, [password]);

  // [로직 3] 비밀번호 실시간 매칭
  useEffect(() => {
    if (confirmPassword.length > 0) {
      const isMatch = password === confirmPassword;
      setVal(p => ({
        ...p,
        pwMatch: { 
          msg: isMatch ? '✓ 비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.', 
          isOk: isMatch, 
          color: isMatch ? '#007bff' : '#ff4d4d' 
        }
      }));
    } else {
      setVal(p => ({ ...p, pwMatch: { msg: '', isOk: false, color: '#666' } }));
    }
  }, [password, confirmPassword]);

  // [로직 4] 비밀번호 업데이트 제출 핸들러
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!val.pwComplexity.isOk || !val.pwMatch.isOk) {
      return alert("입력 조건을 다시 확인해 주십시오.");
    }

    setLoading(true);
    try {
      // 현재 세션의 사용자 비밀번호를 신규 비밀번호로 갱신
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;

      alert("비밀번호가 성공적으로 변경되었습니다. 보안을 위해 새로운 비밀번호로 다시 로그인해 주십시오.");
      
      // 보안 처리: 일시적 복구 세션 파기 후 로그인 화면으로 유도
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      alert(`비밀번호 변경 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>

      <div style={styles.mainLayout}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>신규 비밀번호 설정</h2>
          </div>

          <p style={styles.guideText}>
            계정의 새로운 비밀번호를 입력해 주십시오.
          </p>

          <form onSubmit={handleUpdatePassword} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>새 비밀번호</label>
              <input 
                type="password" 
                style={styles.input} 
                placeholder="영문+숫자+특수기호 8자 이상" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <span style={{...styles.valMsg, color: val.pwComplexity.color}}>{val.pwComplexity.msg}</span>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>새 비밀번호 재확인</label>
              <input 
                type="password" 
                style={styles.input} 
                placeholder="비밀번호 재입력" 
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
              {loading ? "처리 중..." : "비밀번호 변경 완료"}
            </button>
          </form>

          <div style={styles.switchModeArea}>
            <button type="button" style={styles.secondaryBtn} onClick={() => navigate('/login')}>
              로그인 화면으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Login.jsx와 동일한 디자인 규격 유지
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