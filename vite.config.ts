import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
      '/file': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
      '/private': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
      '/_matrix': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true,
      },
    },
  },
})
