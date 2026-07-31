// 광고 릴스 실촬 공용 헬퍼 — 카테고리별 광고(명작·자연·전래·생활동화)가 같이 쓴다.
//
// 🔴 하루 종일 밟은 함정이 여기 다 들어 있다. 새 촬영 스크립트는 이걸 import 해서 쓸 것.
//   - 고정 sleep 금지: 에셋 프리로드 게이트("준비하고 있어요")를 찍는다 → `waitReady`
//   - screencast 는 CSS 뷰포트 크기로 찍는다(deviceScaleFactor 무시) → `SCALE`
//   - 정지 화면은 프레임이 0개다(repaint 기반) → 안 움직이는 화면은 `shot()` 으로 스틸
//   - 커서는 누르면 **즉시 감춘다**: 남겨두면 화면이 바뀐 뒤 엉뚱한 걸 가리킨다
//   - 획은 캔버스 **한가운데서 시작**: 모서리는 rounded 밖이라 pointerdown 이 안 닿아 조용히 0%
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const VIEWPORT = { width: 360, height: 640, deviceScaleFactor: 3 };
export const CAPTURE_FPS = Number(process.env.CAPTURE_FPS || 120);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 🔴 **화질의 전부가 여기 달렸다** — screencast 는 `setViewport({deviceScaleFactor})` 를 무시하고
 * **CSS 픽셀(360×640)로** 찍는다. 그래서 예전엔 `scale: 3` 으로 3배 확대해 1080×1920 을 만들었는데,
 * 그건 **360p 를 늘린 1080p** 였다(실측: 무손실 스크린샷 대비 PSNR 28.96dB / SSIM 0.944 —
 * ref 를 360 으로 줄였다 늘린 것과 거의 같았다).
 * 창 자체를 3배 DPI 로 띄우면 device 픽셀로 찍혀 **PSNR 54.82dB / SSIM 0.998**(사실상 무손실).
 * ⚠️ 그래서 `SCALE = 1` 이다. 되돌리지 말 것.
 * (VP9 CRF 는 범인이 아니었다 — crf30 vs crf4 가 PSNR 50.7dB 로 사실상 동일.)
 */
export const LAUNCH_ARGS = [
  '--autoplay-policy=no-user-gesture-required',
  `--force-device-scale-factor=${VIEWPORT.deviceScaleFactor}`,
  `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
  '--hide-scrollbars',
];
export const SCALE = 1;

const CURSOR_CSS = `
#__adcursor{position:fixed;left:0;top:0;width:74px;height:74px;margin:-37px 0 0 -37px;
 border-radius:999px;background:rgba(255,255,255,.42);border:4px solid rgba(255,255,255,.95);
 box-shadow:0 6px 22px rgba(0,0,0,.28);z-index:2147483647;pointer-events:none;opacity:0;
 transition:transform .14s ease,opacity .12s ease}
#__adcursor.on{opacity:1}
#__adcursor.tap{transform:scale(.72);background:rgba(255,255,255,.75)}`;

export async function installCursor(page) {
  await page.evaluate((css) => {
    if (document.getElementById('__adcursor')) return;
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
    const d = document.createElement('div');
    d.id = '__adcursor';
    document.body.appendChild(d);
  }, CURSOR_CSS);
}

/**
 * 🔴 screencast 는 **화면이 변할 때만** 프레임을 준다. 그래서 "바꾸고 나서 가만히 두는" 마지막
 * 상태가 통째로 사라진다 — 클립 꼬리가 직전 화면으로 채워져 **바꾸기 전 그림으로 끝난다**
 * (실측: 언어를 한국어로 되돌렸는데 클립 끝까지 중국어 표지가 3초).
 * 1px 짜리 색을 10Hz 로 뒤집어 프레임이 끊기지 않게 한다. `record` 가 알아서 돌린다.
 * 🔴 CSS 애니로는 안 된다 — 매끄러운 애니(60Hz)는 puppeteer 의 프레임 복제 `round(fps*Δt)`
 * 가 Δt<16.7ms 를 0 으로 내려 **시간이 절반이 되고**(5.7초→3.0초), `steps()` 로 늦추면
 * 컴포지터가 삼켜 프레임이 아예 안 온다. 노드에서 직접 스타일을 바꾸는 것만 확실했다.
 */
function startBeat(page, ms = 100) {
  let stop = false;
  let on = false;
  (async () => {
    while (!stop) {
      on = !on;
      await page
        .evaluate((v) => {
          let d = document.getElementById('__adbeat');
          if (!d) {
            d = document.createElement('div');
            d.id = '__adbeat';
            Object.assign(d.style, {
              position: 'fixed',
              right: '0',
              bottom: '0',
              width: '1px',
              height: '1px',
              zIndex: '2147483646',
              pointerEvents: 'none',
            });
            document.body.appendChild(d);
          }
          d.style.background = v ? '#fdf8f0' : '#fdf8f1';
        }, on)
        .catch(() => {});
      await sleep(ms);
    }
  })();
  return () => {
    stop = true;
  };
}

/** 프리로드 게이트가 사라지고, 선택자가 뜨고, 보이는 이미지가 전부 로드될 때까지. */
export async function waitReady(page, selector, { images = true } = {}) {
  await page
    .waitForFunction(() => !document.body.innerText.includes('준비하고 있어요'), { timeout: 60000 })
    .catch(() => {});
  if (selector) await page.waitForSelector(selector, { timeout: 30000 });
  if (images) {
    await page
      .waitForFunction(
        () => {
          const imgs = [...document.images].filter((i) => i.getBoundingClientRect().width > 20);
          return imgs.length === 0 || imgs.every((i) => i.complete && i.naturalWidth > 0);
        },
        { timeout: 30000 }
      )
      .catch(() => {});
  }
  await sleep(500);
}

