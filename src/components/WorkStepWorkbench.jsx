import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

const makeDraftKey = () => 'draft-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);

export default function WorkStepWorkbench({
  isOpen,
  onClose,
  procedures = [],
  onApply,
  maxSteps = 20
}) {
  const { i18n } = useTranslation();
  const isKo = i18n.language?.startsWith('ko');

  const copy = isKo ? {
    title: '오늘의 작업 조립',
    subtitle: '여러 과거 프로젝트의 작업단계를 한 화면에서 비교하고 오늘 수행할 단계만 조합합니다.',
    projectLibrary: '프로젝트',
    search: '프로젝트·작업단계 검색',
    pinned: '펼쳐보기',
    unpin: '접기',
    noProject: '불러올 프로젝트가 없습니다.',
    loginRequired: '로그인 후 내 프로젝트와 스크랩 프로젝트를 조립할 수 있습니다.',
    loading: '라이브러리를 불러오는 중...',
    selected: '선택됨',
    addSelected: '선택 단계 추가',
    add: '추가',
    riskCount: '위험요인',
    today: '오늘의 JSA',
    todayHint: '왼쪽 작업단계의 + 버튼을 누르거나 이 영역으로 드래그하세요.',
    emptyToday: '아직 선택한 작업단계가 없습니다.',
    source: '출처',
    remove: '삭제',
    apply: '오늘 작업으로 적용',
    cancel: '닫기',
    maxReached: '작업단계는 최대 20개까지 구성할 수 있습니다.',
    pinLimit: '한 번에 최대 4개 프로젝트를 펼칠 수 있습니다.',
    own: 'MY',
    scrap: 'SCRAP'
  } : {
    title: 'Compose Today\'s Work',
    subtitle: 'Compare steps from multiple previous projects and assemble only the work being performed today.',
    projectLibrary: 'Projects',
    search: 'Search projects or work steps',
    pinned: 'Open',
    unpin: 'Close',
    noProject: 'No reusable projects found.',
    loginRequired: 'Sign in to compose work from your own and saved projects.',
    loading: 'Loading library...',
    selected: 'selected',
    addSelected: 'Add selected steps',
    add: 'Add',
    riskCount: 'hazards',
    today: 'Today\'s JSA',
    todayHint: 'Click + on a work step or drag it into this area.',
    emptyToday: 'No work steps selected yet.',
    source: 'Source',
    remove: 'Remove',
    apply: 'Apply to today\'s work',
    cancel: 'Close',
    maxReached: 'A JSA can contain up to 20 work steps.',
    pinLimit: 'You can open up to four projects at once.',
    own: 'MY',
    scrap: 'SCRAP'
  };

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedIds, setPinnedIds] = useState([]);
  const [selectedStepKeys, setSelectedStepKeys] = useState([]);
  const [draftSteps, setDraftSteps] = useState([]);
  const [draggedDraftIdx, setDraggedDraftIdx] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const initialDraft = procedures
      .filter(p => p?.stepTitle?.trim() || p?.stepDetail?.trim())
      .map(proc => ({ key: makeDraftKey(), proc: { ...proc } }));
    setDraftSteps(initialDraft);
    setSelectedStepKeys([]);
    setSearchTerm('');

    const fetchProjects = async () => {
      setLoading(true);
      setAuthRequired(false);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setProjects([]);
          setPinnedIds([]);
          setAuthRequired(true);
          return;
        }

        const [authoredRes, favoriteRes] = await Promise.all([
          supabase
            .from('jsa_projects')
            .select('*')
            .eq('author_id', user.id)
            .order('updated_at', { ascending: false }),
          supabase
            .from('user_favorites')
            .select('*, jsa_projects(*)')
            .eq('user_id', user.id)
        ]);

        const map = new Map();
        (authoredRes.data || []).forEach(project => {
          if (project?.id) map.set(project.id, { ...project, libraryType: 'MY' });
        });
        (favoriteRes.data || []).forEach(item => {
          const project = item?.jsa_projects;
          if (project?.id && !map.has(project.id)) {
            map.set(project.id, { ...project, libraryType: 'SCRAP' });
          }
        });

        const combined = Array.from(map.values()).filter(project =>
          Array.isArray(project.analysis_data) && project.analysis_data.length > 0
        );

        setProjects(combined);
        setPinnedIds(combined.slice(0, 3).map(project => project.id));
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isOpen, procedures]);

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return projects;

    return projects.filter(project => {
      const projectText = [
        project.title,
        ...(project.tags || []),
        ...(project.analysis_data || []).flatMap(step => [
          step?.proc?.stepTitle,
          step?.proc?.stepDetail
        ])
      ].filter(Boolean).join(' ').toLowerCase();
      return projectText.includes(q);
    });
  }, [projects, searchTerm]);

  const pinnedProjects = useMemo(
    () => pinnedIds
      .map(id => projects.find(project => project.id === id))
      .filter(Boolean),
    [pinnedIds, projects]
  );

  if (!isOpen) return null;

  const stepKey = (projectId, stepIndex) => String(projectId) + ':' + stepIndex;

  const togglePinned = (projectId) => {
    setPinnedIds(prev => {
      if (prev.includes(projectId)) return prev.filter(id => id !== projectId);
      if (prev.length >= 4) {
        alert(copy.pinLimit);
        return prev;
      }
      return [...prev, projectId];
    });
  };

  const toggleSelected = (projectId, stepIndex) => {
    const key = stepKey(projectId, stepIndex);
    setSelectedStepKeys(prev =>
      prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
    );
  };

  const buildProcedure = (project, step, stepIndex) => ({
    ...(step?.proc || {}),
    stepTitle: step?.proc?.stepTitle || '',
    stepDetail: step?.proc?.stepDetail || '',
    sourceProjectId: project.id,
    sourceProjectTitle: project.title || '',
    sourceStepIndex: stepIndex
  });

  const addLibraryStep = (project, step, stepIndex) => {
    setDraftSteps(prev => {
      if (prev.length >= maxSteps) {
        alert(copy.maxReached);
        return prev;
      }
      return [...prev, {
        key: makeDraftKey(),
        proc: buildProcedure(project, step, stepIndex)
      }];
    });
  };

  const addSelected = () => {
    const selected = [];
    projects.forEach(project => {
      (project.analysis_data || []).forEach((step, stepIndex) => {
        if (selectedStepKeys.includes(stepKey(project.id, stepIndex))) {
          selected.push({ project, step, stepIndex });
        }
      });
    });

    if (!selected.length) return;
    const available = Math.max(0, maxSteps - draftSteps.length);
    if (selected.length > available) alert(copy.maxReached);

    setDraftSteps(prev => [
      ...prev,
      ...selected.slice(0, available).map(item => ({
        key: makeDraftKey(),
        proc: buildProcedure(item.project, item.step, item.stepIndex)
      }))
    ]);
    setSelectedStepKeys([]);
  };

  const handleLibraryDragStart = (event, projectId, stepIndex) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(
      'application/x-smart-jsa-step',
      JSON.stringify({ projectId, stepIndex })
    );
  };

  const handleDropToToday = (event) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/x-smart-jsa-step');
    if (!raw) return;

    try {
      const payload = JSON.parse(raw);
      const project = projects.find(item => String(item.id) === String(payload.projectId));
      const step = project?.analysis_data?.[payload.stepIndex];
      if (project && step) addLibraryStep(project, step, payload.stepIndex);
    } catch {
      // Ignore malformed drag payload.
    }
  };

  const reorderDraft = (targetIdx) => {
    if (draggedDraftIdx === null || draggedDraftIdx === targetIdx) return;
    setDraftSteps(prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedDraftIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setDraggedDraftIdx(targetIdx);
  };

  const applyDraft = () => {
    onApply?.(draftSteps.map(item => ({ ...item.proc })));
    onClose?.();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <section style={styles.workspace} onClick={event => event.stopPropagation()}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>STEP COMPOSER</div>
            <h2 style={styles.title}>{copy.title}</h2>
            <p style={styles.subtitle}>{copy.subtitle}</p>
          </div>
          <button type="button" style={styles.closeBtn} onClick={onClose}>×</button>
        </header>

        {loading ? (
          <div style={styles.centerMessage}>{copy.loading}</div>
        ) : authRequired ? (
          <div style={styles.centerMessage}>{copy.loginRequired}</div>
        ) : (
          <div style={styles.body}>
            <aside style={styles.projectRail}>
              <div style={styles.panelTitle}>{copy.projectLibrary}</div>
              <input
                style={styles.searchInput}
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder={copy.search}
              />
              <div style={styles.projectList}>
                {filteredProjects.length === 0 ? (
                  <div style={styles.emptySmall}>{copy.noProject}</div>
                ) : filteredProjects.map(project => {
                  const isPinned = pinnedIds.includes(project.id);
                  return (
                    <button
                      type="button"
                      key={project.id}
                      style={isPinned ? styles.projectBtnActive : styles.projectBtn}
                      onClick={() => togglePinned(project.id)}
                    >
                      <span style={styles.projectType}>
                        {project.libraryType === 'MY' ? copy.own : copy.scrap}
                      </span>
                      <span style={styles.projectName}>{project.title}</span>
                      <span style={styles.pinLabel}>{isPinned ? copy.unpin : copy.pinned}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main style={styles.projectBoard}>
              <div style={styles.boardToolbar}>
                <span>{pinnedProjects.length}/4</span>
                <button
                  type="button"
                  style={styles.bulkAddBtn}
                  disabled={selectedStepKeys.length === 0}
                  onClick={addSelected}
                >
                  {copy.addSelected} ({selectedStepKeys.length})
                </button>
              </div>

              <div style={styles.projectColumns}>
                {pinnedProjects.map(project => (
                  <section key={project.id} style={styles.projectColumn}>
                    <div style={styles.projectColumnHeader}>
                      <div>
                        <div style={styles.projectColumnType}>
                          {project.libraryType === 'MY' ? copy.own : copy.scrap}
                        </div>
                        <h3 style={styles.projectColumnTitle}>{project.title}</h3>
                      </div>
                      <button
                        type="button"
                        style={styles.columnClose}
                        onClick={() => togglePinned(project.id)}
                      >
                        ×
                      </button>
                    </div>

                    <div style={styles.stepList}>
                      {(project.analysis_data || []).map((step, stepIndex) => {
                        const key = stepKey(project.id, stepIndex);
                        const checked = selectedStepKeys.includes(key);
                        return (
                          <article
                            key={key}
                            draggable
                            onDragStart={event => handleLibraryDragStart(event, project.id, stepIndex)}
                            style={checked ? styles.stepCardSelected : styles.stepCard}
                          >
                            <div style={styles.stepCardTop}>
                              <label style={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSelected(project.id, stepIndex)}
                                />
                                <span>STEP {stepIndex + 1}</span>
                              </label>
                              <button
                                type="button"
                                style={styles.addStepBtn}
                                onClick={() => addLibraryStep(project, step, stepIndex)}
                              >
                                + {copy.add}
                              </button>
                            </div>
                            <strong style={styles.stepTitle}>{step?.proc?.stepTitle || '-'}</strong>
                            <p style={styles.stepDetail}>{step?.proc?.stepDetail || '-'}</p>
                            <div style={styles.riskCount}>
                              {copy.riskCount} {step?.risks?.length || 0}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </main>

            <aside
              style={styles.todayPanel}
              onDragOver={event => event.preventDefault()}
              onDrop={handleDropToToday}
            >
              <div style={styles.todayHeader}>
                <div>
                  <div style={styles.panelTitle}>{copy.today}</div>
                  <div style={styles.todayCount}>{draftSteps.length}/{maxSteps}</div>
                </div>
              </div>
              <div style={styles.todayHint}>{copy.todayHint}</div>

              <div style={styles.todayList}>
                {draftSteps.length === 0 ? (
                  <div style={styles.todayEmpty}>{copy.emptyToday}</div>
                ) : draftSteps.map((item, index) => (
                  <div
                    key={item.key}
                    draggable
                    onDragStart={() => setDraggedDraftIdx(index)}
                    onDragOver={event => {
                      event.preventDefault();
                      reorderDraft(index);
                    }}
                    onDragEnd={() => setDraggedDraftIdx(null)}
                    style={styles.todayStep}
                  >
                    <div style={styles.dragHandle}>☰</div>
                    <div style={styles.todayStepBody}>
                      <strong style={styles.todayStepTitle}>
                        {index + 1}. {item.proc.stepTitle || '-'}
                      </strong>
                      <div style={styles.todaySource}>
                        {copy.source}: {item.proc.sourceProjectTitle || 'Current JSA'}
                      </div>
                    </div>
                    <button
                      type="button"
                      title={copy.remove}
                      style={styles.removeBtn}
                      onClick={() => setDraftSteps(prev => prev.filter(row => row.key !== item.key))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div style={styles.actions}>
                <button type="button" style={styles.cancelBtn} onClick={onClose}>
                  {copy.cancel}
                </button>
                <button type="button" style={styles.applyBtn} onClick={applyDraft}>
                  {copy.apply}
                </button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 5000,
    background: 'rgba(0,0,0,0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2vh 2vw'
  },
  workspace: {
    width: '96vw',
    height: '92vh',
    background: '#0b0b0b',
    border: '1px solid #2b2b2b',
    borderRadius: '16px',
    boxShadow: '0 30px 100px rgba(0,0,0,0.85)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '18px 22px',
    borderBottom: '1px solid #222',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    alignItems: 'flex-start'
  },
  eyebrow: { fontSize: '0.68rem', color: '#007bff', fontWeight: 900, letterSpacing: '1.5px' },
  title: { margin: '5px 0 4px', fontSize: '1.45rem' },
  subtitle: { margin: 0, color: '#777', fontSize: '0.82rem', lineHeight: 1.5 },
  closeBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#151515',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '1.4rem'
  },
  centerMessage: { margin: 'auto', color: '#888', fontSize: '0.95rem' },
  body: { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '235px minmax(0, 1fr) 340px' },
  projectRail: {
    minWidth: 0,
    padding: '18px',
    borderRight: '1px solid #222',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflow: 'hidden'
  },
  panelTitle: { fontSize: '0.76rem', color: '#aaa', fontWeight: 900, letterSpacing: '0.4px' },
  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 11px',
    background: '#121212',
    border: '1px solid #2d2d2d',
    borderRadius: '7px',
    color: '#fff',
    fontSize: '0.78rem'
  },
  projectList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px' },
  projectBtn: {
    width: '100%',
    textAlign: 'left',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #242424',
    background: '#111',
    color: '#aaa',
    cursor: 'pointer',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '4px 8px',
    alignItems: 'center'
  },
  projectBtnActive: {
    width: '100%',
    textAlign: 'left',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #007bff',
    background: 'rgba(0,123,255,0.09)',
    color: '#fff',
    cursor: 'pointer',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '4px 8px',
    alignItems: 'center'
  },
  projectType: {
    fontSize: '0.58rem',
    background: '#242424',
    color: '#aaa',
    padding: '2px 5px',
    borderRadius: '3px'
  },
  projectName: { fontSize: '0.78rem', fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis' },
  pinLabel: { gridColumn: '2', fontSize: '0.62rem', color: '#555' },
  emptySmall: { padding: '20px 4px', color: '#666', fontSize: '0.75rem', lineHeight: 1.5 },
  projectBoard: { minWidth: 0, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  boardToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#555',
    fontSize: '0.7rem',
    marginBottom: '10px'
  },
  bulkAddBtn: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #007bff',
    background: 'rgba(0,123,255,0.12)',
    color: '#4fa3ff',
    fontSize: '0.72rem',
    cursor: 'pointer',
    fontWeight: 800
  },
  projectColumns: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    overflowY: 'hidden',
    alignItems: 'stretch'
  },
  projectColumn: {
    width: '285px',
    minWidth: '285px',
    background: '#101010',
    border: '1px solid #242424',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  projectColumnHeader: {
    padding: '12px',
    borderBottom: '1px solid #222',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px'
  },
  projectColumnType: { fontSize: '0.58rem', color: '#007bff', fontWeight: 900 },
  projectColumnTitle: { margin: '3px 0 0', fontSize: '0.86rem', lineHeight: 1.35 },
  columnClose: { background: 'none', border: 0, color: '#555', cursor: 'pointer', fontSize: '1rem' },
  stepList: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' },
  stepCard: {
    padding: '10px',
    border: '1px solid #282828',
    borderRadius: '8px',
    background: '#151515',
    cursor: 'grab'
  },
  stepCardSelected: {
    padding: '10px',
    border: '1px solid #007bff',
    borderRadius: '8px',
    background: 'rgba(0,123,255,0.08)',
    cursor: 'grab'
  },
  stepCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' },
  checkboxLabel: { display: 'flex', gap: '6px', alignItems: 'center', color: '#666', fontSize: '0.62rem', fontWeight: 800 },
  addStepBtn: {
    background: '#202020',
    color: '#ddd',
    border: '1px solid #333',
    borderRadius: '5px',
    padding: '4px 7px',
    fontSize: '0.65rem',
    cursor: 'pointer'
  },
  stepTitle: { display: 'block', marginTop: '9px', fontSize: '0.82rem', color: '#eee' },
  stepDetail: {
    margin: '5px 0 8px',
    color: '#777',
    fontSize: '0.68rem',
    lineHeight: 1.45,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  riskCount: { fontSize: '0.62rem', color: '#ff7675' },
  todayPanel: {
    minWidth: 0,
    borderLeft: '1px solid #222',
    background: '#0e0e0e',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  todayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  todayCount: { marginTop: '4px', color: '#007bff', fontSize: '0.7rem', fontWeight: 800 },
  todayHint: {
    margin: '12px 0',
    padding: '10px',
    border: '1px dashed #303030',
    borderRadius: '7px',
    color: '#666',
    fontSize: '0.68rem',
    lineHeight: 1.45
  },
  todayList: { flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px' },
  todayEmpty: { margin: 'auto', padding: '20px', textAlign: 'center', color: '#555', fontSize: '0.75rem' },
  todayStep: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '10px',
    background: '#161616',
    border: '1px solid #292929',
    borderRadius: '8px',
    cursor: 'grab'
  },
  dragHandle: { color: '#555', fontSize: '0.75rem' },
  todayStepBody: { flex: 1, minWidth: 0 },
  todayStepTitle: {
    display: 'block',
    color: '#eee',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  todaySource: {
    marginTop: '4px',
    color: '#555',
    fontSize: '0.6rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  removeBtn: { background: 'none', border: 0, color: '#ff5c5c', cursor: 'pointer', fontSize: '1rem' },
  actions: { display: 'flex', gap: '8px', marginTop: '14px' },
  cancelBtn: {
    flex: 1,
    padding: '11px',
    background: '#171717',
    border: '1px solid #303030',
    borderRadius: '7px',
    color: '#888',
    cursor: 'pointer',
    fontWeight: 800
  },
  applyBtn: {
    flex: 2,
    padding: '11px',
    background: '#007bff',
    border: '1px solid #007bff',
    borderRadius: '7px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 900
  }
};
