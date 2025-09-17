import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
dotenv.config(); // Load .env variables

const API_BASE = process.env.VITE_API_BASE || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: `${API_BASE}`,
        changeOrigin: true,
        secure: false,
      },
      '/books': {
        target:`${API_BASE}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
