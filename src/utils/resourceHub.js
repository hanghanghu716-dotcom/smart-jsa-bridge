import { SUPPORTED_LANGS } from '../locales/config.js';
export const RESOURCE_TOPICS = ['common','construction','manufacturing','chemical','high-risk','general'];
export const RESOURCE_KINDS = ['news','incident','legal','form'];
export const HUB_PAGE_SIZE = 12;
export function hubQuery(input = '') {
  const p = input instanceof URLSearchParams ? input : new URLSearchParams(input);
  return { q: (p.get('q') || '').trim().slice(0, 160), kind: RESOURCE_KINDS.includes(p.get('kind')) ? p.get('kind') : '',
    topic: RESOURCE_TOPICS.includes(p.get('topic')) ? p.get('topic') : '', page: Math.max(0, Math.min(5000, parseInt(p.get('page'), 10) || 0)),
    type: ['jsa','case','guide','resource'].includes(p.get('type')) ? p.get('type') : 'all' };
}
export function hubSearch(query) {
  const p = new URLSearchParams();
  for (const key of ['q','kind','topic','page','type']) if (query[key]) p.set(key, String(query[key]));
  return p.size ? '?' + p : '';
}
export const hubLocale = value => SUPPORTED_LANGS.includes(value) ? value : null;
export function officialUrl(value, domains) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.port &&
    domains.includes(u.hostname) && value.match(/^https:\/\/([^/]+)/)?.[1] === u.hostname && !/[\u0000-\u0020\\]/.test(value) ? u.href : null; } catch { return null; }
}
export function visibleResource(item, source, now = Date.now()) {
  return source?.active === true && item?.state === 'published' && Date.parse(source.review_until) > now &&
    Date.parse(item.review_until) > now && Boolean(item.evidence_url) && Boolean(officialUrl(item.url, source.domains || [])) &&
    (!item.summary || (source.commercial === true && source.adaptation === true && item.reuse_confirmed === true)) &&
    (!item.translated || (source.adaptation === true && item.reuse_confirmed === true));
}
