import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site served at /ai-intel-pipeline/
export default defineConfig({
  base: '/ai-intel-pipeline/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})

