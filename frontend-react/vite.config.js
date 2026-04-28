import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    // Dev proxy only — production requires nginx or Flask to forward these paths to port 8000
    port: 5173,
    proxy: {
      '/upload':     'http://localhost:8000',
      '/tasks':      'http://localhost:8000',
      '/stream':     'http://localhost:8000',
      '/reset':      'http://localhost:8000',
      '/ws':         { target: 'ws://localhost:8000', ws: true },
      '/camera':     'http://localhost:8000',
      '/multi-cctv': 'http://localhost:8000',
      '/download':   'http://localhost:8000',
      '/session':    'http://localhost:8000',
    }
  }
})
