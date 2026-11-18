import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/ReactLoom/' : '/',
  plugins: [react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 4319, strictPort: true },
  preview: { host: '127.0.0.1', port: 4319, strictPort: true },
  build: { manifest: true, sourcemap: mode !== 'pages' },
}))
