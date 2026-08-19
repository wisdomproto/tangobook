// 순환 그림 둘째 칸 — 「그림짝 맞추기」에서 **아기**를 맞힌 순간.
//
// 🔴 셋째 칸(동화책 리빌)이 「아기」라서 여기도 아기여야 한다(2026-08-19 사용자: "가운데는 고기인데
//    오른쪽은 아기인 게 맞냐"). 세 칸이 한 낱말을 따라가지 않으면 「그 낱말이 책을 연다」가 안 보인다.
// 🔴 그림 카드에 alt 가 없다 — **파일명의 로마자**(`…-agi-…`)로 고른다.
// 🔴 맞히면 잠시 뒤 동화 리빌이 덮으므로, 선이 그려진 직후에 찍는다.
//
//   node packages/client/scripts/capture-cycle-play.mjs [base]
import path from 'node:path'; import fs from 'node:fs';
import puppeteer from 'puppeteer';
import sharp from '../../server/node_modules/sharp/lib/index.js';
import { LAUNCH_ARGS, sleep } from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:5174';
const WORD = process.argv[3] || 'agi';
const LABEL = process.argv[4] || '아기';
const OUT = path.join(process.cwd(), 'packages/client/public/landing/hangul/cycle-play.webp');

const b = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
await p.goto(`${BASE}/library/phonics/korean/kr-h1-u02/game-line-matching`, {
  waitUntil: 'networkidle2',
  timeout: 60000,
});
await sleep(6000);

const picked = await p.evaluate(
  (w, label) => {
    const img = [...document.querySelectorAll('img')].find((i) => i.src.includes(`-${w}-`));
    const btn = [...document.querySelectorAll('button')].find(
      (e) => (e.textContent || '').trim() === label
    );
    if (!img || !btn) return null;
    (img.closest('button') ?? img).click();
    btn.click();
    return true;
  },
  WORD,
  LABEL
);
if (!picked) throw new Error(`카드를 못 찾았다: ${WORD}/${LABEL}`);
await sleep(900); // 선이 그려질 만큼만 — 더 두면 동화 리빌이 덮는다

await p.evaluate(() => {
  for (const e of document.querySelectorAll('a, button')) {
    if (/뒤로|홈|Home|Back/.test(e.textContent || '')) e.style.visibility = 'hidden';
  }
});
const buf = await p.screenshot({ type: 'png' });
await sharp(buf).resize(1280, 720, { fit: 'cover' }).webp({ quality: 84 }).toFile(OUT);
console.log('cycle-play', Math.round(fs.statSync(OUT).size / 1024) + 'KB');
await b.close();
