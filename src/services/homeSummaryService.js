import { supabase } from '../supabaseClient';
import { readHomeSummary } from '../utils/homeSummary.js';
import { validProjectId } from '../utils/publicJsa.js';
import { localeCountry } from '../utils/publicCountry.js';

export function loadHomeSummary(locale, { client = supabase, blocked = [], hidden = [], signal } = {}) {
  return readHomeSummary(locale, async ({ table, fields, offset, limit }) => {
    let query = client.from(table).select(fields).eq('is_public', true);
    const country = localeCountry(locale);
    if (country) query = query.eq('public_country', country);
    const authors = blocked.filter(validProjectId), projects = hidden.filter(validProjectId);
    if (authors.length) query = query.not('author_id', 'in', '(' + authors.join(',') + ')');
    if (projects.length) query = query.not('id', 'in', '(' + projects.join(',') + ')');
    query = query.order('published_at', { ascending: false }).order('id', { ascending: true }).range(offset, offset + limit - 1);
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }, signal);
}
