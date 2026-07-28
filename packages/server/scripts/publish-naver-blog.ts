/**
 * 네이버 블로그 배치 발행기 — 2주치를 한 세션에 만들어 하루 1편씩 예약한다.
 *
 * 실행은 형 PC 에서. 예약이 걸리고 나면 **컴퓨터를 꺼도** 네이버가 그 시각에 발행한다.
 *
 * 사용:
 *   npx tsx scripts/publish-naver-blog.ts --limit=14 --order=score            # dry-run
 *   npx tsx scripts/publish-naver-blog.ts --limit=14 --order=score --apply
 *
 * 옵션: --limit(기본 14) --order=score|title --category(기본 nature)
 *       --hour(기본 9, 예약 시각) --start=YYYY-MM-DD(기본 내일) --keep
 *
 * 🔴 한 세션에 100편씩 몰아넣지 말 것 — 예약 시각은 흩어져도 **작성 기록이 한날에 몰린다**.
 *    2주치(14편)가 상한선이라 보고 기본값을 그렇게 뒀다.
 *
 * 셀렉터 근거는 스펙 §12·§13.
 */
import 'dotenv/config';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer, { type Browser, type Frame, type Page } from 'puppeteer';
import { loadSession, applySession } from '../src/services/naver/naver-session.js';
import { loadBlogSource } from '../src/services/naver/blog-source.js';
import { buildInjectionPlan } from '../src/services/naver/blog-html.js';
import {
  findPublication,
  recordPublication,
  shouldSkip,
} from '../src/services/naver/naver-publications.store.js';

const OUT = path.resolve(process.cwd(), 'out/naver');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a));

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || true];
  })
) as Record<string, string | true>;

const LIMIT = Number(args.limit ?? 14);
const HOUR = String(args.hour ?? '9').padStart(2, '0');
const APPLY = args.apply === true;
const CATEGORY_NAME = '자연관찰 동화';

