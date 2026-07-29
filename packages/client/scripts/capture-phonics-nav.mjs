// 라이브러리 → 사이드바 → 파닉스 → 한글 카드 → 단원 화면(익히기·게임하기) → 단원 선택 → ㄱ 단원 → 첫 활동.
// 광고 도입부용 '친절한' 내비게이션 실촬 — 어디를 누르는지 전부 보인다.
//   node scripts/capture-phonics-nav.mjs <baseUrl> <outDir>
//
// 🔴 클릭만 하면 화면이 툭툭 바뀌어 시청자가 따라올 수 없다. 손가락이 어디로 가는지 보여야 한다.
//    → 실제 클릭 위치로 움직이는 터치 표시를 얹는다(가짜 UI 가 아니라 실제 탭의 커서 표현).
import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:50758';
const OUT = process.argv[3] || '.';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CURSOR_CSS = `
#__adcursor{position:fixed;left:0;top:0;width:74px;height:74px;margin:-37px 0 0 -37px;
 border-radius:999px;background:rgba(255,255,255,.42);border:4px solid rgba(255,255,255,.95);
 box-shadow:0 6px 22px rgba(0,0,0,.28);z-index:2147483647;pointer-events:none;
 transition:left .42s cubic-bezier(.4,0,.2,1),top .42s cubic-bezier(.4,0,.2,1),transform .16s ease;opacity:0}
#__adcursor.on{opacity:1}
#__adcursor.tap{transform:scale(.72);background:rgba(255,255,255,.75)}`;

async function installCursor(page) {
  await page.evaluate((css) => {
    if (document.getElementById('__adcursor')) return;
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
    const d = document.createElement('div');
    d.id = '__adcursor';
    document.body.appendChild(d);
  }, CURSOR_CSS);
}

/**
 * 커서를 목표 위에 **띄우고 → 누르고 → 즉시 감춘다.**
 * 🔴 누른 뒤에도 커서를 켜 두면, 화면이 바뀌었는데 커서는 옛 좌표에 남아 **엉뚱한 걸 가리킨다**
 *    (사용자 지적: "포인팅이 지금 다 이상해"). 탭 직후 감추는 게 핵심이다.
 * 🔴 커서는 **다음 목표 위에서 다시 나타난다** — 이동 궤적을 보여주려고 켠 채로 끌면
 *    화면 전환 중에 허공을 가로지른다.
 */
async function tap(page, expr, label, settle = 340) {
  await installCursor(page); // 리렌더로 지워졌을 수 있다
  const box = await page.evaluate(expr);
  if (!box) {
    console.warn(`  ! 못 찾음: ${label}`);
    return false;
  }
  // 이동은 커서를 감춘 채로(순간이동) → 목표 위에서 켠다.
  await page.evaluate(
    (x, y) => {
      const d = document.getElementById('__adcursor');
      if (!d) return;
      d.classList.remove('on');
      d.style.transition = 'none';
      d.style.left = `${x}px`;
      d.style.top = `${y}px`;
      void d.offsetWidth; // 리플로우 — transition 없이 좌표만 옮긴다
      d.style.transition = 'transform .14s ease, opacity .12s ease';
      d.classList.add('on');
    },
    box.x,
    box.y
  );
  await sleep(settle); // 어디를 누를지 보여주는 시간
  await page.evaluate(() => document.getElementById('__adcursor')?.classList.add('tap'));
  await sleep(150);
  await page.mouse.click(box.x, box.y);
  await page.evaluate(() => {
    const d = document.getElementById('__adcursor');
    d?.classList.remove('tap');
    d?.classList.remove('on'); // 🔴 누르자마자 감춘다
  });
  console.log(`  탭: ${label}`);
  return true;
}

const byAria = (aria) => `(() => {
  const el=[...document.querySelectorAll('button,a')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(aria)});
  if(!el) return null; const r=el.getBoundingClientRect();
  return {x:r.x+r.width/2, y:r.y+r.height/2};
})()`;

const byText = (txt) => `(() => {
  const el=[...document.querySelectorAll('a,button,[role=button]')].filter(e=>e.getBoundingClientRect().width>10)
    .find(e=>e.innerText.replace(/\\s+/g,' ').includes(${JSON.stringify(txt)}));
  if(!el) return null; const r=el.getBoundingClientRect();
  return {x:r.x+r.width/2, y:r.y+r.height/2};
})()`;

const browser = await puppeteer.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.createBrowserContext(); // 깨끗한 프로필 = "가입 없이" 가 사실
const page = await ctx.newPage();
await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });

try {
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3500);
  await installCursor(page);
  console.log('localStorage:', await page.evaluate(() => Object.keys(localStorage).join(',') || '(없음)'));

  const rec = await page.screencast({ path: path.join(OUT, 'nav.webm'), scale: 3 });

  // 🔴 진입은 **빠르게**. 시작하자마자 메뉴 → 파닉스 → 한글 → (왼쪽 리스트에서) ㄱ → 첫 게임.
  //    한 화면을 오래 물고 있으면 사용 설명서가 된다.
  await sleep(700); // 라이브러리를 짧게 보여준다
  await tap(page, byAria('메뉴 열기'), '☰ 메뉴 열기');
  await sleep(750); // 사이드바 슬라이드
  await tap(page, byText('파닉스'), '사이드바 · 파닉스');
  await sleep(1100);
  await tap(page, byText('한글 파닉스'), '한글 파닉스 카드');
  await sleep(1300);

  // 왼쪽 리스트(단원 목록)에서 ㄱ
  await tap(page, byText('단원'), '☰ 단원');
  await sleep(900);
  await tap(page, byText('ㄱ 배우기'), '2 ㄱ 배우기');
  await sleep(1500);

  // 게임들이 나오면 맨 처음 것
  await tap(page, byText('1 ㄱ 배우기'), '활동 1 · ㄱ 배우기');
  await sleep(2000);

  await rec.stop();
  const f = path.join(OUT, 'nav.webm');
  console.log(`  → nav.webm ${(fs.statSync(f).size / 1048576).toFixed(2)}MB`);
} finally {
  await browser.close();
}
