import { createJsaThumbnailHandler } from '../api/jsa-thumbnail.js';
import { resolvePublicSupabaseConfig } from '../src/config/supabase.js';

export function jsaThumbnailDev() {
  return { name: 'local-jsa-thumbnail', apply: 'serve', configureServer(server) {
    const handler = createJsaThumbnailHandler({ config: resolvePublicSupabaseConfig(server.config.env) });
    server.middlewares.use((req, res, next) => {
      if (new URL(req.url, 'http://localhost').pathname !== '/api/jsa-thumbnail') return next();
      return handler(req, res);
    });
  } };
}
