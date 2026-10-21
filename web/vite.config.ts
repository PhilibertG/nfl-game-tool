import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // relative paths so the build also works from a sub-folder (GitHub Pages)
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  // single page app: charts (recharts) make the bundle ~900 kB, acceptable here
  build: { chunkSizeWarningLimit: 1000 },
})
