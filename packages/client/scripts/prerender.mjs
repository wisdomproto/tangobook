#!/usr/bin/env node
/**
 * 정적 라우트 + 동화책 about 페이지 prerender — vite build 후 puppeteer 로 HTML snapshot 생성.
 *
 * SPA 의 SEO 약점 (검색엔진/소셜 크롤러가 JS 실행 안 하는 경우, 특히 네이버 Yeti) 해소.
 * Vite build 결과물 dist 안에 라우트별 index.html 생성:
 *   dist/index.html                          (원본 SPA)
 *   dist/library/index.html                  (prerender)
 *   dist/library/phonics/korean/index.html   (prerender)
 *   dist/vocabulary/index.html               (prerender)
 *   dist/library/<id>/about/index.html       (prerender · 공개 동화책 SEO 본문)
 *
 * Cloudflare Pages / Vercel / Netlify 등 정적 호스팅이 해당 라우트로 정적 HTML 우선 서빙.
 *
 * 동화책 about 페이지는 API 데이터(useStorybook)가 필요한데 prerender 시 백엔드가 없으므로,
 * puppeteer 요청 가로채기로 `/api/*` 를 프로덕션 API(PRERENDER_API_ORIGIN)로 프록시한다.
 * → 앱 코드 변경 없이 실제 책 데이터로 본문이 렌더된 HTML 을 굽는다.
 *
 * 라우트 목록은 dist/sitemap.xml 에서 자동 추출 (R2 크레덴셜 불필요).
 *
 * 사용:
 *   pnpm --filter client prerender          # 빌드 후 단독 실행
 *   pnpm --filter client build:prerender    # build + prerender 한 번에
 *
 * 환경변수:
 *   PRERENDER_API_ORIGIN   API 프록시 대상 (기본: https://www.tangobook.co.kr)
 *   PRERENDER_BOOKS        '0' 이면 about 페이지 prerender 건너뜀 (기본: 켜짐)
 *   PRERENDER_BOOK_LIMIT   about 페이지 개수 제한 (테스트용, 기본: 무제한)
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
  '/blog',
];

const PREVIEW_PORT = 4173;
const API_ORIGIN = (process.env.PRERENDER_API_ORIGIN || 'https://www.tangobook.co.kr').replace(/\/$/, '');
const PRERENDER_BOOKS = process.env.PRERENDER_BOOKS !== '0';
const BOOK_LIMIT = process.env.PRERENDER_BOOK_LIMIT ? Number(process.env.PRERENDER_BOOK_LIMIT) : Infinity;

/** API_ORIGIN 이 응답하는지 짧게 확인. about prerender 가능 여부 판단. */
async function probeApi() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`${API_ORIGIN}/api/storybooks`, {
      headers: { accept: 'application/json' },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

async function ensureDist() {
  try {
    await fs.access(path.join(distDir, 'index.html'));
  } catch {
    console.error('[prerender] dist/index.html 없음 — 먼저 `pnpm --filter client build` 실행.');
    process.exit(1);
  }
}

/** dist/sitemap.xml 에서 동화책 about 라우트 목록 추출. */
async function aboutRoutesFromSitemap() {
  try {
    const xml = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf-8');
    const routes = [...xml.matchAll(/<loc>\s*https?:\/\/[^/]+(\/library\/[^<\s]+\/about)\s*<\/loc>/g)].map(
      (m) => m[1]
    );
    return [...new Set(routes)];
  } catch {
    console.warn('[prerender] dist/sitemap.xml 없음 — about 페이지 건너뜀.');
    return [];
  }
}

/** dist/sitemap.xml 에서 공개 블로그 글 라우트(/blog/:slug) 추출. */
async function blogRoutesFromSitemap() {
  try {
    const xml = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf-8');
    const routes = [...xml.matchAll(/<loc>\s*https?:\/\/[^/]+(\/blog\/[^<\s]+)\s*<\/loc>/g)].map(
      (m) => m[1]
    );
    return [...new Set(routes)];
  } catch {
    return [];
  }
}

/**
 * preview 서버로 가는 `/api/*` 요청을 프로덕션 API 로 프록시.
 * about 페이지가 실제 책 데이터로 렌더되도록.
 */
async function installApiProxy(page, baseUrl) {
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
    const apiIdx = url.indexOf('/api/');
    if (apiIdx !== -1 && url.startsWith(baseUrl)) {
      const target = API_ORIGIN + url.slice(apiIdx);
      try {
        const r = await fetch(target, { headers: { accept: 'application/json' } });
        const body = Buffer.from(await r.arrayBuffer());
        const headers = {};
        r.headers.forEach((v, k) => {
          const low = k.toLowerCase();
          if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(low)) headers[k] = v;
        });
        await req.respond({ status: r.status, headers, body });
      } catch (e) {
        await req.respond({ status: 502, contentType: 'application/json', body: '{"error":"prerender proxy"}' });
      }
      return;
    }
    req.continue();
  });
}

