import { readPublic, escapeHtml as e } from './public-content.js';
import { PUBLIC_JSA_FIELDS, publicSortColumn } from '../src/utils/publicJsa.js';
import { localeCountry, countryLabel } from '../src/utils/publicCountry.js';
import { readPublicCatalogPage } from '../src/utils/publicCatalogPage.js';
import { homePublicCards } from '../src/utils/homePublicCatalog.js';
import { communityHomeUi } from '../src/locales/communityHomeUi.js';
import { getPublicUi } from '../src/locales/publicUi.js';
import { getOperatorUi } from '../src/locales/operatorUi.js';
import { getLanguageTag } from '../src/locales/config.js';
import { exploreSearch } from '../src/utils/discovery.js';

export async function readHomePublic(locale, fetcher = fetch) {
  const country = localeCountry(locale);
  const filters = { is_public: 'eq.true', ...(country ? { public_country: 'eq.' + country } : {}) };
  const signal = AbortSignal.timeout(12000);
  const { rows } = await readPublicCatalogPage({ page: 0, pageSize: 12,
    readPage: async () => { const data = await readPublic('public_jsa_catalog', {
      ...filters, select: 'id', order: publicSortColumn('latest') + '.desc,id.asc', limit: '12',
    }, fetcher, { signal }); return { data, count: data.length }; },
    readBatch: async ids => ({ data: await readPublic('public_jsa_catalog', {
      ...filters, select: PUBLIC_JSA_FIELDS, id: 'in.(' + ids.join(',') + ')',
    }, fetcher, { signal }) }),
  });
  return { locale, cards: homePublicCards(rows, locale) };
}

export function renderHomePublic({ cards }, locale) {
  const ui = communityHomeUi(locale), p = getPublicUi(locale);
  return `<div class="home-public-grid">${cards.map(card => {
    const href = `/${e(locale)}/public-jsa/${e(card.id)}`;
    return `<article class="home-resource-card"><div class="home-card-meta"><span class="home-source${card.operator ? ' home-source--operator' : ''}">${e(card.operator ? getOperatorUi(locale).badge : ui.member)}</span><span>${e(countryLabel(card.country, locale))} · ${e(p.steps)} ${card.steps}${card.variant ? ' · ' + e(getOperatorUi(locale)[card.variant]) : ''}</span></div><h3 lang="${e(getLanguageTag(card.locale))}" dir="auto"><a href="${href}">${e(card.title)}</a></h3><p class="home-card-excerpt" lang="${e(getLanguageTag(card.locale))}" dir="auto">${e(card.excerpt)}</p><div class="home-card-tags">${card.tags.map(({ tag, label }) => `<a href="/${e(locale)}/explore${e(exploreSearch({ tags: [tag], country: card.country }))}">#${e(label)}</a>`).join('')}</div><div class="home-card-bottom"><time datetime="${e(card.date || '')}">${e(card.date?.slice(0, 10))}</time><a href="${href}">${e(ui.read)} ↗</a></div></article>`;
  }).join('')}</div>${!cards.length ? `<p>${e(p.empty)}</p>` : ''}`;
}
