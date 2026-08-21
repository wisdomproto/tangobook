/* global process */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        /**
         * 🔴 **엔트리에 든 것 = 첫 화면이 쓰는 것, 이 아니다**(2026-08-21 실측).
         *
         * 라우터는 첫 화면에 필요한 것만 정적 import 하고 나머지를 전부 `lazy` 로 두는데도 엔트리가
         * **1,200KB**(회선 374KB)였다. 소스맵으로 뜯어 보니 `features/games` 66개 모듈과
         * framer-motion 62개 모듈이 들어 있었다 — 소개 페이지가 절대 안 쓰는 것들이다.
         *
         * 원인은 정적 import 가 아니다(그래프를 따라가면 닿지 않는다). rollup 은 **여러 lazy 청크가
         * 공유하는 모듈을 공통 조상으로 끌어올리는데** 그 조상이 엔트리다. 게임 코드는 게임 페이지·
         * 책 상세·파닉스가 다 같이 써서 셋의 공통 조상인 엔트리로 올라갔다. 빌드가 매번 찍던
         * `manualChunks` 경고가 정확히 이 얘기였다.
         *
         * 🔴 **게임은 통째로 한 청크**여야 한다 — 레지스트리가 `*.register.ts` 의 **side-effect** 로
         *    채워지므로 쪼개면 등록 전에 조회가 일어날 수 있다.
         * 🔴 supabase 는 여기서 안 가른다 — `AuthProvider` 가 첫 렌더에 필요해 어차피 온다.
         *    가르려면 auth 만 남기고 realtime/storage 를 떼야 하는데 `createClient` 가 한 덩어리다.
         */
        manualChunks(id) {
          if (id.includes('/src/features/games/')) return 'games';
          if (id.includes('framer-motion') || id.includes('motion-dom')) return 'motion';
        },
      },
    },
  },
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
