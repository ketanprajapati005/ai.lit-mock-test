import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes the build work from any sub-path (GitHub Pages, Netlify, etc.).
export default defineConfig({
  base: './',
  plugins: [react()],
})
