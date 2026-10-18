import ThemeSettings from '../components/ThemeSettings';
import AdminVerification from '../components/AdminVerification';
import { accountSecurity } from '../locales/accountSecurity';
import { getCommunityUi } from '../locales/communityUi';
import { communityAction } from '../services/communityService';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ useNavigate 제거
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import AdBanner from '../AdBanner';
import SEO from '../components/SEO'; // ✅ [추가] 글로벌 SEO 컴포넌트
import { useLanguageNavigate } from '../hooks/useLanguage'; // ✅ [추가] 다국어 네비게이션 훅

export default function Profile() {
  const navigate = useLanguageNavigate(); // ✅ [변경] 다국어 네비게이트 사용
  const { t, i18n } = useTranslation('profile');
  const security = accountSecurity(i18n.language);
  const [message,setMessage] = useState('');
  const [saving,setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    username: '', company_name: '', bio: '', sector: '',
    default_department: '', default_manager: '',
    default_publicity: false, signature_url: ''
  });
  const [stats, setStats] = useState({ myCount: 0, scrapCount: 0 });
  const [notifications, setNotifications] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);

  const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);
  const [withdrawalConfirmText, setWithdrawalConfirmText] = useState("");

  useEffect(() => {
    fetchUserData().catch(()=>setMessage(getCommunityUi(i18n.language).error)).finally(()=>setLoading(false));
  }, []);
  useEffect(()=>()=>{if(profile.signature_url?.startsWith('blob:'))URL.revokeObjectURL(profile.signature_url);},[profile.signature_url]);

  const fetchUserData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    const [pRes, jsaRes, notiRes, sessionRes, prefs] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('jsa_projects').select('id, scrap_count').eq('author_id', user.id),
      supabase.from('community_notices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.auth.getSession(),
      supabase.from('profile_preferences').select('sector,default_department,default_manager,default_publicity').eq('user_id',user.id).maybeSingle()
    ]);

    if (pRes.data) {
      setProfile(prev=>({ ...prev, ...pRes.data, ...prefs.data }));
    }
    if (jsaRes.data) {
      const totalScraps = jsaRes.data.reduce((acc, curr) => acc + (curr.scrap_count || 0), 0);
      setStats({ myCount: jsaRes.data.length, scrapCount: totalScraps });
    }
    if (notiRes.data) setNotifications(notiRes.data);
    setSessionInfo(sessionRes.data.session);
    if(pRes.error||prefs.error||notiRes.error)throw pRes.error||prefs.error||notiRes.error;
    const signature=await supabase.storage.from('profile-assets').download(`${user.id}/signature`);
    if(signature.data)setProfile(prev=>({...prev,signature_url:URL.createObjectURL(signature.data)}));
    setLoading(false);
  };

  const handleUpdate = async () => {
    setSaving(true);setMessage('');
    try {
      const {error}=await supabase.rpc('save_profile_preferences',{
        p_profile:{username:profile.username,company_name:profile.company_name,bio:profile.bio},
        p_preferences:{sector:profile.sector,default_department:profile.default_department,default_manager:profile.default_manager,default_publicity:profile.default_publicity}
      });
      if(error)throw error;setMessage(t('messages.updateSuccess'));
    }catch{setMessage(getCommunityUi(i18n.language).error);}finally{setSaving(false);}
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if(!['image/png','image/jpeg'].includes(file.type)||file.size>1048576){setMessage(security.signatureLimit);return;}
    setSaving(true);
    try{
      const {data:{user},error}=await supabase.auth.getUser();if(error||!user)throw error||Error('AUTH_REQUIRED');
      const uploaded=await supabase.storage.from('profile-assets').upload(`${user.id}/signature`,file,{upsert:true,contentType:file.type});
      if(uploaded.error)throw uploaded.error;
      setProfile(prev=>({...prev,signature_url:URL.createObjectURL(file)}));setMessage(t('messages.signatureSuccess'));
    }catch{setMessage(getCommunityUi(i18n.language).error);}finally{setSaving(false);e.target.value='';}
  };

  const handleGlobalSignOut = async () => {
    if (window.confirm(t('messages.confirmRemoteLogout'))) { // ✅ [다국어화]
      await supabase.auth.signOut({ scope: 'global' }); navigate('/login');
    }
  };

  const handleWithdrawal = async () => {
    if (withdrawalConfirmText !== t('messages.withdrawConsentText')) { // ✅ [다국어화]
      alert(t('messages.withdrawMismatch')); // ✅ [다국어화]
      return;
    }
    if (window.confirm(security.withdrawConfirm)) {
      setSaving(true);
      try{
        await communityAction('request',null,{category:'erasure',detail:'Account deletion requested by the signed-in account owner.',evidence:''});
        setMessage(security.withdrawReceived);setIsWithdrawVisible(false);setWithdrawalConfirmText('');
        navigate('/community');
      }catch{setMessage(getCommunityUi(i18n.language).error);}finally{setSaving(false);}
    }
  };

  const handleLogoClick = () => {
    if (window.confirm(t('messages.confirmGoMain'))) navigate('/'); // ✅ [다국어화]
  };

  return (
    <div className="theme-workspace" style={styles.wrapper}>
      <SEO /> {/* ✅ [추가] 글로벌 SEO 태그 자동 삽입 */}
      
      <div style={styles.bgWrapper}>
        <div style={styles.bgImage} />
        <div style={styles.dimOverlay} />
      </div>

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1>
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="2000000004" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>{t('ui.title')}</h2>
            </div>

            <div style={styles.scrollArea}>
              <ThemeSettings />
              {message&&<p role="status">{message}</p>}
              <AdminVerification />
              <div style={styles.formGrid}>
                {/* 왼쪽 섹션: 통계 및 기본 프로필 */}
                <section style={styles.leftSection}>
                  <label style={styles.label}>{t('ui.statsLabel')}</label>
                  <div style={styles.statsRow}>
                    <div style={styles.statCard}>
                      <span style={styles.statTitle}>{t('ui.myDocs')}</span>
                      <strong style={styles.statValue}>{stats.myCount}</strong>
                    </div>
                    <div style={styles.statCard}>
                      <span style={styles.statTitle}>{t('ui.scraps')}</span>
                      <strong style={{...styles.statValue, color: 'var(--success)'}}>{stats.scrapCount}</strong>
                    </div>
                  </div>

                  <div style={styles.row}>
                    <div style={styles.flexItem}>
                      <label style={styles.label}>{t('ui.nickname')}</label>
                      <input 
                        style={styles.input} 
                        value={profile.username} 
                        onChange={e => setProfile({...profile, username: e.target.value})} 
                      />
                    </div>
                    <div style={styles.flexItem}>
                      <label style={styles.label}>{t('ui.sector')}</label>
                      <select 
                        style={styles.selectInput} 
                        value={profile.sector || ''} 
                        onChange={e => setProfile({...profile, sector: e.target.value})}
                      >
                        <option value="">{t('sectors.default')}</option>
                        <option value="건설 / 토목 / 건축">{t('sectors.construction')}</option>
                        <option value="제조 / 플랜트 / 화학">{t('sectors.manufacturing')}</option>
                        <option value="에너지 / 전기 / 가스">{t('sectors.energy')}</option>
                        <option value="운송 / 물류 / 창고">{t('sectors.logistics')}</option>
                        <option value="안전관리 / 전문 컨설팅">{t('sectors.safety')}</option>
                        <option value="IT / 시스템 / 엔지니어링">{t('sectors.it')}</option>
                        <option value="공공기관 / 교육 / 보건">{t('sectors.public')}</option>
                        <option value="기타 산업군">{t('sectors.etc')}</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('ui.company')}</label>
                    <input 
                      style={styles.input} 
                      value={profile.company_name} 
                      onChange={e => setProfile({...profile, company_name: e.target.value})} 
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('ui.bio')}</label>
                    <textarea 
                      style={styles.textarea} 
                      value={profile.bio} 
                      onChange={e => setProfile({...profile, bio: e.target.value})} 
                      placeholder={t('ui.bioPlaceholder')}
                    />
                  </div>
                </section>

                {/* 오른쪽 섹션: 업무 환경 설정 및 서명 */}
                <section style={styles.rightSection}>
                  <label style={styles.label}>{t('ui.presetTitle')}</label>
                  <div style={styles.presetBox}>
                    <div style={styles.row}>
                      <div style={styles.flexItem}>
                        <label style={styles.subLabel}>{t('ui.department')}</label>
                        <input 
                          style={styles.inputSmall} 
                          value={profile.default_department} 
                          onChange={e => setProfile({...profile, default_department: e.target.value})} 
                        />
                      </div>
                      <div style={styles.flexItem}>
                        <label style={styles.subLabel}>{t('ui.manager')}</label>
                        <input 
                          style={styles.inputSmall} 
                          value={profile.default_manager} 
                          onChange={e => setProfile({...profile, default_manager: e.target.value})} 
                        />
                      </div>
                    </div>
                    <label style={styles.checkLabelHighlight}>
                      <input 
                        type="checkbox" 
                        checked={profile.default_publicity} 
                        onChange={e => setProfile({...profile, default_publicity: e.target.checked})} 
                        style={styles.checkboxSmall}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: profile.default_publicity ? "var(--accent)" : "var(--text-muted)" }}>
                        {t('ui.autoPublicity')}
                      </span>
                    </label>
                  </div>

                  <label style={{...styles.label, marginTop: '1rem'}}>{t('ui.signatureLabel')}</label>
                  <div style={styles.signCard}>
                    {profile.signature_url ? (
                      <img src={profile.signature_url} alt="Signature" style={styles.signImg} />
                    ) : (
                      <div style={styles.noSign}>{t('ui.noSignature')}</div>
                    )}
                    <label style={styles.uploadBtn}>
                      {t('ui.uploadSignature')}
                      <input type="file" hidden accept="image/png,image/jpeg" disabled={saving} onChange={handleSignatureUpload} />
                    </label>
                  </div>

                  <label style={{...styles.label, marginTop: '1rem'}}>{t('ui.securityLabel')}</label>
                  <div style={styles.sessionBox}>
                    <span style={styles.sessionEmail}>{sessionInfo?.user?.email}</span>
                    <button style={styles.globalLogoutBtn} onClick={handleGlobalSignOut}>
                      {t('ui.remoteLogout')}
                    </button>
                  </div>
                </section>
              </div>

              {/* 하단 위험 영역: 회원 탈퇴 */}
              <div style={styles.dangerZone}>
                <div 
                  style={styles.withdrawToggle} 
                  onClick={() => setIsWithdrawVisible(!isWithdrawVisible)}
                >
                  {isWithdrawVisible ? t('ui.closeWithdraw') : security.withdraw}
                </div>
                {isWithdrawVisible && (
                  <div style={styles.withdrawForm}>
                    <div style={styles.withdrawInfo}>
                      {security.withdrawHelp}
                    </div>
                    <input 
                      style={styles.input} 
                      placeholder={t('ui.withdrawPlaceholder')}
                      value={withdrawalConfirmText}
                      onChange={e => setWithdrawalConfirmText(e.target.value)}
                    />
                    <button 
                      style={{...styles.withdrawBtn, opacity: withdrawalConfirmText === t('messages.withdrawConsentText') ? 1 : 0.5}}
                      onClick={handleWithdrawal}
                      disabled={saving||withdrawalConfirmText !== t('messages.withdrawConsentText')}
                    >
                      {security.withdraw}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={() => navigate('/')}>{t('ui.goMain')}</button>
              <button disabled={loading||saving} style={styles.nextBtn} onClick={handleUpdate}>{t('ui.saveProfile')}</button>
            </div>
          </div>
        </main>

        <aside style={styles.sideAd}>
          <AdBanner slot="2000000005" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>
    </div>
  );
}

