/* eslint-disable no-console -- 운영자가 콘솔로 진행을 본다. */
/**
 * 이미 만들어둔 **임시저장 글**을 열어 예약 발행을 건다.
 *
 * 초안(`publish-naver-blog.ts --draft`)은 제목·본문·이미지까지만 넣는다. 발행 패널을
 * 건너뛰므로 **태그·공개설정·검색허용은 비어 있다** — 여기서 채운다.
 *
 * 사용:
 *   npx tsx scripts/schedule-naver-drafts.ts --category=nature              # 목록만 보기
 *   npx tsx scripts/schedule-naver-drafts.ts --category=classic --hour=12 --apply
 *
 * 옵션: --category(기본 nature — nature|classic|phonics) --limit(기본 14) --hour(기본 9)
 *       --start=YYYY-MM-DD(기본 내일부터) --match=<제목 추가 필터, 선택> --keep
 * 🔴 카테고리별 하루 1편 = 카테고리마다 다른 --hour 로 각각 실행(자연 9 / 명작 12 / 파닉스 15 등).
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser, type Frame, type Page } from 'puppeteer';
import { loadSession, applySession } from '../src/services/naver/naver-session.js';
import { recordPublication } from '../src/services/naver/naver-publications.store.js';
import { naverCategory } from './lib/naver-category.js';

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
// 🔴 카테고리로 대상을 고른다(제목 MATCH 아님). 명작은 제목에 「명작」이 51편 중 19편뿐이라
//    MATCH 로는 32편이 새어 나갔다 — DB category 로 직접 거른다. MATCH 는 선택적 추가 필터.
const CATEGORY = String(args.category ?? 'nature');
const MATCH = args.match ? String(args.match) : '';
const APPLY = args.apply === true;

const tagsFor = (title: string) => naverCategory(CATEGORY).tags(title.split(/[\s—:]/)[0]);

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
  titleToCategory: Map<string, string>;
}> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const empty = {
    published: new Set<string>(),
    titleToBook: new Map<string, BookRef>(),
    titleToCategory: new Map<string, string>(),
  };
  if (!base || !key) return empty; // 키 없으면 dedup 생략(중복이 무발행보다 낫다)
  const rest = async <T>(q: string): Promise<T[]> => {
    const r = await fetch(`${base}/rest/v1/${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    return r.json() as Promise<T[]>;
  };
  // 🔴 category 는 mkt_contents 에 있다 — content_id 로 조인해 제목→카테고리 다리를 만든다.
  const rows = await rest<{
    id: string;
    title: string;
    content_id: string;
    mkt_contents: { category: string | null } | null;
  }>(
    'mkt_blog_contents?select=id,title,content_id,mkt_contents!inner(category)&lang=eq.ko&limit=2000'
  );
  const titleToBook = new Map<string, BookRef>(
    rows.map((r) => [r.title, { bookId: r.content_id, blogContentId: r.id }])
  );
  const titleToCategory = new Map<string, string>(
    rows.map((r) => [r.title, r.mkt_contents?.category ?? ''])
  );
  const pubs = await rest<{ book_id: string }>(
    'mkt_naver_blog_publications?select=book_id&status=eq.published'
  );
  const publishedBooks = new Set(pubs.map((p) => p.book_id));
  const published = new Set(
    [...titleToBook].filter(([, ref]) => publishedBooks.has(ref.bookId)).map(([t]) => t)
  );
  return { published, titleToBook, titleToCategory };
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

/** 예약 목록을 열어 제목들을 읽는다(임시저장과 같은 li 클래스, 여는 버튼만 다름).
 *  🔴 목록이 lazy-load 라 스크롤로 끝까지 불러온 뒤 읽는다(안 그러면 첫 12개만 잡힌다). */
async function listReserved(ed: Frame): Promise<string[]> {
  await ed.evaluate(
    `(function(){var b=document.querySelector('button.reserve_btn__Km5Xh'); if(b) b.click()})()`
  );
  await sleep(2200);
  let prev = -1;
  for (let i = 0; i < 15; i++) {
    const cnt = (await ed.evaluate(`document.querySelectorAll('li.item__mm7Zd').length`)) as number;
    if (cnt === prev) break;
    prev = cnt;
    await ed.evaluate(
      `(function(){var it=document.querySelectorAll('li.item__mm7Zd'); var last=it[it.length-1]; if(last) last.scrollIntoView({block:'end'});})()`
    );
    await sleep(800);
  }
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

/** 발행 패널에서 네이버 블로그 카테고리를 고른다(드롭다운 열고 이름 일치 라벨 클릭).
 *  🔴 셀렉터 실측(2026-08-11): 열기 `button.selectbox_button__jb1Dt`,
 *  옵션 `label.radio_label__mB6ia`(nbsp→space 정규화해 이름 매칭). */
async function selectCategory(ed: Frame, naverName: string): Promise<void> {
  await ed.evaluate(
    `(function(){var b=document.querySelector('button.selectbox_button__jb1Dt'); if(b) b.click()})()`
  );
  await sleep(900);
  const ok = await ed.evaluate(
    `(function(){
       var target=${JSON.stringify(naverName)};
       var labels=Array.prototype.slice.call(document.querySelectorAll('label.radio_label__mB6ia'));
       var lbl=labels.find(function(l){ return (l.innerText||'').replace(/\\s+/g,' ').trim()===target; });
       if(lbl){ lbl.click(); return true; } return false;
     })()`
  );
  await sleep(700);
  if (!ok) throw new Error(`카테고리 「${naverName}」 못 찾음`);
}

/** 이미 예약된 글을 열어 **카테고리만** 바꿔 재확정한다(날짜·시간·공개설정은 안 건드림).
 *  🔴 처음 예약 때 카테고리를 안 골라 전부 기본(자연관찰)으로 들어간 걸 사후 교정하는 용도. */
async function recatOne(page: Page, ed: Frame, naverName: string): Promise<void> {
  await ed.evaluate(
    `(function(){var b=Array.prototype.slice.call(document.querySelectorAll('button')).filter(function(x){return (x.innerText||'').trim()==='발행'})[0]; if(b) b.click()})()`
  );
  await sleep(2200);
  await selectCategory(ed, naverName);
  await sleep(600);
  await ed.evaluate(
    `(function(){var b=document.querySelector('button.confirm_btn__WEaBq'); if(b && !b.disabled) b.click()})()`
  );
  await sleep(6000);
  // 재확정은 예약 건수가 안 늘어난다(이미 예약됨) → 패널이 닫혔는지(=성공)로 판정.
  let stillPanel: boolean;
  try {
    stillPanel = (await ed.evaluate(
      `!!document.querySelector('button.confirm_btn__WEaBq')`
    )) as boolean;
  } catch {
    stillPanel = false; // 프레임 사라짐 = 이동 = 성공
  }
  if (stillPanel) {
    await page.screenshot({ path: path.join(OUT, `recat-fail-${Date.now()}.png`) });
    throw new Error('확정 후 패널이 안 닫힘');
  }
}

/** 이미 예약된 글들의 카테고리를 사후 교정한다(--recat). */
async function runRecat(browser: Browser): Promise<void> {
  const naverName = naverCategory(CATEGORY).naverName;
  const { titleToCategory } = await loadDbState();
  const { page: p0, ed: ed0 } = await openEditor(browser);
  const all = await listReserved(ed0);
  await p0.close();
  const targets = [...new Set(all)]
    .filter((t) => titleToCategory.get(t) === CATEGORY)
    .filter((t) => !MATCH || t.includes(MATCH))
    .slice(0, LIMIT);
  console.log(
    `예약글 ${all.length}개 · category=${CATEGORY} → ${targets.length}개 「${naverName}」로 재분류${APPLY ? '' : ' (dry-run)'}`
  );
  targets.forEach((t, i) => console.log(`  ${i + 1}. ${t.slice(0, 44)}`));
  if (!APPLY) return;

  const done: string[] = [];
  const failed: string[] = [];
  for (const title of targets) {
    let page: Page | undefined;
    try {
      const o = await openEditor(browser);
      page = o.page;
      await listReserved(o.ed);
      await openDraft(o.ed, title); // 같은 li 클래스라 예약글도 열린다
      await recatOne(page, o.ed, naverName);
      done.push(title);
      console.log(`  ✓ ${title.slice(0, 40)} → ${naverName}`);
    } catch (e) {
      failed.push(`${title.slice(0, 24)} (${(e as Error).message.slice(0, 40)})`);
      console.log(`  ✗ ${title.slice(0, 30)}: ${(e as Error).message.slice(0, 50)}`);
    }
    if (page) await page.close().catch(() => {});
    await sleep(rand(5000, 10000));
  }
  const msg =
    `🐯 네이버 카테고리 재분류 ${done.length}편 → ${naverName}` +
    (failed.length ? ` · 실패 ${failed.length}편\n${failed.join('\n')}` : '');
  console.log(`\n${msg}`);
  await notify(msg);
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

  // 🔴 네이버 카테고리 선택 — 안 하면 전부 기본(자연관찰 동화)으로 간다(2026-08-11 누락 사고).
  await selectCategory(ed, naverCategory(CATEGORY).naverName);

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

  // --recat: 이미 예약된 글의 카테고리 사후 교정(초기 예약 때 카테고리 누락분).
  if (args.recat) {
    await runRecat(browser);
    if (!args.keep) await browser.close();
    return;
  }

  const { page: p0, ed: ed0 } = await openEditor(browser);
  const all = await listDrafts(ed0);
  await p0.close();

  // 🔴 목록은 **저장 시각 역순**이라 그대로 쓰면 검색량 상위가 뒤로 밀린다.
  //    검색량은 자연관찰만 캐시돼 있다(naver-volumes.json[category]). 없는 카테고리(명작·파닉스)는
  //    vol 0 → 저장순 유지. 순서 정교화는 검색량 실측 후 별도 과제.
  const volPath = path.resolve(process.cwd(), 'scripts/_data/naver-volumes.json');
  const volMap: Record<string, { vol: number }> = fs.existsSync(volPath)
    ? (JSON.parse(fs.readFileSync(volPath, 'utf-8'))[CATEGORY] ?? {})
    : {};
  const volKeys = Object.keys(volMap).sort((a, b) => b.length - a.length); // 부분문자열 충돌 방지
  const volOf = (title: string) => {
    const k = volKeys.find((book) => title.startsWith(book));
    return k ? volMap[k].vol : 0;
  };

  // 🔴 이미 발행된 책은 뺀다 — 라이브 발행한 책의 초안이 임시저장에 남아 재예약되던 구멍(장수풍뎅이 2회).
  const { published, titleToBook, titleToCategory } = await loadDbState();
  // 🔴 카테고리로 이 레인 초안만 고른다(제목 MATCH 아님). MATCH 는 주면 추가 필터.
  //    같은 제목이 두 번 있을 수 있다(테스트 중복 초안) → new Set 으로 첫 개만.
  const targets = [...new Set(all.filter((t) => !published.has(t)))]
    .filter((t) => titleToCategory.get(t) === CATEGORY)
    .filter((t) => !MATCH || t.includes(MATCH))
    .sort((a, b) => volOf(b) - volOf(a))
    .slice(0, LIMIT);
  if (published.size) console.log(`발행 완료 ${published.size}편은 예약 대상에서 제외`);

  console.log(
    `임시저장 ${all.length}개 · category=${CATEGORY}${MATCH ? ` · "${MATCH}" 포함` : ''} → ${targets.length}개 예약${APPLY ? '' : ' (dry-run)'}`
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
