// vite.config.js - proxy de desenvolvimento para a API local
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5204',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