const styles = {
  // 원본 디자인 시스템 스타일을 100% 보존합니다[cite: 9].
  wrapper: { position: 'relative', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', overflowX: 'hidden' },
  bgWrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image3.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.2)' },
  dimOverlay: { position: 'absolute', inset: 0, background: "var(--workspace-overlay)", zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: "var(--text-primary)", cursor: 'pointer' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem 100px', gap: '4rem', zIndex: 10, overflow: 'hidden' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1440px', height: '80vh', backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-default)", borderRadius: '12px', padding: '2.5rem 3rem', boxShadow: "var(--shadow-panel)", display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  formHeader: { marginBottom: '1.8rem', borderLeft: "5px solid var(--accent)", paddingLeft: '1rem' },
  formTitle: { fontSize: '1.5rem', fontWeight: '800', color: "var(--text-primary)" },
  scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '1rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '3rem', marginBottom: '1rem' },
  leftSection: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  rightSection: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  label: { fontSize: '0.8rem', color: "var(--text-muted)", fontWeight: '700', marginBottom: '4px' },
  subLabel: { fontSize: '0.75rem', color: "var(--text-muted)", fontWeight: '600' },
  input: { height: '45px', padding: '0 1rem', backgroundColor: "var(--input-bg)", border: "1px solid var(--border-default)", borderRadius: '6px', color: "var(--text-primary)", fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  inputSmall: { height: '40px', padding: '0 1rem', backgroundColor: "var(--input-bg)", border: "1px solid var(--border-default)", borderRadius: '6px', color: "var(--text-primary)", fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  selectInput: { height: '45px', padding: '0 1rem', backgroundColor: "var(--input-bg)", border: "1px solid var(--border-default)", borderRadius: '6px', color: "var(--text-primary)", fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' },
  textarea: { padding: '1rem', backgroundColor: "var(--input-bg)", border: "1px solid var(--border-default)", borderRadius: '6px', color: "var(--text-primary)", fontSize: '0.95rem', minHeight: '100px', outline: 'none', resize: 'none' },
  row: { display: 'flex', gap: '1rem' },
  flexItem: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  statsRow: { display: 'flex', gap: '1rem' },
  statCard: { flex: 1, backgroundColor: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: '8px', padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  statTitle: { fontSize: '0.7rem', color: "var(--text-muted)", fontWeight: '800', textTransform: 'uppercase' },
  statValue: { fontSize: '2.2rem', color: "var(--accent)", fontWeight: '900' },
  presetBox: { backgroundColor: "var(--card-bg)", padding: '1.2rem', borderRadius: '8px', border: "1px solid var(--border-default)", display: 'flex', flexDirection: 'column', gap: '1rem' },
  checkLabelHighlight: { display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', backgroundColor: "var(--card-bg)", padding: '0.8rem', borderRadius: '6px', border: "1px solid var(--border-default)" },
  checkboxSmall: { width: '1rem', height: '1rem' },
  sessionBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: "var(--card-bg)", padding: '1rem', borderRadius: '8px', border: "1px solid var(--border-default)" },
  sessionEmail: { fontSize: '0.85rem', color: "var(--text-secondary)", fontWeight: '500' },
  globalLogoutBtn: { padding: '6px 12px', backgroundColor: "var(--card-bg)", color: "var(--danger)", border: "1px solid var(--border-default)", borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' },
  signCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', backgroundColor: "var(--card-bg)", padding: '1.5rem', borderRadius: '8px', border: "1px dashed var(--border-default)" },
  signImg: { width: '180px', height: '80px', objectFit: 'contain', backgroundColor: '#fff', borderRadius: '4px', padding: '5px' },
  noSign: { fontSize: '0.8rem', color: "var(--text-muted)", fontStyle: 'italic' },
  uploadBtn: { fontSize: '0.8rem', color: "var(--accent)", fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' },
  dangerZone: { marginTop: '4rem', padding: '2rem 0', borderTop: "1px solid var(--border-default)" },
  withdrawToggle: { fontSize: '0.8rem', color: "var(--text-muted)", cursor: 'pointer', transition: 'color 0.2s', ':hover': { color: "var(--danger)" } },
  withdrawForm: { marginTop: '1.5rem', backgroundColor: 'rgba(255, 77, 77, 0.05)', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  withdrawInfo: { fontSize: '0.85rem', color: "var(--danger)", fontWeight: '600' },
  withdrawBtn: { padding: '1rem', backgroundColor: "var(--danger-action)", color: "var(--on-accent)", border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' },
  btnArea: { marginTop: '2rem', display: 'flex', gap: '1.2rem' },
  prevBtn: { flex: 1, padding: '1.1rem', backgroundColor: 'transparent', color: "var(--text-muted)", border: "1px solid var(--border-default)", borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtn: { flex: 2, padding: '1.1rem', backgroundColor: "var(--action-bg)", color: "var(--on-accent)", border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '900', fontSize: '1.1rem' },
};
