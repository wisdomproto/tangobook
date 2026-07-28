/**
 * 파닉스 화면 컨택트 시트 — 활동·게임 화면을 훑어 찍고 한 장의 HTML 로 붙인다.
 *
 * 🔴 **왜 필요한가**: 2026-07-28 하루에 사용자가 찾아낸 결함 13건 중 12건이 코드 리뷰의
 *    사각지대였다 — 레이아웃·크기(4) · 한글↔영어 대칭 깨짐(5) · 4~7세 적합성(3).
 *    전부 **화면을 열면 3초 만에** 보이지만 코드만 봐선 안 보이고, jsdom 엔 레이아웃이 없어
 *    테스트로도 못 잡는다. 단원은 71개여도 **화면 종류는 스무 개 남짓**이라 전수가 가능하다.
 *
 * 🔴 **라우트를 적어두지 않는다** — 사이드바와 단원 화면의 링크를 **크롤**한다. 활동이 늘거나
 *    키가 바뀌어도 시트가 저절로 따라오고, 손으로 적은 목록이 낡아 조용히 빠지는 일이 없다.
 *
 * 사용법:
 *   1) `pnpm --filter client dev` (기본 5175)
 *   2) node scripts/phonics-contact-sheet.mjs [--base=http://localhost:5175] [--viewport=mobile]
 *   3) out/phonics-sheet/index.html
 *
 * ⚠️ 활동 화면은 전체화면(`fixed inset-0`)이라 **뷰포트를 명시**해야 한다. 0×0 이면 `vw/vh` 로
 *    잡은 크기가 전부 0 이 되어 아무것도 안 보인다(브라우저 패널에서 실제로 겪었다).
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const BASE = arg('base', 'http://localhost:5175');
const OUT = path.resolve('out/phonics-sheet');
const VIEWPORTS = {
  tablet: { width: 1024, height: 768 },
  desktop: { width: 1440, height: 900 },
  mobile: { width: 375, height: 812, deviceScaleFactor: 2 },
};
const VIEWPORT = VIEWPORTS[arg('viewport', 'tablet')] ?? VIEWPORTS.tablet;
/** 언어별로 몇 개 단원을 훑을지 — 화면 **종류**를 덮는 게 목적이라 전 단원을 돌 필요가 없다. */
const UNITS_PER_LANG = Number(arg('units', 5));
const SETTLE_MS = 1200;

