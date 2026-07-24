import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

declare const process: { env: Record<string, string | undefined> }

export default defineConfig(() => {
  const backendUrl = process.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:3007'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': backendUrl
      }
    }
  }
})
