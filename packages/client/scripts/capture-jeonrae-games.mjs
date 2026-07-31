// 전래 동화 광고 릴스 — 「단어 익히기」 게임 실촬(명작 스크립트 포크, 책만 다르다).
//   node scripts/capture-jeonrae-games.mjs <baseUrl> <outDir> [clip...]
//
// 광고에 그림짝 하나만 들어가 있어서 "게임이 하나뿐"으로 보였다 → 4종을 각각 찍는다.
//   g1-match  그림짝 맞추기      g3-draw   단어 그림 그리기(칠하기)
//   g2-block  한글 블록          g4-write  따라 쓰기
//   g5-reveal 정답 → **동화 장면 리빌**(어두운 오버레이 + 그 단어가 나오는 페이지 + 나레이션)
//
// 🔴 촬영 함정은 `_capture-lib.mjs` 주석에 다 있다. 여기 것만 추가로:
//   - 그림짝/따라쓰기는 정답 뒤 **몇 초 후** 장면 리빌이 스스로 뜬다(단어 발음 → 칭찬 → 리빌).
//     리빌을 원치 않는 클립은 그 전에 끊어야 한다.
//   - 칠하기 캔버스는 `pointerdown` 이 캔버스 안에서 시작해야 한다(모서리 X) — `_capture-lib` 참조.
//   - 따라쓰기는 **순차 모드**라 지금 칸 밖은 clip 되어 아예 안 칠해진다. 칸(코랄 링)을 읽어 그 안만 칠한다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer';
import { VIEWPORT, CAPTURE_FPS, sleep, waitReady, installCursor, tap, record, shot, LAUNCH_ARGS} from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:49412';
const OUT = process.argv[3] || '.';
const ONLY = process.argv.slice(4);
const BOOK = '1784529056876'; // 흥부와 놀부 — 낱말 5개(박·지게·톱·엽전·짚신)
// 🔴 공룡을 앞세운 건 취향이 아니라 실측이다 — 채널에 배달되는 시청자군이 공룡 시청자이고
//    검색량도 종명이 압도적이다(memory `youtube-korea-redesign-2026-07-28`).
const want = (n) => ONLY.length === 0 || ONLY.includes(n);

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: LAUNCH_ARGS,
});
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport(VIEWPORT);

const marks = {};
let t0 = 0;
const mark = (clip, what) => {
  (marks[clip] ??= []).push({ what, ms: Date.now() - t0 });
  console.log(`    · ${what} @${Date.now() - t0}ms`);
};

const bySel = (sel) => `(() => {
  const el=document.querySelector(${JSON.stringify(sel)}); if(!el) return null;
  const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};
})()`;

/** 게임 카드 라벨로 진입 — 프리로드 게이트가 걷힐 때까지 기다린다. */
async function enter(label, readySel) {
  await page.goto(`${BASE}/vocabulary/book-${BOOK}?lang=ko`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  const ok = await page.evaluate((l) => {
    const b = [...document.querySelectorAll('button')].find((e) => !e.disabled && e.innerText.includes(l));
    if (!b) return false;
    b.click();
    return true;
  }, label);
  if (!ok) throw new Error(`게임 카드 못 찾음: ${label}`);
  await sleep(400);
  await page.waitForFunction(() => !document.body.innerText.includes('준비하고 있어요'), { timeout: 60000 });
  if (readySel) await page.waitForSelector(readySel, { timeout: 30000 });
  await sleep(900);
  await installCursor(page);
}

/** 캔버스 상대좌표 궤적. 🔴 pointerdown 은 캔버스 한가운데서. */
async function drawPath(page, box, pts, stepMs) {
  const at = ([rx, ry]) => [box.x + box.width * rx, box.y + box.height * ry];
  const [cx, cy] = at([0.5, 0.5]);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  const [sx, sy] = at(pts[0]);
  await page.mouse.move(sx, sy);
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = at(pts[i - 1]);
    const [tx, ty] = at(pts[i]);
    for (let s = 1; s <= 8; s++) {
      await page.mouse.move(px + ((tx - px) * s) / 8, py + ((ty - py) * s) / 8);
      await sleep(stepMs / 8);
    }
  }
  await page.mouse.up();
}

