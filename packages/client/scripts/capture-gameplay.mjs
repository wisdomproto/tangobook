// 실제 앱 게임 플레이를 녹화한다 (광고 릴스 실촬용).
// 로컬 클라이언트(프로덕션 API) 를 puppeteer 로 열고, 정답을 눌러가며 page.screencast 로 webm 을 받는다.
//   node scripts/capture-gameplay.mjs <baseUrl> <outDir>
//
// 🔴 고정 sleep 으로 기다리지 마라. 이 앱엔 에셋 프리로드 게이트("그림과 소리를 준비하고 있어요")가 있고
//    단어 카드 이미지는 늦게 붙는다. 준비 안 된 화면을 찍으면 로딩바만 남는다(1차 시도에서 실제로 그랬다).
// 🔴 screencast 는 CSS 뷰포트 크기로 찍는다 — deviceScaleFactor 는 무시된다. 크기는 `scale` 옵션으로 올린다.
import puppeteer from 'puppeteer';
import { LAUNCH_ARGS, record } from './_capture-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:64546';
const OUT = process.argv[3] || '.';
const BOOK = '1778555233699'; // 백설공주
const VOCAB = `${BASE}/vocabulary/book-${BOOK}?lang=ko`;

// 360×640 = 9:16 정확 + 모바일 레이아웃(<640 sm). screencast 는 scale 3 → 1080×1920,
// 스크린샷은 deviceScaleFactor 3 → 1080×1920. (screencast 는 dsf 를 무시하므로 둘 다 필요하다.)
const VIEWPORT = { width: 360, height: 640, deviceScaleFactor: 3 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(page, text) {
  await page.waitForFunction(
    (t) =>
      [...document.querySelectorAll('button')].some((b) =>
        b.innerText.replace(/\s+/g, ' ').includes(t)
      ),
    { timeout: 30000 },
    text
  );
  await page.evaluate((t) => {
    [...document.querySelectorAll('button')]
      .find((b) => b.innerText.replace(/\s+/g, ' ').includes(t))
      .click();
  }, text);
}

/** 프리로드 게이트가 사라지고, 선택자가 뜨고, 보이는 이미지가 전부 로드될 때까지. */
async function waitReady(page, selector) {
  await page.waitForFunction(() => !document.body.innerText.includes('준비하고 있어요'), {
    timeout: 60000,
  });
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.waitForFunction(
    () => {
      const imgs = [...document.images].filter((i) => i.getBoundingClientRect().width > 0);
      return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
    },
    { timeout: 30000 }
  );
  await sleep(600); // 등장 애니메이션이 자리 잡을 여유
}

/** 그림짝 — data-image-card / data-word-card 의 인덱스가 같으면 정답 짝이다. */
async function playLineMatching(page) {
  const idxs = await page.$$eval('[data-image-card]', (els) =>
    els.map((e) => e.getAttribute('data-image-card'))
  );
  for (const i of idxs) {
    const img = await page.$(`[data-image-card="${i}"]`);
    const word = await page.$(`[data-word-card="${i}"]`);
    if (!img || !word) continue;
    if (await img.evaluate((e) => e.disabled)) continue;
    await img.click();
    await sleep(450);
    await word.click();
    await sleep(950); // 정답 피드백
  }
}

// 🔴 블록 타일은 음절(사·과)이 아니라 자모(ㅅ·ㅏ·ㄱ·ㅘ)다. 분해해서 눌러야 한다.
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];

function decomposeHangul(word) {
  const out = [];
  for (const ch of word) {
    const idx = ch.charCodeAt(0) - 0xac00;
    if (idx < 0 || idx > 11171) {
      out.push(ch);
      continue;
    }
    out.push(CHO[Math.floor(idx / 588)]);
    out.push(JUNG[Math.floor((idx % 588) / 28)]);
    const jong = JONG[idx % 28];
    if (jong) out.push(jong);
  }
  return out;
}

