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

async function shoot(page, rows, group, label, route) {
  const file = `${group}-${slug(label)}.png`;
  const errors = [];
  const onErr = (e) => errors.push(String(e.message).slice(0, 200));
  page.on('pageerror', onErr);
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30_000 });
    await new Promise((r) => setTimeout(r, SETTLE_MS));
    await page.screenshot({ path: path.join(OUT, file) });
    rows.push({ group, label, route, file, errors: [...errors] });
    console.log(`  ${errors.length ? '!' : '+'} ${group} · ${label}`);
  } catch (e) {
    rows.push({ group, label, route, file: null, errors: [String(e.message).slice(0, 200)] });
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
  await page.setViewport(VIEWPORT);
  const rows = [];

  await shoot(page, rows, 'landing', '파닉스 랜딩', '/library/phonics');
  for (const lang of ['korean', 'english']) await walkLang(page, rows, lang);
  await browser.close();

  const card = (r) => `
    <figure${r.errors.length ? ' class="err"' : ''}>
      ${r.file ? `<img src="${r.file}" loading="lazy">` : '<div class="missing">렌더 실패</div>'}
      <figcaption><b>${r.label}</b><code>${r.route}</code>
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
  const bad = rows.filter((r) => !r.file || r.errors.length);
  console.log(`\n${rows.length}장 · 문제 ${bad.length}건 → ${path.join(OUT, 'index.html')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
