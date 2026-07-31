// 세계 명작 광고 — k2(그림체)·k3(언어) 재촬영: **아래로 스크롤한 상태**로 찍는다.
//   node scripts/capture-classics-scrolled.mjs <baseUrl> <outDir>
//
// 🔴 기존 클립은 화면 위 60% 를 「1·2·3 가이드 카드」가 차지하고, 정작 바뀌는 것(그림체 칩 ·
//    언어 셀렉트 · 표지)은 아래 가장자리에 눌려 표지가 잘려 나갔다(2026-07-29 지적).
//    선택 바가 화면 위쪽에 오도록 내린 뒤 찍으면 **바뀌는 것이 화면의 주인공**이 된다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer';
import { VIEWPORT, CAPTURE_FPS, sleep, waitReady, installCursor, record, byText, LAUNCH_ARGS} from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:49412';
const OUT = process.argv[3] || '.';
const BOOK = '1772107608499'; // 신데렐라
const STYLES = 3;

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: LAUNCH_ARGS,
});
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport(VIEWPORT);

const coverSrc = () =>
  page.evaluate(() => {
    const i = [...document.images].find((x) => {
      const r = x.getBoundingClientRect();
      return r.width > 100 && r.height > 100;
    });
    return i ? i.currentSrc || i.src : null;
  });

async function waitCover(prev, timeout = 15000) {
  await page
    .waitForFunction(
      (p) => {
        const imgs = [...document.images].filter((i) => {
          const r = i.getBoundingClientRect();
          return r.width > 100 && r.height > 100;
        });
        if (!imgs.length) return false;
        if (!imgs.every((i) => i.complete && i.naturalWidth > 0)) return false;
        return p === null || imgs.some((i) => (i.currentSrc || i.src) !== p);
      },
      { timeout },
      prev ?? null
    )
    .catch(() => console.warn('  ! 표지 대기 타임아웃'));
  await sleep(140);
}