/** 화면에 떠 있는 목표 단어(h1.font-display). 🔴 라운드마다 바뀌고 순서는 우리가 못 고른다. */
async function readTargetWord(page) {
  return page.evaluate(() => {
    const h = [...document.querySelectorAll('h1.font-display')].find((e) =>
      /^[가-힣]{1,3}$/.test(e.textContent.trim())
    );
    return h ? h.textContent.trim() : null;
  });
}

/**
 * 한글 블록 — 라운드마다 목표 단어를 읽어 자모로 분해해 누른다.
 * 🔴 목표 단어는 게임이 고른다(어댑터가 랜덤 N). "사과" 를 눌러도 그 라운드가 "침대" 면 아무것도 안 놓인다
 *    (1차 시도에서 0/3 으로 끝났다). 반드시 화면에서 읽어서 쓴다.
 * 반환: [{ word, atMs }] — 녹화 시작 기준 경과 시각. 원하는 단어 구간만 잘라내는 데 쓴다.
 */
async function playKoreanBlock(page, rounds = 3) {
  const t0 = Date.now();
  const log = [];
  for (let r = 0; r < rounds; r++) {
    const word = await readTargetWord(page);
    if (!word) break;
    const atMs = Date.now() - t0;
    const jamo = decomposeHangul(word);
    console.log(`  R${r + 1} ${word} → ${jamo.join(' ')}  (+${(atMs / 1000).toFixed(1)}s)`);
    log.push({ word, atMs });
    for (const j of jamo) {
      const tile = await page.$(`[data-jamo-tile="${j}"]`);
      if (!tile) {
        console.warn(`  ! 타일 없음: ${j}`);
        continue;
      }
      await tile.click();
      await sleep(700);
    }
    // 자동 채점이 아니면 확인을 눌러야 한다.
    const confirmed = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(
        (x) => x.innerText.trim() === '확인' && !x.disabled
      );
      if (!b) return false;
      b.click();
      return true;
    });
    await sleep(confirmed ? 2400 : 1800); // 정답 연출
    if (word === await readTargetWord(page)) await sleep(1200); // 아직 안 넘어갔으면 여유
  }
  return log;
}

const browser = await puppeteer.launch({
  headless: true,
  args: LAUNCH_ARGS,
});
const page = await browser.newPage();
await page.setViewport(VIEWPORT);

try {
  // 1) 단어 카드 화면 (S4) — 🔴 정지 화면이라 screencast 가 프레임을 하나도 안 만든다(repaint 기반,
  //    1차 시도에서 0바이트 webm 이 나왔다). 스틸로 받는다.
  console.log('[1/3] 단어 둘러보기 (스틸)');
  await page.goto(VOCAB, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page, 'button');
  await page.screenshot({
    path: path.join(OUT, 'words.png'),
    captureBeyondViewport: false,
  });
  console.log('  → words.png');

  // 2) 그림짝 맞추기 (S5)
  console.log('[2/3] 그림짝 맞추기');
  await clickByText(page, '그림짝 맞추기');
  await waitReady(page, '[data-image-card]');
  await record(page, OUT, 'linematch', () => playLineMatching(page));

  // 3) 한글 블록 (S6)
  console.log('[3/3] 한글 블록');
  await page.goto(VOCAB, { waitUntil: 'networkidle2', timeout: 60000 });
  await clickByText(page, '한글 블록');
  await waitReady(page, '[data-jamo-tile]');
  let rounds = [];
  await record(page, OUT, 'block', async () => {
    rounds = await playKoreanBlock(page, 3);
  });
  fs.writeFileSync(path.join(OUT, 'block-rounds.json'), JSON.stringify(rounds, null, 2));
  console.log('  라운드:', rounds.map((r) => `${r.word}@${(r.atMs / 1000).toFixed(1)}s`).join(' · '));
} finally {
  await browser.close();
}
console.log('완료:', OUT);
