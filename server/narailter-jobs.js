import { XMLParser, XMLValidator } from 'fast-xml-parser';

// Official list schema: data.go.kr/data/15156780/openapi.do (reviewed 2026-11-03).
// Do not import contents, attachments, contact data, or unverified region-code labels.
export function narailterWindow(now = new Date()) {
  const end = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const begin = new Date(Date.parse(end + 'T00:00:00Z') - 30 * 86400000).toISOString().slice(0, 10);
  return { begin, end };
}

export function parseNarailterPage(xml, request = {}) {
  if (typeof xml !== 'string' || xml.length > 2 * 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw Error('invalid_data');
  const root = new XMLParser({ parseTagValue: false, trimValues: true }).parse(xml).response;
  if (!root || root.header?.resultCode !== '00' || !/^\d+$/.test(String(root.body?.totalCount))) throw Error('source_error');
  const rows = root.body?.items?.item;
  const total = Number(root.body.totalCount);
  const all = Array.isArray(rows) ? rows : rows ? [rows] : [];
  if (!Number.isSafeInteger(total) || total > 5000 || all.length > 1000) throw Error('invalid_data');
  if (request.page && (Number(root.body.pageNo) !== request.page || Number(root.body.numOfRows) !== 1000 || all.length !== Math.min(1000, Math.max(0, total - (request.page - 1) * 1000)))) throw Error('invalid_data');
  if (Number(root.body.totalCount) > 0 && !rows) throw Error('invalid_data');
  const plain = (value, max) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim().slice(0, max) : '';
  const items = all.flatMap(row => {
    // The live API ignores Kwrd/Sort_order. Fail closed if its verified date filter also stops working.
    if (request.begin && (!/^\d{8}$/.test(row.regdate || '') || row.regdate < request.begin.replaceAll('-', '') || row.regdate > request.end.replaceAll('-', ''))) throw Error('invalid_data');
    const id = plain(row.idx, 160), title = plain(row.title, 250), date = plain(row.enddate, 160);
    const employer = plain(row.insttname, 250);
    // An agency's name alone (e.g. food-safety certification body) is not a safety occupation.
    const shortEmployer = employer.replace(/^(재단법인|사단법인|한국산업|한국)\s*/, '');
    let occupationTitle = employer ? title.replaceAll(employer, '') : title;
    if (shortEmployer) occupationTitle = occupationTitle.replaceAll(shortEmployer, '');
    if (!/^[1-9]\d{0,15}$/.test(id) || !/안전관리|산업안전|산업위생|보건관리|산업보건|안전보건|건설안전/.test(occupationTitle)) return [];
    // Announcements of results/test locations are not new job openings.
    if (/합격자|합격\s*발표|결과\s*공고|시험\s*장소|채용\s*취소/.test(title)) return [];
    if (!/^\d{8}$/.test(date)) return []; // No invented deadline or open status.
    const y = +date.slice(0, 4), m = +date.slice(4, 6), d = +date.slice(6, 8);
    const day = new Date(Date.UTC(y, m - 1, d));
    if (y < 2000 || day.getUTCFullYear() !== y || day.getUTCMonth() !== m - 1 || day.getUTCDate() !== d) throw Error('invalid_data');
    return [{ external_id: id, locale: 'ko', title, employer, location: '',
      url: 'https://www.gojobs.go.kr/apmView.do?' + new URLSearchParams({ menuNo: '401', empmnsn: id, flag: 'U' }),
      deadline_text: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
      closes_at: new Date(day.getTime() + 15 * 3600000).toISOString() }];
  });
  return { total, items };
}

export const parseNarailter = xml => parseNarailterPage(xml).items;
