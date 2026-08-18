/**
 * 히어로 브릿지의 「글자와 소리를 배우고」 그림을 다시 찍는다.
 *
 * 🔴 **왜 다시 찍나**: 예전 그림이 `ㄷ + ㅏ → 다` 인데 바로 아래 낱말 카드가 「구두」다.
 *    구두는 ㄷ+ㅜ 라, 위에서 만든 글자가 아래 낱말에 없다 — 이어진다고 말하는 그림이
 *    정작 안 이어져 있었다.
 *
 * 🔴 창을 **3배 DPI 로 띄운다**(`_capture-lib` 의 `LAUNCH_ARGS`). `deviceScaleFactor` 만 주면
 *    스크린샷은 따르지만 습관을 갈라 두면 다음 사람이 screencast 에서 그대로 밟는다.
 *
 * 사용: node packages/client/scripts/capture-bridge-letter.mjs [http://localhost:5176]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { LAUNCH_ARGS, VIEWPORT, sleep } from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:5176';
// 🔴 **가로 모음이어야 한다.** ㅜ·ㅗ 같은 세로 모음은 자음 **아래**에 서서 그림이 세로로 길어지고,
//    이 자리는 34% 폭 칸이라 그러면 히어로가 통째로 커진다. ㄹ 단원을 쓰는 이유가 그것이다 —
//    「리」 = ㄹ + ㅣ 는 옆에 붙고, 그 단원 낱말이 **오리·다리·너구리**라 아래 낱말 그림과도 이어진다.
//    (ㄷ 단원은 낱말이 도마·두유·구두라 셋 다 세로 모음이어서 가로 액자를 못 맞춘다.)
const UNIT = process.env.UNIT || 'kr-h1-u05'; // ㄹ
const TARGET = process.env.TARGET || '리';
const ACTIVITY = process.env.ACTIVITY || 'ㄹ+모음';
const VOWEL = process.env.VOWEL || 'ㅣ';
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'landing',
  'hangul',
  'bridge-letter.webp'
);

const clickText = async (page, text, tag = '*') => {
  const found = await page.evaluate(
    (t, sel) => {
      const els = [...document.querySelectorAll(sel)].filter(
        (e) => e.textContent?.trim() === t && e.getBoundingClientRect().width > 0
      );
      const el = els[els.length - 1]; // 가장 안쪽 요소
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      (el.closest('button,a') ?? el).click();
      return true;
    },
    text,
    tag
  );
  if (!found) throw new Error(`못 찾음: ${text}`);
  await sleep(900);
};

const browser = await puppeteer.launch({ headless: 'new', args: LAUNCH_ARGS });
const page = await browser.newPage();
// 🔴 **낮은 화면으로 찍는다.** 활동이 `100dvh` 라 640px 로 찍으면 음절 띠와 글자 타일이 위아래
//    끝으로 벌어져 가운데가 텅 빈다(실측 360×425). 화면을 낮추면 둘이 붙어 가로 액자에 들어간다.
await page.setViewport({ ...VIEWPORT, height: Number(process.env.VH || 430) });
await page.goto(`${BASE}/library/phonics/korean/${UNIT}`, { waitUntil: 'networkidle2' });
await sleep(1500);

await clickText(page, ACTIVITY);
await sleep(1800);
await clickText(page, TARGET); // 목록에서 「두」부터 시작할 수 있다
await sleep(1500);

// 🔴 누르기 **전** 상태를 찍는다 — 가로 모음이면 두 글자가 이미 나란히 서 있어 그것으로 충분하다.
await sleep(Number(process.env.MERGE_MS || 300));

// 찍을 자리 = **음절 띠 맨 위부터 글자 타일 맨 아래까지**.
// 🔴 「두」 칩 하나를 기준으로 잡으면 띠가 잘리고(다·댜·더… 가 밖으로) 아래 모음 타일도 놓친다.
//    띠는 칩의 **부모**, 아래는 모음 글자 타일의 바닥으로 잡는다.
const clip = await page.evaluate((t, vowel) => {
  const chip = [...document.querySelectorAll('*')].find(
    (e) => e.textContent?.trim() === t && e.getBoundingClientRect().width > 0
  );
  const vowelTile = [...document.querySelectorAll('*')]
    .filter((e) => e.textContent?.trim() === vowel && e.getBoundingClientRect().height > 30)
    .pop();
  if (!chip || !vowelTile) return null;
  const strip = chip.parentElement.getBoundingClientRect();
  const bottom = vowelTile.getBoundingClientRect().bottom;
  const y = Math.max(0, strip.top - 10);
  return {
    x: 0,
    y,
    width: window.innerWidth,
    height: Math.min(window.innerHeight - y, bottom - y + 12),
  };
}, TARGET, VOWEL);
if (!clip) throw new Error(`음절 띠 또는 모음 타일(${VOWEL})을 못 찾음`);
console.log('  자른 영역', JSON.stringify(clip));

const raw = OUT.replace(/\.webp$/, '.raw.png');
fs.writeFileSync(raw, await page.screenshot({ clip }));
console.log(`→ ${raw}`);
console.log('이제: cd packages/server && node -e "…sharp(raw).resize(460,270).webp()…"');
await browser.close();
