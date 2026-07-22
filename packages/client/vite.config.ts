/* global process */
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
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5174,
    // COOP/COEP 헤더 제거 — credentialless가 cross-origin iframe(YouTube 등)을 차단해
    // "연결 거부" 오류를 유발. SharedArrayBuffer 사용처(ffmpeg.wasm 등) 없음.
    proxy: {
      '/api': {
        // 기본은 로컬 서버. R2 자격증명 없는 워크트리에서 실제 데이터로 UI 확인할 땐
        // API_TARGET=https://www.tangobook.co.kr 로 띄운다 (읽기 전용 확인용).
        target: process.env.API_TARGET || 'http://localhost:3500',
        changeOrigin: true,
        timeout: 300000,
        proxyTimeout: 300000,
      },
    },
  },
});
