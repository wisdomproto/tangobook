import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tangobook/shared': resolve(__dirname, '../shared/src/index.ts'),
      '@tangobook/remotion': resolve(__dirname, '../remotion/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    // COOP/COEP 헤더 제거 — credentialless가 cross-origin iframe(YouTube 등)을 차단해
    // "연결 거부" 오류를 유발. SharedArrayBuffer 사용처(ffmpeg.wasm 등) 없음.
    proxy: {
      '/api': {
        target: 'http://localhost:3500',
        changeOrigin: true,
        timeout: 300000,
        proxyTimeout: 300000,
      },
    },
  },
});
