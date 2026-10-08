import { supabase } from '../supabaseClient';
import { validProjectId, safeMetric } from '../utils/publicJsa.js';

// A first-party, daily random ID only for approximate article-view deduplication.
// No advertising identifier, fingerprint, URL query or cross-day identifier is sent.
function dailyVisitor() {
  try {
    const day = new Date().toISOString().slice(0,10), key = 'jsa-case-view-day';
    const previous = JSON.parse(localStorage.getItem(key) || 'null');
    if (previous?.day === day && validProjectId(previous.id)) return previous.id;
    const id = crypto.randomUUID();
    localStorage.setItem(key, JSON.stringify({ day, id }));
    return id;
  } catch { return null; }
}
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
    const {data,error}=await client.rpc('record_case_study_view',{p_case_id:id,p_visitor_id:dailyVisitor()});
    return error || data === null ? null : safeMetric(data);
  } catch { return null; }
}
