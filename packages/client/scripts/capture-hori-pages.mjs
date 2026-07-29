// 호리 시리즈 광고 — **뷰어 페이지 넘김** 실촬(라인별 매력 페이지 한 장씩).
//   node scripts/capture-hori-pages.mjs <baseUrl> <outDir> [key...]
//
// 🔴 「뷰어는 정지라 녹화하면 프레임이 0개」는 **가만히 둘 때** 이야기다. 페이지가 넘어가는
//    순간은 repaint 라 screencast 가 프레임을 뱉는다 — 이 편에 없던 「제품이 일하는 순간」이
//    여기서 나온다(격자 나열만으론 34.8초 중 10초가 완전 정지였다).
// 🔴 뷰어 기본값이 **전체화면 ON** 이라 그냥 찍으면 삽화가 꽉 차고 자막·툴바가 숨는다 → 끄고 찍는다.
// 🔴 진입 게이트 문구는 「화면을 한 번 누르면…」이고, **자막 글은 게이트 화면에서도 DOM 에 있다** —
//    글자 유무로 판정하면 표지만 찍힌다. 게이트 문구가 사라졌는지로 본다.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { VIEWPORT, sleep, waitReady, record, toMp4, LAUNCH_ARGS } from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:49412';
const OUT = process.argv[3] || '.';
const ONLY = process.argv.slice(4);
const want = (k) => ONLY.length === 0 || ONLY.includes(k);

// 라인별 한 장씩. page 는 0-based — 그 쪽으로 **넘어가는 장면**을 찍는다.
const TARGETS = [
  { key: 'p-life', book: '1782824600992', page: 5, note: '화가 나면 — 코로 스으읍, 입으로 후우' },
  { key: 'p-kinder', book: '1784550869911', page: 0, note: '유치원 — 내 노란 크레파스 어디 갔지?' },
  { key: 'p-explore', book: '1784860653245', page: 7, note: '우주로 슝 — 카운트다운' },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport(VIEWPORT);

/** 지금 자막 첫 40자 — 몇 쪽인지 확인하는 유일하게 믿을 수 있는 신호. */
const subText = () =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find((d) =>
      /whitespace-pre-line/.test(d.className || '')
    );
    return (el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  });

/**
 * 한 쪽 넘긴다. 🔴 좌표로 오른쪽 가장자리를 누르면 안 된다 — 컨트롤은 **4초 뒤 스스로 숨고**,
 * 숨은 상태의 탭은 「다음」이 아니라 **컨트롤 토글**로 먹힌다(그래서 한 쪽도 안 넘어갔다).
 * `aria-label="다음 페이지"` 버튼을 직접 누르고, 없으면 한 번 탭해 컨트롤을 되살린 뒤 다시 찾는다.
 */
async function next() {
  const before = await subText();
  const hit = async () =>
    page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(
        (e) => e.getAttribute('aria-label') === '다음 페이지'
      );
      if (!b || b.disabled) return false;
      b.click();
      return true;
    });
  if (!(await hit())) {
    await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height * 0.3);
    await sleep(400);
    if (!(await hit())) throw new Error('「다음 페이지」 버튼을 못 찾았다');
  }
  await page
    .waitForFunction(
      (b) => {
        const el = [...document.querySelectorAll('div')].find((d) =>
          /whitespace-pre-line/.test(d.className || '')
        );
        const t = (el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        return t && t !== b;
      },
      { timeout: 8000 },
      before
    )
    .catch(() => {});
}

try {
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await page.evaluate(() => {
    localStorage.setItem('tb_entry_choice', 'guest');
    localStorage.setItem('tb_guest_started_at', new Date().toISOString());
    localStorage.setItem(
      'tangobook-viewer-settings',
      JSON.stringify({
        language: 'ko',
        textSize: 'md',
        darkMode: true,
        autoPlayTts: true,
        showText: true,
        fullscreenImage: false,
        volume: 'high',
        version: 2,
      })
    );
  });

  for (const t of TARGETS) {
    if (!want(t.key)) continue;
    console.log(`[${t.key}] ${t.note}`);
    await page.goto(`${BASE}/viewer/${t.book}?lang=ko&autoplay=1`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await page.waitForFunction(() => document.body.innerText.includes('한 번 누르면'), {
      timeout: 60000,
    });
    await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height / 2);
    await page.waitForFunction(() => !document.body.innerText.includes('한 번 누르면'), {
      timeout: 20000,
    });
    // 나레이션이 실제로 도는지 — 재생 중에만 생기는 하이라이트로 본다(뷰어는 `new Audio()` 라
    // DOM 에 audio 엘리먼트가 없어서 currentTime 으로는 못 잰다).
    let playing = false;
    for (let i = 0; i < 20 && !playing; i++) {
      await sleep(1000);
      playing = await page.evaluate(() => !!document.querySelector('.text-coral-500'));
      if (!playing && i === 7) await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height / 2);
    }
    if (!playing) throw new Error(`나레이션이 안 돈다: ${t.key}`);

    // 목표 쪽 **직전**까지 조용히 넘긴다.
    for (let i = 0; i < t.page - 1; i++) await next();
    await sleep(900);
    const before = await subText();

    // 여기서부터 녹화 — 넘어가는 순간 + 새 쪽에 머무는 시간.
    await record(page, OUT, t.key, async () => {
      await sleep(500);
      await next();
      await sleep(2600);
    });
    const after = await subText();
    if (after === before) throw new Error(`쪽이 안 넘어갔다: ${t.key}`);
    console.log(`  ${before.slice(0, 18)}… → ${after.slice(0, 26)}…`);
    toMp4(OUT, t.key);
  }
} finally {
  await browser.close();
}
console.log('완료:', OUT);