const slug = (s) =>
  s
    .replace(/[^\w가-힣]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

/**
 * 그 화면에서 이동 가능한 하위 링크 — 사이드바 단원 / 단원 안 활동 카드.
 *
 * 🔴 라벨은 **가장 긴 줄**을 쓴다 — 카드의 첫 줄은 번호 배지("1")라 그대로 쓰면 시트가
 *    「u01 · 5」 같은 숫자 목록이 된다(실제로 그렇게 나왔다).
 */
const linksUnder = (page, prefix) =>
  page.$$eval(
    `a[href^="${prefix}"]`,
    (as, p) => {
      const seen = new Map();
      for (const a of as) {
        const h = a.getAttribute('href');
        if (!h || h === p || !h.startsWith(p) || seen.has(h)) continue;
        const longest = (a.innerText || '')
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
          .sort((x, y) => y.length - x.length)[0];
        seen.set(h, { href: h, text: longest || '' });
      }
      return [...seen.values()];
    },
    prefix
  );

/**
 * 사이드바의 레벨을 전부 펼친다.
 *
 * 🔴 기본은 **현재 레벨만 펼침**이라 그냥 링크를 긁으면 한글1 밖에 안 잡힌다 — 받침·쌍자음·
 *    복잡한 모음·복습이 통째로 빠진다. 사용자가 찾아낸 결함이 대부분 그 뒤쪽에 있었으니,
 *    이걸 안 하면 시트가 「앞쪽은 멀쩡하다」만 확인해 준다.
 */
async function expandAllLevels(page) {
  for (let i = 0; i < 8; i++) {
    const count = () => page.$$eval('a[href*="/library/phonics/"]', (as) => as.length);
    const before = await count();
    for (const b of await page.$$('aside button')) {
      await b.click({ delay: 5 }).catch(() => {});
    }
    await new Promise((r) => setTimeout(r, 400));
    if ((await count()) <= before) break;
  }
}

/**
 * 게임은 자산을 데우는 **로딩 게이트** 뒤에서 시작한다 — 그냥 찍으면 85장 중 게임이 전부
 * 「그림과 소리를 준비하고 있어요 50%」 로 찍힌다(실제로 그랬다). 게이트가 사라질 때까지 기다리고,
 * 오래 걸리면 「바로 시작」을 눌러 넘긴다.
 */
async function passLoadingGate(page) {
  for (let i = 0; i < 12; i++) {
    const gated = await page.evaluate(() => document.body.innerText.includes('준비하고 있어요'));
    if (!gated) return;
    if (i === 5) {
      const btns = await page.$$('button');
      for (const b of btns) {
        const txt = await b.evaluate((n) => n.innerText || '');
        if (txt.includes('바로 시작')) await b.click().catch(() => {});
      }
    }
    await new Promise((r) => setTimeout(r, 700));
  }
}

/**
 * 🔴 **잘림을 사람 눈에 맡기지 않는다.** 전체화면 활동이 뷰포트를 넘으면 제목이 위로 밀려 잘리거나
 *    「퀴즈」 버튼이 화면 밖으로 나간다 — 스크린샷을 한 장씩 보다 보면 놓친다. 넘친 높이와
 *    **화면 밖으로 나간 버튼 수**를 재서 시트에 빨간 딱지로 남긴다.
 */
const measureClipping = (page) =>
  page.evaluate(() => {
    const winH = window.innerHeight;
    const overflow = Math.max(0, document.documentElement.scrollHeight - winH);
    // 🔴 **스크롤되는 페이지는 아래로 나간 게 정상**이다(단원 목록). 결함은 ①위로 잘렸거나
    //    ②스크롤이 막힌 전체화면 활동인데 아래로 나간 경우 — 그때만 손이 닿을 수 없다.
    const scrollable = document.documentElement.scrollHeight > winH + 4 &&
      getComputedStyle(document.body).overflowY !== 'hidden';
    const offscreen = [...document.querySelectorAll('button, a, h1, h2')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.height > 0 && (r.top < -1 || (!scrollable && r.bottom > winH + 1)))
      .map(({ el, r }) => `${el.tagName}:${(el.innerText || '').trim().slice(0, 14)}(${Math.round(r.top)})`);
    return { overflow, offscreen: offscreen.slice(0, 6) };
  });

/**
 * 🔴 **소리는 「울렸나」가 아니라 「받아졌나」로 잰다.**
 *
 * 처음엔 `play()` 를 후킹해 무음 클릭·에러·겹침을 셌는데 **거의 다 헛것이었다**(실측으로 확인):
 *   - `MEDIA_ERR_SRC_NOT_SUPPORTED(code=4)` = 오디오 엘리먼트 **하나를 재사용**하며 src 를 바꿀 때
 *     직전 src 에 뜨는 정상 신호다. 결함이 아니다.
 *   - 「겹침」 = `tap.mp3`(버튼음) + 내용음. 설계대로다.
 *   - 「무음 클릭」 = 블록 배치음처럼 **Web Audio(<audio> 아님)** 로 내는 소리와, 애초에 소리가
 *     없는 버튼(퀴즈 시작 등)까지 잡는다.
 * 그래서 남긴 건 **네트워크가 실제로 못 받아온 음원**(4xx·요청 실패)뿐이다 — 이건 명백한 결함이다.
 * ⚠️ 톤·속도·발음이 어색한지는 headless 로 못 듣는다. **그건 여전히 사람 몫**이다.
 */
/**
 * 🔴 **소리의 「타이밍」을 잰다** — 이 프로젝트가 반복해서 고쳐 온 결함이 정확히 두 가지다.
 *
 *   ① **잘림**: 앞 소리가 끝나기 전에 다음 소리가 시작해 앞말이 잘린다. 오디오 채널이 하나라
 *      `playAudio` 가 새 src 를 물리는 순간 앞 소리가 죽는다(띵동이 곧바로 잘리던 단골 버그).
 *   ② **붙음**: 끝나자마자 1~3ms 만에 다음이 시작해 세 소리가 한 덩어리로 들린다.
 *      규칙은 이음매마다 **400~450ms 쉼**(`REST_MS`).
 *
 * 🔴 **버튼음(`/sounds/ui/`)은 빼고 센다** — 탭음과 내용음이 같이 나는 건 설계다. 처음엔 그걸
 *    같이 세는 바람에 「겹침 32건」이 나왔고 전부 헛것이었다. 재는 건 **내용음끼리의 간격**이다.
 * ⚠️ 톤·발음이 어색한지는 여기서 안 잰다(이미 만들어진 음원이고, headless 로 못 듣는다).
 */
async function instrumentAudioTiming(page) {
  await page.evaluateOnNewDocument(() => {
    window.__t = { cuts: [], tight: [] };
    const nameOf = (el) => String(el.currentSrc || el.src || '').split('/').pop().slice(0, 24);
    const isUi = (el) => /\/sounds\/ui\//.test(String(el.currentSrc || el.src || ''));
    let lastEnd = null; // 마지막으로 끝난 내용음 { name, at }
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const now = Date.now();
      const name = nameOf(this);
      if (!isUi(this)) {
        // ① 이 엘리먼트가 아직 재생 중인데 새로 play → 앞 소리가 잘린다.
        if (this.__hf_playing && this.__hf_name && this.__hf_name !== name) {
          window.__t.cuts.push(`${this.__hf_name} → ${name}`);
        }
        // ② 앞 소리가 끝난 지 얼마 안 돼 다음이 시작 → 붙어서 한 덩어리로 들린다.
        if (lastEnd && now - lastEnd.at < 350) {
          window.__t.tight.push(`${lastEnd.name}→${name} ${now - lastEnd.at}ms`);
        }
        this.__hf_playing = true;
        this.__hf_name = name;
        const done = () => {
          this.__hf_playing = false;
          lastEnd = { name, at: Date.now() };
        };
        this.addEventListener('ended', done, { once: true });
        this.addEventListener('error', done, { once: true });
      }
      return orig.call(this).catch(() => {});
    };
  });
}

