// 파닉스 단원 화면 스틸 — 블로그·기본글에 넣을 「실제 학습 화면」.
//   node scripts/capture-phonics-unit.mjs <baseUrl> <outDir> <unitId...>
//   예: … kr-h1-u02 kr-h1-u03
//
// 단원마다 3장: ①단원 화면(익히기 + 낱말 놀이) ②첫 익히기 활동 ③낱말 게임 하나.
// 🔴 파닉스는 이제 게이팅된다(`PHONICS_ALWAYS_FREE=false` + `GuestGate`, 2026-07-29) —
//    게스트 모드를 심지 않으면 학습 화면 대신 진입 게이트가 찍힌다.
// 🔴 화면은 프리로드 게이트("준비하고 있어요")를 지나야 한다 — 고정 sleep 말고 `waitReady`.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { VIEWPORT, sleep, waitReady, LAUNCH_ARGS } from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:49412';
const OUT = process.argv[3] || '.';
const UNITS = process.argv.slice(4);
if (!UNITS.length) throw new Error('단원 id 를 하나 이상 주세요 (예: kr-h1-u02)');

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport(VIEWPORT);

/**
 * 🔴 활동은 **URL 로 직접** 간다. 카드는 `<Link to={/library/phonics/korean/:unitId/:key}>` 라
 * 라벨로 찾아 누르려다 헛돌았다(같은 글자가 헤더에도 있어 엉뚱한 걸 집는다).
 * 키는 `lib/korean-phonics-units.ts` 에 있는 것 그대로다.
 * ⚠️ `game-korean-block` 은 쓰지 않는다 — 모바일에서 자모 타일이 7.2×19.2px 라 그림이 안 된다.
 */
const KO_ACTIVITY = ['consonant-tap', 'vowel-tap', 'blend-listen'];
const KO_GAME = ['game-line-matching', 'game-dots', 'game-word-writing'];
const EN_ACTIVITY = ['letter-sound', 'blend-listen', 'word-listen-choose'];
const EN_GAME = ['game-line-matching', 'game-dots', 'game-word-writing'];

/** 그 화면이 실제로 활동 화면인지 — 빈 화면·404 를 찍지 않도록. */
const looksReal = () =>
  page.evaluate(() => {
    const t = document.body.innerText || '';
    if (/찾을 수 없|없는 단원|오류/.test(t)) return false;
    return document.querySelectorAll('canvas, button, img').length > 2;
  });

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`  → ${name}.png`);
}

/** 라벨(부분일치)로 눌러 화면을 넘긴다. 못 찾으면 null 을 돌려준다(호출부가 판단). */
async function tapLabel(text) {
  const ok = await page.evaluate((t) => {
    const el = [...document.querySelectorAll('a,button,[role=button]')].find(
      (e) => !e.disabled && (e.innerText || '').includes(t)
    );
    if (!el) return false;
    el.click();
    return true;
  }, text);
  if (ok) await sleep(900);
  return ok;
}

try {
  const lang = UNITS[0].startsWith('kr') ? 'korean' : 'english';
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await page.evaluate(() => {
    localStorage.setItem('tb_entry_choice', 'guest');
    localStorage.setItem('tb_guest_started_at', new Date().toISOString());
  });

  for (const unit of UNITS) {
    console.log(`[${unit}]`);
    await page.goto(`${BASE}/library/phonics/${lang}/${unit}`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await waitReady(page);
    // 🔴 게이트가 떴는지 확인 — 떴으면 학습 화면이 아니라 가입 벽을 찍게 된다.
    const gated = await page.evaluate(() =>
      /회원가입|게스트로 시작|로그인/.test(document.body.innerText.slice(0, 400))
    );
    if (gated) throw new Error(`${unit}: 진입 게이트가 떴다 — 게스트 모드가 안 먹었다`);
    await sleep(600);
    await shot(`${unit}-1-unit`);

    // ②③ 익히기·게임 — 후보 키를 차례로 열어보고 **처음으로 제대로 뜨는 것**을 찍는다.
    //     단원마다 활동 구성이 달라(자음/모음/받침/복잡한 모음) 한 키로 고정할 수 없다.
    const groups = [
      { tag: '2-activity', keys: lang === 'korean' ? KO_ACTIVITY : EN_ACTIVITY },
      { tag: '3-game', keys: lang === 'korean' ? KO_GAME : EN_GAME },
    ];
    for (const g of groups) {
      let done = false;
      for (const key of g.keys) {
        await page.goto(`${BASE}/library/phonics/${lang}/${unit}/${key}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });
        await waitReady(page, null);
        await sleep(1400); // 첫 소리·그림이 붙을 틈
        if (!(await looksReal())) continue;
        await shot(`${unit}-${g.tag}`);
        console.log(`     (${key})`);
        done = true;
        break;
      }
      if (!done) console.warn(`  ! ${g.tag}: 후보 ${g.keys.join(', ')} 전부 실패`);
    }
  }
} finally {
  await browser.close();
}
console.log('완료:', OUT);