/** 예약 날짜 문자열 — 네이버 입력 형식 `2026. 07. 29` */
function dateStr(base: Date, addDays: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + addDays);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`;
}

function toPlain(html: string): string {
  return html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gis, '$1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gis, '$1\n')
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

const tagsFor = (title: string) =>
  [
    title,
    `${title}그림책`,
    '유아그림책',
    '자연관찰',
    '자연관찰책',
    '유아자연관찰',
    '4세그림책',
    '5세그림책',
    '6세그림책',
    '탱고북',
  ].join(',');

async function notify(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return; // 미설정이면 조용히 넘어간다 — 발행을 막을 이유는 없다
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text }),
    });
  } catch {
    /* 알림 실패가 발행을 되돌리진 않는다 */
  }
}

/** 글 하나를 에디터에 넣고 예약까지 건다. */
async function writeAndSchedule(
  page: Page,
  ed: Frame,
  plan: { title: string; blocks: Array<{ kind: string; html?: string; imageUrl?: string }> },
  imgs: Map<string, string>,
  when: { date: string; hour: string }
) {
  for (const label of ['취소', '닫기']) {
    await ed.evaluate(
      `(function(){var b=Array.prototype.slice.call(document.querySelectorAll('button')).filter(function(x){return (x.innerText||'').trim()===${JSON.stringify(label)}})[0]; if(b){b.click();return true} return false})()`
    );
  }
  await sleep(600);

  await ed.click('.se-title-text');
  await sleep(300);
  await page.keyboard.type(plan.title, { delay: 8 });
  await page.keyboard.press('Enter');
  await sleep(400);

  for (const b of plan.blocks) {
    if (b.kind === 'html') {
      if (/함께 읽으면 좋은/.test(b.html ?? '')) continue; // 링크 4개 = 대형 카드 4장
      const text = toPlain(b.html ?? '');
      if (!text) continue;
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]) await page.keyboard.type(lines[i], { delay: 3 });
        if (i < lines.length - 1) await page.keyboard.press('Enter');
      }
      await page.keyboard.press('Enter');
      await sleep(200);
      continue;
    }
    const local = imgs.get(b.imageUrl ?? '');
    if (!local) continue;
    let ok = false;
    for (let t = 0; t < 3 && !ok; t++) {
      try {
        const chooser = page.waitForFileChooser({ timeout: 20000 });
        await ed.click('button.se-image-toolbar-button');
        (await chooser).accept([local]);
        ok = true;
      } catch {
        await sleep(3000);
      }
    }
    if (!ok) throw new Error(`이미지 삽입 실패: ${local}`);
    await sleep(4000);
  }

  // --- 발행 패널 (스펙 §13) -------------------------------------------
  await sleep(800);
  await ed.evaluate(
    `(function(){var b=Array.prototype.slice.call(document.querySelectorAll('button')).filter(function(x){return (x.innerText||'').trim()==='발행'})[0]; if(b) b.click()})()`
  );
  await sleep(2000);

  await ed.evaluate(
    `(function(){
       var pub = document.querySelector('#open_public'); if (pub && !pub.checked) pub.click();
       var s = document.querySelector('#publish-option-search'); if (s && !s.checked) s.click();
       var r = document.querySelector('#radio_time2'); if (r && !r.checked) r.click();
       return true;
     })()`
  );
  await sleep(1000);

  // 예약 날짜·시간 — 🔴 분은 10분 단위만 고를 수 있어 정각으로 둔다.
  await ed.evaluate(
    `(function(){
       var d = document.querySelector('input.input_date__QmA0s');
       if (d) {
         var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
         setter.call(d, ${JSON.stringify(when.date)});
         d.dispatchEvent(new Event('input', { bubbles: true }));
         d.dispatchEvent(new Event('change', { bubbles: true }));
       }
       var h = document.querySelector('select.hour_option__J_heO');
       if (h) { h.value = ${JSON.stringify(when.hour)}; h.dispatchEvent(new Event('change', { bubbles: true })); }
       var m = document.querySelector('select.minute_option__Vb3xB');
       if (m) { m.value = '00'; m.dispatchEvent(new Event('change', { bubbles: true })); }
       return true;
     })()`
  );
  await sleep(600);

  const tagInput = await ed.$('#tag-input');
  if (tagInput) {
    await tagInput.click();
    await page.keyboard.type(tagsFor(plan.title.split(' ')[0]), { delay: 6 });
  }
  await sleep(500);

  if (!APPLY) return { scheduled: false };

  await ed.evaluate(
    `(function(){var b=document.querySelector('button.confirm_btn__WEaBq'); if(b) b.click()})()`
  );
  await sleep(5000);
  return { scheduled: true };
}

async function main() {
  const session = loadSession();
  if (!session) throw new Error('세션 없음 — naver-poc.ts login 먼저');

  // --- 대상 고르기 -----------------------------------------------------
  // 🔴 listBlogTargets 는 **언어·카테고리 필터가 없다** — 5개 언어 980행이 섞여 나오고,
  //    그대로 쓰면 자연관찰이 아니라 명작을 집는다(실제로 그랬다). 여기서 직접 좁힌다.
  const rest = async (q: string) => {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${q}`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    return r.json() as Promise<Array<{ id: string; content_id: string }>>;
  };
  const category = String(args.category ?? 'nature');
  const targets = await rest(
    `mkt_blog_contents?select=id,content_id,mkt_contents!inner(category)` +
      `&lang=eq.ko&mkt_contents.category=eq.${category}&limit=500`
  );
  console.log(`후보 ${targets.length}편 (lang=ko · category=${category})`);

  const picked: Array<{ blogContentId: string; title: string; bookId: string; chars: number }> = [];
  for (const t of targets.map((r) => ({ blogContentId: r.id }))) {
    const src = await loadBlogSource(t.blogContentId);
    if (!src) continue;
    const chars = src.cards
      .map((c) => c.html ?? '')
      .join('')
      .replace(/<[^>]+>/g, '')
      .replace(/\s/g, '').length;
    const hist = await findPublication(src.bookId, src.blogContentId, 'ko');
    if (shouldSkip(hist, 'publish')) continue;
    picked.push({ blogContentId: t.blogContentId, title: src.title, bookId: src.bookId, chars });
  }
  // 🔴 기본은 **검색량 많은 순**. 글 길이순(`--order=score`)도 남겨두지만 근거가 약하다 —
  //    1,500자는 업계 통용치일 뿐 네이버가 정한 수치가 아니다. 수요가 있는 키워드부터 치는 게 낫다.
  //    검색량은 `measure-book-keywords.mjs` 가 캐시해둔 값(분기에 한 번 갱신).
  const volPath = path.resolve(process.cwd(), 'scripts/_data/naver-volumes.json');
  const volMap: Record<string, { keyword: string; vol: number; comp: string | null }> =
    fs.existsSync(volPath) ? (JSON.parse(fs.readFileSync(volPath, 'utf-8'))[category] ?? {}) : {};
  // 🔴 부분문자열 충돌 주의 — 「강아지풀 …」 글이 책 「강아지」로 잡혔었다.
  //    **긴 책 제목부터** 대조해 가장 구체적인 것이 이기게 한다.
  const volKeys = Object.keys(volMap).sort((a, b) => b.length - a.length);
  const volOf = (title: string) => {
    const k = volKeys.find((bookTitle) => title.startsWith(bookTitle));
    return k ? volMap[k] : { keyword: '', vol: 0, comp: null };
  };

  if (args.order === 'score') picked.sort((a, b) => b.chars - a.chars);
  else picked.sort((a, b) => volOf(b.title).vol - volOf(a.title).vol);
  const list = picked.slice(0, LIMIT);

  console.log(`대상 ${list.length}편${APPLY ? '' : ' (dry-run — --apply 로 예약)'}`);
  list.forEach((p, i) => {
    const v = volOf(p.title);
    console.log(
      `  ${String(i + 1).padStart(2)}. ${v.keyword.padEnd(10)} ${String(v.vol).padStart(7)} ${String(v.comp ?? '-').padEnd(3)} ${p.chars}자  ${p.title.slice(0, 34)}`
    );
  });
  if (!APPLY) return;

  const base = args.start ? new Date(String(args.start)) : new Date();
  const browser: Browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const done: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    try {
      const src = await loadBlogSource(item.blogContentId);
      if (!src) throw new Error('소스 로드 실패');
      const plan = buildInjectionPlan(src);

      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nv-'));
      const imgs = new Map<string, string>();
      let n = 0;
      for (const b of plan.blocks) {
        if (b.kind !== 'image') continue;
        const res = await fetch(encodeURI(decodeURI(b.imageUrl)));
        if (!res.ok) continue;
        const p = path.join(tmp, `${String(++n).padStart(2, '0')}.webp`);
        fs.writeFileSync(p, Buffer.from(await res.arrayBuffer()));
        imgs.set(b.imageUrl, p);
      }

      const page = await browser.newPage();
      await applySession(page, session);
      await page.goto('https://blog.naver.com/tangobooks?Redirect=Write&', {
        waitUntil: 'domcontentloaded',
      });
      let ed: Frame | undefined;
      for (let k = 0; k < 40 && !ed; k++) {
        await sleep(1000);
        for (const f of page.frames()) {
          if (!/PostWriteForm/.test(f.url())) continue;
          try {
            if (await f.evaluate('!!document.querySelector(\'[contenteditable="true"]\')')) ed = f;
          } catch {
            /* 로딩 */
          }
        }
      }
      if (!ed) throw new Error('에디터 프레임 없음');
      await sleep(1500);

      await writeAndSchedule(page, ed, plan, imgs, { date: dateStr(base, i + 1), hour: HOUR });
      await recordPublication({
        bookId: src.bookId,
        postId: src.blogContentId,
        language: 'ko',
        status: 'published',
      });
      done.push(item.title);
      console.log(`  ✓ ${item.title} → ${dateStr(base, i + 1)} ${HOUR}:00 예약`);
      await page.close();
    } catch (e) {
      failed.push(`${item.title}(${(e as Error).message.slice(0, 40)})`);
      console.log(`  ✗ ${item.title}: ${(e as Error).message.slice(0, 80)}`);
      await recordPublication({
        bookId: item.bookId,
        postId: item.blogContentId,
        language: 'ko',
        status: 'failed',
        error: (e as Error).message.slice(0, 200),
      }).catch(() => {});
    }
    // 사람 속도로 — 글 사이 8~20초
    if (i < list.length - 1) await sleep(rand(8000, 20000));
  }

  if (!args.keep) await browser.close();

  const msg =
    `🐯 네이버 예약 ${done.length}편 완료` +
    (failed.length ? ` · 실패 ${failed.length}편` : '') +
    `\n${dateStr(base, 1)} ~ ${dateStr(base, list.length)} 매일 ${HOUR}:00` +
    (done.length ? `\n\n${done.map((t, i) => `${i + 1}. ${t}`).join('\n')}` : '') +
    (failed.length ? `\n\n실패:\n${failed.join('\n')}` : '');
  console.log(`\n${msg}`);
  await notify(msg);
}

main().catch(async (e) => {
  console.error('Fatal:', e.message);
  await notify(`🐯 네이버 발행기 실패\n${e.message.slice(0, 300)}`);
  process.exit(1);
});
