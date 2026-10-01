import { supabase } from '../supabaseClient';
import { validProjectId } from '../utils/publicJsa';

function visitorId() { return null; }

// Analytics failure must never block reading or applying a document.
export async function recordPublicEngagement(id, kind, steps = [], client = supabase) {
  if (!validProjectId(id)) return null;
  try {
    const indices = [...new Set(steps)].filter(index => Number.isInteger(index) && index >= 0);
    const visitor = visitorId();
    let metrics = null;
    for (let offset = 0; offset < Math.max(1, indices.length); offset += 20) {
      const { data, error } = await client.rpc('record_public_jsa_engagement', {
        p_project_id: id, p_kind: kind, p_visitor_id: visitor,
        p_steps: indices.slice(offset, offset + 20),
      });
      if (error) return metrics;
      metrics = data;
    }
    return metrics;
  } catch { return null; }
}

export function recordAppliedPublicSteps(procedures) {
  const sources = new Map();
  for (const proc of procedures) {
    if (!validProjectId(proc?.sourceProjectId) || !Number.isInteger(proc?.sourceStepIndex)) continue;
    const indices = sources.get(proc.sourceProjectId) || [];
    indices.push(proc.sourceStepIndex);
    sources.set(proc.sourceProjectId, indices);
  }
  return Promise.all([...sources].map(([id, indices]) => recordPublicEngagement(id, 'reuse', indices)));
}
