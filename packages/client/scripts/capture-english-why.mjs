// 「왜 파닉스인가」 영어판 카드 석 장 — 한글 `why-{sound,blend,new}.webp` 의 짝.
//
// 🔴 영어 구간에 낱말 카드만 있고 활동 그림이 없어서, 한글을 읽다 온 부모에게 **낱말 넉 장이
//    난데없이** 튀어나왔다(2026-08-19 사용자). 같은 자리에 같은 문법으로 활동 셋을 세운다.
// 🔴 두 단원 다 무료 단원이라(`en-b1-u01`·`en-b2-u01`) 게이트가 안 뜬다 — 잠긴 단원을 찍으면
//    벽이 찍힌다.
//
//   node packages/client/scripts/capture-english-why.mjs http://localhost:5174
import puppeteer from 'puppeteer';
import sharp from '../../server/node_modules/sharp/lib/index.js';
import path from 'node:path';
import fs from 'node:fs';
import { LAUNCH_ARGS } from './_capture-lib.mjs';

const BASE = process.argv[2] ?? 'http://localhost:5174';
const OUT = path.join(process.cwd(), 'packages/client/public/landing/hangul');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SHOTS = [
  ['en-why-sound', '/library/phonics/english/en-b1-u01/letters-learn'],
  ['en-why-blend', '/library/phonics/english/en-b2-u01/cvc-an'],
  ['en-why-new', '/library/phonics/english/en-b1-u01/word-listen-choose'],
];

const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.5 });

for (const [name, route] of SHOTS) {
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 });
  try {
    await page.waitForFunction(
      () => !/준비하고 있어요|Loading|불러오는/.test(document.body.innerText),
      { timeout: 30000 }
    );
  } catch {}
  await sleep(3000); // 등장 애니메이션
  // 🔴 앱 chrome(뒤로가기)은 지운다 — 한글 카드 석 장이 활동 화면만 담고 있어서, 여기만
  //    버튼이 있으면 넉 장이 한 벌로 안 읽힌다.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('a, button')) {
      if (/돌아가기|뒤로|Back/.test(el.textContent || '')) el.style.visibility = 'hidden';
    }
  });
  const buf = await page.screenshot({ type: 'png' });
  await sharp(buf).resize(960, 540, { fit: 'cover' }).webp({ quality: 82 }).toFile(path.join(OUT, `${name}.webp`));
  const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 100));
  console.log(`${name}  ${Math.round(fs.statSync(path.join(OUT, name + '.webp')).size / 1024)}KB  ${txt}`);
}
await browser.close();
