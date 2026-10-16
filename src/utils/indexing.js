// These informational pages share their Canadian copy across English provinces.
// Keep the regional UI while consolidating the identical public content.
export function staticCanonicalLocale(locale, page) {
  return ['en-CA-AB', 'en-CA-ON', 'en-CA-BC'].includes(locale)
    && ['about', 'terms', 'privacy', 'protectiveequipment'].includes(page)
    ? 'en-CA' : locale;
}

// The Romanian dictionary now contains contextual groups from 199 published cases.
export function isIndexableStaticPage() {
  return true;
}
