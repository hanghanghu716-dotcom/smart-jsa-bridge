// Region comes from a verified deployment/CMP integration, never the UI language.
export function adEligible(config, consent, pathname, now = Date.now(), content = null) {
 return Boolean(config.adsEnabled && config.contactsVerified && config.regionalReviewComplete
  && config.certifiedCmpConfigured && config.approvedRegions?.includes(consent?.region)
  && config.approvedCmpIds?.includes(consent?.cmpId)
  && consent?.ads === true && consent?.verified === true
  && Number.isFinite(consent?.expiresAt) && consent.expiresAt > now
  && /^\/[\w-]+\/public-jsa\/[\da-f-]+$/i.test(pathname)
  && content?.indexable === true && content?.review === 'approved');
}
