import { createHash } from 'node:crypto';

export const COUNTRIES = ['KR','US','CA','GB','AU','JP','DE','FR','IT','ES','SG','SA','BR','RO','RU'];
export const LOW_RISK = new Set(['clipboard','document-holder','tool-storage']);
const array = value => Array.isArray(value) ? value : [];
const text = value => typeof value === 'string' ? value : '';
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export const fingerprint = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export function purchaseCountry(locale, explicit) {
  if (explicit !== undefined) return COUNTRIES.includes(explicit) ? explicit : null;
  if (locale === 'ko') return 'KR';
  const country = text(locale).split('-')[1];
  return COUNTRIES.includes(country) ? country : null;
}
export function contentSnapshot(kind, row) {
  if (!row || row.restricted || (kind === 'ugc' && row.is_public !== true)) return null;
  if (kind === 'case') return { kind, id: row.id, locale: row.language_code, title: text(row.title), body: text(row.content_md) };
  if (kind !== 'ugc') return null;
  return { kind, id: row.id, locale: row.public_locale, title: text(row.title),
    scope: text(row.publication_context?.scope), ppe: array(row.form_data?.ppe).filter(x => typeof x === 'string'),
    steps: array(row.analysis_data).filter(Boolean).slice(0,300).map(step => ({ title: text(step.proc?.stepTitle), detail: text(step.proc?.stepDetail),
      controls: array(step.risks).filter(Boolean).slice(0,100).map(r => [text(r.current_measure || r.measure), text(r.recommend_measure)]),
      additional: text(step.actionPlan?.additionalControls) })) };
}
// Conservative bootstrapping only: safety equipment never gets selected by keyword.
// A reviewed profile can express other categories and exact required attributes.
const TERMS = {
  clipboard: ['clipboard','클립보드','서류 받침','クリップボード','Klemmbrett','porte-bloc','portablocco','portapapeles','prancheta','планшет для бумаг','clipboard de scris','لوح كتابة'],
  'document-holder': ['document holder','document pouch','서류 보관함','서류 파우치','書類ケース','Dokumentenhalter','porte-documents','portadocumenti','portadocumentos','porta-documentos','держатель документов','suport documente','حافظة مستندات'],
  'tool-storage': ['toolbox','tool box','tool organizer','공구함','공구 정리함','工具箱','Werkzeugkasten','boîte à outils','cassetta degli attrezzi','caja de herramientas','caixa de ferramentas','ящик для инструментов','cutie de scule','صندوق أدوات'],
};
export function extractNeeds(snapshot) {
  const body = JSON.stringify(snapshot).toLowerCase();
  return Object.entries(TERMS).filter(([, words]) => words.some(word => body.includes(word.toLowerCase())))
    .map(([category]) => ({ category, constraints: {}, origin: 'explicit-term' }));
}
export function approvedProfile(snapshot, profiles, now) {
  const hash = fingerprint(snapshot);
  return array(profiles).find(p => p && p.sourceFingerprint === hash && p.status === 'approved' && text(p.reviewer)
    && validDate(p.reviewedAt, now) && future(p.validUntil, now));
}
const validDate = (value, now) => Number.isFinite(Date.parse(value)) && Date.parse(value) <= now;
const future = (value, now) => Number.isFinite(Date.parse(value)) && Date.parse(value) > now;
export function safeLink(value, hosts) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.port
    && array(hosts).includes(url.hostname) ? url.href : null; } catch { return null; }
}
export function offerFingerprint(offer) {
  return fingerprint({ id: offer.id, merchantId: offer.merchantId, title: offer.title, category: offer.category,
    country: offer.country, affiliateUrl: offer.affiliateUrl, attributes: offer.attributes || {} });
}
export function selectOffers({ snapshot, catalog, country, now = Date.now(), limit = 4 }) {
  if (!snapshot || !COUNTRIES.includes(country) || catalog?.version !== 1) return [];
  const profile = approvedProfile(snapshot, catalog.profiles, now);
  // Explicit suppression takes precedence; edited content invalidates it just like other reviews.
  if (profile?.suppress === true) return [];
  const needs = profile ? array(profile.needs) : extractNeeds(snapshot);
  const merchants = new Map(array(catalog.merchants).filter(Boolean).map(m => [m.id, m]));
  const reviews = new Map(array(catalog.reviews).filter(Boolean).map(r => [r.offerFingerprint, r]));
  const candidates = [];
  for (const offer of array(catalog.offers)) {
    if(!offer || typeof offer !== 'object')continue;
    const merchant = merchants.get(offer.merchantId), review = reviews.get(offerFingerprint(offer));
    if (!merchant || merchant.enabled !== true || merchant.affiliateApproved !== true || merchant.displayApproved !== true
      || !array(merchant.countries).includes(country) || offer.country !== country || offer.availability !== 'in_stock') continue;
    if (!text(offer.id) || !text(offer.title) || offer.title.length > 240 || !validDate(offer.checkedAt, now)
      || !future(offer.expiresAt, now) || !Number.isFinite(merchant.maxAgeHours) || merchant.maxAgeHours <= 0
      || now - Date.parse(offer.checkedAt) > Math.min(merchant.maxAgeHours,24) * 3600000) continue;
    if (!review || review.status !== 'approved' || !text(review.reviewer) || !validDate(review.reviewedAt, now)
      || !future(review.validUntil, now)) continue;
    const href = safeLink(offer.affiliateUrl, merchant.linkHosts);
    if (!href) continue;
    const need = needs.find(n => n && n.category === offer.category && n.constraints && typeof n.constraints === 'object'
      && !Array.isArray(n.constraints) && (LOW_RISK.has(n.category) || (profile && Object.keys(n.constraints).length > 0 && review.safetyReviewed === true))
      && Object.entries(n.constraints).every(([key,value]) => typeof value === 'string' && value.length > 0 && offer.attributes?.[key] === value));
    if (!need) continue;
    // No commissions, user profiling or invented popularity enters the ranking.
    candidates.push({ id: `${merchant.id}:${offer.id}`, title: offer.title, merchant: text(merchant.name) || merchant.id,
      merchantId: merchant.id, category: offer.category, href, country,
      disclosure: text(merchant.disclosures?.[snapshot.locale] || merchant.disclosures?.en),
      score: Object.keys(need.constraints).length, checkedAt: offer.checkedAt });
  }
  candidates.sort((a,b) => b.score-a.score || Date.parse(b.checkedAt)-Date.parse(a.checkedAt) || a.id.localeCompare(b.id));
  const chosen=[], seen=new Set(), counts=new Map();
  for (const item of candidates) {
    if (seen.has(item.id) || seen.has(item.href) || (counts.get(item.merchantId)||0)>=2) continue;
    seen.add(item.id);seen.add(item.href);counts.set(item.merchantId,(counts.get(item.merchantId)||0)+1);
    const {score: _score, checkedAt: _checkedAt, ...publicItem}=item;
    chosen.push(publicItem);
    if(chosen.length>=Math.max(1,Math.min(6,limit)))break;
  }
  return chosen;
}
