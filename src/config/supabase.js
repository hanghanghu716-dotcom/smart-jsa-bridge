// Public application identity only. Authorization is enforced by Supabase RLS.
export const DEFAULT_PUBLIC_SUPABASE = Object.freeze({
  url: 'https://aajvezmhyrdawxxbulqz.supabase.co',
  key: 'sb_publishable_cufRFMwEfGJxlH_UH5Yxog_PSlzSdPh',
});

export function resolvePublicSupabaseConfig(env = {}) {
  const urlValue = String(env.VITE_SUPABASE_URL ?? '').trim();
  const keyValue = String(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  if (Boolean(urlValue) !== Boolean(keyValue)) {
    throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY together.');
  }
  const configured = Boolean(urlValue);
  const key = configured ? keyValue : DEFAULT_PUBLIC_SUPABASE.key;
  let url;
  try { url = new URL(configured ? urlValue : DEFAULT_PUBLIC_SUPABASE.url); }
  catch { throw new Error('VITE_SUPABASE_URL must be a valid Supabase origin.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('VITE_SUPABASE_URL must be an HTTPS origin (HTTP is allowed for localhost).');
  }
  // Legacy anon JWTs remain supported, but privileged credentials must never
  // reach a browser bundle or an anonymous public-content endpoint.
  let anonymousJwt = false;
  if (key.split('.').length === 3) {
    try {
      const payload = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
      anonymousJwt = claims.role === 'anon';
      if (claims.ref && url.hostname.endsWith('.supabase.co') && url.hostname !== `${claims.ref}.supabase.co`) {
        throw new Error('PROJECT_MISMATCH');
      }
    } catch { anonymousJwt = false; }
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && !anonymousJwt) {
    throw new Error('Use a Supabase publishable or anon key; secret and service-role keys are forbidden here.');
  }
  return Object.freeze({ url: url.origin, key, configured, production: url.origin === DEFAULT_PUBLIC_SUPABASE.url });
}
