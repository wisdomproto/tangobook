// 세계 명작 광고 릴스 — 재촬영 3건(k2 그림체 · k3 언어 · k6 그림짝).
//   node scripts/capture-classics-reshoot.mjs <baseUrl> <outDir>
//
// 검수에서 나온 결함을 촬영 단계에서 고친다:
//   k2 — 그림체마다 같은 시간 머물고, 표지가 다 뜬 뒤 넘기고, **첫 그림체로 돌아와 끝낸다**
//        (다음 씬이 페이퍼3D 로 시작해서, 콜라주로 끝나면 그림이 튄다)
//   k3 — 언어를 바꾸면 표지가 다시 로드된다. 다 뜰 때까지 기다린다. **한국어로 끝낸다**
//   k6 — 같은 인덱스끼리만 눌러 틀린 선을 아예 안 긋고, 정답 간격을 일정하게
//   k1 — 오프닝. 게스트 모드라 드릴인 격자에 자물쇠가 없다. 신데렐라 탭 뒤 0.6초에 끊어
//        상세 페이지 **로딩 스켈레톤**이 한 프레임도 안 들어가게 한다
//
// 🔴 게스트 모드를 심고 찍는다 — 미로그인은 무료 11권만 열려 「🔒 잠금」 배지가 그리드에 뜬다.
//    「1년 무료」를 파는 광고에 자물쇠가 나오면 안 된다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer';
import {
  VIEWPORT,
  CAPTURE_FPS,
  sleep,
  waitReady,
  installCursor,
  tap,
  record,
  shot,
  byText, LAUNCH_ARGS} from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:49412';
const OUT = process.argv[3] || '.';
const BOOK = '1772107608499'; // 신데렐라
const STYLES = 3; // 페이퍼 3D 아트 → 수채동화풍 → 콜라주 → (wrap) 페이퍼 3D 아트

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: LAUNCH_ARGS,
});
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport(VIEWPORT);

/** 화면에서 가장 큰 이미지(=표지)의 현재 src. */
const coverSrc = () =>
  page.evaluate(() => {
    const imgs = [...document.images].filter((i) => {
      const r = i.getBoundingClientRect();
      return r.width > 100 && r.height > 100;
    });
    return imgs[0] ? imgs[0].currentSrc || imgs[0].src : null;
  });

/** 큰 이미지가 **전부 로드**되고(빈 칸 X), prev 와 다른 걸로 바뀔 때까지. */
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
  await sleep(140); // 페인트 한 박자
}

/**
 * 🔴 표지 src 가 바뀌면 `BookCover` 의 <img> 가 remount 되고(key={src}), 디코드가 끝날 때까지
 * peach 플레이스홀더가 비친다 — 실측 2~4프레임. 앱에선 눈에 안 띄지만 광고엔 **빈 칸**으로 박힌다.
 * 바꾸기 직전에 지금 표지를 그대로 복제해 덮어두고, 새 표지가 다 뜨면 걷는다.
 */
async function holdCover() {
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
  await sleep(90); // 복제본이 먼저 그려지고 나서 바꾼다
}
const releaseCover = () =>
  page.evaluate(() => document.getElementById('__adhold')?.remove());

// 「더 보기」는 카테고리 줄마다 있다 — 세계 명작 줄 **바로 위**, 그리고 화면 안에 있는 것.
// 🔴 화면 밖 버튼을 집으면 `mouse.click` 이 조용히 허공을 눌러 드릴인이 통째로 안 일어난다.
const moreInClassics = `(() => {
  const row=[...document.querySelectorAll('[role=region]')].find(x=>x.getAttribute('aria-label')==='세계 명작');
  if(!row) return null; const top=row.getBoundingClientRect().top;
  const cand=[...document.querySelectorAll('button,a')]
    .filter(e=>e.innerText.includes('더 보기'))
    .map(e=>e.getBoundingClientRect())
    .filter(r=>r.width>10 && r.top>0 && r.bottom<window.innerHeight && r.bottom<=top+8)
    .sort((a,b)=>b.top-a.top);
  const r=cand[0]; if(!r) return null;
  return {x:r.x+r.width/2, y:r.y+r.height/2};
})()`;

// 🔴 책 카드엔 글자가 없다(표지에 제목이 그려져 있다) — 표지 alt 로 찾는다.
const coverByAlt = (title) => `(() => {
  const img=[...document.querySelectorAll('button img')].find(i=>(i.alt||'').includes(${JSON.stringify(title)}));
  const btn=img?.closest('button'); if(!btn) return null; const r=btn.getBoundingClientRect();
  return {x:r.x+r.width/2, y:r.y+r.height/2};
})()`;

const styleLabel = () =>
  page.evaluate(() => {
    const next = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '→');
    return next?.parentElement?.querySelector('span.truncate')?.textContent?.trim() ?? null;
  });

