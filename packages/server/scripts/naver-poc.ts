/* eslint-disable no-undef -- page.evaluate 콜백은 브라우저 컨텍스트(DOM 타입 HTMLElement 등). PoC 스크립트. */
/**
 * Phase 0 PoC 스파이크 (폐기 가능) — 네이버 스마트에디터 ONE 실측.
 * TDD 아님. 3가지 가정을 실측한다: ①세션 재사용 ②텍스트 주입 ③이미지 파일 input 주입.
 *
 * 사용:
 *   pnpm --filter @tangobook/server exec tsx scripts/naver-poc.ts login
 *     → headed 브라우저로 네이버 로그인 페이지 표시. 사람이 직접 로그인(2FA·캡차 포함).
 *       로그인 성공을 자동 감지(NID_AUT 쿠키)하여 naver-session.json 저장.
 *   pnpm --filter @tangobook/server exec tsx scripts/naver-poc.ts measure <blogId>
 *     → 저장 세션 복원 → 글쓰기 페이지 진입 → iframe/셀렉터 덤프 + 스크린샷(out/naver/).
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  saveSessionFromPage,
  loadSession,
  applySession,
} from '../src/services/naver/naver-session.js';

const mode = process.argv[2];
const arg = process.argv[3];
const OUT = path.resolve(process.cwd(), 'out/naver');
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runLogin(): Promise<void> {
  const browser: Browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page: Page = await browser.newPage();
  await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'domcontentloaded' });
  console.log('▶ 뜬 브라우저 창에서 네이버에 직접 로그인하세요 (아이디/비밀번호·2FA·캡차).');
  console.log('  로그인 성공을 자동 감지합니다. 최대 5분 대기...');

  const deadline = Date.now() + 5 * 60 * 1000;
  let ok = false;
  while (Date.now() < deadline) {
    await sleep(2000);
    let cookies: Awaited<ReturnType<Page['cookies']>>;
    try {
      cookies = await page.cookies('https://www.naver.com');
    } catch {
      continue; // 네비게이션 중이면 잠깐 실패할 수 있음
    }
    const hasAuth = cookies.some((c) => c.name === 'NID_AUT' && c.value);
    const url = page.url();
    if (hasAuth && !url.includes('nidlogin') && !url.includes('nid.naver.com')) {
      ok = true;
      break;
    }
  }

  if (!ok) {
    console.error('✗ 5분 내 로그인 감지 실패. 창을 닫고 다시 시도하세요.');
    await browser.close();
    process.exit(1);
  }

  await saveSessionFromPage(page);
  console.log('✅ 세션 저장됨: naver-session.json');
  const s = loadSession();
  console.log(
    `   cookies: ${s?.cookies.length ?? 0}개, localStorage keys: ${Object.keys(s?.localStorage ?? {}).length}개`
  );
  await browser.close();
}

async function runMeasure(blogId: string): Promise<void> {
  if (!blogId) {
    console.error('✗ 사용법: naver-poc.ts measure <네이버블로그ID>');
    process.exit(1);
  }
  const session = loadSession();
  if (!session) {
    console.error('✗ 세션 없음 — 먼저 `naver-poc.ts login` 실행');
    process.exit(1);
  }

  const browser: Browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page: Page = await browser.newPage();
  await applySession(page, session);

  // 글쓰기 페이지 진입
  const writeUrl = `https://blog.naver.com/${blogId}?Redirect=Write&`;
  await page.goto(writeUrl, { waitUntil: 'networkidle2' });
  await sleep(4000);

  const url = page.url();
  console.log(`\n현재 URL: ${url}`);
  if (url.includes('nidlogin') || url.includes('nid.naver.com')) {
    console.error('✗ 로그인 페이지로 튕김 — 세션 만료. `login` 재실행 필요.');
    await page.screenshot({ path: path.join(OUT, 'measure-bounced.png') });
    await browser.close();
    process.exit(1);
  }

  // iframe 목록 덤프
  const frames = page.frames();
  console.log(`\n== iframe ${frames.length}개 ==`);
  for (const f of frames) {
    console.log(`  - name="${f.name()}" url=${f.url().slice(0, 80)}`);
  }

  // 각 프레임에서 에디터 후보 요소 탐색
  console.log('\n== 에디터 후보 요소 (프레임별) ==');
  for (const f of frames) {
    try {
      const found = await f.evaluate(() => {
        // 브라우저 컨텍스트 — server eslint 는 document 미인지라 globalThis.document 사용.
        const doc = globalThis.document;
        const pick = (sel: string) =>
          Array.from(doc.querySelectorAll(sel))
            .slice(0, 3)
            .map((el) => {
              const e = el as HTMLElement;
              return `${e.tagName.toLowerCase()}${e.className ? '.' + String(e.className).trim().split(/\s+/).join('.') : ''}`;
            });
        return {
          fileInputs: pick('input[type=file]'),
          titleLike: pick('[class*=title], [placeholder*="제목"], textarea'),
          editableLike: pick(
            '[contenteditable=true], [class*=editor], [class*=SmartEditor], [class*=se-]'
          ),
          imageBtns: Array.from(doc.querySelectorAll('button, [role=button]'))
            .filter((b) =>
              /사진|이미지|image/i.test(
                (b as HTMLElement).innerText || (b as HTMLElement).getAttribute('aria-label') || ''
              )
            )
            .slice(0, 5)
            .map((b) =>
              `${(b as HTMLElement).innerText || (b as HTMLElement).getAttribute('aria-label')}`.slice(
                0,
                20
              )
            ),
        };
      });
      const nonEmpty = Object.entries(found).filter(([, v]) => (v as string[]).length);
      if (nonEmpty.length) {
        console.log(`  [frame name="${f.name()}"]`);
        for (const [k, v] of nonEmpty) console.log(`      ${k}: ${JSON.stringify(v)}`);
      }
    } catch {
      // cross-origin 등
    }
  }

  await page.screenshot({ path: path.join(OUT, 'measure-editor.png'), fullPage: true });
  console.log(`\n📸 스크린샷: out/naver/measure-editor.png`);
  console.log('브라우저는 열어둡니다(수동 관찰용). 확인 후 이 프로세스를 종료하세요(Ctrl+C).');
  // 브라우저 열어둠 — 수동 관찰
  await sleep(10 * 60 * 1000);
  await browser.close();
}

/**
 * capture — **사용자의 진짜 Chrome**(디버그 포트로 띄운)에 붙어 네이버 세션을 저장한다.
 *
 * 🔴 왜: 네이버가 puppeteer로 조종되는 브라우저의 **로그인**을 자동화로 감지해 막는다(맞는 비번도
 *    「틀렸다」, 2FA 무한루프). 그래서 로그인은 사람이 자기 Chrome에서 하고(네이버가 안 막음),
 *    그 결과 쿠키만 가져온다 — 봇 탐지 우회가 아니라 사람이 만든 세션의 재사용이다.
 *
 * 준비(사용자): 크롬 전부 종료 후 아래로 실행 → 그 창에서 네이버 로그인.
 *   chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\naver-debug-profile"
 */
