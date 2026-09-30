import { supabase } from '../supabaseClient';
import { templatePayload, projectEditorState } from '../utils/projectPersistence.js';

const checked = async query => { const { data, error } = await query; if (error) throw error; return data; };
export const businessAction = (action, { org = null, doc = null, expected = null, payload = {} } = {}, client = supabase) =>
  checked(client.rpc('jsa_business_action', { p_action: action, p_org: org, p_doc: doc, p_expected: expected, p_payload: payload }));
export async function getBusinessAccount(client = supabase) {
  const { data: { user }, error } = await client.auth.getUser();
  if (!user) { if (error && error.name !== 'AuthSessionMissingError') throw error; return { user: null, organizations: [], projects: [] }; }
  const [beta, organizations, projects] = await Promise.all([
    checked(client.from('jsa_beta_access').select('*').eq('user_id', user.id).maybeSingle()),
    checked(client.from('jsa_organizations').select('*').order('created_at')),
    checked(client.from('jsa_projects').select('id,title,updated_at').eq('author_id', user.id).eq('user_id', user.id).eq('is_public', false).order('updated_at', { ascending: false })),
  ]);
  return { user, beta, organizations: organizations || [], projects: projects || [] };
}
export async function getOrganization(org, client = supabase) {
  const [status, members, documents, templates] = await Promise.all([
    businessAction('org_status', { org }, client),
    checked(client.from('jsa_org_members').select('*').eq('org_id', org).order('created_at')),
    checked(client.from('jsa_org_documents').select('id,org_id,title,state,version,edited_by,reviewer_id,submitted_by,updated_at').eq('org_id', org).order('updated_at', { ascending: false })),
    checked(client.from('jsa_org_templates').select('*').eq('org_id', org).order('name')),
  ]);
  const [profiles, invites] = await Promise.all([
    members.length ? checked(client.from('profiles').select('id,username,display_name').in('id', members.map(m => m.user_id))) : [],
    status.role === 'owner' ? checked(client.from('jsa_org_invites').select('id,role,expires_at,revoked,accepted_by').eq('org_id', org).order('created_at', { ascending: false })) : [],
  ]);
  return { id: org, status, members: members.map(m => ({ ...m, name: profiles.find(p => p.id === m.user_id)?.display_name || profiles.find(p => p.id === m.user_id)?.username || m.user_id.slice(0,8) })), documents, templates, invites };
}
export async function getOrganizationDocument(id, client = supabase) {
  const [document, revisions] = await Promise.all([
    checked(client.from('jsa_org_documents').select('*').eq('id', id).maybeSingle()),
    checked(client.from('jsa_org_revisions').select('id,document_id,version,state,action,actor_id,comment,created_at').eq('document_id', id).order('version', { ascending: false }).limit(100)),
  ]);
  return { document, revisions };
}
export const getPersonalRevisions = (id, client = supabase) => checked(client.from('jsa_project_revisions').select('id,project_id,created_at').eq('project_id', id).order('id', { ascending: false }).limit(100));
export const getRevision = (id, company, client = supabase) => checked(client.from(company ? 'jsa_org_revisions' : 'jsa_project_revisions').select('*').eq('id', id).maybeSingle());
export const saveCompanyTemplate = ({ org, id, version, name, layout }) => businessAction('save_template', { org, doc: id, expected: version, payload: { name, layout: templatePayload(layout) } });
export function companyEditorCopy(snapshot) {
  // Team documents are edited through explicit private copies and re-imported.
  return { ...projectEditorState({ ...snapshot, id: null }, false), isFork: false, parentId: null, projectSaveContext: null, originalAnalysisData: null };
}
