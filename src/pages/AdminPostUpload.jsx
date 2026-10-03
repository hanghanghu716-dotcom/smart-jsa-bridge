import { CANADIAN_PROVINCES } from '../locales/config.js';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import {
  readAllCaseStudies, buildSubmitData, saveCaseStudy, removePdfFromForm,
} from './caseStudyAdminTools.js';

const emptyForm = () => ({
  post_group_id: '', title: '', language_code: 'ko', meta_title: '',
  meta_description: '', pdf_download_url: '', pdf_list: [],
  schema_markup: '', content_md: '',
});

export default function AdminPostUpload() {
  const editorRef = useRef();
  const busyRef = useRef(false);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [notice, setNotice] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;

  const showNotice = (type, text) => setNotice({ type, text });
  const errorText = (error) => error?.message || '요청을 완료하지 못했습니다.';
  const startOperation = () => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setIsSubmitting(true);
    setNotice(null);
    return true;
  };
  const finishOperation = () => {
    busyRef.current = false;
    setIsSubmitting(false);
  };
  const resetForm = () => {
    setEditId(null);
    setFormData(emptyForm());
    editorRef.current?.getInstance().setMarkdown('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchPosts = async () => {
    try {
      // Load only list fields. Fetch the full body when opening one post.
      const rows = await readAllCaseStudies(supabase, {
        columns: 'id,post_group_id,title,language_code,created_at',
      });
      rows.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))
        || String(a.id).localeCompare(String(b.id)));
      setPosts(rows);
      return true;
    } catch (error) {
      showNotice('error', '목록 조회 실패: ' + errorText(error));
      return false;
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const onUploadImage = async (blob, callback) => {
    if (!startOperation()) {
      showNotice('error', '현재 작업이 끝난 후 이미지를 다시 추가해주세요.');
      return;
    }
    try {
      const extension = (blob.name || '').split('.').pop() || 'png';
      const name = `post-images/${Date.now()}_${Math.random().toString(36).substring(2)}.${extension}`;
      const { error } = await supabase.storage.from('blog-images').upload(name, blob);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(name);
      callback(publicUrl, blob.name || 'image');
      showNotice('success', '이미지를 추가했습니다. 게시물을 저장하면 반영됩니다.');
    } catch (error) {
      showNotice('error', '이미지 업로드 실패: ' + errorText(error));
    } finally {
      finishOperation();
    }
  };

  const handlePdfUpload = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !startOperation()) return;
    try {
      const name = `pdfs/${Date.now()}_${Math.random().toString(36).substring(2)}.pdf`;
      const { error } = await supabase.storage.from('blog-images').upload(name, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(name);
      setFormData(prev => ({
        ...prev, pdf_download_url: publicUrl,
        pdf_list: [...(prev.pdf_list || []), { name: file.name, url: publicUrl }],
      }));
      showNotice('success', 'PDF를 추가했습니다. 게시물을 저장하면 반영됩니다.');
    } catch (error) {
      showNotice('error', 'PDF 업로드 실패: ' + errorText(error));
    } finally {
      input.value = '';
      finishOperation();
    }
  };

  const handleRemovePdf = (index) => {
    if (busyRef.current) return;
    setFormData(prev => removePdfFromForm(prev, index));
  };

  const persistPost = async (id) => {
    if (!startOperation()) return;
    let didSave = false;
    try {
      const editor = editorRef.current?.getInstance();
      if (!editor) throw new Error('본문 편집기가 준비되지 않았습니다.');
      const submitData = buildSubmitData(formData, editor.getMarkdown());
      await saveCaseStudy(supabase, id, submitData);
      didSave = true;
      resetForm();
      const refreshed = await fetchPosts();
      showNotice(refreshed ? 'success' : 'warning', refreshed
        ? '게시물을 저장했습니다.'
        : '게시물은 저장됐지만 목록을 새로 읽지 못했습니다. 중복 저장하지 말고 목록을 새로고침해주세요.');
    } catch (error) {
      showNotice('error', (didSave ? '저장은 완료됐지만 화면 초기화에 실패했습니다: ' : '저장 확인 실패: ')
        + errorText(error));
    } finally {
      finishOperation();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Enter in an edit form must update the same ID, never insert a duplicate.
    await persistPost(editId);
  };

  const handleEditMode = async (post) => {
    if (!startOperation()) return;
    try {
      const { data, error } = await supabase.from('case_studies')
        .select('*').eq('id', post.id).single();
      if (error) throw error;
      if (!data) throw new Error('게시물을 찾을 수 없습니다.');
      const next = {
        post_group_id: data.post_group_id || '', title: data.title || '',
        language_code: data.language_code || 'ko', meta_title: data.meta_title || '',
        meta_description: data.meta_description || '', pdf_download_url: data.pdf_download_url || '',
        pdf_list: Array.isArray(data.pdf_list) ? data.pdf_list : [],
        schema_markup: data.schema_markup ? JSON.stringify(data.schema_markup, null, 2) : '',
        content_md: data.content_md || '',
      };
      const editor = editorRef.current?.getInstance();
      if (!editor) throw new Error('본문 편집기가 준비되지 않았습니다.');
      editor.setMarkdown(next.content_md);
      setEditId(data.id);
      setFormData(next);
      window.scrollTo(0, 0);
    } catch (error) {
      showNotice('error', '게시물 열기 실패: ' + errorText(error));
    } finally {
      finishOperation();
    }
  };

  const handleDelete = async (id) => {
    if (busyRef.current || !window.confirm('해당 사례 연구를 완전히 삭제하시겠습니까?')) return;
    if (!startOperation()) return;
    try {
      const { data, error } = await supabase.from('case_studies').delete().eq('id', id).select('id');
      if (error) throw error;
      if (!data || data.length !== 1) throw new Error('삭제된 행을 확인하지 못했습니다.');
      if (String(editId) === String(id)) resetForm();
      const refreshed = await fetchPosts();
      showNotice(refreshed ? 'success' : 'warning', refreshed
        ? '게시물을 삭제했습니다.' : '삭제는 완료됐지만 목록 갱신에 실패했습니다.');
    } catch (error) {
      showNotice('error', '삭제 확인 실패: ' + errorText(error));
    } finally {
      finishOperation();
    }
  };

  const handleExport = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsExporting(true);
    setNotice(null);
    try {
      const rows = await readAllCaseStudies(supabase, {
        onProgress: (loaded, total) => setExportProgress(`${loaded} / ${total}건`),
      });
      const exportedAt = new Date().toISOString();
      const payload = {
        format: 'smart-jsa-case-studies-v1', table: 'case_studies',
        exported_at: exportedAt, access_scope: 'current-client-permissions',
        row_count: rows.length, posts: rows,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `case_studies_${exportedAt.replace(/[:.]/g, '-')}.json`;
      try {
        document.body.appendChild(link);
        link.click();
      } finally {
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      showNotice('success', `${rows.length}건 JSON 다운로드를 요청했습니다. 다운로드 파일과 SQL Editor의 전체 행 수를 대조해주세요.`);
    } catch (error) {
      showNotice('error', '내보내기 실패: ' + errorText(error));
    } finally {
      busyRef.current = false;
      setIsExporting(false);
      setExportProgress('');
    }
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

  useEffect(() => {
    setCurrentPage(page => Math.min(page, Math.max(1, totalPages)));
  }, [totalPages]);

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>사례 연구(Case Study) 업로드</h2>
      {notice && (
        <div role={notice.type === 'error' ? 'alert' : 'status'} aria-live="polite"
          style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '6px',
            background: notice.type === 'error' ? '#fff1f2' : notice.type === 'warning' ? '#fff7ed' : '#ecfdf5',
            color: '#172338', overflowWrap: 'anywhere' }}>
          {notice.text}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>그룹 ID (필수)</label>
          <input type="text" name="post_group_id" placeholder="예: jsa-tank-cleaning" value={formData.post_group_id} onChange={handleChange} style={inputStyle} required />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>언어 선택</label>
          <select name="language_code" value={formData.language_code} onChange={handleChange} style={inputStyle}>
            <option value="en-US">English (en-US)</option>
            <option value="en-CA">English (Canada — shared)</option>
            {CANADIAN_PROVINCES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
            <option value="en-AU">English (en-AU)</option>
            <option value="en-GB">English (en-GB)</option>
            <option value="en-SG">English (Singapore)</option>
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
            disabled={isSubmitting || isExporting}
          />
          {/* 다중 파일 리스트 렌더링 */}
          {formData.pdf_list && formData.pdf_list.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formData.pdf_list.map((pdf, index) => (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '10px 15px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <span style={{ fontSize: '14px', color: '#333', wordBreak: 'break-all', paddingRight: '10px' }}>{pdf.name}</span>
                  <button type="button" disabled={isSubmitting || isExporting} onClick={() => handleRemovePdf(index)} style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', flexShrink: 0 }}>
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

        {editId === null && (
          <button type="submit" disabled={isSubmitting || isExporting} style={buttonStyle}>
            {isSubmitting ? '업로드 중...' : '발행하기'}
          </button>
        )}
        
        {editId !== null && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={isSubmitting || isExporting} style={{ ...buttonStyle, flex: 1, backgroundColor: '#28a745' }}>
              {isSubmitting ? '수정 중...' : '수정 완료'}
            </button>
            <button type="button" disabled={isSubmitting || isExporting} onClick={resetForm} style={{ ...buttonStyle, flex: 1, backgroundColor: '#6c757d' }}>
              취소
            </button>
          </div>
        )}
      </form>

      <div style={{ marginTop: '50px', borderTop: '2px solid #ccc', paddingTop: '30px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#111' }}>등록된 사례 연구 관리</h3>
        
        <div style={{ marginBottom: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleExport} disabled={isSubmitting || isExporting}
            style={{ ...buttonStyle, padding: '10px 16px' }}>
            {isExporting ? `내보내는 중 ${exportProgress}` : '게시물 JSON 내보내기 (모든 언어)'}
          </button>
          <button type="button" disabled={isSubmitting || isExporting}
            onClick={async () => {
              if (!startOperation()) return;
              try { await fetchPosts(); } finally { finishOperation(); }
            }} style={{ ...buttonStyle, padding: '10px 16px', backgroundColor: '#64748b' }}>
            목록 다시 읽기
          </button>
        </div>
        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
          내보내기는 현재 검색 조건과 무관하게 조회 권한이 있는 모든 언어를 포함합니다.
          내려받는 동안 다른 창에서 게시물을 변경하지 마세요.
        </p>
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
                <button type="button" disabled={isSubmitting || isExporting} onClick={() => handleEditMode(post)} style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: '#111', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>수정</button>
                <button type="button" disabled={isSubmitting || isExporting} onClick={() => handleDelete(post.id)} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
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
