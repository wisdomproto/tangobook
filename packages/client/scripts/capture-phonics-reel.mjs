// 한글 파닉스 광고 릴스 — 활동 5클립(c4·c5·c6·c7).
//   node scripts/capture-phonics-reel.mjs <baseUrl> <outDir>
//
//   c4-tap    ㄱ 배우기 (누르면 소리)        끝: 1번 카드 뒤집혀 낱말 그림
//   c5-blend  ㄱ+모음 → 가                   끝: 합쳐진 「가」
//   c5-write  ㄱ 써보기 (갸)                 끝: 첫 칸 ㄱ 완성
//   c6-match  그림 짝 찾기                   끝: 3짝 연결됨
//   c7-dots   낱말 그리기 (고기)             끝: 사진 공개 + 「최고야!」
//
// 촬영 규칙 (전부 실제로 당해서 생긴 것) — 자세한 건 `_capture-lib.mjs` 머리말.
// 🔴 고정 sleep 금지 — 프리로드 게이트("준비하고 있어요")를 찍는다 → `waitReady`
// 🔴 획은 캔버스 **한가운데서** 시작한다. 모서리는 `rounded-xl` 밖이라 pointerdown 이 안 닿아 조용히 0%.
// 🔴 칠하는 속도는 **아이가 쓰는 속도**로. 봇 속도면 0.6초에 다 차고 나머지가 정지 화면이 된다.
// 🔴 합체(`blend-listen`)는 `which !== step` 가드가 있어 **번갈아** 눌러야 진행된다.
// 🔴 녹화는 공용 `record` — 자체 `page.screencast` 는 fps 를 안 줘서 정지 구간이 압축된다.
import fs from 'node:fs';
import puppeteer from 'puppeteer';
import {
  VIEWPORT,
  LAUNCH_ARGS,
  sleep,
  waitReady,
  record,
  toMp4,
  seedGuest,
} from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:59827';
const OUT = process.argv[3] || '.';
const ONLY = process.argv.slice(4); // 예: c5-write
const UNIT = 'kr-h1-u02'; // ㄱ 배우기
const KO = `${BASE}/library/phonics/korean`;
const want = (n) => ONLY.length === 0 || ONLY.includes(n);

fs.mkdirSync(OUT, { recursive: true });

const clickAria = (page, label) =>
  page.evaluate((a) => {
    const el = [...document.querySelectorAll('button,[role=button]')].find(
      (y) => y.getAttribute('aria-label') === a
    );
    if (el) el.click();
    return !!el;
  }, label);

const prompt = (page) =>
  page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));

/** 캔버스 위 손가락 궤적. pts = 캔버스 상대좌표. stepMs = 점 사이 이동 시간. */
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
function zigzag(offset = 0) {
  const step = BRUSH / 2;
  const rows = [];
  const lo = 0.08;
  const hi = 0.92;
  for (let y = lo + offset; y <= hi; y += step) {
    const f = rows.length % 4 === 0;
    rows.push([f ? lo : hi, y], [f ? hi : lo, y]);
  }
  return rows;
}

/**
 * 화면이 바뀔 때까지(= 글자가 완성될 때까지) 천천히 칠한다.
 * 🔴 정해진 패스 수만 칠하면 **99% 를 못 넘겨** 「완성」 순간이 클립에 없다(예전 c5-write 가 0% 로 끝났다).
 */
async function fillUntilDone(page, { stepMs = 100, maxPasses = 6 } = {}) {
  const before = await prompt(page);
  for (let p = 0; p < maxPasses; p++) {
    const c = await mainCanvas(page);
    if (!c) break;
    await drawPath(page, c, zigzag(p % 2 ? BRUSH / 4 : 0), stepMs);
    await sleep(320);
    if ((await prompt(page)) !== before) {
      console.log(`    완성 (패스 ${p + 1})`);
      return true;
    }
  }
  console.warn('    ! 완성 못 함 — 화면이 안 바뀌었다');
  return false;
}

