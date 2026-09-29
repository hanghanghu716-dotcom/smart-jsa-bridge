import { supabase } from '../supabaseClient';

const GUEST_DRAFT_PREFIX = 'smartjsa_guest_draft:';
const ACTIVE_DRAFT_KEY = 'smartjsa_active_draft_id';

const newUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getActiveDraftId = () => {
  if (typeof window === 'undefined') return null;
  const existing = sessionStorage.getItem(ACTIVE_DRAFT_KEY);
  if (existing) return existing;
  const id = newUuid();
  sessionStorage.setItem(ACTIVE_DRAFT_KEY, id);
  return id;
};

export const setActiveDraftId = (draftId) => {
  if (typeof window === 'undefined' || !draftId) return;
  sessionStorage.setItem(ACTIVE_DRAFT_KEY, draftId);
};

export const clearActiveDraft = () => {
  if (typeof window === 'undefined') return;
  const draftId = sessionStorage.getItem(ACTIVE_DRAFT_KEY);
  sessionStorage.removeItem(ACTIVE_DRAFT_KEY);
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
    localStorage.setItem(
      GUEST_DRAFT_PREFIX + draftId,
      JSON.stringify({ ...payload, guest: true })
    );
    return { draftId, storage: 'local' };
  }

  const { error } = await supabase
    .from('user_jsa_drafts')
    .upsert({ ...payload, user_id: user.id }, { onConflict: 'id' });

  if (error) throw error;
  return { draftId, storage: 'cloud' };
};

export const loadDraft = async (draftId) => {
  if (!draftId) return null;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const raw = localStorage.getItem(GUEST_DRAFT_PREFIX + draftId);
    return raw ? JSON.parse(raw) : null;
  }

  const { data, error } = await supabase
    .from('user_jsa_drafts')
    .select('*')
    .eq('id', draftId)
    .maybeSingle();

  if (error) throw error;
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
