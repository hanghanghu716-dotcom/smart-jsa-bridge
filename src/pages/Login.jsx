import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
  const navigate = useNavigate();

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
        setVal(p => ({ ...p, nick: { msg: '사용할 수 없는 닉네임입니다.', isOk: false, color: '#ff4d4d' } }));
        return;
      }
      if (hasSpecial) {
        setVal(p => ({ ...p, nick: { msg: '특수문자는 제외해 주십시오.', isOk: false, color: '#ff4d4d' } }));
        return;
      }

      const { data } = await supabase.from('profiles').select('username').eq('username', nickname).maybeSingle();

      if (data) {
        setVal(p => ({ ...p, nick: { msg: '이미 사용 중인 닉네임입니다.', isOk: false, color: '#ff4d4d' } }));
      } else {
        setVal(p => ({ ...p, nick: { msg: '✓ 사용 가능한 닉네임입니다.', isOk: true, color: '#007bff' } }));
      }
    };
    const timer = setTimeout(validateNick, 400); 
    return () => clearTimeout(timer);
  }, [nickname]);

  useEffect(() => {
    if (!password) {
      setVal(p => ({ ...p, pwComplexity: { msg: '', isOk: false, color: '#666' } }));
      return;
    }
    const isOk = /[a-zA-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*()]/.test(password) && password.length >= 8;
    setVal(p => ({ ...p, pwComplexity: { 
      msg: isOk ? '✓ 보안 안전' : '영문+숫자+특수기호 8자 이상', 
      isOk, 
      color: isOk ? '#007bff' : '#ff4d4d' 
    } }));
  }, [password]);

  useEffect(() => {
    if (confirmPassword.length > 0) {
      const isMatch = password === confirmPassword;
      setVal(p => ({ ...p, pwMatch: { 
        msg: isMatch ? '✓ 비밀번호 일치' : '비밀번호 불일치', 
        isOk: isMatch, 
        color: isMatch ? '#007bff' : '#ff4d4d' 
      } }));
    } else {
      setVal(p => ({ ...p, pwMatch: { msg: '', isOk: false, color: '#666' } }));
    }
  }, [password, confirmPassword]);

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
        alert("비밀번호 재설정 링크가 발송되었습니다.");
        setMode('login');
      } catch (err) { alert(err.message); } finally { setLoading(false); }
      return;
    }

    if (mode === 'signup') {
      if (!val.nick.isOk || !val.pwComplexity.isOk || !val.pwMatch.isOk) return alert("입력 정보를 확인하십시오.");
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
        alert("이메일로 전송된 인증 링크를 클릭하여 가입을 완료해 주십시오.");
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

      <div style={styles.mainLayout}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>
              {mode === 'signup' ? "사용자 계정 등록" : mode === 'reset' ? "비밀번호 재설정" : "시스템 접속 인증"}
            </h2>
          </div>

          <p style={styles.guideText}>
            {mode === 'signup' ? "지식 자산화를 위한 필수 정보를 입력하십시오." : mode === 'reset' ? "재설정 링크를 메일로 보내드립니다." : "등록된 계정으로 로그인하여 서비스를 이용하십시오."}
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
                    <label style={styles.label}>활동 닉네임</label>
                    <input type="text" style={styles.input} placeholder="활동명" value={nickname} onChange={e => setNickname(e.target.value)} required />
                    <span style={{...styles.valMsg, color: val.nick.color}}>{val.nick.msg}</span>
                  </div>
                  <div style={{...styles.flexItem, flex: 1}}>
                    <label style={styles.label}>종사 분야</label>
                    {/* ✅ 종사 분야 드롭다운 확장 및 정렬 교정 */}
                    <select style={styles.selectInput} value={sector} onChange={e => setSector(e.target.value)} required>
                      <option value="">선택</option>
                      <option value="건설 / 토목 / 건축">건설 / 토목 / 건축</option>
                      <option value="제조 / 플랜트 / 화학">제조 / 플랜트 / 화학</option>
                      <option value="에너지 / 전기 / 가스">에너지 / 전기 / 가스</option>
                      <option value="운송 / 물류 / 창고">운송 / 물류 / 창고</option>
                      <option value="안전관리 / 전문 컨설팅">안전관리 / 전문 컨설팅</option>
                      <option value="IT / 시스템 / 엔지니어링">IT / 시스템 / 엔지니어링</option>
                      <option value="공공기관 / 교육 / 보건">공공기관 / 교육 / 보건</option>
                      <option value="기타 산업군">기타 산업군</option>
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
                  <input type="password" style={styles.input} placeholder="동일하게 재입력" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  <span style={{...styles.valMsg, color: val.pwMatch.color}}>{val.pwMatch.msg}</span>
                </div>
              </>
            )}

            {mode === 'login' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>비밀번호</label>
                <input type="password" style={styles.input} placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required />
                <div style={styles.forgotPasswordArea}>
                  <button type="button" style={styles.textLinkBtn} onClick={() => setMode('reset')}>비밀번호 분실</button>
                </div>
              </div>
            )}

            <button type="submit" style={styles.primaryBtn} disabled={loading || (mode === 'signup' && (!val.nick.isOk || !val.pwComplexity.isOk || !val.pwMatch.isOk))}>
              {loading ? "처리 중..." : mode === 'signup' ? "사용자 계정 생성" : mode === 'reset' ? "재설정 메일 발송" : "시스템 접속"}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div style={styles.dividerContainer}><div style={styles.line} /><span style={styles.dividerText}>또는</span><div style={styles.line} /></div>
              {/* ✅ 구글 로그인 이미지 에셋 복구 */}
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
  form: { display: 'flex', flexDirection: 'column' }
};