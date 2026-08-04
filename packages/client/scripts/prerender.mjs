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

/**
 * 라우트별 최소 글자 수 — **껍데기만 구워지는 걸 막는 유일한 장치**.
 *
 * 🔴 공통 임계값 하나로는 못 잡는다. `/library` 는 헤더+푸터만으로 315자가 나와서
 *    MIN_TEXT(250)를 넘겨 **표지 0장짜리 라이브러리가 두 번 배포됐다**. 반면 파닉스 단원
 *    목록은 글자·숫자뿐이라 정상인데도 360자다. 그래서 "그 화면이 다 그려졌을 때의 실측값"
 *    을 라우트마다 적어 둔다(실측의 6~7할).
 * 🔴 못 채우면 **굽지 않는다** — 매니페스트에 안 들어가고 그 라우트는 예전 SPA 동작으로
 *    돌아간다. 반쪽짜리를 배포하느니 느린 편이 낫다.
 */
const MIN_BY_ROUTE = {
  '/library': 900, // 실측 1,231 (표지 105장)
  '/hangul': 3000, // 실측 4,881
  '/vocabulary': 4000, // 실측 7,243
};

/**
 * 진입 게이트 헤드라인(ko) — 구워졌는지 판정할 지문. 못 읽으면 검사를 건너뛴다(빌드는 계속).
 * i18n 파일에서 읽는 이유 = 문구를 여기에 베껴 두면 문구가 바뀔 때 검사가 조용히 죽는다.
 */
const gateNeedle = await (async () => {
  try {
    const j = JSON.parse(
      await fs.readFile(path.join(clientRoot, 'src/i18n/locales/ko/access.json'), 'utf-8')
    );
    return j?.entryGate?.title || null;
  } catch {
    return null;
  }
})();

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
  const minText = MIN_BY_ROUTE[route] ?? MIN_TEXT;
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
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' });
  await page.evaluateOnNewDocument(() => {
    try {
      // 🔴 `'auth'` 로 심는다 — 게이트를 막는 건 **선택했다는 사실**이고(`needsGate` 는
      //    choice===null 일 때만 참), `'guest'` 로 심으면 게스트 창까지 시작돼 모든 방문자가
      //    첫 1초 동안 「게스트 30일 남음」이라는 **사실 아닌 문구**를 보게 된다(실측).
      localStorage.setItem('tb_entry_choice', 'auth');
      // 🔴 언어를 못 박는다 — 도커 컨테이너엔 로케일이 없어 헤드리스 크롬이 en-US 로 잡히고,
      //    그대로 구우면 한국 방문자가 영어 화면을 먼저 본다(실측: 배포본이 영어로 구워졌다).
      localStorage.setItem('tangobook-ui-lang', 'ko');
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
    /**
     * 🔴 **글자 수가 멈출 때까지** 기다린다 — 「N자 넘으면 됨」으로 재면 안 된다.
     *    껍데기(헤더+푸터)만으로 417자가 나오는 화면이 있어서, 책이 도착하기도 전에
     *    조건을 만족해 **표지 0장짜리 라이브러리**가 구워져 배포됐다(실측).
     *    한국어에선 껍데기가 그 밑이라 로컬에선 우연히 제대로 기다렸고, 그래서 못 봤다.
     */
    // 🔴 **요청이 끝나기를 먼저 기다린다.** 글자 수만 보면 API 응답이 날아오는 중에도
    //    껍데기가 「안정적」이라 그대로 찍힌다(그래서 표지 0장으로 배포됐다).
    await page.waitForNetworkIdle({ idleTime: 1000, timeout: 25000 }).catch(() => {});

    let last = -1;
    let stable = 0;
    for (let i = 0; i < 40; i++) {
      const n = await page
        .evaluate(
          () =>
            (document.getElementById('root')?.innerText || '').replace(/\s+/g, ' ').trim().length
        )
        .catch(() => -1);
      if (n === last) {
        stable++;
        if (stable >= 2 && n >= minText) break; // 1초간 안 늘면 다 그려진 것으로 본다
      } else {
        stable = 0;
        last = n;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const html = await page.content();
  await page.close();

  const len = visibleTextLength(html);
  if (len < minText) throw new Error(`내용 부족 (${len}자 < ${minText}) — 껍데기/에러 화면 의심`);
  // 🔴 한국어인지 확인 — 배포본이 통째로 영어로 구워진 적이 있다(컨테이너 로케일 없음).
  //    빌드 로그엔 ✓ 만 찍혀서 서빙된 HTML 을 열어 보기 전엔 몰랐다.
  const hangul = (html.match(/[가-힣]/g) || []).length;
  if (hangul < 30) throw new Error(`한글이 ${hangul}자뿐 — 영어로 구워진 듯(로케일 확인)`);
  if (gateNeedle && html.includes(gateNeedle)) {
    // 🔴 실제로 이렇게 구워졌었다 — localStorage 씨앗의 키가 하나 모자랐다(앵커만 심고
    //    선택 플래그를 안 심음). 키가 또 바뀌면 조용히 재발하므로 여기서 빌드를 떨어뜨린다.
    throw new Error('진입 게이트가 구워짐 — evaluateOnNewDocument 의 guest-mode 키를 확인할 것');
  }

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
  // 🔴 **항상 프로브하고 로그를 남긴다.** 정적 라우트도 API 데이터로 굽기 때문에, 안 닿으면
  //    표지 없는 라이브러리가 나온다. 예전엔 about/blog 가 있을 때만 재서, 빌드 로그만 보고는
  //    "왜 표지가 비었나"를 알 수 없었다.
  const apiOk = await probeApi();
  console.log(`[prerender] API(${API_ORIGIN}) ${apiOk ? '도달 ✓' : '도달 불가 ✗ — 데이터 없이 구워짐'}`);
  if (bookRoutes.length || blogRoutes.length) {
    const reachable = apiOk;
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
