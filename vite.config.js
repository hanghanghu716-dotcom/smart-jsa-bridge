import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import { jsaThumbnailDev } from './scripts/jsa-thumbnail-dev.js'
import { guideDevPdf } from './scripts/guide-dev-pdf.js'
import { resolvePublicSupabaseConfig } from './src/config/supabase.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  resolvePublicSupabaseConfig(loadEnv(mode, process.cwd(), 'VITE_'))
  return {
    plugins: [react(), guideDevPdf(), jsaThumbnailDev()],
    build: {
      rollupOptions: { input: { main: 'index.html', analytics: 'analytics-frame.html' } },
      target: 'es2015'
    }
  }
})