// 표지 교체 순간의 peach 플레이스홀더를 가린다(실측 2~4프레임).
// ⚠️ 선택 바까지 같이 복제해 보려다 실패했다 — flex 자식들이 폭을 잃고 언어 pill 이 아래로
//    떨어져 화면이 통째로 망가진다. 라벨/표지 어긋남은 `swap` 의 **순서**로 푼다(아래).
async function hold() {
  await page.evaluate(() => {
    const img = [...document.images].find((i) => {
      const r = i.getBoundingClientRect();
      return r.width > 100 && r.height > 100;
    });
    const box = img?.parentElement;
    if (!box) return;
    const r = box.getBoundingClientRect();
    const c = box.cloneNode(true);
    c.id = '__adhold';
    Object.assign(c.style, {
      position: 'fixed',
      left: `${r.x}px`,
      top: `${r.y}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
      zIndex: '2147483645',
      pointerEvents: 'none',
    });
    document.body.appendChild(c);
  });
  await sleep(90);
}
const release = () => page.evaluate(() => document.getElementById('__adhold')?.remove());

/**
 * 🔴 여기가 이번 재촬영의 핵심 — **선택 바가 화면 위쪽에 오도록** 내린다.
 * `scrollIntoView` 는 컨테이너를 못 찾으면 조용히 아무 것도 안 하므로, 스크롤 전후 값을
 * 재서 실제로 움직였는지 확인한다(안 움직였는데 찍으면 예전 구도가 그대로 나온다).
 */
// topAt=26 — 70 으로 두면 위에 **가이드 카드 꼬리가 잘린 채** 한 줄 남는다(실측).
async function scrollToSelectors(topAt = 26) {
  const moved = await page.evaluate((topAt) => {
    const sel = document.querySelector('select');
    const bar = sel?.closest('div')?.parentElement;
    if (!bar) return null;
    const before = window.scrollY;
    window.scrollBy({ top: bar.getBoundingClientRect().top - topAt, behavior: 'instant' });
    return { before, after: window.scrollY, barTop: bar.getBoundingClientRect().top };
  }, topAt);
  await sleep(420);
  if (!moved || moved.after === moved.before) {
    throw new Error(`스크롤이 안 먹었다: ${JSON.stringify(moved)}`);
  }
  console.log(`  스크롤 ${moved.before} → ${moved.after} · 선택바 top=${Math.round(moved.barTop)}`);
  return moved;
}

const styleLabel = () =>
  page.evaluate(() => {
    const next = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '→');
    return next?.parentElement?.querySelector('span.truncate')?.textContent?.trim() ?? null;
  });

/** 커서를 띄웠다 누르는 연출 + 실제 클릭. */
async function tapAt(box, label) {
  await installCursor(page);
  await page.evaluate(
    (x, y) => {
      const d = document.getElementById('__adcursor');
      d.classList.remove('on');
      d.style.left = `${x}px`;
      d.style.top = `${y}px`;
      void d.offsetWidth;
      d.classList.add('on');
    },
    box.x,
    box.y
  );
  await sleep(200);
  await page.evaluate(() => document.getElementById('__adcursor')?.classList.add('tap'));
  await sleep(120);
  await box.act();
  await page.evaluate(() => {
    const d = document.getElementById('__adcursor');
    d?.classList.remove('tap');
    d?.classList.remove('on');
  });
  console.log(`  탭: ${label}`);
}

const nextStyleBtn = async () => {
  const b = await page.evaluate(byText('→'));
  if (!b) throw new Error('그림체 → 버튼 못 찾음');
  return { ...b, act: () => page.mouse.click(b.x, b.y) };
};
const langSelect = async (v) => {
  const b = await page.evaluate(() => {
    const el = document.querySelector('select');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!b) throw new Error('언어 셀렉트 못 찾음');
  return { ...b, act: () => page.select('select', v) };
};

// 한 상태가 머무는 시간. 🔴 여기가 곧 씬 길이다 — 4상태 × (DWELL+탭연출+로드) 라
// 1250 이면 씬 하나가 8초가 되어 광고가 64초로 불었다. 650 이면 상태당 ~1.1초.
const DWELL = 650;
let shownAt = 0;
const padDwell = async () => {
  const rest = DWELL - (Date.now() - shownAt);
  if (rest > 0) await sleep(rest);
};
/**
 * 🔴 dwell 을 **탭 앞에서** 채운다. 예전처럼 탭 뒤에 채우면 라벨(탭 즉시 변경)과 표지(dwell 뒤
 * 공개)가 0.75초씩 어긋나 「콜라주라고 써 있는데 수채 표지」가 보인다 — 스크롤해서 표지가
 * 화면 주인공이 되자 눈에 띄게 됐다. 이 순서면 어긋남은 표지 로드 시간(~0.2s)뿐이고,
 * 그건 실제로 눌렀을 때 일어나는 일이라 자연스럽다.
 */
async function swap(change) {
  await padDwell();
  const prev = await coverSrc();
  await hold();
  await change();
  await waitCover(prev);
  await release();
  shownAt = Date.now();
}

function toMp4(name) {
  const scale = (25 / CAPTURE_FPS).toFixed(8);
  execFileSync(
    'ffmpeg',
    ['-y', '-v', 'error', '-itsscale', scale, '-i', path.join(OUT, `${name}.webm`),
     '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
     '-an', '-r', '30', path.join(OUT, `${name}.mp4`)],
    { stdio: 'inherit' }
  );
  const n = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v',
    '-show_entries', 'stream=nb_frames', '-of', 'csv=p=0', path.join(OUT, `${name}.mp4`)])
    .toString().trim();
  console.log(`  → ${name}.mp4  ${n} 프레임 (${(n / 30).toFixed(2)}s)`);
}

try {
  // 게스트 모드 — 미로그인이면 「🔒 잠금」 배지가 뜬다.
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await page.evaluate(() => {
    localStorage.setItem('tb_entry_choice', 'guest');
    localStorage.setItem('tb_guest_started_at', new Date().toISOString());
  });

  // ── k2-styles ────────────────────────────────────────────────────────
  console.log('[k2-styles]');
  await page.goto(`${BASE}/library/${BOOK}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  for (let i = 0; i < STYLES; i++) {
    const prev = await coverSrc();
    await page.evaluate(() =>
      [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '→')?.click()
    );
    await waitCover(prev);
  }
  await scrollToSelectors();
  console.log('  프리워밍 후 그림체:', await styleLabel());
  await installCursor(page);
  await record(page, OUT, 'k2-styles', async () => {
    shownAt = Date.now();
    for (let i = 0; i < STYLES; i++) {
      await swap(async () => tapAt(await nextStyleBtn(), `그림체 ${i + 2}`));
    }
    await padDwell();
    await sleep(500); // 첫 그림체로 돌아온 상태 — 다음 씬이 여기서 이어진다
  });
  console.log('  최종 그림체:', await styleLabel());

  // ── k3-lang — 언어마다 **그림체도 함께** 바뀐다 ────────────────────────
  // 🔴 한 비트에 두 축을 같이 움직인다(2026-07-29 요청). 앞 씬이 그림체를, 이 씬이 언어를
  //    따로 팔았는데, 언어마다 그림이 그대로라 「같은 책이 5개 언어」가 밋밋했다.
  //    탭은 **언어 셀렉트에만** 보여준다 — 그림체는 이미 앞 씬에서 조작을 보여줬고, 여기서
  //    화살표까지 누르면 비트당 탭이 둘이라 늘어진다. 표지를 붙잡은 동안 둘 다 바뀌므로
  //    공개되는 순간엔 한 덩어리 상태 변화로 보인다.
  // ⚠️ 언어별 표지(`primaryCoverByLang`)가 있는 그림체만 쓸 수 있다 — 신데렐라는 화면에 뜨는
  //    3종(페이퍼3D·수채·콜라주) 전부 en/zh/vi/th 를 갖고 있다(데이터 확인 후 진행).
  console.log('[k3-lang]');
  await page.reload({ waitUntil: 'networkidle2' });
  await waitReady(page);
  // 프리워밍 — (그림체 × 언어) 조합을 미리 받아둔다. 안 하면 비트마다 로딩이 끼어든다.
  for (const v of ['en', 'zh', 'ko']) {
    for (let i = 0; i < STYLES; i++) {
      const prev = await coverSrc();
      await page.select('select', v);
      await page.evaluate(() =>
        [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '→')?.click()
      );
      await waitCover(prev);
    }
  }
  await page.reload({ waitUntil: 'networkidle2' }); // 페이퍼3D · 한국어로 초기화
  await waitReady(page);
  await scrollToSelectors();
  await installCursor(page);
  await record(page, OUT, 'k3-lang', async () => {
    shownAt = Date.now();
    for (const [v, name] of [['en', 'English'], ['zh', '中文'], ['ko', '한국어']]) {
      await swap(async () => {
        // 그림체를 한 칸 넘기고(마지막 비트에서 3칸째라 페이퍼3D 로 돌아온다) 언어를 탭한다.
        await page.evaluate(() =>
          [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '→')?.click()
        );
        await tapAt(await langSelect(v), name);
      });
      console.log(`    → ${name} · ${await styleLabel()}`);
    }
    await padDwell();
    await sleep(500); // 🔴 한국어+페이퍼3D 로 끝난다 — 다음 씬이 한국어 화면부터 시작한다
  });
  console.log('  최종:', await page.$eval('select', (e) => e.value), await styleLabel());
} finally {
  await browser.close();
}

for (const n of ['k2-styles', 'k3-lang']) toMp4(n);
console.log('완료:', OUT);
