import { useState, useRef, useEffect } from 'react'; // ✅ useEffect 추가
import { supabase } from '../supabaseClient';
// ✅ 에디터 라이브러리 및 스타일 임포트 추가
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

export default function AdminPostUpload() {
  const editorRef = useRef(); // ✅ 에디터 인스턴스 제어용 참조
  const [formData, setFormData] = useState({
    post_group_id: '', title: '', language_code: 'ko', meta_description: '', content_md: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ [기능 추가] 게시물 목록 및 수정 모드 식별 상태 추가
  const [posts, setPosts] = useState([]);
  const [editId, setEditId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

// ✅ [추가] 이미지 드래그 앤 드롭 / 붙여넣기 시 작동하는 업로드 핸들러
  const onUploadImage = async (blob, callback) => {
    // 1. 고유 파일명 생성 및 한글/공백 오류 방지
    const extension = blob.name.split('.').pop(); // 원본 파일에서 확장자만 추출
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${extension}`; // 영문+숫자 난수 조합
    const fileName = `post-images/${safeFileName}`;
    
    // 2. Supabase Storage 'blog-images' 버킷에 파일 업로드
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, blob);

    if (error) {
      alert('이미지 업로드 실패: ' + error.message);
      return;
    }

    // 3. 업로드된 이미지의 Public URL 획득
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    // 4. 에디터 본문에 마크다운 이미지 태그 자동 삽입
    callback(publicUrl, blob.name); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // ✅ 제출 전 에디터의 최종 마크다운 텍스트를 추출하여 데이터에 병합
    const finalContent = editorRef.current.getInstance().getMarkdown();
    const submitData = { ...formData, content_md: finalContent };

    const { error } = await supabase.from('case_studies').insert([submitData]);

    if (error) {
      alert('업로드 실패: ' + error.message);
    } else {
      alert('콘텐츠가 성공적으로 업로드되었습니다.');
      // 폼 및 에디터 초기화
      setFormData({ post_group_id: '', title: '', language_code: 'ko', meta_description: '', content_md: '' });
      editorRef.current.getInstance().setMarkdown('');
}
    setIsSubmitting(false);
  };

  // ✅ [기능 추가] 등록된 게시물 데이터 호출 로직
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from('case_studies').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  // ✅ [기능 추가] 수정 모드 진입 및 에디터 데이터 맵핑 로직
  const handleEditMode = (post) => {
    setEditId(post.id);
    setFormData({
      post_group_id: post.post_group_id,
      title: post.title,
      language_code: post.language_code,
      meta_description: post.meta_description,
      content_md: post.content_md
    });
    if (editorRef.current) {
      editorRef.current.getInstance().setMarkdown(post.content_md);
    }
    window.scrollTo(0, 0); // 폼 상단으로 시점 이동
  };

  // ✅ [기능 추가] 수정 완료 데이터 서버 전송 로직
  const handleUpdate = async () => {
    setIsSubmitting(true);
    const finalContent = editorRef.current.getInstance().getMarkdown();
    const submitData = { ...formData, content_md: finalContent };

    const { error } = await supabase.from('case_studies').update(submitData).eq('id', editId);
    if (error) {
      alert('수정 실패: ' + error.message);
    } else {
      alert('성공적으로 수정되었습니다.');
      setEditId(null);
      setFormData({ post_group_id: '', title: '', language_code: 'ko', meta_description: '', content_md: '' });
      editorRef.current.getInstance().setMarkdown('');
      fetchPosts();
    }
    setIsSubmitting(false);
  };

  // ✅ [기능 추가] 게시물 삭제 로직
  const handleDelete = async (id) => {
    if (!window.confirm('해당 사례 연구를 완전히 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('case_studies').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchPosts();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>사례 연구(Case Study) 업로드</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <input 
          type="text" name="post_group_id" placeholder="그룹 ID (다국어 공통 식별자, 예: jsa-tank-cleaning)" 
          value={formData.post_group_id} onChange={handleChange} style={inputStyle} required 
        />

        <select name="language_code" value={formData.language_code} onChange={handleChange} style={inputStyle}>
          <option value="ko">한국어 (ko)</option>
          <option value="en-US">English (en-US)</option>
          <option value="en-GB">English (en-GB)</option>
          <option value="en-AU">English (en-AU)</option>
          <option value="de-DE">Deutsch (de-DE)</option>
          <option value="fr-FR">Français (fr-FR)</option>
          <option value="es-ES">Español (es-ES)</option>
          <option value="ru-RU">Русский (ru-RU)</option>
        </select>

        <input 
          type="text" name="title" placeholder="게시물 제목" 
          value={formData.title} onChange={handleChange} style={inputStyle} required 
        />
        
        <input 
          type="text" name="meta_description" placeholder="SEO 메타 요약 (150자 이내)" 
          value={formData.meta_description} onChange={handleChange} style={inputStyle} required 
        />

        {/* ✅ [수정] textarea를 TOAST UI Editor로 전면 교체 */}
        <div style={{ backgroundColor: '#fff', color: '#000' }}>
          <Editor
            ref={editorRef}
            initialValue={formData.content_md}
            placeholder="본문 내용을 입력하세요. 이미지를 드래그 앤 드롭하여 첨부할 수 있습니다."
            previewStyle="vertical" // 좌측 작성, 우측 미리보기 분할 화면
            height="600px"
            initialEditType="markdown"
            useCommandShortcut={true}
            hooks={{
              addImageBlobHook: onUploadImage // 이미지 첨부 이벤트 연결
            }}
          />
        </div>

{/* 기존 업로드 버튼: 수정 모드가 아닐 때만 렌더링 (기존 로직 유지) */}
        {!editId && (
          <button type="submit" disabled={isSubmitting} style={buttonStyle}>
            {isSubmitting ? '업로드 중...' : '발행하기'}
          </button>
        )}
        
        {/* ✅ [기능 추가] 수정 모드 시 나타나는 제어 버튼 분기 추가 */}
        {editId && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleUpdate} disabled={isSubmitting} style={{ ...buttonStyle, flex: 1, backgroundColor: '#28a745' }}>
              {isSubmitting ? '수정 중...' : '수정 완료'}
            </button>
            <button type="button" onClick={() => {
              setEditId(null);
              setFormData({ post_group_id: '', title: '', language_code: 'ko', meta_description: '', content_md: '' });
              editorRef.current.getInstance().setMarkdown('');
            }} style={{ ...buttonStyle, flex: 1, backgroundColor: '#6c757d' }}>
              취소
            </button>
          </div>
        )}
      </form>

      {/* ✅ [기능 추가] 하단 게시물 관리(목록/수정/삭제) UI 블록 추가 */}
      <div style={{ marginTop: '50px', borderTop: '2px solid #ccc', paddingTop: '30px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#111' }}>등록된 사례 연구 관리</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {posts.map(post => (
            <li key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#fff' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#111', fontSize: '1.1rem', display: 'block', marginBottom: '5px' }}>{post.title}</strong>
                <span style={{ color: '#666', fontSize: '0.85rem' }}>그룹 ID: {post.post_group_id} | 언어: {post.language_code}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => handleEditMode(post)} style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: '#111', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>수정</button>
                <button type="button" onClick={() => handleDelete(post.id)} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const inputStyle = { padding: '12px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '16px', width: '100%', color: '#111', backgroundColor: '#fff' };
const buttonStyle = { padding: '15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };