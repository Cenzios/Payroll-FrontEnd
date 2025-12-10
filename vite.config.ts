import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env variables based on mode (development / production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    server: {
      port: Number(env.VITE_DEV_PORT) || 5090,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET,
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
  };
});
