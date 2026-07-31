// 세계 명작 광고 — 마지막 「책 리스트 쫙」 클립(g6-list).
//   node scripts/capture-classics-list.mjs <baseUrl> <outDir>
//
// 드릴인 격자(/library?category=세계 명작)를 천천히 훑는다. 🔴 게스트 모드로 심어야
// 「🔒 잠금」 배지가 안 뜬다 — 「1년 무료」를 파는 광고에 자물쇠가 나오면 안 된다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer';
import { VIEWPORT, CAPTURE_FPS, sleep, waitReady, record, LAUNCH_ARGS } from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:49412';
const OUT = process.argv[3] || '.';
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
  });
  await page.goto(`${BASE}/library?category=${encodeURIComponent('세계 명작')}`, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  await waitReady(page);
  const locks = await page.evaluate(() => (document.body.innerText.match(/잠금/g) || []).length);
  if (locks) throw new Error(`격자에 잠금 배지 ${locks}개 — 게스트 모드가 안 먹었다`);

  // 🔴 격자는 **화면 밖**에서 시작한다 — 배너·묶어보기·검색·칩이 위에 있어서, 그냥 찍으면
  //    첫 2초가 라이브러리 홈이다(실측). 표지가 화면을 채운 지점까지 먼저 내려놓고 녹화한다.
  await page.evaluate(() => {
    const img = [...document.images].find((i) => i.getBoundingClientRect().width > 120);
    const card = img?.closest('button');
    if (card) window.scrollBy({ top: card.getBoundingClientRect().top - 40, behavior: 'instant' });
  });
  await sleep(600);
  const atTop = await page.evaluate(() => window.scrollY);
  if (atTop < 200) throw new Error(`격자까지 안 내려갔다(scrollY=${atTop})`);
  console.log(`  시작 위치 scrollY=${atTop}`);

  await record(page, OUT, 'g6-list', async () => {
    await sleep(500);
    // 천천히 훑는다 — 한 번에 크게 뛰면 표지가 흐르는 띠로만 보인다.
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy({ top: 620, behavior: 'smooth' }));
      await sleep(760);
    }
    await sleep(400);
  });
} finally {
  await browser.close();
}

const scale = (25 / CAPTURE_FPS).toFixed(8);
execFileSync('ffmpeg', ['-y', '-v', 'error', '-itsscale', scale, '-i', path.join(OUT, 'g6-list.webm'),
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-an', '-r', '30', path.join(OUT, 'g6-list.mp4')], { stdio: 'inherit' });
const n = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries',
  'stream=nb_frames', '-of', 'csv=p=0', path.join(OUT, 'g6-list.mp4')]).toString().trim();
console.log(`→ g6-list.mp4  ${n} 프레임 (${(n / 30).toFixed(2)}s)`);