/** 지그재그로 박스를 칠한다. step = 세로 간격(상대). */
function serpentine(step, lo = 0.06, hi = 0.94, phase = 0) {
  const rows = [];
  let i = 0;
  for (let y = lo + phase * step; y <= hi; y += step) {
    const f = i++ % 2 === 0;
    rows.push([f ? lo : hi, y], [f ? hi : lo, y]);
  }
  return rows;
}

const doneCount = () =>
  page.evaluate(() => {
    const m = document.body.innerText.match(/(\d+)\/(\d+) 글자/);
    return m ? { done: Number(m[1]), total: Number(m[2]) } : { done: 0, total: 0 };
  });

/**
 * 따라쓰기 — 코랄 링(지금 쓸 칸)만 칠한다. 칸이 끝나면 링이 다음 칸으로 옮겨간다.
 * `stopAt` 만큼 칸이 끝나면 멈춘다(g5 는 앞 칸을 녹화 전에 미리 칠해 두려고 쓴다).
 */
async function paintWriteZones({ budgetMs = 9000, stepMs = 30, stopAt = Infinity } = {}) {
  const canvas = await boxOf('canvas');
  const started = Date.now();
  const step = 28 / 360; // 캔버스 720×360 · 붓 56px → 세로 간격은 붓의 절반
  for (let pass = 0; pass < 20; pass++) {
    const before = await doneCount();
    if (before.done >= stopAt) break;
    if (before.total && before.done >= before.total) break;
    if (Date.now() - started > budgetMs) break;
    const ring = await boxOf('[class*="ring-coral-400"]');
    if (!ring) break;
    await drawPath(
      page,
      { x: ring.x + 2, y: canvas.y, width: ring.width - 4, height: canvas.height },
      serpentine(step, 0.04, 0.96, (pass % 3) * 0.33),
      stepMs // 아이가 쓰는 속도
    );
    const after = await doneCount();
    if (after.done > before.done) mark('write', `${after.done}/${after.total} 글자 완성`);
    await sleep(120);
  }
}

const boxOf = (sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, sel);

/** 🔴 puppeteer webm 은 실제 fps 와 무관하게 25fps 로 태깅된다. */
function toMp4(name) {
  const scale = (25 / CAPTURE_FPS).toFixed(8);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-itsscale', scale, '-i', path.join(OUT, `${name}.webm`),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-an', '-r', '30', path.join(OUT, `${name}.mp4`)], { stdio: 'inherit' });
  const n = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-count_frames',
    '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', path.join(OUT, `${name}.mp4`)])
    .toString().trim().replace(/,/g, '');
  console.log(`  → ${name}.mp4  ${n} 프레임 (${(Number(n) / 30).toFixed(2)}s)`);
  return Number(n);
}

