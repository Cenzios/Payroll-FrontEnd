import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5090,
    proxy: {
      '/api': {
        target: 'https://payroll.dev.server.cenzios.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
