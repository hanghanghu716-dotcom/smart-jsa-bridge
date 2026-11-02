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
    (!item.summary || (source.commercial === true && source.adaptation === true && item.reuse_confirmed === true && (item.attribution || '').trim().length >= 12)) &&
    (!item.translated || (source.commercial === true && source.adaptation === true && item.reuse_confirmed === true && (item.attribution || '').trim().length >= 12)) &&
    (!item.collection_provenance?.automatic_publication || canPublishFeed(item,source,now));
}
export function canPublishFeed(item,source,now=Date.now()){
 const approval=source?.automatic_publication,collection=source?.collection,date=Date.parse(item?.source_date),today=Date.parse(new Date(now).toISOString().slice(0,10));
 return Boolean(source?.active&&source.commercial&&Date.parse(source.review_until)>now&&approval?.eligible&&approval.enabled&&Date.parse(approval.review_until)>now&&/^https:\/\/[^\s]+$/.test(approval.evidence_url||'')&&(approval.attribution||'').length>=12
 &&collection?.enabled&&collection.mode==='feed'&&Date.parse(collection.review_until)>now&&item?.collection_provenance?.mode==='feed'&&source.locales?.includes(item.locale)&&officialUrl(item.url,source.domains||[])
 &&item.kind==='news'&&!item.summary&&!item.translated&&item.title?.trim().length>=8&&item.title.length<=250&&!/[<>\u0000-\u001f\u007f]/.test(item.title)&&!/link awaiting review/i.test(item.title)&&date>=today-180*86400000&&date<=today+86400000);
}
