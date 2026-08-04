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
  '/hangul',
];
// 🔴 `/blog` 는 넣지 않는다 — 서버가 `blogListHandler` 로 이미 SSR 한다(app.ts). 구워 봐야
//    그 핸들러가 먼저 잡아 영영 안 쓰이고, 매니페스트에 담기면 246KB 를 헛되이 물고 있는다.
//    같은 이유로 `/library/:id`(about SSR)·`/guide/*` 도 대상이 아니다.

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

/**
 * #root 안에 남은 **눈에 보이는 글자 수** — 무엇이 구워졌는지 판정하는 유일한 기준.
 *
 * 🔴 이 가드가 없으면 API 가 안 닿는 채로 구워진 **에러 화면**("연결이 안 돼 와이파이를…")이
 *    그대로 배포된다(실측: 그렇게 구워졌다). 빈 화면보다 나쁘다 — 고장난 앱으로 보인다.
 *    문구를 찍어 거르지 않는 이유 = i18n 이 바뀌면 조용히 통과한다. **양**으로 잰다.
 * 🔴 실측 두 점 사이에 둔 값이다 — 오프라인 에러 92자 / 정상 파닉스 단원 목록 360자
 *    (그 화면은 글자·숫자뿐이라 짧다). 400 이었을 때 멀쩡한 파닉스를 떨어뜨렸다.
 *    ponytail: 라우트 무관 단일 임계값. 특정 화면이 오탐되면 그때 라우트별로 나눈다.
 */
const MIN_TEXT = 250;

function visibleTextLength(html) {
  const rootAt = html.indexOf('<div id="root"');
  const body = rootAt === -1 ? html : html.slice(rootAt);
  return body
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

async function prerenderRoute(browser, baseUrl, route, { isBook = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  /**
   * 🔴 **진입 게이트를 굽지 않는다.** `AppShell` 은 미로그인 + 게스트 창 미시작이면
   *    `EntryGate` 오버레이를 띄운다 — 그대로 구우면 이미 게스트/로그인인 방문자까지
   *    첫 1초 동안 「가입하시겠어요?」를 보게 된다. 게스트 앵커를 심어 그 상태를 피한다.
   *    처음 오는 사람은 React 가 마운트하면서 곧바로 게이트를 띄우므로 잃는 게 없다.
   * ⚠️ 로컬은 `.env.local` 이 없어 `isConfigured=false` → 게이트가 원래 안 뜬다.
   *    이 줄의 효과는 **Supabase 키가 들어가는 Docker 빌드에서만** 드러난다.
   */
  await page.evaluateOnNewDocument(() => {
    try {
      // 🔴 둘 다 필요하다 — 앵커(창 시작)만 심으면 「아직 안 골랐다」로 남아 게이트가 그대로 뜬다
      //    (`guest-mode.ts` 의 KEY_CHOICE / KEY_STARTED).
      localStorage.setItem('tb_entry_choice', 'guest');
      localStorage.setItem('tb_guest_started_at', new Date().toISOString());
    } catch {
      /* storage 막힘 — 게이트가 구워질 뿐 치명적이지 않다 */
    }
  });

  // 🔴 정적 라우트도 API 를 물려준다 — `/library` 는 책 목록이 없으면 오프라인 에러를 그린다.
  //    데이터가 들어간 채로 구우면 표지·카테고리가 HTML 에 담겨 이미지도 즉시 받기 시작한다.
  await installApiProxy(page, baseUrl);

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
    // 🔴 고정 sleep 이 아니라 **글자가 찰 때까지** 기다린다 — API 응답이 늦으면 sleep 은
    //    스켈레톤을 굽는다(고정 1.5s 였을 때 `/library` 가 그래서 에러 화면으로 구워졌다).
    await page
      .waitForFunction(
        (min) =>
          ((document.getElementById('root')?.innerText || '').replace(/\s+/g, ' ').trim().length >=
          min),
        { timeout: 15000 },
        MIN_TEXT
      )
      .catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
  }

  const html = await page.content();
  await page.close();

  const len = visibleTextLength(html);
  if (len < MIN_TEXT) throw new Error(`내용 부족 (${len}자 < ${MIN_TEXT}) — 에러/스켈레톤 화면 의심`);

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
  /**
   * 서버가 읽을 매니페스트 — **실제로 구워진 정적 라우트만** 담는다.
   * 🔴 이 목록이 없으면 서버(app.ts)는 프리렌더본을 아예 안 쓴다(= 예전 동작).
   *    라우트 목록을 서버에 하드코딩하지 않는 이유 = 여기서 하나 지우면 서버가 없는 파일을 찾는다.
   * about/블로그는 서버가 이미 SSR 로 그리므로 담지 않는다(수백 개를 메모리에 들 이유 없음).
   */
  const served = [];
  try {
    console.log('[prerender] puppeteer launch...');
    browser = await puppeteer.launch({
      headless: true,
      // 🔴 Docker 이미지는 `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` 로 설치하므로 puppeteer 가
      //    번들 Chrome 을 갖고 있지 않다 — 시스템 chromium 경로를 넘겨야 뜬다(Remotion 과 같은 값).
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const route of STATIC_ROUTES) {
      try {
        await prerenderRoute(browser, baseUrl, route);
        ok++;
        if (route !== '/') served.push(route);
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

    await fs.writeFile(path.join(distDir, 'prerendered.json'), JSON.stringify(served), 'utf-8');
    console.log(`[prerender] 완료. 성공 ${ok} / 실패 ${fail} · 매니페스트 ${served.length}`);
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
