import { readPublic, escapeHtml as e } from './public-content.js';
import { localeCountry, countryLabel } from '../src/utils/publicCountry.js';
import { readHomeSummary, homeAfterFilter } from '../src/utils/homeSummary.js';
import { archiveUi } from '../src/locales/archiveUi.js';
import { communityHomeUi } from '../src/locales/communityHomeUi.js';
import { getPublicUi } from '../src/locales/publicUi.js';
import { getOperatorUi } from '../src/locales/operatorUi.js';
import { getLanguageTag } from '../src/locales/config.js';
import { exploreSearch } from '../src/utils/discovery.js';

export async function readHomePublic(locale, fetcher = fetch) {
  const country = localeCountry(locale), signal = AbortSignal.timeout(12000);
  return readHomeSummary(locale, ({ table, fields, offset, after, limit }) => readPublic(table, {
    is_public: 'eq.true', ...(country ? { public_country: 'eq.' + country } : {}),
    select: fields, order: 'published_at.desc.nullslast,id.asc', limit: String(limit),
    ...(homeAfterFilter(after) ? { or: '(' + homeAfterFilter(after) + ')' } : { offset: String(offset) }),
  }, fetcher, { signal }), signal);
}

export function renderHomePublic({ cards }, locale) {
  const ui = communityHomeUi(locale), p = getPublicUi(locale);
  return `<div class="home-public-grid">${cards.map(card => {
    const href = `/${e(locale)}/public-jsa/${e(card.id)}`;
    return `<article class="home-resource-card"><a class="home-document-link" href="${href}" tabindex="-1" aria-hidden="true"><div class="home-risk-thumbnail">${card.thumbnail ? `<div class="risk-pdf-thumbnail"><img src="${e(card.thumbnail.src)}" width="${e(card.thumbnail.width)}" height="${e(card.thumbnail.height)}" alt="" loading="lazy" decoding="async"><span class="document-preview-badge">${e(archiveUi(locale).riskPdfPreview)}</span></div>` : ''}</div></a><div class="home-card-body"><div class="home-card-meta"><span class="home-source${card.operator ? ' home-source--operator' : ''}">${e(card.operator ? getOperatorUi(locale).badge : ui.member)}</span><span>${e(countryLabel(card.country, locale))}${card.steps !== null ? ' · ' + e(p.steps) + ' ' + card.steps : ''}${card.variant ? ' · ' + e(getOperatorUi(locale)[card.variant]) : ''}</span></div><h3 lang="${e(getLanguageTag(card.locale))}" dir="auto"><a href="${href}">${e(card.title)}</a></h3><p class="home-card-excerpt" lang="${e(getLanguageTag(card.locale))}" dir="auto">${e(card.excerpt)}</p><div class="home-card-tags">${card.tags.map(({ tag, label }) => `<a href="/${e(locale)}/explore${e(exploreSearch({ tags: [tag], country: card.country }))}">#${e(label)}</a>`).join('')}</div><div class="home-card-bottom"><time datetime="${e(card.date || '')}">${e(card.date?.slice(0, 10))}</time><a href="${href}">${e(ui.read)} ↗</a></div></div></article>`;
  }).join('')}</div>${!cards.length ? `<p>${e(p.empty)}</p>` : ''}`;
}
