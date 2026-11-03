import { parse } from 'parse5';
import { jobUrl } from '../src/utils/jobs.js';

// MHLW's own recruitment HTML is covered by PDL1.0. Its separately restricted
// RSS, Hello Work employer records, attachments and third-party sites are not used.
export const MHLW_LIST = 'https://www.mhlw.go.jp/kouseiroudoushou/saiyou/oldinfo.html';
export const MHLW_DETAIL_LIMIT = 5;
const children = n => n?.childNodes || [];
const attr = (n, key) => n?.attrs?.find(a => a.name === key)?.value || '';
const hasClass = (n, key) => attr(n, 'class').split(/\s+/).includes(key);
const text = n => n?.nodeName === '#text' ? n.value : ['script', 'style', 'template'].includes(n?.tagName) ? '' : children(n).map(text).join('');
const clean = (s, limit = 250) => s.replace(/\s+/g, ' ').trim().slice(0, limit);
function find(root, predicate) {
  const pending = [root], result = [];
  while (pending.length) { const n = pending.pop(); if (predicate(n)) result.push(n); pending.push(...children(n).slice().reverse()); }
  return result;
}
function main(html) {
  if (typeof html !== 'string' || html.length > 2 * 1024 * 1024) throw Error('invalid_data');
  const nodes = find(parse(html), n => hasClass(n, 'l-contentMain'));
  if (nodes.length !== 1) throw Error('invalid_data');
  return nodes[0];
}
const relevant = title => /化学物質|労働安全|労働衛生|産業安全|産業保健|安全衛生/.test(title) && /募集|採用/.test(title);
function detailUrl(value) {
  let url; try { url = new URL(value, MHLW_LIST); } catch { throw Error('invalid_data'); }
  if (!jobUrl(url.href, ['www.mhlw.go.jp']) || url.search || url.hash
    || !/^\/stf\/kouseiroudoushou\/saiyou\/(?:hijoukin|ninkituki)\/[a-zA-Z0-9_-]+\.html$/.test(url.pathname)
    || url.pathname.length > 160) throw Error('invalid_data');
  return url.href;
}
export function parseMhlwList(html, now = new Date()) {
  const root = main(html);
  if (!text(find(root, n => n.tagName === 'h1')[0]).includes('採用情報')) throw Error('invalid_data');
  const lists = find(root, n => n.tagName === 'ul' && hasClass(n, 'm-listNews'));
  if (lists.length !== 1) throw Error('invalid_data');
  const rows = children(lists[0]).filter(n => n.tagName === 'li'), selected = new Map();
  for (const row of rows) {
    const title = clean(text(find(row, n => hasClass(n, 'm-listNews__txt'))[0])).replace(/\s*NEW$/, '');
    if (!relevant(title)) continue;
    const posted = attr(find(row, n => n.tagName === 'time')[0], 'datetime');
    const date = Date.parse(posted + 'T00:00:00+09:00');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(posted) || !Number.isFinite(date)) throw Error('invalid_data');
    // Bounded recent discovery, not a crawl of the historical recruitment archive.
    if (date > now.getTime() || date < now.getTime() - 180 * 86400000) continue;
    const url = detailUrl(attr(find(row, n => n.tagName === 'a')[0], 'href'));
    if (!selected.has(url) || selected.get(url).date < date) selected.set(url, { url, date });
  }
  return [...selected.values()].sort((a, b) => b.date - a.date).slice(0, MHLW_DETAIL_LIMIT).map(x => x.url);
}

// Read only application-deadline sections. Employment end dates, office hours,
// publication dates and interview dates must never become application deadlines.
export function mhlwDeadline(value, applicationMethod = false) {
  const raw = value.normalize('NFKC').replace(/\s+/g, ' ').trim();
  const dates = [...raw.matchAll(/(?:(令和|平成)(元|\d{1,2})|(\d{4}))年\s*(\d{1,2})月\s*(\d{1,2})日/g)];
  if (!dates.length || dates.length > 2) return { deadline_text: '', closes_at: null };
  // Two dates are accepted only as an explicit application range, never two methods.
  if (dates.length === 2 && !/^\s*(?:[（(][^）)]{1,8}[）)])?\s*[～〜~]\s*$/.test(raw.slice(dates[0].index + dates[0][0].length, dates[1].index)))
    return { deadline_text: '', closes_at: null };
  const match = dates.at(-1), after = raw.slice(match.index + match[0].length, match.index + match[0].length + 60);
  if (applicationMethod && !/^(?:\s*[（(][^）)]{1,8}[）)])?\s*(?:必着|消印有効|まで|締切|締め切り)/.test(after))
    return { deadline_text: '', closes_at: null };
  const year = match[3] ? +match[3] : (match[1] === '令和' ? 2018 : 1988) + (match[2] === '元' ? 1 : +match[2]);
  const month = +match[4], day = +match[5], date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw Error('invalid_data');
  const time = after.match(/^(?:\s*[（(][^）)]{1,8}[）)])?\s*(?:(午前|午後)\s*)?(\d{1,2})(?:時|:)(?:(\d{1,2})分?)?/);
  let hour = time ? +time[2] : 24, minute = time ? +(time[3] || 0) : 0;
  if (time?.[1] === '午後' && hour < 12) hour += 12;
  if (time?.[1] === '午前' && hour === 12) hour = 0;
  if (hour > 24 || minute > 59 || (hour === 24 && minute)) throw Error('invalid_data');
  const label = date.toISOString().slice(0, 10) + (time ? ` ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')} JST` : '')
    + (/必着/.test(after) ? '（必着）' : /消印有効/.test(after) ? '（消印有効）' : '');
  return { deadline_text: label, closes_at: new Date(date.getTime() + ((hour - 9) * 60 + minute) * 60000).toISOString() };
}

export function parseMhlwDetail(html, inputUrl) {
  const url = detailUrl(inputUrl), root = main(html);
  const title = clean(text(find(root, n => n.tagName === 'h1')[0]));
  if (!title) throw Error('invalid_data');
  if (!relevant(title)) return null;
  const body = text(root);
  if (/転載禁止|無断転載|複製禁止/.test(body)) throw Error('invalid_data');
  const sections = new Map(); let section = '';
  const visit = n => {
    if (['script', 'style', 'template'].includes(n.tagName)) return;
    if (/^h[1-6]$/.test(n.tagName)) { section = clean(text(n)); if (!sections.has(section)) sections.set(section, ''); return; }
    if (n.nodeName === '#text' && section) sections.set(section, sections.get(section) + n.value);
    else children(n).forEach(visit);
  };
  visit(root);
  const get = name => clean(sections.get(name) || '', 2500);
  const deadlineSection = ['応募期限', '応募締切', '応募締め切り', '申込期限'].map(get).find(Boolean);
  const deadline = mhlwDeadline(deadlineSection || get('応募方法'), !deadlineSection);
  const workplace = get('勤務先'), location = get('勤務地') || workplace.match(/所在地[：:]\s*([^）)]+)/)?.[1] || '';
  return { external_id: new URL(url).pathname, locale: 'ja-JP', url, title,
    employer: clean(workplace.split(/[（(]/)[0] || '厚生労働省'), location: clean(location), ...deadline,
    source_closed: /(?:募集|受付)(?:は|を)?(?:終了しました|終了いたしました|締め切りました)/.test(body) };
}
