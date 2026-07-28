/**
 * 발행 패널 실측 — 카테고리·태그·공개설정·검색허용·**예약 발행** 셀렉터.
 *
 * 🔴 안전장치: **빈 문서**로 연다. 제목이 없으면 네이버가 발행을 막으므로,
 *    실수로 확정 버튼을 눌러도 글이 나가지 않는다. 패널만 덤프하고 닫는다.
 *
 * 사용: npx tsx scripts/naver-measure-publish.ts
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser, type Frame, type Page } from 'puppeteer';
import { loadSession, applySession } from '../src/services/naver/naver-session.js';

const OUT = path.resolve(process.cwd(), 'out/naver');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PROBE = `(function () {
  function desc(e) {
    return {
      tag: e.tagName.toLowerCase(),
      type: e.getAttribute('type') || undefined,
      cls: (e.getAttribute('class') || '').slice(0, 90),
      id: e.id || undefined,
      name: e.getAttribute('name') || undefined,
      ph: e.getAttribute('placeholder') || undefined,
      text: (e.innerText || e.value || '').trim().slice(0, 30) || undefined
    };
  }
  function all(sel, n) {
    return Array.prototype.slice.call(document.querySelectorAll(sel), 0, n || 30).map(desc);
  }
  return {
    radios: all('input[type=radio]'),
    checks: all('input[type=checkbox]'),
    texts: all('input[type=text], input:not([type]), textarea'),
    selects: all('select'),
    // 예약 관련 낱말이 붙은 것 전부
    scheduleish: Array.prototype.slice
      .call(document.querySelectorAll('button, label, span, a, input'))
      .filter(function (e) { return /예약|발행 시간|시간 설정/.test(e.innerText || e.getAttribute('aria-label') || ''); })
      .slice(0, 15).map(desc),
    buttons: all('button', 30)
  };
})()`;

async function main() {
  const session = loadSession();
  if (!session) throw new Error('세션 없음');

  const browser: Browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page: Page = await browser.newPage();
  await applySession(page, session);
  await page.goto('https://blog.naver.com/tangobooks?Redirect=Write&', {
    waitUntil: 'domcontentloaded',
  });

  let ed: Frame | undefined;
  for (let i = 0; i < 40 && !ed; i++) {
    await sleep(1000);
    for (const f of page.frames()) {
      if (!/PostWriteForm/.test(f.url())) continue;
      try {
        if (await f.evaluate('!!document.querySelector(\'[contenteditable="true"]\')')) ed = f;
      } catch {
        /* 로딩 */
      }
    }
  }
  if (!ed) throw new Error('에디터 프레임 없음');
  await sleep(2000);

  // 상단 「발행」 = 설정 패널을 여는 버튼(실제 발행은 패널 안의 확정 버튼).
  const opened = await ed.evaluate(
    `(function () {
       var b = Array.prototype.slice.call(document.querySelectorAll('button'))
         .filter(function (x) { return (x.innerText || '').trim() === '발행'; })[0];
       if (!b) return false;
       b.click();
       return true;
     })()`
  );
  console.log('발행 패널 열기:', opened);
  await sleep(2500);

  // 🔴 예약 날짜·시간 입력은 「예약」 라디오를 켜야 나타난다 — 켠 뒤에 재야 보인다.
  await ed.evaluate(
    `(function () {
       var r = document.querySelector('#radio_time2');
       if (r) { r.click(); return true; }
       return false;
     })()`
  );
  await sleep(1200);

  const dump = await ed.evaluate(PROBE);
  fs.writeFileSync(path.join(OUT, 'publish-panel.json'), JSON.stringify(dump, null, 2), 'utf-8');
  console.log(JSON.stringify(dump, null, 2).slice(0, 6000));
  await page.screenshot({ path: path.join(OUT, 'publish-panel.png'), fullPage: true });

  await browser.close();
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
