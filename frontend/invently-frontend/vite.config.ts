import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:3001'
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: '0.0.0.0', // Allow external connections for subdomain testing
      proxy: {
        '/api': {
          target: apiUrl,
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
  }
})