export const byAria = (aria) => `(() => {
  const el=[...document.querySelectorAll('button,a,[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(aria)});
  if(!el) return null; const r=el.getBoundingClientRect();
  return {x:r.x+r.width/2, y:r.y+r.height/2};
})()`;

export const byText = (txt, nth = 0) => `(() => {
  const els=[...document.querySelectorAll('a,button,[role=button]')].filter(e=>e.getBoundingClientRect().width>10)
    .filter(e=>e.innerText.replace(/\\s+/g,' ').includes(${JSON.stringify(txt)}));
  const el=els[${nth}]; if(!el) return null; const r=el.getBoundingClientRect();
  return {x:r.x+r.width/2, y:r.y+r.height/2};
})()`;

/** 커서를 목표 위에 띄우고 → 누르고 → **즉시 감춘다**. */
export async function tap(page, expr, label, settle = 340) {
  await installCursor(page);
  const box = await page.evaluate(expr);
  if (!box) {
    console.warn(`  ! 못 찾음: ${label}`);
    return false;
  }
  await page.evaluate(
    (x, y) => {
      const d = document.getElementById('__adcursor');
      if (!d) return;
      d.classList.remove('on');
      d.style.left = `${x}px`;
      d.style.top = `${y}px`;
      void d.offsetWidth;
      d.classList.add('on');
    },
    box.x,
    box.y
  );
  await sleep(settle);
  await page.evaluate(() => document.getElementById('__adcursor')?.classList.add('tap'));
  await sleep(150);
  await page.mouse.click(box.x, box.y);
  await page.evaluate(() => {
    const d = document.getElementById('__adcursor');
    d?.classList.remove('tap');
    d?.classList.remove('on');
  });
  console.log(`  탭: ${label}`);
  return true;
}

export async function record(page, out, name, fn) {
  const webm = path.join(out, `${name}.webm`);
  const t0 = Date.now();
  // 🔴 `fps` 를 안 주면 정지 구간이 통째로 **압축된다** — 실측 5초 녹화가 1.56초로 나온다
  // (repaint 없는 구간이 프레임 복제 없이 건너뛰어진다). 명시하면 벽시계와 일치한다.
  // 🔴 그리고 **높게** 준다: puppeteer 는 프레임을 `round(fps*Δt)` 로 복제하는데, 헤드리스
  // 크롬은 vsync 없이 그리므로 애니 중엔 Δt 가 8ms 까지 내려가 30fps 기준으로 0 이 된다
  // (= 그 구간이 통째로 사라져 클립이 빨라진다). 120 이면 Δt≥4ms 까지 안 잃는다.
  // 최종 mp4 는 어차피 `-r 30` 으로 내린다.
  const rec = await page.screencast({ path: webm, scale: SCALE, fps: CAPTURE_FPS });
  const stopBeat = startBeat(page);
  try {
    await fn();
    await sleep(160); // 마지막 변화가 프레임으로 나갈 틈
  } finally {
    stopBeat();
    await rec.stop();
  }
  const mb = fs.existsSync(webm) ? (fs.statSync(webm).size / 1048576).toFixed(2) : '0';
  console.log(`  → ${name}.webm  ${mb}MB  (벽시계 ${((Date.now() - t0) / 1000).toFixed(2)}s)`);
}

/**
 * webm → mp4(30fps).
 * 🔴 `-itsscale 25/CAPTURE_FPS` 필수 — puppeteer webm 은 실제 fps 와 무관하게 **25fps 로 태깅**된다.
 *    안 주면 120fps 로 찍은 게 4.8배 느리게 재생된다.
 */
export function toMp4(out, name) {
  const src = path.join(out, `${name}.webm`);
  const dst = path.join(out, `${name}.mp4`);
  execFileSync(
    'ffmpeg',
    ['-y', '-v', 'error', '-itsscale', (25 / CAPTURE_FPS).toFixed(8), '-i', src,
     '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
     '-an', '-r', '30', dst],
    { stdio: 'inherit' }
  );
  const n = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v',
    '-show_entries', 'stream=nb_frames', '-of', 'csv=p=0', dst]).toString().trim();
  console.log(`  → ${name}.mp4  ${n} 프레임 (${(n / 30).toFixed(2)}s)`);
  return Number(n);
}

/**
 * 게스트 모드 심기 — 미로그인이면 「🔒 잠금」 배지가 뜨고, 파닉스는 GuestGate 가 막는다.
 * 🔴 `tb_guest_started_at` 은 **ISO 문자열**이어야 한다(`Date.now()` 숫자면 창 계산이 NaN 이라 안 풀린다).
 */
export async function seedGuest(page, base) {
  await page.goto(`${base}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => {
    localStorage.setItem('tb_entry_choice', 'guest');
    localStorage.setItem('tb_guest_started_at', new Date().toISOString());
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await waitReady(page);
  const locks = await page.evaluate(() => (document.body.innerText.match(/잠금/g) || []).length);
  if (locks) throw new Error(`게스트 모드가 안 먹었다 — 잠금 배지 ${locks}개`);
  console.log('  게스트 모드 OK (잠금 0)');
}

export async function shot(page, out, name) {
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log(`  → ${name}.png`);
}
