// Public URL aliases only. Stored group IDs and article bodies remain unchanged.
const aliases = {
  ' jsa-form-work': 'jsa-form-work',
  ' jsa-leak-testing': 'jsa-leak-testing',
  'jsa- roof-truss': 'jsa-roof-truss',
};
export const canonicalCaseSlug = slug => Object.hasOwn(aliases, slug) ? aliases[slug] : slug;
export function caseLookupSlugs(slug) {
  const canonical = canonicalCaseSlug(slug);
  return [canonical, ...Object.keys(aliases).filter(key => aliases[key] === canonical)];
}
export const casePath = (locale, slug) => `/${locale}/case-study/${encodeURIComponent(canonicalCaseSlug(slug))}`;
export function canonicalCaseLink(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return path;
  return path.replace(/^(\/(?:[^/]+\/)?case-study\/)([^/?#]+)/, (match, prefix, slug) => {
    try { return prefix + encodeURIComponent(canonicalCaseSlug(decodeURIComponent(slug))); }
    catch { return match; }
  });
}