try {
  // ── 게스트 앵커 + 잠금 배지 0 확인 ───────────────────────────────────
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await page.evaluate(() => {
    localStorage.setItem('tb_entry_choice', 'guest');
    localStorage.setItem('tb_guest_started_at', new Date().toISOString());
  });
  await page.goto(`${BASE}/library?category=${encodeURIComponent('세계 명작')}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  const locks = await page.evaluate(() => (document.body.innerText.match(/잠금/g) || []).length);
  console.log(`[0] 게스트 모드 — 드릴인 격자 잠금 배지 ${locks}`);
  if (locks !== 0) throw new Error('게스트 모드인데 잠금 배지가 남았다');

  // ── g1-match — 그림짝 맞추기 (틀린 선 없이, 리빌 전에 끊는다) ────────
  if (want('g1-match')) {
    console.log('[g1-match]');
    await enter('그림짝 맞추기', '[data-image-card]');
    await page.waitForFunction(() => {
      const b = document.querySelector('[data-image-card]');
      return b && !b.disabled;
    }, { timeout: 30000 });
    const idxs = await page.$$eval('[data-image-card]', (e) => e.map((x) => x.getAttribute('data-image-card')));
    console.log('  카드', idxs.length, '쌍');
    await record(page, OUT, 'g1-match', async () => {
      t0 = Date.now();
      // 🔴 정답 **1쌍만**. 정답 ≈1.5초 뒤에 장면 리빌이 스스로 떠서 화면을 덮는다 —
      //    두 쌍째를 누르면 그 탭이 리빌 오버레이에 먹혀 짝이 안 맞는다(실측). 리빌은 g5 에서.
      await sleep(1500); // 판을 먼저 보여준다(4~6초를 채우는 것도 이 lead-in)
      const i = idxs[0];
      await tap(page, bySel(`[data-image-card="${i}"]`), `그림 ${i}`, 260);
      await sleep(300);
      await tap(page, bySel(`[data-word-card="${i}"]`), `단어 ${i}`, 260);
      mark('g1-match', `정답 ${i}`);
      await sleep(1250); // 선 + 「정답!」 + 호리까지, 리빌 직전에 끊는다
    });
  }

  // ── g2-block — 한글 블록 (자모 타일 크기 실측 후 판단) ───────────────
  if (want('g2-block')) {
    console.log('[g2-block]');
    await enter('한글 블록', '[data-jamo-tile]');
    const tiles = await page.$$eval('[data-jamo-tile]', (els) =>
      els.map((e) => { const r = e.getBoundingClientRect(); return { j: e.getAttribute('data-jamo-tile'), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; }));
    const word = await page.evaluate(() => document.querySelector('h1.font-display')?.textContent?.trim() ?? null);
    console.log(`  목표 단어 ${word} · 타일 ${tiles.length}개, 첫 타일 ${tiles[0]?.w}×${tiles[0]?.h}px`);
    fs.writeFileSync(path.join(OUT, 'g2-block-tiles.json'), JSON.stringify({ word, tiles }, null, 1));
    await shot(page, OUT, 'g2-block-screen');
  }

  // ── g3-draw — 단어 그림 그리기(칠하기) ───────────────────────────────
  if (want('g3-draw')) {
    console.log('[g3-draw]');
    await enter('단어 그림 그리기', 'canvas');
    const box = await boxOf('canvas');
    console.log('  캔버스', JSON.stringify(box));
    await record(page, OUT, 'g3-draw', async () => {
      t0 = Date.now();
      await sleep(500);
      // 붓 지름 = 캔버스 폭 8%(PEN_RATIO). 세로 간격은 그 절반으로 겹친다.
      // 🔴 한 번만 훑어도 99% 가 차서 완성된다 — 더 칠하면 다음 단어로 넘어가고 리빌까지 들어온다.
      const step = (0.08 * box.width) / box.height / 2;
      await drawPath(page, box, serpentine(step, 0.06, 0.94), 62); // 아이가 칠하는 속도
      mark('g3-draw', '한 판 다 칠함');
      await sleep(1400); // 🎉 + 호리 + 낱말까지, 리빌 직전에 끊는다
    });
  }

  // ── g4-write — 따라 쓰기 (칸별 순차) ─────────────────────────────────
  if (want('g4-write')) {
    console.log('[g4-write]');
    await enter('따라 쓰기', 'canvas');
    await record(page, OUT, 'g4-write', async () => {
      t0 = Date.now();
      await sleep(400);
      await paintWriteZones({ budgetMs: 6000 });
      await sleep(600); // 두 글자가 초록으로 남는 것까지 — 리빌 전에 끊는다
    });
  }

  // ── g5-reveal — 정답 → 동화 장면 리빌 (광고의 마지막 게임) ───────────
  if (want('g5-reveal')) {
    console.log('[g5-reveal]');
    // 🔴 **리빌은 낱말을 가린다** — `resolve-scene.ts` `findValidatedPageNumber` 가 그 낱말이
    //    본문에 실제로 나오는 쪽만 인정하고, 없으면 **엉뚱한 장면 대신 아무것도 안 띄운다**.
    //    티라노 책은 10개 중 4개(숲·야자수·나뭇잎·코)가 본문에 없어서, 그게 걸리면 리빌이 없다
    //    (두 번 연속 그렇게 헛돌았다). 본문에 나오는 낱말이 걸릴 때까지 다시 뽑는다.
    // 🔴 이 책은 낱말 5개가 **전부 본문에 등장**해서 리셔플이 사실상 필요 없다(자연은 4/10이 없었다).
    const SCENE_WORDS = ['박', '지게', '톱', '엽전', '짚신'];
    let target = null;
    for (let tryN = 0; tryN < 8; tryN++) {
      await enter('따라 쓰기', 'canvas');
      // 낱말은 화면 위쪽 **큰 그림의 alt** 다. (본문 문구로 찾으면 「글자를 색칠해봐」의
      // '글자' 가 먼저 걸린다 — 실제로 그렇게 네 번 헛돌았다.)
      target = await page.evaluate(() => {
        const big = [...document.querySelectorAll('img')]
          .filter((i) => i.getBoundingClientRect().width > 100)
          .map((i) => i.alt)
          .filter(Boolean);
        return big[0] || null;
      });
      if (target && SCENE_WORDS.includes(target)) break;
      console.log(`  낱말 「${target ?? '?'}」 — 리빌이 없는 낱말이라 다시 뽑는다`);
      target = null;
    }
    if (!target) throw new Error('본문에 나오는 낱말이 8번 안에 안 걸렸다');
    console.log(`  낱말: ${target}`);
    // 🔴 리빌 삽화는 그 순간에 처음 받는다 — 안 데워두면 어두운 화면이 0.8초 비어 있다.
    //    (앱은 블록 게임에서만 장면 자산을 미리 데운다.)
    const warmed = await page.evaluate(async (id) => {
      const r = await fetch(`/api/storybooks/${id}`).then((x) => x.json()).catch(() => null);
      if (!r) return 0;
      const urls = [...new Set(JSON.stringify(r).match(/https?:\/\/[^"\\]+?\.(?:webp|png|jpe?g)/g) ?? [])];
      await Promise.all(urls.slice(0, 80).map((u) => new Promise((res) => {
        const i = new Image();
        i.onload = i.onerror = () => res();
        i.src = u;
      })));
      return urls.length;
    }, BOOK);
    console.log(`  장면 삽화 프리워밍 ${warmed}장`);
    // 🔴 단어는 라운드마다 바뀐다(1~3글자) — **마지막 한 글자만 남기고** 녹화 전에 칠해 두어야
    //    클립 길이가 단어 길이에 안 휘둘린다.
    const { total } = await doneCount();
    await paintWriteZones({ stopAt: Math.max(0, total - 1) });
    await sleep(300);
    await record(page, OUT, 'g5-reveal', async () => {
      t0 = Date.now();
      await sleep(400);
      await paintWriteZones({ budgetMs: 5000 });
      mark('g5-reveal', '단어 완성');
      // 단어 발음 → 칭찬 → SceneReveal(어두운 오버레이 + 페이지 자막 + 나레이션)
      await page.waitForFunction(() => !!document.querySelector('[aria-label="다음으로"]'), { timeout: 30000 })
        .then(() => mark('g5-reveal', '장면 리빌 등장'))
        .catch(() => console.warn('  ! 리빌이 안 떴다'));
      await sleep(4200); // 나레이션 + 자막을 끝까지
    });
  }

  fs.writeFileSync(path.join(OUT, 'games-marks.json'), JSON.stringify(marks, null, 2));
} finally {
  await browser.close();
}

console.log('[mp4]');
const frames = {};
for (const n of ['g1-match', 'g3-draw', 'g4-write', 'g5-reveal']) {
  if (want(n) && fs.existsSync(path.join(OUT, `${n}.webm`))) frames[n] = toMp4(n);
}
console.log('완료:', OUT, JSON.stringify(frames));
