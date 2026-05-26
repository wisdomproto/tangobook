#!/usr/bin/env node
/**
 * 정적 라우트 prerender — vite build 후 puppeteer 로 라우트별 HTML snapshot 생성.
 *
 * SPA 의 SEO 약점 (검색엔진/소셜 크롤러가 JS 실행 안 하는 경우) 해소.
 * Vite build 결과물 dist 안에 라우트별 index.html 생성:
 *   dist/index.html                          (원본 SPA)
 *   dist/library/index.html                  (prerender)
 *   dist/library/phonics/korean/index.html   (prerender)
 *   dist/vocabulary/index.html               (prerender)
 *
 * Cloudflare Pages / Vercel / Netlify 등 정적 호스팅이 해당 라우트로 정적 HTML 우선 서빙.
 *
 * 사용:
 *   pnpm --filter client prerender          # 빌드 후 단독 실행
 *   pnpm --filter client build:prerender    # build + prerender 한 번에
 */
import puppeteer from 'puppeteer';
import { preview } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');
const distDir = path.join(clientRoot, 'dist');

const STATIC_ROUTES = [
  '/',
  '/library',
  '/library/phonics/korean',
  '/vocabulary',
];

const PREVIEW_PORT = 4173;

async function ensureDist() {
  try {
    await fs.access(path.join(distDir, 'index.html'));
  } catch {
    console.error('[prerender] dist/index.html 없음 — 먼저 `pnpm --filter client build` 실행.');
    process.exit(1);
  }
}

async function prerenderRoute(browser, baseUrl, route) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 일부 페이지는 R2 / API 호출이 있는데 prerender 시 backend 없을 수 있음.
  // SEO 메타는 페이지 진입 즉시 useSeo 가 동기로 set 하므로 networkidle 까지 안 가도 됨.
  // 대신 timeout 짧게 + DOM ready 만 기다림.
  await page.goto(`${baseUrl}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  // useSeo / useEffect 실행 대기 (React 18 마이크로태스크 큐 flush + 한 프레임)
  await new Promise((r) => setTimeout(r, 1500));

  // HTML 가져오기
  const html = await page.content();
  await page.close();

  // 라우트 → dist 경로
  const routePath = route === '/' ? '' : route.replace(/^\//, '');
  const outDir = route === '/' ? distDir : path.join(distDir, routePath);
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, 'index.html');

  // 루트 (/) 는 dist/index.html 을 덮어쓰지 않음 — SPA fallback 으로 보존
  if (route === '/') {
    const homeOut = path.join(distDir, 'home', 'index.html');
    await fs.mkdir(path.dirname(homeOut), { recursive: true });
    await fs.writeFile(homeOut, html, 'utf-8');
    console.log(`✓ ${route.padEnd(36)} → home/index.html (SPA fallback 보존)`);
    return;
  }

  await fs.writeFile(outFile, html, 'utf-8');
  console.log(`✓ ${route.padEnd(36)} → ${path.relative(distDir, outFile)}`);
}

async function main() {
  console.log('[prerender] dist 확인...');
  await ensureDist();

  console.log('[prerender] vite preview 띄우는 중...');
  const server = await preview({
    root: clientRoot,
    preview: { port: PREVIEW_PORT, host: 'localhost', strictPort: true },
  });
  const baseUrl = `http://localhost:${PREVIEW_PORT}`;
  console.log(`[prerender] preview ready: ${baseUrl}`);

  let browser;
  try {
    console.log('[prerender] puppeteer launch...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const route of STATIC_ROUTES) {
      try {
        await prerenderRoute(browser, baseUrl, route);
      } catch (e) {
        console.warn(`✗ ${route} — ${e.message}`);
      }
    }

    console.log('[prerender] 완료.');
  } finally {
    if (browser) await browser.close();
    // vite preview server close
    await new Promise((resolve) => {
      server.httpServer.close(() => resolve());
    });
  }
}

main().catch((e) => {
  console.error('[prerender] FATAL:', e);
  process.exit(1);
});
