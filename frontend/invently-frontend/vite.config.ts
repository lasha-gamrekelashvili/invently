import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow external connections for subdomain testing
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward the original Host header to preserve subdomain
            if (req.headers.host) {
              proxyReq.setHeader('Host', req.headers.host);
            }
          });
        }
      }
    }
  }
})