async function prerenderRoute(browser, baseUrl, route, { isBook = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  if (isBook) await installApiProxy(page, baseUrl);

  await page.goto(`${baseUrl}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  if (isBook) {
    // 책 데이터 로드 후 본문(h1)이 렌더될 때까지 대기 (skeleton/error 면 selector 안 뜸)
    try {
      await page.waitForSelector('article h1', { timeout: 20000 });
    } catch {
      throw new Error('book content 미렌더 (API 데이터 실패 가능)');
    }
    await new Promise((r) => setTimeout(r, 500));
  } else {
    // useSeo / useEffect 실행 대기 (React 18 마이크로태스크 큐 flush + 한 프레임)
    await new Promise((r) => setTimeout(r, 1500));
  }

  const html = await page.content();
  await page.close();

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

  let bookRoutes = PRERENDER_BOOKS ? (await aboutRoutesFromSitemap()).slice(0, BOOK_LIMIT) : [];
  let blogRoutes = PRERENDER_BOOKS ? await blogRoutesFromSitemap() : [];
  if (bookRoutes.length || blogRoutes.length) {
    // API 도달성 프로브 — 안 닿으면 API 필요한 페이지(about·blog) 전체 스킵 (헛도는 timeout 방지)
    const reachable = await probeApi();
    if (reachable) {
      console.log(
        `[prerender] 동화책 about ${bookRoutes.length} + 블로그 ${blogRoutes.length}개 — API 프록시: ${API_ORIGIN}`
      );
    } else {
      console.warn(
        `[prerender] API(${API_ORIGIN}) 도달 불가 — about ${bookRoutes.length} + 블로그 ${blogRoutes.length}개 건너뜀.`
      );
      bookRoutes = [];
      blogRoutes = [];
    }
  }

  console.log('[prerender] vite preview 띄우는 중...');
  const server = await preview({
    root: clientRoot,
    preview: { port: PREVIEW_PORT, host: 'localhost', strictPort: true },
  });
  const baseUrl = `http://localhost:${PREVIEW_PORT}`;
  console.log(`[prerender] preview ready: ${baseUrl}`);

  let browser;
  let ok = 0;
  let fail = 0;
  try {
    console.log('[prerender] puppeteer launch...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const route of STATIC_ROUTES) {
      try {
        await prerenderRoute(browser, baseUrl, route);
        ok++;
      } catch (e) {
        fail++;
        console.warn(`✗ ${route} — ${e.message}`);
      }
    }

    for (const route of bookRoutes) {
      try {
        await prerenderRoute(browser, baseUrl, route, { isBook: true });
        ok++;
      } catch (e) {
        fail++;
        console.warn(`✗ ${route} — ${e.message}`);
      }
    }

    // 블로그 글 — API 프록시 필요(about 과 동일 처리)
    for (const route of blogRoutes) {
      try {
        await prerenderRoute(browser, baseUrl, route, { isBook: true });
        ok++;
      } catch (e) {
        fail++;
        console.warn(`✗ ${route} — ${e.message}`);
      }
    }

    console.log(`[prerender] 완료. 성공 ${ok} / 실패 ${fail}`);
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
