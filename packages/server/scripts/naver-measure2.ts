/**
 * 스마트에디터 ONE 셀렉터 실측 2차.
 *
 * naver-poc.ts measure 가 비어서 나온 이유 두 가지를 고친다:
 *  ① 에디터는 `mainFrame` iframe **안**에 있는데 4초만 기다려 아직 안 그려졌었다.
 *     → 프레임을 잡고 contenteditable 이 실제로 생길 때까지 기다린다.
 *  ② 브라우저를 10분 열어두고 끝나서 stdout 을 회수할 수 없었다. → 덤프하고 바로 닫는다.
 *
 * 산출물 → out/naver/selectors.json (사람이 읽고 발행기에 박을 셀렉터 후보)
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser, type Frame, type Page } from 'puppeteer';
import { loadSession, applySession } from '../src/services/naver/naver-session.js';

const OUT = path.resolve(process.cwd(), 'out/naver');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const blogId = process.argv[2] ?? 'tangobooks';

async function main() {
  const session = loadSession();
  if (!session) throw new Error('세션 없음 — naver-poc.ts login 먼저');

  const browser: Browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page: Page = await browser.newPage();
  await applySession(page, session);
  await page.goto(`https://blog.naver.com/${blogId}?Redirect=Write&`, {
    waitUntil: 'domcontentloaded',
  });

  // mainFrame(PostWriteForm) 이 붙고 그 안에 에디터가 그려질 때까지 기다린다
  let editor: Frame | undefined;
  for (let i = 0; i < 40 && !editor; i++) {
    await sleep(1000);
    for (const f of page.frames()) {
      if (!/PostWriteForm/.test(f.url())) continue;
      try {
        // 🔴 evaluate 는 문자열로 넘긴다 — tsx(esbuild)가 함수에 `__name` 헬퍼를 끼워 넣는데
        //    브라우저 컨텍스트엔 그게 없어서 "__name is not defined" 로 죽는다.
        const ready = await f.evaluate('!!document.querySelector(\'[contenteditable="true"]\')');
        if (ready) editor = f;
      } catch {
        /* 아직 로딩 */
      }
    }
  }
  if (!editor) throw new Error('에디터 프레임을 못 찾음 (PostWriteForm 안에 contenteditable 없음)');

  const PROBE = `(function () {
    function desc(e) {
      return {
        tag: e.tagName.toLowerCase(),
        cls: (e.getAttribute('class') || '').slice(0, 120),
        id: e.id || undefined,
        ph: e.getAttribute('placeholder') || undefined,
        aria: e.getAttribute('aria-label') || undefined,
        dataA11y: e.getAttribute('data-a11y-title') || undefined,
        text: (e.innerText || '').trim().slice(0, 24) || undefined
      };
    }
    function all(sel, n) {
      return Array.prototype.slice.call(document.querySelectorAll(sel), 0, n || 12).map(desc);
    }
    return {
      contenteditable: all('[contenteditable="true"]'),
      fileInputs: all('input[type=file]'),
      seTitle: all('[class*="se-title"], [class*="se_title"]', 6),
      seText: all('[class*="se-text-paragraph"]', 4),
      toolbarBtns: all('button[data-a11y-title], button[data-name]', 20),
      topBtns: Array.prototype.slice
        .call(document.querySelectorAll('button, a'))
        .filter(function (b) { return /저장|발행|임시/.test(b.innerText || ''); })
        .slice(0, 10)
        .map(desc)
    };
  })()`;
  const dump = await editor.evaluate(PROBE);

  fs.writeFileSync(path.join(OUT, 'selectors.json'), JSON.stringify(dump, null, 2), 'utf-8');
  console.log(JSON.stringify(dump, null, 2));
  await page.screenshot({ path: path.join(OUT, 'measure2.png'), fullPage: true });
  await browser.close();
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
