import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5175',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:5175',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
})