function watchMedia(page, bucket) {
  const bad = (t) => bucket.push(t.slice(0, 60));
  page.on('requestfailed', (r) => {
    if (/\.(mp3|wav|webp|png|jpg)(\?|$)/i.test(r.url())) {
      bad(`${r.failure()?.errorText} ${decodeURIComponent(r.url().split('/').pop())}`);
    }
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && /\.(mp3|wav|webp|png|jpg)(\?|$)/i.test(r.url())) {
      bad(`${r.status()} ${decodeURIComponent(r.url().split('/').pop())}`);
    }
  });
}

/** 카드를 실제로 눌러본다 — 눌러야 나는 소리·이미지 요청이 그때 발생한다. */
async function probeInteractions(page, max = 5) {
  let clicks = 0;
  for (const el of (await page.$$('button[aria-label], main button')).slice(0, max)) {
    const label = await el.evaluate((n) => (n.innerText || n.getAttribute('aria-label') || '').trim());
    if (/돌아가기|뒤로|홈|Home/.test(label)) continue; // 누르면 화면을 떠난다
    await el.click({ delay: 10 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    clicks += 1;
  }
  return { clicks, silent: 0 };
}

async function shoot(page, rows, group, label, route) {
  const file = `${group}-${slug(label)}.png`;
  const errors = [];
  const onErr = (e) => errors.push(String(e.message).slice(0, 200));
  page.on('pageerror', onErr);
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30_000 });
    await new Promise((r) => setTimeout(r, SETTLE_MS));
    await passLoadingGate(page);
    const clip = await measureClipping(page);
    await page.screenshot({ path: path.join(OUT, file) });
    // 단원 목록 화면은 누를 게 링크뿐이라 소리 검사를 하지 않는다(활동만).
    if (route.split('/').length > 5) await probeInteractions(page);
    const media = mediaFails.splice(0);
    const timing = await page.evaluate(() => {
      const t = window.__t ?? { cuts: [], tight: [] };
      window.__t = { cuts: [], tight: [] };
      return t;
    });
    rows.push({ group, label, route, file, errors: [...errors], ...clip, media, ...timing });
    const flags = [
      clip.offscreen.length && `손이 못 닿는 요소 ${clip.offscreen.length}`,
      media.length && `자산 실패 ${media.length}`,
      timing.cuts.length && `앞소리 잘림 ${timing.cuts.length}`,
      timing.tight.length && `너무 붙음 ${timing.tight.length}`,
    ].filter(Boolean);
    console.log(`  ${errors.length || flags.length ? '!' : '+'} ${group} · ${label}${flags.length ? ' — ' + flags.join(' · ') : ''}`);
  } catch (e) {
    rows.push({ group, label, route, file: null, errors: [String(e.message).slice(0, 200)], offscreen: [] });
    console.log(`  x ${group} · ${label} — ${String(e.message).slice(0, 70)}`);
  }
  page.off('pageerror', onErr);
}

