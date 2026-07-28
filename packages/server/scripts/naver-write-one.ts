/**
 * 블로그 1편을 네이버 스마트에디터에 주입한다. Chunk 3 의 writePost 원형.
 *
 * 기본은 **임시저장까지**. 발행은 사람이 확인하고 누른다(`--publish` 는 일부러 안 만들었다).
 *
 * 사용:
 *   npx tsx scripts/naver-write-one.ts --book=장수풍뎅이 [--keep]
 *
 * 실측 근거는 스펙 §12. 요약:
 *  - 에디터는 `mainFrame`(PostWriteForm) iframe 안이고 늦게 그려진다 → 폴링 필수
 *  - `input[type=file]` 이 없다 → 사진 버튼이 네이티브 다이얼로그를 연다 → filechooser 로 가로챈다
 *  - 상단 버튼 클래스는 CSS-module 해시라 배포마다 바뀐다 → **텍스트로 찾고** 클래스는 폴백
 */
import 'dotenv/config';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer, { type Browser, type Frame, type Page } from 'puppeteer';
import { loadSession, applySession } from '../src/services/naver/naver-session.js';
import { listBlogTargets, loadBlogSource } from '../src/services/naver/blog-source.js';
import { buildInjectionPlan } from '../src/services/naver/blog-html.js';

const OUT = path.resolve(process.cwd(), 'out/naver');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || true];
  })
) as Record<string, string | true>;

/** HTML → 에디터에 칠 평문. 소제목은 줄만 남긴다(서식은 v1 범위 밖). */
function toPlain(html: string): string {
  return html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gis, '$1\n')
    .replace(/<li[^>]*>\s*<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>\s*<\/li>/gis, '$2 $1\n')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gis, '$2 ($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/ul>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 버튼을 텍스트로 찾아 누른다 — 클래스 해시에 기대지 않기 위해. */
async function clickByText(frame: Frame | Page, text: string): Promise<boolean> {
  const handle = await frame.evaluateHandle(
    `(function () {
       var els = Array.prototype.slice.call(document.querySelectorAll('button, a'));
       for (var i = 0; i < els.length; i++) {
         var t = (els[i].innerText || '').trim();
         if (t === ${JSON.stringify(text)} || t.split('\\n')[0] === ${JSON.stringify(text)}) return els[i];
       }
       return null;
     })()`
  );
  const el = handle.asElement();
  if (!el) return false;
  await el.click();
  return true;
}

