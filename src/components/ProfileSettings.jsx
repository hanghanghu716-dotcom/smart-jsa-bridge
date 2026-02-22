import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ProfileSettings() {
  const [profile, setProfile] = useState({
    username: '',
    display_name: '',
    company_name: '',
    bio: ''
  });

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    }
  }

  async function updateProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...profile,
      updated_at: new Date()
    });

    if (!error) alert('프로필이 업데이트되었습니다.');
  }

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.title}>프로필 및 브랜딩 설정</h2>
        <div style={styles.inputGroup}>
          <label style={styles.label}>고유 사용자 아이디 (URL 주소용)</label>
          <input 
            style={styles.input} 
            value={profile.username} 
            onChange={e => setProfile({...profile, username: e.target.value})}
            placeholder="예: yizuno9"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>표시 이름</label>
          <input 
            style={styles.input} 
            value={profile.display_name} 
            onChange={e => setProfile({...profile, display_name: e.target.value})}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>소속 (회사/부서)</label>
          <input 
            style={styles.input} 
            value={profile.company_name} 
            onChange={e => setProfile({...profile, company_name: e.target.value})}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>전문 분야 소개</label>
          <textarea 
            style={styles.textarea} 
            value={profile.bio} 
            onChange={e => setProfile({...profile, bio: e.target.value})}
            placeholder="어떤 전문성을 가진 안전 관리자인지 한 줄로 표현해 보세요."
          />
        </div>
        <button style={styles.saveBtn} onClick={updateProfile}>브랜딩 정보 저장</button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#121212', padding: '20px' },
  formCard: { width: '100%', maxWidth: '500px', backgroundColor: '#1d1d1d', padding: '2.5rem', borderRadius: '16px', border: '1px solid #333' },
  title: { color: '#fff', fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' },
  inputGroup: { marginBottom: '1.5rem' },
  label: { display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: '8px' },
  input: { width: '100%', padding: '0.8rem', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' },
  textarea: { width: '100%', padding: '0.8rem', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', minHeight: '100px', outline: 'none', resize: 'none' },
  saveBtn: { width: '100%', padding: '1rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }
};