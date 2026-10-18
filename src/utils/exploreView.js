export const EXPLORE_VIEWS = Object.freeze({ large: 12, small: 24, details: 48 });
export const exploreView = value => Object.hasOwn(EXPLORE_VIEWS, value) ? value : 'large';
export const explorePageSize = value => EXPLORE_VIEWS[exploreView(value)];

// Keep the first visible result within the new page when changing density.
export function changeExploreView(query, view) {
  return { ...query, view: exploreView(view), page: Math.floor(query.page * explorePageSize(query.view) / explorePageSize(view)) };
}