async function walkLang(page, rows, lang) {
  const root = `/library/phonics/${lang}`;
  await page.goto(BASE + root, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, SETTLE_MS));
  await expandAllLevels(page);
  const units = await linksUnder(page, `${root}/`);
  // 🔴 앞에서 순서대로가 아니라 **고르게** 뽑는다 — 앞쪽만 찍으면 받침·복습처럼 뒤에 있는
  //    화면 종류를 통째로 놓친다(오늘 결함이 대부분 거기 있었다).
  const step = Math.max(1, Math.floor(units.length / UNITS_PER_LANG));
  const picked = units.filter((_, i) => i % step === 0).slice(0, UNITS_PER_LANG);
  console.log(`${lang}: 단원 ${units.length}개 중 ${picked.length}개 훑음`);

  for (const u of picked) {
    const unitId = u.href.split('/').pop();
    await shoot(page, rows, lang, `단원 · ${u.text || unitId}`, u.href);
    const acts = await linksUnder(page, `${u.href}/`);
    for (const a of acts) {
      await shoot(page, rows, lang, `${unitId} · ${a.text || a.href.split('/').pop()}`, a.href);
    }
  }
}

async function main() {
  // 🔴 이전 실행의 png 를 지우고 시작한다 — 안 그러면 라벨 규칙이 바뀔 때마다 옛 파일이 쌓여
  //    폴더가 실제보다 커 보이고(182장 남은 적 있다) 어느 게 최신인지 알 수 없다.
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await instrumentAudioTiming(page);
  const mediaFails = [];
  watchMedia(page, mediaFails);
  await page.setViewport(VIEWPORT);
  const rows = [];

  await shoot(page, rows, 'landing', '파닉스 랜딩', '/library/phonics');
  for (const lang of ['korean', 'english']) await walkLang(page, rows, lang);
  await browser.close();

  const bad = (r) =>
    r.errors.length || r.offscreen?.length || r.media?.length || r.cuts?.length || r.tight?.length;
  const card = (r) => `
    <figure${bad(r) ? ' class="err"' : ''}>
      ${r.file ? `<img src="${r.file}" loading="lazy">` : '<div class="missing">렌더 실패</div>'}
      <figcaption><b>${r.label}</b><code>${r.route}</code>
      ${r.offscreen?.length ? `<p class="msg">화면 밖: ${r.offscreen.join(', ')}</p>` : ''}
      ${r.media?.length ? `<p class="msg">자산 실패: ${r.media.join(', ')}</p>` : ''}
      ${r.cuts?.length ? `<p class="msg">앞소리 잘림: ${r.cuts.join(' / ')}</p>` : ''}
      ${r.tight?.length ? `<p class="msg">너무 붙음: ${r.tight.join(' / ')}</p>` : ''}
      ${r.errors.length ? `<p class="msg">${r.errors.join('<br>')}</p>` : ''}</figcaption>
    </figure>`;
  const groups = [...new Set(rows.map((r) => r.group))];
  const html = `<!doctype html><meta charset="utf-8"><title>파닉스 화면 시트</title>
<style>
 body{font-family:Pretendard,system-ui,sans-serif;background:#f6f2ec;margin:0;padding:24px}
 h1{font-size:20px} h2{margin:28px 0 10px;font-size:16px;color:#c4451f}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
 figure{margin:0;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px -12px #0006}
 figure.err{outline:3px solid #e75757}
 img{width:100%;display:block;background:#eee}
 .missing{padding:60px 0;text-align:center;color:#999}
 figcaption{padding:8px 10px;font-size:12px;line-height:1.5}
 code{display:block;color:#888;font-size:11px}
 .msg{color:#c00;margin:6px 0 0;font-size:11px}
</style>
<h1>파닉스 화면 컨택트 시트 <small style="font-weight:400;color:#888">${VIEWPORT.width}×${VIEWPORT.height} · ${rows.length}장</small></h1>
<p style="color:#666;font-size:13px;max-width:62em">
 확인 다섯 줄: <b>①무엇을 하라는 말이 있나 ②정답이 화면에 노출되나 ③보기 수가 나이에 맞나
 ④다 하고 나면 뭘 할 수 있나 ⑤소리가 나나</b>.
 그리고 <b>한글과 영어를 나란히</b> 볼 것 — 오늘 결함의 최대 원인이 한쪽에만 넣은 규칙이었다.
 빨간 테두리 = 그 화면에서 JS 에러가 났다는 뜻.</p>
${groups.map((g) => `<h2>${g}</h2><div class="grid">${rows.filter((r) => r.group === g).map(card).join('')}</div>`).join('')}`;
  await fs.writeFile(path.join(OUT, 'index.html'), html);
  const flagged = rows.filter((r) => !r.file || bad(r));
  console.log(`\n${rows.length}장 · 문제 ${bad.length}건 → ${path.join(OUT, 'index.html')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
