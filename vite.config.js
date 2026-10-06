import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { guideDevPdf } from './scripts/guide-dev-pdf.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), guideDevPdf()],
  build: {
    rollupOptions: { input: { main: 'index.html', analytics: 'analytics-frame.html' } },
    target: 'es2015'
  }
})
