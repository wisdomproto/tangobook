// 호리 시리즈 광고 릴스 — 라이브러리 여정 · 표지 · 읽어주기 스틸 · 20편 격자.
//   node scripts/capture-hori-reel.mjs <baseUrl> <outDir> [clip...]
//
// 🔴 호리는 **세 갈래를 한 캐릭터가 잇는다** — 생활동화 43(습관) · 유치원동화 20 · 세상 탐험 15(탈것)
//    = 78권. 축은 **이어 듣기**다: 세 라인 모두 낱말이 사실상 없어(유치원·탐험 0/35, 생활동화도
//    책당 1~2개) 게임을 팔 수 없지만, **나레이션은 78권 전부 완비**고 「묶어 보기」에 묶음이 이미 있다
//    (생활 2시간 20분 · 유치원 1시간 5분 · 탐험 50분 = 4시간 15분).
// ⚠️ 라이브러리 줄 이름은 표시명(`호리네 생활동화`)이지만 **드릴인 쿼리는 원본 키(`생활동화`)** 다.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {
  VIEWPORT,
  sleep,
  waitReady,
  installCursor,
  tap,
  record,
  toMp4,
  byText,
  LAUNCH_ARGS,
} from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:49412';
const OUT = process.argv[3] || '.';
const ONLY = process.argv.slice(4);
const want = (n) => ONLY.length === 0 || ONLY.includes(n);
const BOOK = '1782823692664'; // 04. 쉬야 쑥, 참 잘했어요! — en 페이지 TTS 10/10 완비
const TITLE = '쉬야 쑥';

// 라이브러리에 실제로 있는 자연 카테고리 줄(순서대로). aria-label 로 찾는다.
const CATEGORY = '생활동화'; // 드릴인 쿼리용 **원본 키**
const ROW_LABEL = '호리네 생활동화'; // 라이브러리 줄 aria-label(표시명)
const HORI_ROWS = ['호리네 생활동화', '호리 세상 탐험', '호리 유치원동화'];

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport(VIEWPORT);

const rowTop = (label) => `(() => {
  const r=[...document.querySelectorAll('[role=region]')].find(x=>x.getAttribute('aria-label')===${JSON.stringify(label)});
  return r? Math.round(r.getBoundingClientRect().top) : null;
})()`;

/** 🔴 책 카드엔 글자가 없다(표지에 제목이 그려져 있다) — 표지 alt 로 찾는다. */
const coverByAlt = (t) => `(() => {
  const img=[...document.querySelectorAll('button img')].find(i=>(i.alt||'').includes(${JSON.stringify(t)}));
  const btn=img?.closest('button'); if(!btn) return null; const r=btn.getBoundingClientRect();
  return {x:r.x+r.width/2, y:r.y+r.height/2};
})()`;

/** 선택 바(그림체/언어)가 화면 위로 오도록 내린다. 명작과 같은 구도 — 표지가 주인공. */
async function scrollToSelectors(topAt = 26) {
  const moved = await page.evaluate((t) => {
    const bar = document.querySelector('select')?.closest('div')?.parentElement;
    if (!bar) return null;
    const before = window.scrollY;
    window.scrollBy({ top: bar.getBoundingClientRect().top - t, behavior: 'instant' });
    return { before, after: window.scrollY };
  }, topAt);
  await sleep(420);
  if (!moved || moved.after === moved.before) throw new Error(`스크롤이 안 먹었다: ${JSON.stringify(moved)}`);
  console.log(`  스크롤 ${moved.before} → ${moved.after}`);
}

