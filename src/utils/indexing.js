// These informational pages share their Canadian copy across English provinces.
// Keep the regional UI while consolidating the identical public content.
export function staticCanonicalLocale(locale, page) {
  return ['en-CA-AB', 'en-CA-ON', 'en-CA-BC'].includes(locale)
    && ['about', 'terms', 'privacy', 'protectiveequipment'].includes(page)
    ? 'en-CA' : locale;
}

// Romanian hazard/measure translations are not populated yet. Keep the empty
// dictionary available as a live, noindex page until that separate dataset ships.
export function isIndexableStaticPage(locale, page) {
  return !(locale === 'ro-RO' && page === 'dictionary');
}
