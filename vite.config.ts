import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api/stations': {
        target: 'https://radio-locator.com',
        changeOrigin: true,
        rewrite: (path) => {
          const params = new URL(path, 'http://localhost').searchParams
          return `/cgi-bin/pat?pat=${params.get('zip') ?? ''}&nse=1&format=json`
        },
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          })
        },
      },
    },
  },
})