/**
 * 정답 뒤 뜨는 「동화 장면」 오버레이(`SceneReveal`)를 즉시 닫는 감시자.
 * 🔴 파닉스 낱말엔 붙은 동화 장면이 없어 **검은 카드**가 뜬다 — 광고 한복판에 그게 12프레임 남았다.
 *    화면을 누르면 닫히므로, 60ms 마다 보고 있다가 뜨는 즉시 누른다.
 */
function watchSceneReveal(page) {
  let stop = false;
  (async () => {
    while (!stop) {
      await page
        .evaluate(() => {
          if (!document.body.innerText.includes('화면을 누르면 다음으로')) return;
          document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.dispatchEvent(
            new MouseEvent('click', { bubbles: true })
          );
        })
        .catch(() => {});
      await sleep(60);
    }
  })();
  return () => {
    stop = true;
  };
}

const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
const page = await browser.newPage();
await page.setViewport(VIEWPORT);

const made = [];
try {
  await seedGuest(page, BASE);

  // ── c4-tap ────────────────────────────────────────────────────────
  // 🔴 카드 단어는 `pickPhonicsWordCards` 가 **셔플**해서 매번 다르다. 광고 음원이 `word-gagu`
  //    라서 1번 카드가 **가구** 로 뽑힐 때까지 다시 찍는다(단어를 미리 읽을 방법이 없다 —
  //    뒤집히기 전 aria-label 은 「ㄱ 1번 카드」다). 찍고 나서 확인하는 수밖에 없다.
  if (want('c4-tap')) {
    console.log('[c4-tap] ㄱ 배우기');
    for (let t = 0; t < 12; t++) {
      await page.goto(`${KO}/${UNIT}/consonant-tap`, { waitUntil: 'networkidle2', timeout: 60000 });
      await waitReady(page);
      const slot = await page.evaluate(() =>
        [...document.querySelectorAll('button')].findIndex(
          (b) => b.getAttribute('aria-label') === 'ㄱ 1번 카드'
        )
      );
      await record(page, OUT, 'c4-tap', async () => {
        await sleep(500);
        // 🔴 화면 지시가 **"세 번씩"** 이라 카드당 3번을 눌러야 점 3개가 켜지고 낱말 그림이 뜬다.
        for (let k = 0; k < 3; k++) {
          await clickAria(page, 'ㄱ 1번 카드');
          await sleep(520);
        }
        await sleep(1500); // 뒤집기 + 낱말 그림
        for (let k = 0; k < 2; k++) {
          await clickAria(page, 'ㄱ 2번 카드');
          await sleep(520);
        }
        await sleep(600);
      });
      const word = await page.evaluate(
        (i) => document.querySelectorAll('button')[i]?.getAttribute('aria-label'),
        slot
      );
      console.log(`    1번 카드 = ${word}`);
      if (word === '가구') break;
    }
    made.push('c4-tap');
  }

  // ── c5-blend ──────────────────────────────────────────────────────
  if (want('c5-blend')) {
    console.log('[c5-blend] ㄱ+모음 → 가');
    await page.goto(`${KO}/${UNIT}/blend-listen`, { waitUntil: 'networkidle2', timeout: 60000 });
    await waitReady(page);
    await record(page, OUT, 'c5-blend', async () => {
      await sleep(500);
      for (let r = 0; r < 2; r++) {
        for (const l of ['ㄱ', 'ㅏ']) {
          await clickAria(page, l);
          await sleep(900);
        }
      }
      // 🔴 합쳐진 「가」에서 **끝나야** 한다 — 고정 sleep 이면 활동이 다음 짝(ㄱ+ㅑ)으로 넘어간
      //    뒤가 3초쯤 더 붙는다(실측). 합체를 기다렸다가 1.2초만 더 문다.
      await page.waitForFunction(() => document.body.innerText.includes('두 소리가 만나서'), {
        timeout: 20000,
      });
      // 🔴 합쳐진 「가」가 화면에 머무는 건 **0.5초 남짓**이다 — 여기서 1.2초를 더 물었더니
      //    다음 짝(ㄱ+ㅑ)이 3초쯤 붙어 클립이 엉뚱한 그림으로 끝났다.
      await sleep(60); // record 가 뒤에 160ms 를 더 문다 — 합쳐 ~0.2초
    });
    made.push('c5-blend');
  }

  // ── c5-write ──────────────────────────────────────────────────────
  // 🔴 쓸 음절은 `pickRandom` 이라 매번 다르다. 기존 음원(write-gya·syl-gya)이 **갸** 라서
  //    첫 음절이 갸 로 뽑힐 때까지 새로고침한다(세로로 쌓이는 ㅗㅛㅜㅠㅡ 는 구도도 달라진다).
  if (want('c5-write')) {
    console.log('[c5-write] ㄱ 써보기');
    let target = null;
    for (let i = 0; i < 25; i++) {
      await page.goto(`${KO}/${UNIT}/consonant-write`, { waitUntil: 'networkidle2', timeout: 60000 });
      await waitReady(page, 'canvas');
      target = await page.evaluate(() => {
        const el = [...document.querySelectorAll('button,span,div')]
          .filter((e) => /^[가-힣]$/.test(e.textContent?.trim() ?? ''))
          .map((e) => e.textContent.trim());
        return el[0] ?? null;
      });
      if (target === '갸') break;
      console.log(`    첫 음절 ${target} — 다시`);
    }
    console.log(`    첫 음절: ${target}`);
    await record(page, OUT, 'c5-write', async () => {
      await sleep(500);
      await fillUntilDone(page, { stepMs: 110 });
      await sleep(1400);
    });
    made.push('c5-write');
  }

  // ── c6-match ──────────────────────────────────────────────────────
  if (want('c6-match')) {
    console.log('[c6-match] 그림 짝 찾기');
    await page.goto(`${KO}/${UNIT}/game-line-matching`, { waitUntil: 'networkidle2', timeout: 60000 });
    await waitReady(page, '[data-image-card]');
    const stopWatch = watchSceneReveal(page);
    await record(page, OUT, 'c6-match', async () => {
      await sleep(500);
      const idxs = await page.$$eval('[data-image-card]', (els) =>
        els.map((e) => e.getAttribute('data-image-card'))
      );
      for (const i of idxs.slice(0, 3)) {
        const img = await page.$(`[data-image-card="${i}"]`);
        const word = await page.$(`[data-word-card="${i}"]`);
        if (!img || !word) continue;
        await img.click();
        await sleep(480);
        await word.click();
        await sleep(1100); // 정답 피드백
      }
      await sleep(500);
    });
    stopWatch();
    made.push('c6-match');
  }

  // ── c7-dots ───────────────────────────────────────────────────────
  // 🔴 여기도 낱말이 랜덤이다 — 광고 음원이 `word-gogi` 라 **고기** 가 나올 때까지 새로고침한다.
  //    낱말은 **찍기 전에** 알 수 있다 — 칠할 그림의 `img.alt` 가 그 낱말이다.
  //    (찍고 나서 확인하면 한 판이 24초라 열 번을 헛찍는다. 실제로 그랬다.)
  if (want('c7-dots')) {
    console.log('[c7-dots] 낱말 그리기');
    let word = null;
    for (let t = 0; t < 20; t++) {
      await page.goto(`${KO}/${UNIT}/game-dots`, { waitUntil: 'networkidle2', timeout: 60000 });
      await waitReady(page, 'canvas');
      word = await page.evaluate(() => document.images[0]?.alt ?? null);
      if (word === '고기') break;
      console.log(`    낱말 ${word} — 다시`);
    }
    console.log(`    낱말: ${word}`);
    await record(page, OUT, 'c7-dots', async () => {
      await sleep(500);
      await fillUntilDone(page, { stepMs: 95 });
      await sleep(2600); // 사진 공개 + 최고야!
    });
    made.push('c7-dots');
  }
} finally {
  await browser.close();
}

for (const n of made) toMp4(OUT, n);
console.log('완료:', OUT, made.join(' · '));
