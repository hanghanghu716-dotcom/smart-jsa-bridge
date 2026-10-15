import { createClient } from '@supabase/supabase-js';

// Injected by this test's Vite server only, never by the application build.
const config = __JSA_AUTH_TEST_CONFIG__;
if (config.url !== 'http://127.0.0.1:54321') throw new Error('LOCAL_AUTH_FIXTURE_ONLY');
export const supabase = createClient(config.url, config.anonKey, {
  auth: { storageKey: 'jsa-auth-integration', detectSessionInUrl: false },
});
