import { parse } from 'parse5';
import { jobUrl } from '../src/utils/jobs.js';

// Public, licence-reviewed list endpoints only. No contacts, descriptions or attachments.
const clean = (value, max = 250) => typeof value === 'string'
  ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';
const children = node => node?.childNodes || [];
const attr = (node, name) => node?.attrs?.find(a => a.name === name)?.value || '';
const hasClass = (node, name) => attr(node, 'class').split(/\s+/).includes(name);
const text = node => node?.nodeName === '#text' ? node.value : ['script','style'].includes(node?.tagName) ? '' : children(node).map(text).join('');
const find = (node, predicate) => {
  const pending = [node], found = [];
  while (pending.length) { const n = pending.pop(); if (predicate(n)) found.push(n); pending.push(...children(n).slice().reverse()); }
  return found;
};

export function parseQueensland(html) {
  if (typeof html !== 'string' || html.length > 2 * 1024 * 1024) throw Error('invalid_data');
  const doc = parse(html), lists = find(doc, n => n.tagName === 'ol' && hasClass(n, 'search-results') && hasClass(n, 'jobs'));
  if (lists.length !== 1) throw Error('invalid_data');
  const rows = children(lists[0]).filter(n => n.tagName === 'li');
  if (rows.length > 100) throw Error('invalid_data');
  return rows.flatMap(row => {
    const titleNode = find(row, n => hasClass(n, 'result-title'))[0];
    const title = clean(text(find(titleNode, n => n.tagName === 'strong')[0]));
    // Exclude clinical/patient/child safety; retain occupational safety roles.
    if (!/occupational|workplace|work health|\bWHS\b|\bOHS\b|industrial hygien|electrical safety|health,? safety|safety (?:advisor|adviser|engineer|officer|assurance)|contract(?:or)? safety/i.test(title)
      || /child safety|patient safety|clinical|nurse/i.test(title)) return [];
    const link = find(row, n => n.tagName === 'a' && find(n, v => v === titleNode).length)[0];
    let candidate; try { candidate = new URL(attr(link, 'href'), 'https://smartjobs.qld.gov.au/jobtools/'); } catch { throw Error('invalid_data'); }
    const url = jobUrl(candidate.href, ['smartjobs.qld.gov.au']);
    const id = candidate.pathname.match(/^\/jobs\/(QLD-[A-Za-z0-9-]+)$/)?.[1]
      || (candidate.pathname === '/jobtools/jncustomsearch.viewFullSingle' && candidate.searchParams.get('in_jnCounter'));
    const date = find(row, n => n.tagName === 'time' && hasClass(n, 'date-closes'))[0], raw = attr(date, 'datetime');
    if (!url || !id || !/^[A-Za-z0-9-]+$/.test(id) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+10:00$/.test(raw) || !Number.isFinite(Date.parse(raw))
      || new Date(Date.parse(raw)+10*3600000).toISOString().slice(0,19)!==raw.slice(0,19)) throw Error('invalid_data');
    return [{ external_id: id, locale: 'en-AU', title, url,
      employer: clean(text(titleNode).slice(text(find(titleNode, n => n.tagName === 'strong')[0]).length).replace(/^\s*,\s*/, '')),
      location: clean(find(row, n => hasClass(n, 'locality')).map(text).join(', ')),
      deadline_text: raw.slice(0,10) + ' · ' + raw.slice(11,19) + ' AEST', closes_at: new Date(raw).toISOString() }];
  });
}

export function madridDeadline(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw Error('invalid_data');
  const day = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(+day) || day.toISOString().slice(0,10) !== value) throw Error('invalid_data');
  const target = +day + 86400000, format = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Madrid', year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23' });
  let guess = target;
  for (let i=0;i<3;i++) { const p=Object.fromEntries(format.formatToParts(new Date(guess)).map(v=>[v.type,v.value])); guess=target-(Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-guess); }
  return new Date(guess).toISOString();
}

export function parseCastillaLeon(data, now = new Date()) {
  if (!Number.isInteger(data?.total_count) || data.total_count < 0 || !Array.isArray(data.results) || data.results.length > 100) throw Error('invalid_data');
  return data.results.flatMap(row => {
    const title = clean(row.titulo), id = clean(row.identificador,160);
    if (!/prevenci[oó]n.*riesgos|seguridad.*(?:trabajo|laboral)|higiene.*industrial|salud.*laboral/i.test(title)) return [];
    const url = jobUrl(row.enlace_al_contenido, ['empleopublico.jcyl.es','datosabiertos.jcyl.es']);
    if (!url || !/^\d+$/.test(id) || !row.fecha_de_inicio || !row.fecha_de_finalizacion) throw Error('invalid_data');
    const closes = madridDeadline(row.fecha_de_finalizacion);
    // Do not present announcements before applications open. Preserve original date-only precision.
    madridDeadline(row.fecha_de_inicio); // validate the original calendar date
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
    if (row.fecha_de_inicio > `${parts.year}-${parts.month}-${parts.day}`) return [];
    return [{ external_id:id,locale:'es-ES',title,url,employer:clean(row.organismo_gestor),location:clean(row.municipio) || 'Castilla y León',deadline_text:row.fecha_de_finalizacion,closes_at:closes }];
  });
}

export function parseTrudvsem(data) {
  if (String(data?.status) !== '200' || !Array.isArray(data?.results?.vacancies) || data.results.vacancies.length > 100 || !Number.isFinite(Number(data.meta?.total))) throw Error('invalid_data');
  return data.results.vacancies.flatMap(({vacancy:row}) => {
    const title=clean(row?.['job-name']), id=clean(row?.id,160);
    if (!/охран[а-яё\s-]*труд|промышленн[а-яё\s-]*безопасност/iu.test(title)) return [];
    const url=jobUrl(row.vac_url,['trudvsem.ru']);
    if (!url || !/^[a-z0-9-]+$/i.test(id) || !new URL(url).pathname.startsWith('/vacancy/card/')) throw Error('invalid_data');
    // No application closing timestamp is supplied. hireDate is NOT a deadline.
    return [{external_id:id,locale:'ru-RU',title,url,employer:clean(row.company?.name),location:clean(row.region?.name),deadline_text:'',closes_at:null}];
  });
}
