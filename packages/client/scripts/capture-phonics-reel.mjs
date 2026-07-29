// 한글 파닉스 광고 릴스 실촬 — 씬별 webm(1080×1920).
//   node scripts/capture-phonics-reel.mjs <baseUrl> <outDir>
//
// 순서 = 커리큘럼 → 글자 소리 → 쓰기 → 낱말 → 게임 → 음절 합체(클라이맥스) → 무료 증명.
// 🔴 맥락 없이 활동 화면부터 시작하면 어색하다 — 첫 씬은 **커리큘럼 안에서 오늘의 ㄱ 을 짚는다**.
//
// 촬영 규칙 (전부 실제로 당해서 생긴 것)
// 🔴 고정 sleep 금지 — 에셋 프리로드 게이트("준비하고 있어요")를 찍는다.
// 🔴 screencast 는 CSS 뷰포트 크기로 찍는다(deviceScaleFactor 무시). 크기는 `scale` 옵션.
// 🔴 획은 캔버스 **한가운데서** 시작한다. 모서리는 `rounded-xl` 밖이라 pointerdown 이 캔버스에 안 닿고,
//    그러면 이후 이동이 전부 "획을 시작하지 않은" 상태로 흘러 한 점도 안 칠해진다(조용히 실패).
// 🔴 칠하는 속도는 **아이가 쓰는 속도**로. 봇 속도로 훑으면 0.6초에 다 차서 나머지가 정지 화면이 된다.
// 🔴 단원 드로어는 360px 에서 닫혀 있다 — `☰ 단원` 을 눌러야 레벨이 보인다(안 누르면 숨은 버튼을 눌러 아무 일도 안 생긴다).
import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:50758';
const OUT = process.argv[3] || '.';
const UNIT = 'kr-h1-u02'; // ㄱ 배우기
const KO = `${BASE}/library/phonics/korean`;
const VIEWPORT = { width: 360, height: 640, deviceScaleFactor: 3 };
const SCALE = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitReady(page, selector) {
  await page.waitForFunction(() => !document.body.innerText.includes('준비하고 있어요'), {
    timeout: 60000,
  });
  if (selector) await page.waitForSelector(selector, { timeout: 30000 });
  await sleep(700);
}

async function record(page, name, fn) {
  const webm = path.join(OUT, `${name}.webm`);
  const rec = await page.screencast({ path: webm, scale: SCALE });
  try {
    await fn();
  } finally {
    await rec.stop();
  }
  const mb = fs.existsSync(webm) ? (fs.statSync(webm).size / 1048576).toFixed(2) : '0';
  console.log(`  → ${name}.webm  ${mb}MB`);
}

const clickAria = (page, label) =>
  page.evaluate((a) => {
    const el = [...document.querySelectorAll('button')].find(
      (y) => y.getAttribute('aria-label') === a
    );
    if (el) el.click();
    return !!el;
  }, label);

// 🔴 `button` 만 찾으면 안 된다 — 파닉스 랜딩의 「한글 파닉스」 카드는 링크라서 못 잡고,
//    그러면 탭이 조용히 안 일어나 정지 화면만 찍힌다(S7 이 실제로 그랬다).
const clickText = (page, t) =>
  page.evaluate((x) => {
    const el = [...document.querySelectorAll('a,button,[role=button]')].find((y) =>
      y.innerText.includes(x)
    );
    if (el) el.click();
    return !!el;
  }, t);

/** 캔버스 위 손가락 궤적. pts = 캔버스 상대좌표. stepMs = 점 사이 이동 시간(클수록 천천히 칠한다). */
async function drawPath(page, canvas, pts, stepMs) {
  const box = await canvas.boundingBox();
  if (!box) return;
  const at = ([rx, ry]) => [box.x + box.width * rx, box.y + box.height * ry];
  const [cx0, cy0] = at([0.5, 0.5]); // 🔴 한가운데서 시작(모서리는 둥근 모서리 밖)
  await page.mouse.move(cx0, cy0);
  await page.mouse.down();
  const [sx, sy] = at(pts[0]);
  await page.mouse.move(sx, sy);
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = at(pts[i - 1]);
    const [tx, ty] = at(pts[i]);
    const steps = 10;
    for (let s = 1; s <= steps; s++) {
      await page.mouse.move(px + ((tx - px) * s) / steps, py + ((ty - py) * s) / steps);
      await sleep(stepMs / steps);
    }
  }
  await page.mouse.up();
}

async function mainCanvas(page) {
  const hs = await page.$$('canvas');
  let best = null;
  let area = 0;
  for (const h of hs) {
    const b = await h.boundingBox();
    if (b && b.width * b.height > area) {
      area = b.width * b.height;
      best = h;
    }
  }
  return best;
}

/** 붓 지름 0.15(캔버스 400px 의 60px). 간격은 그 절반으로 겹치게. */
const BRUSH = 0.15;
async function fillGlyph(page, canvas, { stepMs = 80, passes = 2 } = {}) {
  const step = BRUSH / 2;
  const lo = 0.08;
  const hi = 0.92;
  for (let p = 0; p < passes; p++) {
    const rows = [];
    for (let y = lo; y <= hi; y += step) {
      const f = rows.length % 4 === 0;
      rows.push([f ? lo : hi, y], [f ? hi : lo, y]);
    }
    await drawPath(page, canvas, rows, stepMs);
    await sleep(200);
  }
}

