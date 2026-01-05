import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Auto-bind to 0.0.0.0
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true // Proxy websockets
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true
      }
    }
  }
})
