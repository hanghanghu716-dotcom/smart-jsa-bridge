import { supabase } from '../supabaseClient';

const GUEST_DRAFT_PREFIX = 'smartjsa_guest_draft:';
const ACTIVE_DRAFT_KEY = 'smartjsa_active_draft_id';
const ACTIVE_DRAFT_VERSION_KEY = 'smartjsa_active_draft_version';

const newUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getExistingActiveDraftId = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ACTIVE_DRAFT_KEY);
};

export const getActiveDraftId = () => {
  if (typeof window === 'undefined') return null;
  const existing = getExistingActiveDraftId();
  if (existing) return existing;
  const id = newUuid();
  sessionStorage.setItem(ACTIVE_DRAFT_KEY, id);
  return id;
};

export const getActiveDraftVersion = () => {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(ACTIVE_DRAFT_VERSION_KEY);
  if (raw == null) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
};

export const setActiveDraftId = (draftId, version = null) => {
  if (typeof window === 'undefined' || !draftId) return;
  sessionStorage.setItem(ACTIVE_DRAFT_KEY, draftId);
  if (Number.isInteger(version) && version >= 1) {
    sessionStorage.setItem(ACTIVE_DRAFT_VERSION_KEY, String(version));
  } else {
    sessionStorage.removeItem(ACTIVE_DRAFT_VERSION_KEY);
  }
};

export const clearActiveDraft = () => {
  if (typeof window === 'undefined') return;
  const draftId = sessionStorage.getItem(ACTIVE_DRAFT_KEY);
  sessionStorage.removeItem(ACTIVE_DRAFT_KEY);
  sessionStorage.removeItem(ACTIVE_DRAFT_VERSION_KEY);
  if (draftId) localStorage.removeItem(GUEST_DRAFT_PREFIX + draftId);
};

export const saveDraftSnapshot = async ({
  draftId,
  title,
  currentStage,
  formData = {},
  participants = [],
  procedures = [],
  analysisData = [],
  layoutData = {},
  sourceProjectId = null,
}) => {
  if (!draftId) return { draftId: null, storage: 'none' };

  const payload = {
    id: draftId,
    title: title?.trim() || formData?.projectName?.trim() || 'Untitled JSA',
    current_stage: currentStage,
    form_data: formData || {},
    participants: participants || [],
    procedures: procedures || [],
    analysis_data: analysisData || [],
    layout_data: layoutData || {},
    source_project_id: sourceProjectId || null,
    updated_at: new Date().toISOString(),
    last_opened_at: new Date().toISOString(),
  };

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const raw = localStorage.getItem(GUEST_DRAFT_PREFIX + draftId);
    const previous = raw ? JSON.parse(raw) : null;
    const version = Number(previous?.version || 0) + 1;
    localStorage.setItem(
      GUEST_DRAFT_PREFIX + draftId,
      JSON.stringify({ ...payload, guest: true, version })
    );
    sessionStorage.setItem(ACTIVE_DRAFT_VERSION_KEY, String(version));
    return { draftId, storage: 'local', version };
  }

  let expectedVersion = getActiveDraftVersion();

  if (expectedVersion == null) {
    const { data: existing, error: existingError } = await supabase
      .from('user_jsa_drafts')
      .select('id, version')
      .eq('id', draftId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing?.version) {
      expectedVersion = existing.version;
      sessionStorage.setItem(ACTIVE_DRAFT_VERSION_KEY, String(existing.version));
    }
  }

  const { data, error } = await supabase.rpc('save_jsa_draft_snapshot', {
    p_id: draftId,
    p_expected_version: expectedVersion,
    p_title: payload.title,
    p_current_stage: payload.current_stage,
    p_form_data: payload.form_data,
    p_participants: payload.participants,
    p_procedures: payload.procedures,
    p_analysis_data: payload.analysis_data,
    p_layout_data: payload.layout_data,
    p_source_project_id: payload.source_project_id,
  });

  if (error) {
    if (error.message?.includes('DRAFT_VERSION_CONFLICT')) {
      const conflict = new Error('DRAFT_VERSION_CONFLICT');
      conflict.code = 'DRAFT_VERSION_CONFLICT';
      throw conflict;
    }
    throw error;
  }

  const saved = Array.isArray(data) ? data[0] : data;
  if (saved?.version) {
    sessionStorage.setItem(ACTIVE_DRAFT_VERSION_KEY, String(saved.version));
  }

  return { draftId, storage: 'cloud', version: saved?.version || 1 };
};

export const loadActiveDraft = async () => {
  const draftId = getExistingActiveDraftId();
  if (!draftId) return null;
  return loadDraft(draftId);
};

export const loadDraft = async (draftId) => {
  if (!draftId) return null;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const raw = localStorage.getItem(GUEST_DRAFT_PREFIX + draftId);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.version && getExistingActiveDraftId() === draftId) {
      sessionStorage.setItem(ACTIVE_DRAFT_VERSION_KEY, String(parsed.version));
    }
    return parsed;
  }

  const { data, error } = await supabase
    .from('user_jsa_drafts')
    .select('*')
    .eq('id', draftId)
    .maybeSingle();

  if (error) throw error;
  if (data?.version && getExistingActiveDraftId() === draftId) {
    sessionStorage.setItem(ACTIVE_DRAFT_VERSION_KEY, String(data.version));
  }
  return data;
};

export const listRecentDrafts = async (limit = 10) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_jsa_drafts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const archiveActiveDraft = async () => {
  const draftId = getExistingActiveDraftId();
  if (!draftId) return;
  await archiveDraft(draftId);
  sessionStorage.removeItem(ACTIVE_DRAFT_KEY);
  sessionStorage.removeItem(ACTIVE_DRAFT_VERSION_KEY);
};

export const archiveDraft = async (draftId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !draftId) return;

  const { error } = await supabase
    .from('user_jsa_drafts')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', draftId)
    .eq('user_id', user.id);

  if (error) throw error;
};


export const deleteDraft = async (draftId) => {
  if (!draftId) return;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    localStorage.removeItem(GUEST_DRAFT_PREFIX + draftId);
    if (getExistingActiveDraftId() === draftId) {
      sessionStorage.removeItem(ACTIVE_DRAFT_KEY);
      sessionStorage.removeItem(ACTIVE_DRAFT_VERSION_KEY);
    }
    return;
  }

  const { error } = await supabase
    .from('user_jsa_drafts')
    .delete()
    .eq('id', draftId)
    .eq('user_id', user.id);

  if (error) throw error;

  if (getExistingActiveDraftId() === draftId) {
    sessionStorage.removeItem(ACTIVE_DRAFT_KEY);
    sessionStorage.removeItem(ACTIVE_DRAFT_VERSION_KEY);
  }
};
