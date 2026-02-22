import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');

    const { data, error } = await supabase
      .from('jsa_projects')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setProjects(data);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>내 작업 안전 저장소</h2>
        <button style={styles.newBtn} onClick={() => navigate('/info')}>+ 새 JSA 작성</button>
      </header>

      {loading ? (
        <p style={styles.msg}>데이터를 불러오는 중입니다...</p>
      ) : projects.length === 0 ? (
        <div style={styles.emptyState}>
          <p>아직 작성된 JSA가 없습니다.</p>
          <button onClick={() => navigate('/info')}>첫 번째 JSA를 작성해 보세요.</button>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map((proj) => (
            <div key={proj.id} style={styles.card} onClick={() => navigate('/export', { state: proj })}>
              <div style={styles.cardBadge}>{proj.is_public ? '공개' : '비공개'}</div>
              <h3 style={styles.cardTitle}>{proj.title}</h3>
              <p style={styles.cardSub}>{new Date(proj.created_at).toLocaleDateString()} · {proj.form_data.workLocation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '40px 5rem', color: '#fff', minHeight: '100vh', backgroundColor: '#121212' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' },
  title: { fontSize: '1.8rem', fontWeight: '800' },
  newBtn: { padding: '0.8rem 1.5rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#1d1d1d', border: '1px solid #333', borderRadius: '12px', padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' },
  cardBadge: { fontSize: '0.7rem', color: '#007bff', border: '1px solid #007bff', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', marginBottom: '10px' },
  cardTitle: { fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' },
  cardSub: { fontSize: '0.85rem', color: '#888' },
  msg: { textAlign: 'center', color: '#666', marginTop: '5rem' },
  emptyState: { textAlign: 'center', marginTop: '5rem', padding: '3rem', border: '2px dashed #333', borderRadius: '20px' }
};