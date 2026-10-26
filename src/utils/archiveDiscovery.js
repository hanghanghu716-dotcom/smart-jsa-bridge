import { cleanSummary } from './content.js';
import { getCaseLanguages, getLanguageTag, selectLocalizedCases } from '../locales/config.js';
import { DEFAULT_PUBLIC_SUPABASE } from '../config/supabase.js';
export const ARCHIVE_PAGE_SIZE = 12;
export const ARCHIVE_FIELDS = 'id,post_group_id,language_code,title,meta_description,created_at,content_updated_at,pdf_list,pdf_download_url';
export function archiveQuery(value = '') {
 const p = value instanceof URLSearchParams ? value : new URLSearchParams(value);
 return { search: (p.get('q') || '').slice(0,200).trim(), pdf: p.get('pdf') === '1', year: /^\d{4}$/.test(p.get('year') || '') ? p.get('year') : '', sort: ['oldest','title'].includes(p.get('sort')) ? p.get('sort') : 'latest', page: Math.max(1,Math.min(10000,Number.parseInt(p.get('page'),10) || 1)) };
}
export function archiveSearch(query) {
 const p = new URLSearchParams();
 if (query.search) p.set('q',query.search);
 if (query.pdf) p.set('pdf','1');
 if (query.year) p.set('year',query.year);
 if (query.sort && query.sort !== 'latest') p.set('sort',query.sort);
 if (query.page > 1) p.set('page',query.page);
 return p.size ? '?' + p : '';
}
export function casePdf(row) {
 const candidates = [row.pdf_download_url,...(Array.isArray(row.pdf_list) ? row.pdf_list.map(pdf => pdf?.url) : [])];
 return candidates.find(value => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } }) || '';
}
export function previewPdfUrl(value, storageOrigin = DEFAULT_PUBLIC_SUPABASE.url) {
 try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && ((url.origin === storageOrigin && url.pathname.startsWith('/storage/v1/object/public/')) || url.origin === 'https://smartjsabridge.com') ? url.href : ''; } catch { return ''; }
}
const normalized = value => cleanSummary(value || '').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase();
export function archiveResults(rows, query, locale) {
 const words = normalized(query.search).split(/\s+/u).filter(Boolean);
 const result = rows.filter(row => (!query.pdf || casePdf(row)) && (!query.year || String(row.created_at || '').startsWith(query.year)) && words.every(word => normalized(row.title + ' ' + cleanSummary(row.meta_description)).includes(word)));
 const collator = new Intl.Collator(getLanguageTag(locale),{numeric:true,sensitivity:'base'});
 result.sort((a,b) => (query.sort === 'title' ? collator.compare(a.title || '',b.title || '') : (query.sort === 'oldest' ? 1 : -1) * ((Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0))) || String(a.post_group_id).localeCompare(String(b.post_group_id)));
 const pages = Math.max(1,Math.ceil(result.length / ARCHIVE_PAGE_SIZE)), page = Math.min(query.page,pages);
 return { total:result.length, pages, page, rows:result.slice((page-1)*ARCHIVE_PAGE_SIZE,page*ARCHIVE_PAGE_SIZE) };
}
export async function loadArchiveRows(client, locale, signal) {
 const rows = []; let cursor = '';
 for (;;) {
  let query = client.from('case_studies').select(ARCHIVE_FIELDS).in('language_code',getCaseLanguages(locale)).order('id',{ascending:true}).limit(500).abortSignal(signal);
  if (cursor) query = query.gt('id',cursor);
  const {data,error} = await query;
  if (error) throw error;
  if (!data?.length) return selectLocalizedCases(rows,locale);
  const next = data.at(-1).id;
  if (!next || next <= cursor || rows.length + data.length > 50000) throw Error('ARCHIVE_READ_LIMIT');
  rows.push(...data); cursor = next;
 }
}