const browser = await puppeteer.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport(VIEWPORT);

try {
  // ── S1 커리큘럼: 전체에서 오늘의 ㄱ 을 짚는다 ─────────────────────
  console.log('[S1] 커리큘럼 (드로어 + 레벨 + ㄱ 단원)');
  await page.goto(KO, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await record(page, 's1-curriculum', async () => {
    await sleep(500);
    console.log('    ☰ 단원:', await clickText(page, '단원'));
    await sleep(1100); // 드로어 슬라이드
    for (const lvl of ['한글2', '한글3', '한글4']) {
      await clickText(page, lvl);
      await sleep(650);
    }
    // 🔴 목록을 **깊게** 흘려야 한글2~4(받침·쌍자음·복잡한 모음)까지 보인다.
    //    260px 만 내리면 한글1 안에서만 움직여 "자음·모음부터 받침까지" 자막을 못 받쳐준다.
    const scrollTo = (top) =>
      page.evaluate((t) => {
        const el = [...document.querySelectorAll('*')].find(
          (e) => e.scrollHeight > e.clientHeight + 40 && e.clientHeight > 150
        );
        if (el) el.scrollTo({ top: t, behavior: 'smooth' });
      }, top);
    for (const top of [420, 760]) {
      await scrollTo(top);
      await sleep(1500);
    }
    await sleep(600);
  });

  // ── S2 글자 소리: ㄱ 카드 3장 ────────────────────────────────────
  console.log('[S2] ㄱ 배우기 (consonant-tap)');
  await page.goto(`${KO}/${UNIT}/consonant-tap`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await record(page, 's2-tap', async () => {
    await sleep(600);
    // 🔴 카드는 `ㄱ 1번 카드`·`2번`·`3번` 으로 각각 다른 버튼이고, 화면 지시가 **"세 번씩"** 이라
    //    카드마다 3번씩 총 9번을 눌러야 점 3개가 다 켜지고 낱말 그림이 뜬다.
    //    카드당 1번만 누르면 점 하나씩만 켜진 채 끝난다(실제로 그렇게 찍혔다).
    for (const n of [1, 2, 3]) {
      for (let k = 0; k < 3; k++) {
        await clickAria(page, `ㄱ ${n}번 카드`);
        await sleep(430);
      }
      console.log(`    카드 ${n} ×3`);
      await sleep(260);
    }
    await sleep(2400); // 낱말 그림 등장
  });

  // ── S3 쓰기 ─────────────────────────────────────────────────────
  console.log('[S3] ㄱ 써보기 (consonant-write)');
  await page.goto(`${KO}/${UNIT}/consonant-write`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page, 'canvas');
  await record(page, 's3-write', async () => {
    const c = await mainCanvas(page);
    await sleep(500);
    if (c) await fillGlyph(page, c, { stepMs: 110, passes: 2 }); // 천천히
    await sleep(1800);
  });

  // ── S4 낱말 (정지 화면 → 스틸) ──────────────────────────────────
  console.log('[S4] 단어 연습 (스틸)');
  await page.goto(`${KO}/${UNIT}/word-listen-choose`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await sleep(900);
  await page.screenshot({ path: path.join(OUT, 's4-words.png') });
  console.log('  → s4-words.png');

  // ── S5 게임 ─────────────────────────────────────────────────────
  console.log('[S5] 낱말 그리기 (game-dots)');
  await page.goto(`${KO}/${UNIT}/game-dots`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page, 'canvas');
  await record(page, 's5-dots', async () => {
    const c = await mainCanvas(page);
    await sleep(500);
    if (c) await fillGlyph(page, c, { stepMs: 95, passes: 2 });
    await sleep(1600);
  });

  // ── S6 클라이맥스: 음절 합체 ────────────────────────────────────
  console.log('[S6] 음절 만들기 (blend-listen) ★');
  await page.goto(`${KO}/${UNIT}/blend-listen`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await record(page, 's6-blend', async () => {
    await sleep(600);
    // 🔴 `handleTap` 에 `which !== step` 가드 — 첫 글자→둘째 글자를 **번갈아**, TAP_ROUNDS(2)회 반복해야
    //    마지막에 자동으로 붙는다. 같은 카드 연타는 두 번째부터 전부 무시된다.
    for (let r = 0; r < 2; r++) {
      for (const l of ['ㄱ', 'ㅏ']) {
        await clickAria(page, l);
        await sleep(900);
      }
    }
    await sleep(4200); // 합체 + 이어읽기 + 목록 체크
  });

  // ── S7 무료 증명 (깨끗한 프로필) ─────────────────────────────────
} finally {
  await browser.close();
}

console.log('[S7] 미로그인 진입 (깨끗한 프로필)');
const b2 = await puppeteer.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const ctx = await b2.createBrowserContext(); // localStorage 없음 = "가입 없이" 가 사실이 된다
const p2 = await ctx.newPage();
await p2.setViewport(VIEWPORT);
try {
  await p2.goto(`${BASE}/library/phonics`, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1600);
  console.log(
    `    localStorage: ${await p2.evaluate(() => Object.keys(localStorage).join(',') || '(없음)')}`
  );
  await record(p2, 's7-noauth', async () => {
    await sleep(1200);
    await clickText(p2, '한글 파닉스');
    await sleep(2800);
  });
} finally {
  await b2.close();
}
console.log('완료:', OUT);
