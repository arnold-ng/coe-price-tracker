import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Relative base so the build works under a GitHub Pages project subpath
// (https://<user>.github.io/coe-price-tracker/) as well as at a domain root.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
