import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); 
  const [loading, setLoading] = useState(false);

  // 입력 필드 및 인증 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [sector, setSector] = useState('');

  // 실시간 검증 피드백 상태
  const [val, setVal] = useState({
    nick: { msg: '', isOk: false, color: '#666' },
    pwComplexity: { msg: '', isOk: false, color: '#666' },
    pwMatch: { msg: '', isOk: false, color: '#666' }
  });

  // [로직 1] 닉네임 검증 (DB 컬럼명 username과 매핑)
  useEffect(() => {
    const validateNick = async () => {
      if (!nickname) {
        setVal(p => ({ ...p, nick: { msg: '', isOk: false, color: '#666' } }));
        return;
      }
      
      const forbiddenDB = [
        '관리자', '운영자', '어드민', 'admin', 'administrator', 'root', 'system', 'support',
        '씨발', '시발', '병신', '개새끼', '존나', '섹스', '포르노', '도박', '카지노', '토토',
        '바다이야기', '일베', '메갈', '노무현', '문재인', '윤석열', '이재명', '한동훈'
      ];

      const hasBadWord = forbiddenDB.some(word => nickname.toLowerCase().includes(word));
      const hasSpecial = /[^a-zA-Z0-9가-힣]/.test(nickname);

      if (hasBadWord) {
        setVal(p => ({ ...p, nick: { msg: '부적절한 닉네임입니다.', isOk: false, color: '#ff4d4d' } }));
        return;
      }
      if (hasSpecial) {
        setVal(p => ({ ...p, nick: { msg: '특수문자는 허용되지 않습니다.', isOk: false, color: '#ff4d4d' } }));
        return;
      }

      // [수정] select('nickname') -> select('username'), 컬럼명 일치화
      const { data } = await supabase
        .from('profiles')
        .select('username') 
        .eq('username', nickname) 
        .maybeSingle();

      if (data) {
        setVal(p => ({ ...p, nick: { msg: '이미 사용 중인 닉네임입니다.', isOk: false, color: '#ff4d4d' } }));
      } else {
        setVal(p => ({ ...p, nick: { msg: '✓ 사용 가능한 닉네임입니다.', isOk: true, color: '#007bff' } }));
      }
    };
    const timer = setTimeout(validateNick, 400); 
    return () => clearTimeout(timer);
  }, [nickname]);

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

  // [로직 4] 인증 상태 감지 및 라우팅
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/');
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) navigate('/');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // [로직 5] 통합 인증 핸들러
  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (mode === 'reset') {
      if (!email) return alert("이메일을 입력해 주십시오.");
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        alert("비밀번호 재설정 링크가 발송되었습니다.");
        setMode('login');
      } catch (err) {
        alert(`발송 실패: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (!val.nick.isOk || !val.pwComplexity.isOk || !val.pwMatch.isOk) {
        return alert("입력 조건을 확인해 주십시오."); 
      }

      setLoading(true);
      try {
        // [수정] DB 트리거가 인식할 수 있도록 키 이름을 'username', 'display_name', 'company_name'으로 매핑
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              username: nickname,   
              display_name: nickname,
              company_name: sector   
            },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        alert("인증 메일이 전송되었습니다. 메일함에서 가입을 승인해 주십시오.");
        setMode('login');
      } catch (err) {
        alert(`등록 실패: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'login') {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } catch (err) { 
        alert(err.message); 
      } finally { 
        setLoading(false); 
      }
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>

      <div style={styles.mainLayout}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>
              {mode === 'signup' ? "사용자 계정 등록" : mode === 'reset' ? "비밀번호 재설정" : "시스템 접속 인증"}
            </h2>
          </div>

          <p style={styles.guideText}>
            {mode === 'signup' ? "지식 자산화를 위한 필수 정보를 입력하십시오." : mode === 'reset' ? "비밀번호 재설정 링크를 발송합니다." : "등록된 계정으로 접속하여 서비스를 이용하십시오."}
          </p>

          <form onSubmit={handleAuth} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>이메일 주소</label>
              <input type="email" style={styles.input} placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {mode === 'signup' && (
              <>
                <div style={styles.row}>
                  <div style={{...styles.flexItem, flex: 1.2}}>
                    <label style={styles.label}>활동명(닉네임)</label>
                    <input type="text" style={styles.input} placeholder="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} required />
                    <span style={{...styles.valMsg, color: val.nick.color}}>{val.nick.msg}</span>
                  </div>
                  <div style={{...styles.flexItem, flex: 1}}>
                    <label style={styles.label}>분야(업종)</label>
                    <select style={styles.selectInput} value={sector} onChange={e => setSector(e.target.value)} required>
                      <option value="">선택</option>
                      <option value="건설">건설</option><option value="제조">제조</option><option value="화공/가스">화공/가스</option><option value="기타">기타</option>
                    </select>
                  </div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>비밀번호</label>
                  <input type="password" style={styles.input} placeholder="영문+숫자+특수기호 8자 이상" value={password} onChange={e => setPassword(e.target.value)} required />
                  <span style={{...styles.valMsg, color: val.pwComplexity.color}}>{val.pwComplexity.msg}</span>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>비밀번호 재확인</label>
                  <input type="password" style={styles.input} placeholder="비밀번호 재입력" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  <span style={{...styles.valMsg, color: val.pwMatch.color}}>{val.pwMatch.msg}</span>
                </div>
              </>
            )}

            {mode === 'login' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>비밀번호</label>
                <input type="password" style={styles.input} placeholder="8자 이상" value={password} onChange={e => setPassword(e.target.value)} required />
                <div style={styles.forgotPasswordArea}>
                  <button type="button" style={styles.textLinkBtn} onClick={() => setMode('reset')}>비밀번호 분실</button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              style={styles.primaryBtn} 
              disabled={loading || (mode === 'signup' && (!val.nick.isOk || !val.pwComplexity.isOk || !val.pwMatch.isOk))}
            >
              {loading ? "처리 중..." : mode === 'signup' ? "사용자 등록 완료" : mode === 'reset' ? "재설정 링크 발송" : "시스템 접속"}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div style={styles.dividerContainer}><div style={styles.line} /><span style={styles.dividerText}>또는</span><div style={styles.line} /></div>
              <button onClick={() => supabase.auth.signInWithOAuth({provider: 'google'})} style={styles.googleBtn}>
                <img src="https://www.google.com/favicon.ico" alt="" style={{width:'18px'}} />
                <span>Google 계정으로 계속하기</span>
              </button>
            </>
          )}

          <div style={styles.switchModeArea}>
            <button style={styles.secondaryBtn} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? "신규 사용자 등록" : "기존 계정으로 로그인"}
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
  row: { display: 'flex', gap: '12px', marginBottom: '20px' },
  flexItem: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.8rem', color: '#aaa', fontWeight: '600', paddingLeft: '4px' },
  input: { height: '52px', padding: '0 16px', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' },
  selectInput: { height: '52px', padding: '0 12px', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' },
  valMsg: { fontSize: '0.75rem', marginTop: '4px', paddingLeft: '4px', fontWeight: '700' },
  forgotPasswordArea: { textAlign: 'right', marginTop: '8px' },
  textLinkBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', padding: 0, textDecoration: 'underline' },
  primaryBtn: { width: '100%', height: '52px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1rem', marginTop: '10px' },
  googleBtn: { width: '100%', height: '52px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  secondaryBtn: { width: '100%', height: '52px', backgroundColor: 'transparent', color: '#999', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  dividerContainer: { display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' },
  line: { flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#555', fontSize: '0.75rem', fontWeight: '900' },
  switchModeArea: { marginTop: '12px' },
  form: { display: 'flex', flexDirection: 'column' }
};