async function main() {
  const session = loadSession();
  if (!session) throw new Error('세션 없음 — naver-poc.ts login 먼저');

  // --- 소스 로드 -------------------------------------------------------
  const book = String(args.book ?? '');
  const targets = await listBlogTargets({ status: 'draft', limit: 500 });
  const hit = targets.find((t) => t.title.includes(book));
  if (!hit) throw new Error(`블로그를 못 찾음: ${book}`);
  const source = await loadBlogSource(hit.blogContentId);
  if (!source) throw new Error('loadBlogSource 실패');
  const plan = buildInjectionPlan(source);
  console.log(`▶ ${plan.title} — 블록 ${plan.blocks.length}개`);

  // --- 이미지를 로컬로 (filechooser 는 파일 경로를 요구) ----------------
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'naver-imgs-'));
  const localOf = new Map<string, string>();
  let n = 0;
  for (const b of plan.blocks) {
    if (b.kind !== 'image') continue;
    n += 1;
    const res = await fetch(encodeURI(decodeURI(b.imageUrl)));
    if (!res.ok) {
      console.warn(`  ! 이미지 ${res.status} — 건너뜀: ${b.imageUrl.slice(0, 70)}`);
      continue;
    }
    const p = path.join(tmp, `${String(n).padStart(2, '0')}.webp`);
    fs.writeFileSync(p, Buffer.from(await res.arrayBuffer()));
    localOf.set(b.imageUrl, p);
  }
  console.log(`  이미지 ${localOf.size}장 내려받음`);

  // --- 에디터 진입 -----------------------------------------------------
  const browser: Browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page: Page = await browser.newPage();
  await applySession(page, session);
  await page.goto('https://blog.naver.com/tangobooks?Redirect=Write&', {
    waitUntil: 'domcontentloaded',
  });

  let ed: Frame | undefined;
  for (let i = 0; i < 40 && !ed; i++) {
    await sleep(1000);
    for (const f of page.frames()) {
      if (!/PostWriteForm/.test(f.url())) continue;
      try {
        if (await f.evaluate('!!document.querySelector(\'[contenteditable="true"]\')')) ed = f;
      } catch {
        /* 로딩 중 */
      }
    }
  }
  if (!ed) throw new Error('에디터 프레임 없음');
  await sleep(1500);

  // 🔴 도움말 패널 / "작성 중인 글이 있습니다" 복구 팝업이 뜬다 — 안 닫으면 클릭이 가려진다.
  //    복구 팝업은 「취소」를 눌러야 빈 문서로 시작한다(「확인」이면 이전 초안을 이어쓴다).
  await page.screenshot({ path: path.join(OUT, 'before-write.png') });
  for (const label of ['취소', '닫기']) {
    await clickByText(page, label).catch(() => false);
    await clickByText(ed, label).catch(() => false);
  }
  await sleep(800);

  // --- 제목 -------------------------------------------------------------
  await ed.click('.se-title-text');
  await sleep(300);
  await page.keyboard.type(plan.title, { delay: 8 });
  console.log(`  제목 입력: ${plan.title}`);

  // --- 본문 -------------------------------------------------------------
  // 제목 다음 문단으로 내려간다. 이후엔 커서가 계속 본문 끝에 있다.
  await page.keyboard.press('Enter');
  await sleep(400);

  for (const b of plan.blocks) {
    if (b.kind === 'html') {
      // 🔴 「함께 읽으면 좋은 명작 동화」는 네이버에서 뺀다.
      //    맨 URL 을 치면 네이버가 **자동으로 링크 카드**로 바꾼다. 링크가 4개라 거대한
      //    카드 4장이 되고, 변환이 일어나며 앞뒤 줄바꿈까지 먹혀 텍스트가 뒤엉킨다.
      //    (우리 웹 블로그로 나가는 외부 링크라 네이버 쪽 값어치도 낮다. 나중에 네이버
      //     글이 쌓이면 네이버 글끼리 잇는 편이 낫다.) CTA 는 URL 이 하나라 카드 1장 = 유지.
      if (/함께 읽으면 좋은/.test(b.html)) continue;
      const text = toPlain(b.html);
      if (!text) continue;
      // 🔴 `\n` 을 keyboard.type 에 그냥 넘기면 contenteditable 에서 **무시된다** —
      //    Enter 로 안 바뀐다. 그래서 관련글 링크 4개가 한 문단에 이어 붙었었다.
      //    줄로 쪼개 치고 사이에 Enter 를 직접 눌러야 문단이 생긴다.
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]) await page.keyboard.type(lines[i], { delay: 4 });
        if (i < lines.length - 1) await page.keyboard.press('Enter');
      }
      await page.keyboard.press('Enter');
      await sleep(250);
      continue;
    }

    const local = localOf.get(b.imageUrl);
    if (!local) continue;
    // 🔴 사진 버튼 = 네이티브 다이얼로그. 클릭 **전에** 리스너를 걸어야 놓치지 않는다.
    // 🔴 앞 이미지 업로드가 끝나기 전이면 클릭이 먹지 않아 다이얼로그가 안 뜬다 → 재시도.
    let inserted = false;
    for (let attempt = 1; attempt <= 3 && !inserted; attempt++) {
      try {
        const chooser = page.waitForFileChooser({ timeout: 20000 });
        await ed.click('button.se-image-toolbar-button');
        const fc = await chooser;
        await fc.accept([local]);
        inserted = true;
      } catch {
        console.warn(`  · 사진 다이얼로그 놓침 (${attempt}/3) — 다시`);
        await page.screenshot({ path: path.join(OUT, `stuck-${path.basename(local)}.png`) });
        await sleep(3000);
      }
    }
    if (!inserted) throw new Error(`이미지 삽입 실패: ${local}`);
    console.log(`  이미지 삽입: ${path.basename(local)}`);
    await sleep(4000); // 업로드 + 삽입 대기
  }

  // --- 임시저장 ---------------------------------------------------------
  await sleep(1000);
  const saved = (await clickByText(page, '저장')) || (await clickByText(ed, '저장'));
  console.log(saved ? '  💾 저장 클릭' : '  ! 저장 버튼 못 찾음');
  await sleep(3000);

  await page.screenshot({ path: path.join(OUT, 'write-one.png'), fullPage: true });
  console.log(`📸 out/naver/write-one.png`);

  if (!args.keep) await browser.close();
  else console.log('브라우저 열어둠(--keep)');
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