async function runCapture(): Promise<void> {
  const port = process.env.CDP_PORT || '9222';
  let browser: Browser;
  try {
    browser = await puppeteer.connect({
      browserURL: `http://127.0.0.1:${port}`,
      defaultViewport: null,
    });
  } catch {
    console.error(
      `✗ 디버그 Chrome(127.0.0.1:${port})에 못 붙었습니다.\n` +
        `  크롬을 --remote-debugging-port=${port} 로 띄우고 네이버 로그인한 뒤 다시 실행하세요.`
    );
    process.exit(1);
  }

  const page: Page = await browser.newPage();
  // write 페이지가 로그인으로 튕기지 않으면 = 로그인 되어 있음(발행기가 쓸 바로 그 페이지로 검증)
  await page.goto('https://blog.naver.com/tangobooks?Redirect=Write&', {
    waitUntil: 'networkidle2',
  });
  await sleep(3000);
  if (/nidlogin|nid\.naver\.com/.test(page.url())) {
    console.error(
      '✗ 아직 네이버 로그인 안 됨 — 그 Chrome 창에서 네이버 로그인을 먼저 끝내고 다시 실행하세요.'
    );
    await page.close();
    browser.disconnect();
    process.exit(1);
  }

  // 쿠키는 여러 네이버 도메인에서 모아 dedupe(auth 쿠키는 .naver.com, 일부는 서브도메인)
  const urls = ['https://blog.naver.com', 'https://www.naver.com', 'https://nid.naver.com'];
  const seen = new Set<string>();
  const cookies: unknown[] = [];
  for (const u of urls) {
    for (const c of await page.cookies(u)) {
      const k = `${c.name}@${c.domain}${c.path}`;
      if (!seen.has(k)) {
        seen.add(k);
        cookies.push(c);
      }
    }
  }
  const localStorage = await page.evaluate(() => {
    const ls = globalThis.localStorage;
    const out: Record<string, string> = {};
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i)!;
      out[key] = ls.getItem(key) ?? '';
    }
    return out;
  });

  const SESSION_PATH = path.resolve(process.cwd(), 'naver-session.json');
  fs.writeFileSync(
    SESSION_PATH,
    JSON.stringify({ savedAt: new Date().toISOString(), cookies, localStorage }, null, 2),
    'utf-8'
  );
  const hasAuth = cookies.some((c) => (c as { name?: string }).name === 'NID_AUT');
  console.log(
    `✅ 세션 저장됨: naver-session.json (cookies ${cookies.length}개, NID_AUT ${hasAuth ? '있음' : '❌없음'})`
  );
  await page.close();
  browser.disconnect(); // 사용자 Chrome 는 닫지 않는다
  if (!hasAuth) process.exit(1);
}

if (mode === 'login') await runLogin();
else if (mode === 'measure') await runMeasure(arg);
else if (mode === 'capture') await runCapture();
else {
  console.error('사용법: naver-poc.ts <login|measure|capture> [blogId]');
  process.exit(1);
}
