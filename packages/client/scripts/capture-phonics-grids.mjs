// 랜딩 「파닉스 진도에도 함께 쌓입니다」 그림 — 한글 자음×모음 표 + 영어 스킬트리 **두 장**.
//
// 🔴 부모 화면은 로그인+부모 게이트 뒤라 헤드리스로 못 간다 → 임시 페이지 `/_shot/phonics-grids`.
//    찍고 나면 그 페이지와 라우트는 지운다.
// 🔴 폭을 넉넉히 — 좁게 찍으면 표가 가로 스크롤이라 마지막 모음 열이 **에러 없이** 잘린다.
//
//   node packages/client/scripts/capture-phonics-grids.mjs [base]
import path from 'node:path';
import fs from 'node:fs';
import puppeteer from 'puppeteer';
import sharp from '../../server/node_modules/sharp/lib/index.js';
import { LAUNCH_ARGS, sleep } from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:5174';
const OUT = path.join(process.cwd(), 'packages/client/public/landing/hangul');

const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
const page = await browser.newPage();
await page.setViewport({ width: 620, height: 1400, deviceScaleFactor: 3 });
await page.goto(`${BASE}/_shot/phonics-grids`, { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(2500);

await page.evaluate(() => {
  // 「자세히」 같은 앱 안 조작 버튼은 랜딩 그림에서 뜻을 잃는다.
  for (const e of document.querySelectorAll('button')) {
    if (/자세히/.test(e.textContent ?? '')) e.style.display = 'none';
  }
  // 🔴 「타겟 단어」 목록은 뺀다 — 전부 「안 봄」 배지라 자랑이 아니라 빈칸으로 읽히고,
  //    한글 카드 하나가 1,700px 이 되어 webp 로도 안 구워진다(실제로 터졌다).
  for (const e of document.querySelectorAll('div')) {
    if (/^타겟 단어/.test((e.textContent ?? '').trim())) e.style.display = 'none';
  }
  // 영어는 Book 1~3 — 한글 표가 세로로 길어서, 둘을 나란히 놓으려면 이쪽도 높이가 있어야 한다.
  // Book 3 이 회색인 건 「아직 안 배운 곳」이라 거짓이 아니다. 4·5 까지 넣으면 회색만 남는다.
  document.querySelectorAll('#shot-en > div > .rounded-2xl').forEach((e, i) => {
    if (i >= 3) e.style.display = 'none';
  });
  // 한글은 첫 카드(자음×모음 표)만.
  document.querySelectorAll('#shot-ko > div > .rounded-2xl').forEach((e, i) => {
    if (i >= 1) e.style.display = 'none';
  });
});
await sleep(400);

for (const [id, name] of [
  ['#shot-ko', 'report-grid'],
  ['#shot-en', 'report-grid-en'],
]) {
  const el = await page.$(id);
  const buf = await el.screenshot({ type: 'png' });
  await sharp(buf).webp({ quality: 84 }).toFile(path.join(OUT, `${name}.webp`));
  const m = await sharp(path.join(OUT, `${name}.webp`)).metadata();
  console.log(`${name}  ${m.width}x${m.height}  ${Math.round(fs.statSync(path.join(OUT, name + '.webp')).size / 1024)}KB`);
}
await browser.close();
