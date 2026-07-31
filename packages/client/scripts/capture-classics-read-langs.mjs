// 세계 명작 광고 — 「읽어주기」 쇼케이스 스틸: **언어마다 다른 그림체**로 찍는다.
//   node scripts/capture-classics-read-langs.mjs <baseUrl> <outDir>
//
// 🔴 언어만 바뀌고 그림은 그대로라 「5개 언어」가 밋밋했다(2026-07-29 지적). 앞의 언어 선택
//    장면과 **같은 짝**으로 맞춘다 — 한국어·페이퍼3D / English·수채 / 中文·콜라주.
// 🔴 뷰어는 삽화·자막이 안 움직여 **녹화하면 프레임이 0개**다(screencast 는 repaint 기반).
//    그래서 스틸로 찍어 컴포지션에서 이어 붙인다.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { VIEWPORT, sleep, waitReady, LAUNCH_ARGS } from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:49412';
const OUT = process.argv[3] || '.';
const BOOK = '1772107608499'; // 신데렐라

// styleId 는 R2 `_index/style-genre-map.json` 기준(추측 금지 — 라벨만 보고 고르면 어긋난다).
//   paper-craft=paper3d · style-1778400601673=watercolor · style-1778921282450=collage
// 셋 다 페이지 삽화 15장 + 언어별 표지를 갖고 있는 것을 데이터에서 확인하고 골랐다.
const TARGETS = [
  { lang: 'ko', style: 'paper-craft', label: '한국어 · 페이퍼3D' },
  { lang: 'en', style: 'style-1778400601673', label: 'English · 수채' },
  { lang: 'zh', style: 'style-1778921282450', label: '中文 · 콜라주' },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport(VIEWPORT);

try {
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await page.evaluate(() => {
    localStorage.setItem('tb_entry_choice', 'guest');
    localStorage.setItem('tb_guest_started_at', new Date().toISOString());
    // 🔴 뷰어 기본값이 **전체화면 ON** 이라, 그냥 찍으면 삽화가 화면을 꽉 채우고 자막·툴바는
    //    숨는다 — 표지만 찍힌 것처럼 보였던 진짜 이유다(자막 div 는 DOM 엔 있어서 기하학적
    //    확인만으론 안 잡힌다). 광고엔 **자막이 보여야** 하므로 끄고 찍는다(기존 스틸도 이 구도).
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

  for (const { lang, style, label } of TARGETS) {
    await page.goto(`${BASE}/viewer/${BOOK}?lang=${lang}&style=${style}&autoplay=1`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    // 🔴 진입 게이트 문구는 **「화면을 한 번 누르면 이야기가 시작돼요」** 다(브라우저에서 실제로 읽었다).
    //    ⚠️ 자막 글은 **게이트 화면에서도 이미 DOM 에 있다** — `textContent` 로 확인하면 항상
    //    통과해서, 표지만 찍힌 걸 세 번이나 못 잡았다. 판정은 **게이트 문구가 사라졌는가**로 한다.
    const gateUp = () => page.evaluate(() => document.body.innerText.includes('한 번 누르면'));
    await page.waitForFunction(() => document.body.innerText.includes('한 번 누르면'), {
      timeout: 60000,
    });
    await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height / 2);
    await page.waitForFunction(() => !document.body.innerText.includes('한 번 누르면'), {
      timeout: 20000,
    });
    if (await gateUp()) throw new Error(`게이트가 안 걷혔다: ${label}`);

    // 🔴 게이트를 걷는 것만으론 부족하다 — **나레이션이 실제로 도는지**까지 봐야 한다.
    //    안 돌면 뷰어가 타이틀 화면에 머물고 자막은 「전문 정적 표시」(비활성) 상태가 되는데,
    //    그 자막도 DOM 엔 멀쩡히 있어서 기하학적 확인만으론 못 잡는다. ko 가 매번 그렇게 찍혔다.
    //    실제 재생은 `<audio>` 의 currentTime 이 도는지로 판정한다.
    // ⚠️ `document.querySelectorAll('audio')` 로는 못 잰다 — 뷰어는 `new Audio()` 로 만들어
    //    DOM 에 붙이지 않는다(그래서 항상 false 였고, 첫 시도가 통째로 헛돌았다).
    //    재생 중에만 생기는 **하이라이트 span(`text-coral-500`)** 을 본다.
    const ttsRunning = () =>
      page.evaluate(() => !!document.querySelector('.text-coral-500'));
    let playing = false;
    for (let i = 0; i < 4 && !playing; i++) {
      await sleep(1200);
      playing = await ttsRunning();
      if (!playing) await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height / 2);
    }
    if (!playing) throw new Error(`나레이션이 안 돈다 — 타이틀 화면에서 찍힐 뻔했다: ${label}`);
    await sleep(1500); // 하이라이트가 문장 중간쯤 올 때

    const sub = await page.evaluate(() => {
      const el = [...document.querySelectorAll('div')].find((d) =>
        /whitespace-pre-line/.test(d.className || '')
      );
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        text: (el.textContent || '').slice(0, 40),
        visible: r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight + 4,
        overflow: el.scrollWidth - el.clientWidth,
      };
    });
    if (!sub?.visible) throw new Error(`자막이 화면에 없다: ${label}`);
    if (sub.overflow > 1) throw new Error(`자막이 가로로 넘친다(${sub.overflow}px): ${label}`);

    // 삽화가 실제로 그 그림체인지 확인 — style 이 무시되면 세 스틸이 같아진다.
    const shown = await page.evaluate(() => {
      const img = [...document.images]
        .filter((i) => i.getBoundingClientRect().width > 150)
        .map((i) => i.currentSrc || i.src);
      return img[0] || null;
    });
    await page.screenshot({ path: path.join(OUT, `c4-read-${lang}.png`) });
    console.log(`  → c4-read-${lang}.png  ${label}`);
    console.log(`     삽화: ${shown ? shown.split('/').pop().slice(0, 60) : '(없음)'}`);
    console.log(`     자막: ${sub.text}`);
  }
} finally {
  await browser.close();
}
console.log('완료:', OUT);
