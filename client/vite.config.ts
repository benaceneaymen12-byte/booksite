import fs from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const certKey = 'certs/localhost-key.pem'
const certFile = 'certs/localhost-cert.pem'
const hasLocalCertificates = fs.existsSync(certKey) && fs.existsSync(certFile)

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/booksite/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    ...(hasLocalCertificates
      ? {
          https: {
            key: fs.readFileSync(certKey),
            cert: fs.readFileSync(certFile),
          },
        }
      : {}),
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
