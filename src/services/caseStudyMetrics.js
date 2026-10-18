import { supabase } from '../supabaseClient';
import { publicGateway } from './publicGateway';
import { validProjectId, safeMetric } from '../utils/publicJsa.js';

export async function caseViewCounts(ids, client = supabase) {
  const counts = new Map();
  for (let i=0;i<ids.length;i+=100) {
    const batch=ids.slice(i,i+100).filter(validProjectId);
    if (!batch.length) continue;
    const { data, error } = await client.from('case_study_metrics').select('case_id,view_count').in('case_id',batch);
    if (error) throw error;
    for (const row of data||[]) counts.set(row.case_id,safeMetric(row.view_count));
  }
  return counts;
}
export async function recordCaseView(id, client = supabase) {
  if (!validProjectId(id) || navigator.webdriver || /bot|crawler|spider|reactsnap/i.test(navigator.userAgent) || document.visibilityState !== 'visible') return null;
  try {
    const data=await publicGateway('case_view',{id});
    return data === null ? null : safeMetric(data);
  } catch { return null; }
}
