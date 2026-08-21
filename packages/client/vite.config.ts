/* global process */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  /**
   * 🔴 **`manualChunks` 를 쓰지 않는다 — 한 번 넣었다 되돌렸다**(2026-08-21).
   *
   * 엔트리가 1,200KB(회선 372KB)라 `features/games` 와 framer-motion 을 각자 청크로 뺐다.
   * 엔트리는 39KB 로 줄었는데 **첫 화면 전송량은 412 → 427KB 로 늘었다** — 갈라낸 청크가
   * `modulepreload` 로 따라붙었기 때문이다.
   *
   * 🔴 원인: `manualChunks(id)` 로 모듈을 특정 청크에 밀어 넣으면, **그 모듈이 쓰는 공용
   *    의존까지 같은 청크로 끌려간다.** 실제로 React JSX 런타임이 games 청크에 들어갔고
   *    (`import{j as e}from"./games-*.js"`), 그래서 엔트리가 games 청크를 **정적으로 의존**하게
   *    됐다. 빼려던 322KB 가 preload 로 되돌아온 것이다.
   *
   * 🔴 제대로 하려면 **벤더를 먼저 명시**해야 한다(react/react-dom/router/supabase 를 각자
   *    청크로 고정한 **뒤에** 기능 청크를 가른다). 순서를 안 정하면 먼저 걸린 청크가 공용 코드를
   *    가져가고 나머지가 그 청크에 매달린다. 다음에 손댈 땐 이 순서부터 잡을 것.
   *
   * 🔴 **엔트리 크기만 보고 판단하지 말 것** — 판정은 `dist/index.html` 이 부르는
   *    script + modulepreload + stylesheet 를 **전부 gzip 해 더한 값**이다.
   */
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