/** 셀렉트 위에 커서를 띄웠다 누르는 연출 + 실제 값 변경. 네이티브 팝업은 녹화에 안 잡힌다. */
async function tapSelect(value, label) {
  await installCursor(page);
  const box = await page.evaluate(() => {
    const el = document.querySelector('select');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!box) throw new Error('언어 셀렉트 못 찾음');
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
  await sleep(340);
  await page.evaluate(() => document.getElementById('__adcursor')?.classList.add('tap'));
  await sleep(150);
  await page.select('select', value);
  await page.evaluate(() => {
    const d = document.getElementById('__adcursor');
    d?.classList.remove('tap');
    d?.classList.remove('on');
  });
  console.log(`  탭: ${label}`);
}

const marks = {}; // 클립별 "여기서 바뀐다" 기대 시각(ms, 녹화 시작 기준) — 픽셀 측정과 대조용
let t0 = 0;
const mark = (clip, what) => {
  (marks[clip] ??= []).push({ what, ms: Date.now() - t0 });
};

// 🔴 한 화면이 보이는 시간을 **표지 교체 시점 기준으로** 일정하게 맞춘다.
// 앞에 고정 sleep 만 두면 표지 로딩 시간이 그대로 더해져 첫 화면만 1.9초씩 머문다.
const DWELL = 1250;
let shownAt = 0;
const padDwell = async () => {
  const rest = DWELL - (Date.now() - shownAt);
  if (rest > 0) await sleep(rest);
};

/** 지금 화면을 붙잡아 둔 채 바꾸고, 새 표지가 다 뜬 뒤 남은 dwell 을 채우고 공개한다. */
async function swap(clip, label, change) {
  const prev = await coverSrc();
  await holdCover();
  await change();
  await waitCover(prev);
  await padDwell();
  await releaseCover();
  shownAt = Date.now();
  mark(clip, await label());
}

/** ffmpeg 변환 — 🔴 puppeteer webm 은 실제 fps 와 무관하게 **25fps 로 태깅**된다. */
function toMp4(name) {
  const scale = (25 / CAPTURE_FPS).toFixed(8);
  execFileSync(
    'ffmpeg',
    ['-y', '-v', 'error', '-itsscale', scale, '-i', path.join(OUT, `${name}.webm`),
     '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
     '-an', '-r', '30', path.join(OUT, `${name}.mp4`)],
    { stdio: 'inherit' }
  );
  const n = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=nb_frames',
    '-of', 'csv=p=0', path.join(OUT, `${name}.mp4`),
  ])
    .toString()
    .trim();
  console.log(`  → ${name}.mp4  ${n} 프레임 (${(n / 30).toFixed(2)}s)`);
  return Number(n);
}

