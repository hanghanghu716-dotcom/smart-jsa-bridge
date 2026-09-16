import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

export default function AdminPostUpload() {
  const editorRef = useRef();
  const [formData, setFormData] = useState({
    post_group_id: '', 
    title: '', 
    language_code: 'ko', 
    meta_title: '', 
    meta_description: '', 
    pdf_download_url: '', 
    pdf_list: [],
    schema_markup: '',
    content_md: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [editId, setEditId] = useState(null);

  // 검색 및 페이지네이션 상태 추가
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onUploadImage = async (blob, callback) => {
    const extension = blob.name.split('.').pop();
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${extension}`;
    const fileName = `post-images/${safeFileName}`;
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, blob);

    if (error) {
      alert('이미지 업로드 실패: ' + error.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    callback(publicUrl, blob.name); 
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSubmitting(true);
    const safeFileName = `pdfs/${Date.now()}_${Math.random().toString(36).substring(2)}.pdf`;
    
    const { error } = await supabase.storage.from('blog-images').upload(safeFileName, file);

    if (error) {
      alert('PDF 업로드 실패: ' + error.message);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(safeFileName);
      setFormData(prev => ({ 
        ...prev, 
        pdf_download_url: publicUrl, 
        pdf_list: [...(prev.pdf_list || []), { name: file.name, url: publicUrl }]
      }));
      alert('PDF가 성공적으로 추가되었습니다.');
    }
    setIsSubmitting(false);
  };

  const handleRemovePdf = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      pdf_list: prev.pdf_list.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalContent = editorRef.current.getInstance().getMarkdown();
    
    let parsedSchema = null;
    if (formData.schema_markup) {
      try {
        parsedSchema = JSON.parse(formData.schema_markup);
      } catch (err) {
        alert('Schema Markup이 유효한 JSON 형식이 아닙니다. 확인해주세요.');
        setIsSubmitting(false);
        return;
      }
    }

    const submitData = { 
      ...formData, 
      schema_markup: parsedSchema,
      content_md: finalContent 
    };

    const { error } = await supabase.from('case_studies').insert([submitData]);

    if (error) {
      alert('업로드 실패: ' + error.message);
    } else {
      alert('콘텐츠가 성공적으로 업로드되었습니다.');
      setFormData({ 
        post_group_id: '', title: '', language_code: 'ko', meta_title: '', 
        meta_description: '', pdf_download_url: '', pdf_list: [], schema_markup: '', content_md: '' 
      });
      editorRef.current.getInstance().setMarkdown('');
      fetchPosts();
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from('case_studies').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const handleEditMode = (post) => {
    setEditId(post.id);
    
    const schemaString = post.schema_markup ? JSON.stringify(post.schema_markup, null, 2) : '';

    setFormData({
      post_group_id: post.post_group_id || '',
      title: post.title || '',
      language_code: post.language_code || 'ko',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      pdf_download_url: post.pdf_download_url || '',
      pdf_list: post.pdf_list || [],
      schema_markup: schemaString,
      content_md: post.content_md || ''
    });
    if (editorRef.current) {
      editorRef.current.getInstance().setMarkdown(post.content_md || '');
    }
    window.scrollTo(0, 0); 
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    const finalContent = editorRef.current.getInstance().getMarkdown();
    
    let parsedSchema = null;
    if (formData.schema_markup) {
      try {
        parsedSchema = JSON.parse(formData.schema_markup);
      } catch (err) {
        alert('Schema Markup이 유효한 JSON 형식이 아닙니다. 확인해주세요.');
        setIsSubmitting(false);
        return;
      }
    }

    const submitData = { 
      ...formData, 
      schema_markup: parsedSchema,
      content_md: finalContent 
    };

    const { error } = await supabase.from('case_studies').update(submitData).eq('id', editId);
    if (error) {
      alert('수정 실패: ' + error.message);
    } else {
      alert('성공적으로 수정되었습니다.');
      setEditId(null);
      setFormData({ 
        post_group_id: '', title: '', language_code: 'ko', meta_title: '', 
        meta_description: '', pdf_download_url: '', pdf_list: [], schema_markup: '', content_md: '' 
      });
      editorRef.current.getInstance().setMarkdown('');
      fetchPosts();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('해당 사례 연구를 완전히 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('case_studies').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchPosts();
  };

  // 검색 필터링 로직
  const filteredPosts = posts.filter(post => 
    (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (post.post_group_id && post.post_group_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 페이지네이션 로직
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // 검색 시 첫 페이지로 초기화
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // 표시할 페이지 번호 그룹 연산 (최대 5개 표시)
  const maxPageButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = startPage + maxPageButtons - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>사례 연구(Case Study) 업로드</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>그룹 ID (필수)</label>
          <input type="text" name="post_group_id" placeholder="예: jsa-tank-cleaning" value={formData.post_group_id} onChange={handleChange} style={inputStyle} required />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>언어 선택</label>
          <select name="language_code" value={formData.language_code} onChange={handleChange} style={inputStyle}>
            <option value="en-US">English (en-US)</option>
            <option value="en-CA">English (en-CA)</option>
            <option value="en-AU">English (en-AU)</option>
            <option value="en-GB">English (en-GB)</option>
            <option value="de-DE">Deutsch (de-DE)</option>
            <option value="ja-JP">日本語 (ja-JP)</option>
            <option value="fr-FR">Français (fr-FR)</option>
            <option value="it-IT">Italiano (it-IT)</option>
            <option value="es-ES">Español (es-ES)</option>
            <option value="ar-SA">العربية (ar-SA)</option>
            <option value="pt-BR">Português (pt-BR)</option>
            <option value="ru-RU">Русский (ru-RU)</option>
            <option value="ko">한국어 (ko)</option>
          </select>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>본문 제목 (H1) (필수)</label>
          <input type="text" name="title" placeholder="게시물 본문에 표시될 메인 제목" value={formData.title} onChange={handleChange} style={inputStyle} required />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>SEO 메타 타이틀 (선택)</label>
          <input type="text" name="meta_title" placeholder="검색엔진에 노출될 타이틀 (비워둘 경우 본문 제목 사용)" value={formData.meta_title} onChange={handleChange} style={inputStyle} />
        </div>
        
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>SEO 메타 요약 (필수)</label>
          <textarea name="meta_description" placeholder="150자 이내 요약" value={formData.meta_description} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} required />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>PDF 파일 업로드 (다중 버전 지원)</label>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handlePdfUpload} 
            style={{ ...inputStyle, padding: '9px' }} 
            disabled={isSubmitting}
          />
          {/* 다중 파일 리스트 렌더링 */}
          {formData.pdf_list && formData.pdf_list.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formData.pdf_list.map((pdf, index) => (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '10px 15px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <span style={{ fontSize: '14px', color: '#333', wordBreak: 'break-all', paddingRight: '10px' }}>{pdf.name}</span>
                  <button type="button" onClick={() => handleRemovePdf(index)} style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', flexShrink: 0 }}>
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>구조화 데이터 JSON-LD (선택)</label>
          <textarea name="schema_markup" placeholder='{ "@context": "https://schema.org", "@type": "HowTo", ... }' value={formData.schema_markup} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical', minHeight: '120px', fontFamily: 'monospace', fontSize: '14px' }} />
        </div>

        <div style={{ backgroundColor: '#fff', color: '#000', marginTop: '10px' }}>
          <Editor
            ref={editorRef}
            initialValue={formData.content_md}
            placeholder="본문 내용을 입력하세요. 이미지를 드래그 앤 드롭하여 첨부할 수 있습니다."
            previewStyle="vertical" 
            height="600px"
            initialEditType="markdown"
            useCommandShortcut={true}
            hooks={{ addImageBlobHook: onUploadImage }}
          />
        </div>

        {!editId && (
          <button type="submit" disabled={isSubmitting} style={buttonStyle}>
            {isSubmitting ? '업로드 중...' : '발행하기'}
          </button>
        )}
        
        {editId && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleUpdate} disabled={isSubmitting} style={{ ...buttonStyle, flex: 1, backgroundColor: '#28a745' }}>
              {isSubmitting ? '수정 중...' : '수정 완료'}
            </button>
            <button type="button" onClick={() => {
              setEditId(null);
              setFormData({ post_group_id: '', title: '', language_code: 'ko', meta_title: '', meta_description: '', pdf_download_url: '', pdf_list: [], schema_markup: '', content_md: '' });
              editorRef.current.getInstance().setMarkdown('');
            }} style={{ ...buttonStyle, flex: 1, backgroundColor: '#6c757d' }}>
              취소
            </button>
          </div>
        )}
      </form>

      <div style={{ marginTop: '50px', borderTop: '2px solid #ccc', paddingTop: '30px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#111' }}>등록된 사례 연구 관리</h3>
        
        {/* 검색창 UI 추가 */}
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="제목 또는 그룹 ID로 검색..." 
            value={searchTerm} 
            onChange={handleSearchChange} 
            style={{ ...inputStyle, width: '100%', marginBottom: '10px' }} 
          />
        </div>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {currentPosts.map(post => (
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

        {/* 페이지네이션 UI 수정 (최대 5개 표시 및 이전/다음 이동 버튼 추가) */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={() => paginate(1)} 
              disabled={currentPage === 1}
              style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              &laquo;
            </button>
            <button 
              type="button"
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
              style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              &lt;
            </button>

            {pageNumbers.map(number => (
              <button 
                key={number} 
                type="button"
                onClick={() => paginate(number)} 
                style={{ 
                  padding: '8px 14px', 
                  border: '1px solid #ccc', 
                  borderRadius: '6px', 
                  backgroundColor: currentPage === number ? '#007bff' : '#fff', 
                  color: currentPage === number ? '#fff' : '#333', 
                  cursor: 'pointer',
                  fontWeight: currentPage === number ? 'bold' : 'normal'
                }}
              >
                {number}
              </button>
            ))}

            <button 
              type="button"
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages}
              style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              &gt;
            </button>
            <button 
              type="button"
              onClick={() => paginate(totalPages)} 
              disabled={currentPage === totalPages}
              style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              &raquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const fieldGroupStyle = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '14px', fontWeight: 'bold', color: '#333' };
const inputStyle = { padding: '12px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '16px', width: '100%', color: '#111', backgroundColor: '#fff', boxSizing: 'border-box' };
const buttonStyle = { padding: '15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };