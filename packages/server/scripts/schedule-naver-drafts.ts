/* eslint-disable no-console -- 운영자가 콘솔로 진행을 본다. */
/**
 * 이미 만들어둔 **임시저장 글**을 열어 예약 발행을 건다.
 *
 * 초안(`publish-naver-blog.ts --draft`)은 제목·본문·이미지까지만 넣는다. 발행 패널을
 * 건너뛰므로 **태그·공개설정·검색허용은 비어 있다** — 여기서 채운다.
 *
 * 사용:
 *   npx tsx scripts/schedule-naver-drafts.ts                    # 목록만 보기
 *   npx tsx scripts/schedule-naver-drafts.ts --limit=14 --apply
 *
 * 옵션: --limit(기본 14) --hour(기본 9) --start=YYYY-MM-DD(기본 내일부터)
 *       --match=자연관찰 (제목 필터, 기본값) --keep
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser, type Frame, type Page } from 'puppeteer';
import { loadSession, applySession } from '../src/services/naver/naver-session.js';
import { recordPublication } from '../src/services/naver/naver-publications.store.js';

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
const MATCH = String(args.match ?? '자연관찰');
const APPLY = args.apply === true;

const tagsFor = (title: string) => {
  const kw = title.split(/[\s—:]/)[0];
  return [
    kw,
    `${kw}그림책`,
    '유아그림책',
    '자연관찰',
    '자연관찰책',
    '유아자연관찰',
    '4세그림책',
    '5세그림책',
    '6세그림책',
    '탱고북',
  ];
};

/**
 * DB 상태: ①이미 **발행된** ko 제목(예약 대상에서 뺀다) ②ko 제목→bookId 다리(발행 성공 시 기록용).
 *
 * 🔴 두 구멍이 겹쳐 장수풍뎅이가 두 번 나갔다:
 *    (1) 예약 스크립트가 발행이력을 **아예 안 남긴다** — `--draft` 가 30건을 draft 로 기록하는데 예약이
 *        성공해도 published 로 안 바꿔, DB 는 뭐가 나갔는지 모른다. → 성공 시 recordPublication 으로 기록.
 *    (2) 초안 생성엔 `shouldSkip` 대조가 있는데 예약 쪽엔 없었다 → 라이브 발행한 책의 초안이 임시저장에
 *        남아 검색량 1위로 재예약. → 아래 published 로 제외.
 *    book_id = `mkt_blog_contents.content_id`. post_id='' 로 upsert 하면 draft 행을 그대로 갱신한다.
 */