try {
  // ── 0. 게스트 모드 심기 + 잠금 배지 사라진 것 확인 ────────────────────
  console.log('[0] 게스트 모드');
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  const locksBefore = await page.evaluate(
    () => (document.body.innerText.match(/잠금/g) || []).length
  );
  await page.evaluate(() => {
    localStorage.setItem('tb_entry_choice', 'guest');
    localStorage.setItem('tb_guest_started_at', new Date().toISOString());
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await waitReady(page);
  const locksAfter = await page.evaluate(
    () => (document.body.innerText.match(/잠금/g) || []).length
  );
  // 드릴인 그리드(세계 명작 전체 보기)에서도 확인 — 잠금 배지가 실제로 보이던 화면.
  await page.goto(`${BASE}/library?category=${encodeURIComponent('세계 명작')}`, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  await waitReady(page);
  const locksGrid = await page.evaluate(
    () => (document.body.innerText.match(/잠금/g) || []).length
  );
  await shot(page, OUT, 'guest-proof-grid');
  console.log(`  잠금 배지: /library ${locksBefore} → ${locksAfter} · 드릴인 그리드 ${locksGrid}`);
  if (locksAfter !== 0 || locksGrid !== 0) throw new Error('게스트 모드인데 잠금 배지가 남았다');

  // ── ⓪ k1-journey — 라이브러리 진입 여정 (오프닝) ──────────────────────
  console.log('[1] k1-journey');
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await installCursor(page);
  await record(page, OUT, 'k1-journey', async () => {
    t0 = Date.now();
    await sleep(450);
    // 「묶어 보기」는 기본이 펼침 — 먼저 접어야 아래 카테고리 줄이 보인다.
    await tap(page, byText('묶어 보기'), '묶어 보기 접기');
    mark('k1-journey', '묶어보기 접힘');
    await sleep(750);
    await page.evaluate(() =>
      [...document.querySelectorAll('[role=region]')]
        .find((x) => x.getAttribute('aria-label') === '세계 명작')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );
    mark('k1-journey', '세계 명작 줄로 스크롤');
    await sleep(1350);
    await tap(page, moreInClassics, '더 보기');
    // 드릴인이 실제로 일어났는지 확인 — 안 눌리면 그냥 원래 화면이 계속 찍힌다.
    await page.waitForFunction(() => location.search.includes('category='), { timeout: 5000 });
    mark('k1-journey', '더 보기 탭 → 격자');
    await sleep(1500);
    // 🔴 탭 뒤에 상세 페이지로 넘어가면 **로딩 스켈레톤**이 찍힌다(실측: 0.6초 꼬리가 통째로 스켈레톤).
    // 라우팅만 막아 두면 누르는 연출은 그대로 두고 격자 위에서 끝낼 수 있다.
    await page.evaluate(() =>
      document.addEventListener(
        'click',
        (e) => {
          if (e.target.closest('button')) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      )
    );
    await tap(page, coverByAlt('신데렐라'), '신데렐라 표지');
    mark('k1-journey', '신데렐라 탭');
    await sleep(600);
  });
  console.log('  끝난 화면:', page.url());

  // ── ① k2-styles — 그림체 3종 → 첫 그림체로 복귀 ───────────────────────
  console.log('[2] k2-styles');
  await page.goto(`${BASE}/library/${BOOK}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  // 프리워밍: 표지 3장을 미리 받아둔다(녹화 중엔 캐시에서 즉시 뜬다).
  for (let i = 0; i < STYLES; i++) {
    const prev = await coverSrc();
    await page.evaluate(() =>
      [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '→')?.click()
    );
    await waitCover(prev);
  }
  console.log('  프리워밍 후 그림체:', await styleLabel()); // 첫 그림체로 돌아와 있어야 한다
  await installCursor(page);

  await record(page, OUT, 'k2-styles', async () => {
    t0 = shownAt = Date.now();
    mark('k2-styles', `보임 ${await styleLabel()}`);
    for (let i = 0; i < STYLES; i++) {
      await swap('k2-styles', styleLabel, () => tap(page, byText('→'), `그림체 ${i + 2}`));
    }
    await sleep(1900); // 첫 그림체로 돌아온 상태를 넉넉히 (다음 씬이 여기서 이어진다)
  });
  console.log('  최종 그림체:', await styleLabel());

  // ── ② k3-lang — 언어 고르기, 한국어로 끝난다 ──────────────────────────
  console.log('[3] k3-lang');
  await page.reload({ waitUntil: 'networkidle2' }); // 그림체·언어 초기화(페이퍼3D · 한국어)
  await waitReady(page);
  for (const v of ['en', 'zh', 'ko']) {
    const prev = await coverSrc();
    await page.select('select', v);
    await waitCover(prev);
  }
  await installCursor(page);

  await record(page, OUT, 'k3-lang', async () => {
    t0 = shownAt = Date.now();
    mark('k3-lang', '보임 ko');
    for (const [v, name] of [
      ['en', 'English'],
      ['zh', '中文'],
      ['ko', '한국어'],
    ]) {
      await swap('k3-lang', () => v, () => tapSelect(v, name));
    }
    await sleep(1400); // 🔴 한국어로 끝난다 — 다음 씬이 한국어 화면부터 시작한다
  });
  console.log('  최종 언어:', await page.$eval('select', (e) => e.value));

  // ── ③ k6-match — 그림 짝 찾기, 틀린 선 없이 ───────────────────────────
  console.log('[4] k6-match');
  await page.goto(`${BASE}/vocabulary/book-${BOOK}?lang=ko`, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  await waitReady(page);
  await installCursor(page);
  await tap(page, byText('그림짝 맞추기'), '그림짝 맞추기');
  await waitReady(page, '[data-image-card]');
  // 음원 프리페치 overlay 가 걷히고 카드가 눌러질 때까지(disabled 면 클릭이 그냥 씹힌다).
  await page.waitForFunction(
    () => {
      const b = document.querySelector('[data-image-card]');
      return b && !b.disabled;
    },
    { timeout: 30000 }
  );
  const idxs = await page.$$eval('[data-image-card]', (els) =>
    els.map((e) => e.getAttribute('data-image-card'))
  );
  console.log('  카드', idxs.length, '쌍');

  await record(page, OUT, 'k6-match', async () => {
    t0 = Date.now();
    await sleep(450);
    for (const i of idxs) {
      // 🔴 인덱스가 같으면 정답 짝 — 순서대로만 눌러 틀린 선을 아예 안 긋는다.
      await page.click(`[data-image-card="${i}"]`);
      await sleep(400);
      await page.click(`[data-word-card="${i}"]`);
      mark('k6-match', `정답 ${i}`);
      if (i === idxs[idxs.length - 1]) break; // 마지막 뒤엔 아래 연출 시간만
      await sleep(800); // 정답 → 다음 정답 간격 1.2s 로 균일
    }
    await sleep(2400); // 마지막 정답 뒤 연출 — 칭찬이 끝나고 4/4 가 뜰 때까지
  });

  // 표지 박스(측정용) — 비디오 픽셀 = CSS × 3
  await page.goto(`${BASE}/library/${BOOK}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  const rect = await page.evaluate(() => {
    const imgs = [...document.images].filter((i) => {
      const r = i.getBoundingClientRect();
      return r.width > 100 && r.height > 100;
    });
    const r = imgs[0].getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
  fs.writeFileSync(
    path.join(OUT, 'reshoot-marks.json'),
    JSON.stringify({ coverRectCss: rect, marks }, null, 2)
  );
  console.log('  표지 박스(CSS):', JSON.stringify(rect));
} finally {
  await browser.close();
}

console.log('[5] mp4 변환');
for (const n of ['k1-journey', 'k2-styles', 'k3-lang', 'k6-match']) toMp4(n);
console.log('완료:', OUT);