try {
  // 게스트 모드 — 미로그인이면 「🔒 잠금」 배지가 뜬다(1년 무료를 파는 광고에 자물쇠는 금물).
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await page.evaluate(() => {
    localStorage.setItem('tb_entry_choice', 'guest');
    localStorage.setItem('tb_guest_started_at', new Date().toISOString());
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await waitReady(page);
  const locks = await page.evaluate(() => (document.body.innerText.match(/잠금/g) || []).length);
  if (locks) throw new Error(`잠금 배지 ${locks}개 — 게스트 모드가 안 먹었다`);

  // ── n1-rows — 호리 세 줄을 세로로 훑는다(한 캐릭터가 세 갈래) ─────────
  if (want('n1-rows')) {
    console.log('[n1-rows]');
    await page.evaluate(() =>
      [...document.querySelectorAll('a,button')].find((e) => e.innerText.includes('묶어 보기'))?.click()
    );
    await sleep(600);
    await page.evaluate((l) => {
      const r = [...document.querySelectorAll('[role=region]')].find(
        (x) => x.getAttribute('aria-label') === l
      );
      if (r) window.scrollBy({ top: r.getBoundingClientRect().top - 60, behavior: 'instant' });
    }, HORI_ROWS[0]);
    await sleep(800);
    for (const l of HORI_ROWS) {
      const ok = await page.evaluate(
        (x) => !!document.querySelector(`[role=region][aria-label="${x}"]`),
        l
      );
      if (!ok) throw new Error(`「${l}」 줄을 못 찾았다`);
    }
    // 🔴 `scrollIntoView(유치원동화)` 로 내리면 그 아래 **세계 명작 줄이 같이 잡힌다**
    //    (호리 광고에 인어공주가 나오면 안 된다). 호리 블록 안에서만 조금씩 움직인다.
    await record(page, OUT, 'n1-rows', async () => {
      await sleep(700);
      // 🔴 조금만 움직인다. 호리 줄은 셋뿐이고 뷰포트는 1.5줄이라, 600px 만 내려도
      //    세계 명작·전래·공룡이 들어온다(실측). 두 줄을 붙잡고 살짝 흐르게만 한다.
      for (let i = 0; i < 2; i++) {
        await page.evaluate(() => window.scrollBy({ top: 110, behavior: 'smooth' }));
        await sleep(1100);
      }
      await sleep(800);
    });
    const stray = await page.evaluate(() => {
      const bad = ['세계 명작', '전래 동화', '공룡 친구들'];
      return bad.filter((b) => {
        const r = [...document.querySelectorAll('[role=region]')].find(
          (x) => x.getAttribute('aria-label') === b
        );
        if (!r) return false;
        const t = r.getBoundingClientRect();
        return t.top < window.innerHeight - 40;
      });
    });
    if (stray.length) throw new Error(`호리 아닌 줄이 화면에 들어왔다: ${stray.join(', ')}`);
    toMp4(OUT, 'n1-rows');
  }

  // ── 라인별 가로 슬라이드 — **오른쪽으로 흘려** 보여준다 ─────────────────
  // 🔴 세로 격자로 훑던 걸 가로 캐러셀로 바꿨다(2026-07-29 요청). 세로는 권수가 적은 라인에서
  //    **푸터**가, 라이브러리 줄에서는 **옆 카테고리**가 따라 들어왔다. 가로는 그 줄 안에서만 움직인다.
  // 🔴 그리고 **그 줄 밴드만 잘라 쓴다** — 위아래 다른 카테고리가 프레임에 남으면 호리 광고에
  //    인어공주가 나온다. 잘라낼 좌표는 DOM 에서 재서 marks 로 남긴다(눈대중 금지).
  const ROWS = [
    { key: 'g-life', label: '호리네 생활동화' },
    { key: 'g-kinder', label: '호리 유치원동화' },
    { key: 'g-explore', label: '호리 세상 탐험' },
  ];
  const bands = {};
  for (const g of ROWS) {
    if (!want(g.key)) continue;
    console.log(`[${g.key}] ${g.label}`);
    await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
    await waitReady(page);
    await page.evaluate(() =>
      [...document.querySelectorAll('a,button')].find((e) => e.innerText.includes('묶어 보기'))?.click()
    );
    await sleep(500);
    const band = await page.evaluate((l) => {
      const row = [...document.querySelectorAll('[role=region]')].find(
        (x) => x.getAttribute('aria-label') === l
      );
      if (!row) return null;
      // 줄 헤더(라벨+권수)는 캐러셀 바로 위 형제다 — 둘을 합쳐 밴드로 삼는다.
      const head = row.previousElementSibling;
      const top = (head || row).getBoundingClientRect().top;
      window.scrollBy({ top: top - 70, behavior: 'instant' });
      const h2 = (head || row).getBoundingClientRect();
      const r2 = row.getBoundingClientRect();
      return { top: Math.round(h2.top) - 16, bottom: Math.round(r2.bottom) + 16 };
    }, g.label);
    if (!band) throw new Error(`「${g.label}」 줄을 못 찾았다`);
    await sleep(700);
    bands[g.key] = band;
    console.log(`  밴드(CSS) ${band.top}~${band.bottom}`);

    await record(page, OUT, g.key, async () => {
      await sleep(500);
      for (let i = 0; i < 5; i++) {
        await page.evaluate((l) => {
          const r = [...document.querySelectorAll('[role=region]')].find(
            (x) => x.getAttribute('aria-label') === l
          );
          r?.scrollBy({ left: 430, behavior: 'smooth' });
        }, g.label);
        await sleep(700);
      }
      await sleep(500);
    });
    toMp4(OUT, g.key);
  }
  if (Object.keys(bands).length) {
    fs.writeFileSync(path.join(OUT, 'bands.json'), JSON.stringify(bands, null, 2));
    console.log('  → bands.json');
  }

  // ── n2-pick — 공룡 줄로 돌아와 티라노를 고른다 ────────────────────────
  if (want('n2-pick')) {
    console.log('[n2-pick]');
    await page.goto(`${BASE}/library?category=${encodeURIComponent(CATEGORY)}`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await waitReady(page);
    // 격자가 화면을 채운 지점까지 내려둔다(배너·검색·칩이 위에 있다).
    await page.evaluate(() => {
      const img = [...document.images].find((i) => i.getBoundingClientRect().width > 120);
      const card = img?.closest('button');
      if (card) window.scrollBy({ top: card.getBoundingClientRect().top - 40, behavior: 'instant' });
    });
    await sleep(600);
    await installCursor(page);
    await record(page, OUT, 'n2-pick', async () => {
      await sleep(500);
      await page.evaluate(() => window.scrollBy({ top: 560, behavior: 'smooth' }));
      await sleep(900);
      // 🔴 탭 뒤 상세 페이지로 넘어가면 로딩 스켈레톤이 찍힌다 — 라우팅만 막고 누르는 연출은 남긴다.
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
      const ok = await tap(page, coverByAlt(TITLE), TITLE);
      if (!ok) throw new Error('티라노 표지를 못 찾았다');
      await sleep(600);
    });
    toMp4(OUT, 'n2-pick');
  }

  // ── n3-cover — 책 상세, 표지만(언어 전환) ─────────────────────────────
  if (want('n3-cover')) {
    console.log('[n3-cover]');
    await page.goto(`${BASE}/library/${BOOK}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await waitReady(page);
    // 프리워밍 — 언어별 표지를 미리 받아둔다.
    for (const v of ['en', 'zh', 'ko']) {
      await page.select('select', v).catch(() => {});
      await sleep(700);
    }
    await scrollToSelectors();
    await installCursor(page);
    await record(page, OUT, 'n3-cover', async () => {
      await sleep(900);
      for (const [v, name] of [
        ['en', 'English'],
        ['ko', '한국어'],
      ]) {
        const box = await page.evaluate(() => {
          const el = document.querySelector('select');
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        });
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
        await sleep(220);
        await page.evaluate(() => document.getElementById('__adcursor')?.classList.add('tap'));
        await sleep(120);
        await page.select('select', v);
        await page.evaluate(() => {
          const d = document.getElementById('__adcursor');
          d?.classList.remove('tap');
          d?.classList.remove('on');
        });
        console.log(`  탭: ${name}`);
        await sleep(1100);
      }
      await sleep(500); // 🔴 한국어로 끝난다 — 다음 씬이 한국어 화면부터다
    });
    toMp4(OUT, 'n3-cover');
  }

  // ── n4-read — 읽어주기 스틸(뷰어는 정지라 녹화하면 프레임이 0개다) ────
  if (want('n4-read')) {
    console.log('[n4-read]');
    await page.evaluate(() =>
      // 🔴 전체화면이 기본 ON 이라 그냥 찍으면 삽화가 꽉 차고 자막·툴바가 숨는다.
      localStorage.setItem(
        'tangobook-viewer-settings',
        JSON.stringify({
          language: 'ko',
          textSize: 'md',
          darkMode: true,
          autoPlayTts: true,
          showText: true,
          fullscreenImage: false,
          volume: 'high',
          version: 2,
        })
      )
    );
    for (const lang of ['ko', 'en']) {
      await page.goto(`${BASE}/viewer/${BOOK}?lang=${lang}&autoplay=1`, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
      // 🔴 진입 게이트 문구가 사라져야 시작이다. 자막 글은 게이트 화면에서도 DOM 에 있으므로
      //    `textContent` 로 판정하면 표지만 찍힌다(명작에서 세 번 당했다).
      await page.waitForFunction(() => document.body.innerText.includes('한 번 누르면'), {
        timeout: 60000,
      });
      await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height / 2);
      await page.waitForFunction(() => !document.body.innerText.includes('한 번 누르면'), {
        timeout: 20000,
      });
      // 🔴 그리고 **나레이션이 실제로 도는지**까지 본다 — 안 돌면 타이틀 화면에 머문다.
      //    재생 중에만 생기는 하이라이트 span 으로 판정한다(뷰어는 `new Audio()` 라 DOM 에 audio 가 없다).
      // ⚠️ 재시도 탭을 남발하면 안 된다 — 탭은 컨트롤 토글이라 자막(=하이라이트)이 되레 숨는다.
      //    19쪽짜리 실사 책이라 버퍼링이 길다. 1초씩 최대 20초 기다리고, 딱 한 번만 다시 누른다.
      let playing = false;
      for (let i = 0; i < 20 && !playing; i++) {
        await sleep(1000);
        playing = await page.evaluate(() => !!document.querySelector('.text-coral-500'));
        if (!playing && i === 7) await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height / 2);
      }
      if (!playing) {
        const d = await page.evaluate(() => ({
          body: document.body.innerText.split('\n').join(' | ').slice(0, 160),
          fs: localStorage.getItem('tangobook-viewer-settings'),
        }));
        throw new Error(`나레이션이 안 돈다: ${lang} · 화면[${d.body}] · 설정[${d.fs}]`);
      }
      await sleep(1500);
      await page.screenshot({ path: path.join(OUT, `n4-read-${lang}.png`) });
      console.log(`  → n4-read-${lang}.png`);
    }
  }

  // ── n5-list — 공룡 21권 격자 ──────────────────────────────────────────
  if (want('n5-list')) {
    console.log('[n5-list]');
    await page.goto(`${BASE}/library?category=${encodeURIComponent(CATEGORY)}`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await waitReady(page);
    await page.evaluate(() => {
      const img = [...document.images].find((i) => i.getBoundingClientRect().width > 120);
      const card = img?.closest('button');
      if (card) window.scrollBy({ top: card.getBoundingClientRect().top - 40, behavior: 'instant' });
    });
    await sleep(600);
    // 🔴 전래는 20편뿐이라 격자가 짧다 — 620px 씩 네 번 내리면 **f56 에 벌써 푸터**가 든다.
    //    보폭을 줄이고 천천히 훑는다(표지가 흐르는 띠가 되지 않게 하는 것도 겸한다).
    await record(page, OUT, 'n5-list', async () => {
      await sleep(500);
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
        await sleep(900);
      }
      await sleep(500);
    });
    toMp4(OUT, 'n5-list');
  }
} finally {
  await browser.close();
}
console.log('완료:', OUT);