interface BookRef {
  bookId: string; // mkt_blog_contents.content_id
  blogContentId: string; // mkt_blog_contents.id — 발행이력 post_id 규칙(publish-naver-blog 와 동일)
}
async function loadDbState(): Promise<{
  published: Set<string>;
  titleToBook: Map<string, BookRef>;
}> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const empty = { published: new Set<string>(), titleToBook: new Map<string, BookRef>() };
  if (!base || !key) return empty; // 키 없으면 dedup 생략(중복이 무발행보다 낫다)
  const rest = async <T>(q: string): Promise<T[]> => {
    const r = await fetch(`${base}/rest/v1/${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    return r.json() as Promise<T[]>;
  };
  const rows = await rest<{ id: string; title: string; content_id: string }>(
    'mkt_blog_contents?select=id,title,content_id&lang=eq.ko&limit=2000'
  );
  const titleToBook = new Map<string, BookRef>(
    rows.map((r) => [r.title, { bookId: r.content_id, blogContentId: r.id }])
  );
  const pubs = await rest<{ book_id: string }>(
    'mkt_naver_blog_publications?select=book_id&status=eq.published'
  );
  const publishedBooks = new Set(pubs.map((p) => p.book_id));
  const published = new Set(
    [...titleToBook].filter(([, ref]) => publishedBooks.has(ref.bookId)).map(([t]) => t)
  );
  return { published, titleToBook };
}

async function notify(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text }),
    });
  } catch {
    /* 알림 실패가 예약을 되돌리진 않는다 */
  }
}

/** 에디터 프레임을 새로 연다(글마다 새 페이지 — 이전 글 상태가 남지 않게). */
async function openEditor(browser: Browser): Promise<{ page: Page; ed: Frame }> {
  const page = await browser.newPage();
  await applySession(page, loadSession()!);
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
        /* 로딩 */
      }
    }
  }
  if (!ed) throw new Error('에디터 프레임 없음');
  await sleep(1200);
  // 「작성 중인 글이 있습니다」 — 취소를 눌러야 빈 문서에서 시작한다
  await ed.evaluate(
    `(function(){var b=Array.prototype.slice.call(document.querySelectorAll('button')).filter(function(x){return (x.innerText||'').trim()==='취소'})[0]; if(b)b.click()})()`
  );
  await sleep(700);
  return { page, ed };
}

/** 임시저장 목록을 열어 제목들을 읽는다. */
async function listDrafts(ed: Frame): Promise<string[]> {
  await ed.evaluate(
    `(function(){var b=document.querySelector('button.save_count_btn__ZTLNa'); if(b) b.click()})()`
  );
  await sleep(2200);
  return (await ed.evaluate(
    `Array.prototype.slice.call(document.querySelectorAll('li.item__mm7Zd .title__p1G9u'))
       .map(function(e){ return (e.textContent||'').trim(); })`
  )) as string[];
}

/** 제목으로 초안을 연다. */
async function openDraft(ed: Frame, title: string): Promise<void> {
  const ok = await ed.evaluate(
    `(function(){
       var lis = document.querySelectorAll('li.item__mm7Zd');
       for (var i=0;i<lis.length;i++){
         var t = lis[i].querySelector('.title__p1G9u');
         if (t && (t.textContent||'').trim() === ${JSON.stringify(title)}) {
           var b = lis[i].querySelector('button.article_button__JNVjf');
           if (b) { b.click(); return true; }
         }
       }
       return false;
     })()`
  );
  if (!ok) throw new Error('목록에서 못 찾음');
  await sleep(4000); // 본문·이미지 로드
}

/** 예약 날짜를 달력으로 고른다 (스펙 §14). */
async function pickDate(ed: Frame, y: number, m: number, d: number): Promise<void> {
  await ed.click('input.input_date__QmA0s');
  await sleep(900);
  for (let i = 0; i < 14; i++) {
    const cur = (await ed.evaluate(
      `(function(){
         var dp=document.querySelector('.ui-datepicker'); if(!dp) return null;
         var yy=dp.querySelector('.ui-datepicker-year'), mm=dp.querySelector('.ui-datepicker-month');
         return { y: parseInt((yy&&yy.textContent||'').replace(/[^0-9]/g,''),10),
                  m: parseInt((mm&&mm.textContent||'').replace(/[^0-9]/g,''),10) };
       })()`
    )) as { y: number; m: number } | null;
    if (!cur) throw new Error('달력이 안 열렸다');
    if (cur.y === y && cur.m === m) break;
    const moved = await ed.evaluate(
      `(function(){var n=document.querySelector('.ui-datepicker-next');
        if(!n || /ui-state-disabled/.test(n.className)) return false; n.click(); return true})()`
    );
    if (!moved) throw new Error(`달력을 ${y}.${m} 로 못 옮김`);
    await sleep(500);
  }
  const ok = await ed.evaluate(
    `(function(){
       var b=document.querySelectorAll('.ui-datepicker td:not(.ui-state-disabled) > button');
       for (var i=0;i<b.length;i++)
         if ((b[i].textContent||'').trim() === ${JSON.stringify(String(d))}) { b[i].click(); return true; }
       return false;
     })()`
  );
  if (!ok) throw new Error(`${y}.${m}.${d} 를 달력에서 못 찾음`);
  await sleep(700);
}

async function scheduleOne(
  page: Page,
  ed: Frame,
  title: string,
  when: { y: number; m: number; d: number }
): Promise<void> {
  await ed.evaluate(
    `(function(){var b=Array.prototype.slice.call(document.querySelectorAll('button')).filter(function(x){return (x.innerText||'').trim()==='발행'})[0]; if(b) b.click()})()`
  );
  await sleep(2200);

  await ed.evaluate(
    `(function(){
       var pub=document.querySelector('#open_public'); if(pub && !pub.checked) pub.click();
       var s=document.querySelector('#publish-option-search'); if(s && !s.checked) s.click();
       var r=document.querySelector('#radio_time2'); if(r && !r.checked) r.click();
     })()`
  );
  await sleep(1000);

  await pickDate(ed, when.y, when.m, when.d);

  await ed.evaluate(
    `(function(){
       var h=document.querySelector('select.hour_option__J_heO');
       if(h){ h.value=${JSON.stringify(HOUR)}; h.dispatchEvent(new Event('change',{bubbles:true})); }
       var m=document.querySelector('select.minute_option__Vb3xB');
       if(m){ m.value='00'; m.dispatchEvent(new Event('change',{bubbles:true})); }
     })()`
  );
  await sleep(500);

  // 태그 — 초안엔 안 들어가 있다. 한 개씩 Enter 로 끊어 넣는다.
  const tagInput = await ed.$('#tag-input');
  if (tagInput) {
    await tagInput.click();
    for (const t of tagsFor(title)) {
      await page.keyboard.type(t, { delay: 25 });
      await sleep(220);
      await page.keyboard.press('Enter');
      await sleep(220);
    }
  }
  await sleep(600);

  // 🔴 누른 것과 걸린 것은 다르다 — 예약 카운터로 확인한다.
  const n = (s: unknown) => Number(String(s).match(/(\d+)\s*건/)?.[1] ?? -1);
  const before = await ed.evaluate(
    `(document.querySelector('button.reserve_btn__Km5Xh')||{}).innerText || ''`
  );
  await ed.evaluate(
    `(function(){var b=document.querySelector('button.confirm_btn__WEaBq'); if(b && !b.disabled) b.click()})()`
  );
  await sleep(6000);
  const after = await ed.evaluate(
    `(document.querySelector('button.reserve_btn__Km5Xh')||{}).innerText || ''`
  );
  // 🔴 예약이 걸리면 에디터가 **페이지를 떠나** 버튼이 사라진다 → after 가 빈 문자열.
  //    그걸 실패로 읽어서 성공한 건을 실패로 보고했었다. 빈 값 = 이동 = 성공이다.
  if (String(after).trim() === '') return;
  if (n(after) <= n(before)) {
    await page.screenshot({ path: path.join(OUT, `sched-fail-${Date.now()}.png`) });
    throw new Error(`예약 안 걸림 (${before} → ${after})`);
  }
}

async function main() {
  if (!loadSession()) throw new Error('세션 없음 — naver-poc.ts login 먼저');
  const browser: Browser = await puppeteer.launch({ headless: false, defaultViewport: null });

  const { page: p0, ed: ed0 } = await openEditor(browser);
  const all = await listDrafts(ed0);
  await p0.close();

  // 🔴 목록은 **저장 시각 역순**이라 그대로 쓰면 검색량 상위가 뒤로 밀린다
  //    (판다가 1번, 장수풍뎅이가 뒤로). 캐시해둔 검색량으로 다시 세운다.
  const volPath = path.resolve(process.cwd(), 'scripts/_data/naver-volumes.json');
  const volMap: Record<string, { vol: number }> = fs.existsSync(volPath)
    ? (JSON.parse(fs.readFileSync(volPath, 'utf-8')).nature ?? {})
    : {};
  const volKeys = Object.keys(volMap).sort((a, b) => b.length - a.length); // 부분문자열 충돌 방지
  const volOf = (title: string) => {
    const k = volKeys.find((book) => title.startsWith(book));
    return k ? volMap[k].vol : 0;
  };

  // 🔴 이미 발행된 책은 뺀다 — 라이브 발행한 책의 초안이 임시저장에 남아 재예약되던 구멍(장수풍뎅이 2회).
  const { published, titleToBook } = await loadDbState();
  // 🔴 같은 제목이 두 번 있을 수 있다(테스트하다 중복 저장된 초안). 첫 개만 쓴다 —
  //    안 거르면 같은 글이 이틀 연속 나간다.
  const targets = [...new Set(all.filter((t) => t.includes(MATCH) && !published.has(t)))]
    .sort((a, b) => volOf(b) - volOf(a))
    .slice(0, LIMIT);
  if (published.size) console.log(`발행 완료 ${published.size}편은 예약 대상에서 제외`);

  console.log(
    `임시저장 ${all.length}개 · "${MATCH}" 포함 ${targets.length}개 예약${APPLY ? '' : ' (dry-run)'}`
  );
  const base = args.start ? new Date(String(args.start)) : new Date();
  targets.forEach((t, i) => {
    const w = new Date(base);
    w.setDate(w.getDate() + i + 1);
    console.log(
      `  ${String(i + 1).padStart(2)}. ${w.getMonth() + 1}/${w.getDate()} ${HOUR}:00  ${t.slice(0, 40)}`
    );
  });
  if (!APPLY) {
    await browser.close();
    return;
  }

  const done: string[] = [];
  const failed: string[] = [];
  for (let i = 0; i < targets.length; i++) {
    const title = targets[i];
    const w = new Date(base);
    w.setDate(w.getDate() + i + 1);
    let page: Page | undefined;
    try {
      const o = await openEditor(browser);
      page = o.page;
      await listDrafts(o.ed);
      await openDraft(o.ed, title);
      await scheduleOne(page, o.ed, title, {
        y: w.getFullYear(),
        m: w.getMonth() + 1,
        d: w.getDate(),
      });
      done.push(title);
      // 🔴 예약 성공을 발행이력에 남긴다 — 이게 없어서 같은 책이 두 번 나갔다. book_id 를 못 찾으면(제목
      //    불일치) 기록만 건너뛴다(예약은 이미 걸렸다). post_id='' 로 upsert 하면 draft 행을 published 로 갱신.
      const ref = titleToBook.get(title);
      if (ref) {
        await recordPublication({
          bookId: ref.bookId,
          postId: ref.blogContentId,
          language: 'ko',
          status: 'published',
        }).catch((e) => console.log(`    (이력 기록 실패: ${(e as Error).message.slice(0, 40)})`));
      } else {
        console.log(`    (이력 기록 건너뜀 — 제목으로 book_id 못 찾음)`);
      }
      console.log(`  ✓ ${w.getMonth() + 1}/${w.getDate()} ${HOUR}:00 — ${title.slice(0, 36)}`);
    } catch (e) {
      failed.push(`${title.slice(0, 24)} (${(e as Error).message.slice(0, 40)})`);
      console.log(`  ✗ ${title.slice(0, 30)}: ${(e as Error).message.slice(0, 60)}`);
    }
    if (page) await page.close().catch(() => {});
    if (i < targets.length - 1) await sleep(rand(6000, 14000));
  }

  if (!args.keep) await browser.close();
  const msg =
    `🐯 네이버 예약 ${done.length}편` +
    (failed.length ? ` · 실패 ${failed.length}편` : '') +
    (done.length
      ? `\n하루 1편 ${HOUR}:00\n\n${done.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '') +
    (failed.length ? `\n\n실패:\n${failed.join('\n')}` : '');
  console.log(`\n${msg}`);
  await notify(msg);
}

main().catch(async (e) => {
  console.error('Fatal:', e.message);
  await notify(`🐯 네이버 예약 스크립트 실패\n${e.message.slice(0, 300)}`);
  process.exit(1);
});
