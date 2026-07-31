/* eslint-disable no-console -- 운영자가 콘솔로 진행을 본다. */
/**
 * 이미 **예약된 글**에 탱고북 링크를 덧붙인다.
 *
 * 배경: `toPlain` 이 `<a href>` 를 태그째 지워서 CTA 가 「동화책 보러가기 →」 글자만 남고
 * 주소가 빠진 채로 14편이 나갔다. 발행기는 고쳤지만 이미 걸린 예약은 그대로라, 이 스크립트가
 * 그 13편을 열어 링크를 붙이고 **같은 시각으로 다시 예약**한다.
 *
 * ⚠️ 링크는 **글 끝이 아니라 앞쪽(약 5% 지점)** 에 들어간다. 마지막 문단에 Range 를 걸어도
 *    포커스가 따라가지 않아 타이핑이 본문 머리로 간다 — 세 번 고쳐봤지만 못 잡았다.
 *    유입 통로로는 동작하므로 그대로 쓰기로 했다(사용자 판단).
 *
 * 사용:
 *   npx tsx scripts/append-naver-cta.ts            # 목록만
 *   npx tsx scripts/append-naver-cta.ts --apply
 *
 * 🔴 예약 목록은 임시저장 목록과 **같은 클래스**를 쓴다(`li.item__mm7Zd`). 여는 버튼만 다르다
 *    (`reserve_btn__Km5Xh` vs `save_count_btn__ZTLNa`).
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser, type Frame, type Page } from 'puppeteer';
import { loadSession, applySession } from '../src/services/naver/naver-session.js';

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
const APPLY = args.apply === true;

/** 제목 → 그 책의 라이브러리 URL. 블로그 카드의 CTA 에 이미 들어 있다. */
async function bookUrlByTitle(): Promise<Map<string, string>> {
  const rest = async (q: string) => {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${q}`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    return r.json() as Promise<Array<Record<string, unknown>>>;
  };
  const rows = await rest(
    'mkt_blog_contents?select=title,mkt_blog_cards(content)&lang=eq.ko&limit=500'
  );
  const map = new Map<string, string>();
  for (const r of rows) {
    const cards = (r.mkt_blog_cards ?? []) as Array<{ content?: { text?: string } }>;
    const html = cards.map((c) => c.content?.text ?? '').join('');
    const m = html.match(/https:\/\/tangobook\.co\.kr\/library\/\d+/);
    if (m && typeof r.title === 'string') map.set(r.title, m[0]);
  }
  return map;
}

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
  if (!ed) throw new Error('에디터 프레임 없음 (세션 만료?)');
  await sleep(1200);
  await ed.evaluate(
    `(function(){var b=Array.prototype.slice.call(document.querySelectorAll('button')).filter(function(x){return (x.innerText||'').trim()==='취소'})[0]; if(b)b.click()})()`
  );
  await sleep(700);
  return { page, ed };
}

/** 예약 목록을 열어 [{title, date}] 를 읽는다. */
async function listReserved(ed: Frame) {
  await ed.evaluate(
    `(function(){var b=document.querySelector('button.reserve_btn__Km5Xh'); if(b) b.click()})()`
  );
  await sleep(2400);
  return (await ed.evaluate(
    `Array.prototype.slice.call(document.querySelectorAll('li.item__mm7Zd')).map(function(li){
       var t=li.querySelector('.title__p1G9u'), d=li.querySelector('.date__toLrn');
       return { title: t? t.textContent.trim():'', date: d? d.textContent.trim():'' };
     })`
  )) as Array<{ title: string; date: string }>;
}

async function openPost(ed: Frame, title: string) {
  const ok = await ed.evaluate(
    `(function(){
       var lis=document.querySelectorAll('li.item__mm7Zd');
       for (var i=0;i<lis.length;i++){
         var t=lis[i].querySelector('.title__p1G9u');
         if (t && t.textContent.trim() === ${JSON.stringify(title)}) {
           var b=lis[i].querySelector('button.article_button__JNVjf');
           if (b) { b.click(); return true; }
         }
       }
       return false;
     })()`
  );
  if (!ok) throw new Error('목록에서 못 찾음');
  // 🔴 **문단 수가 멈출 때까지** 기다린다. 고정 대기로는 부족해서, 아직 3~4문단만 그려진
  //    상태의 「마지막 문단」에 캐럿을 놓았고 링크가 **글 맨 앞**에 박혔다(상어 1편이 그랬다).
  let prev = -1;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const n = (await ed.evaluate(
      `document.querySelectorAll('.se-text-paragraph').length`
    )) as number;
    if (n > 0 && n === prev) return; // 두 번 연속 같으면 로드 끝
    prev = n;
  }
}

/** 스펙 §14 — 날짜는 readOnly, 달력으로만 고른다. */
async function pickDate(ed: Frame, y: number, m: number, d: number) {
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

async function main() {
  if (!loadSession()) throw new Error('세션 없음 — naver-poc.ts login 먼저');
  const urlOf = await bookUrlByTitle();

  const browser: Browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const { page: p0, ed: ed0 } = await openEditor(browser);
  const posts = await listReserved(ed0);
  await p0.close();

  console.log(`예약 ${posts.length}편${APPLY ? '' : ' (dry-run)'}`);
  posts.forEach((x, i) =>
    console.log(
      `  ${String(i + 1).padStart(2)}. ${x.date}  ${x.title.slice(0, 34)}  ${urlOf.has(x.title) ? '✓책링크' : '— 책링크없음'}`
    )
  );
  if (!APPLY) {
    await browser.close();
    return;
  }

  const done: string[] = [];
  const failed: string[] = [];
  // --title 로 한 편만 고를 수 있다. 이미 손댄 글을 다시 돌리면 링크가 **두 번** 들어가므로
  // 검증은 늘 아직 안 건드린 글로 한다.
  const byTitle = args.title ? posts.filter((x) => x.title.includes(String(args.title))) : posts;
  // 🔴 이미 처리한 글은 반드시 뺀다 — 다시 돌리면 링크가 두 번 들어간다.
  const skip = String(args.exclude ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const notDone = byTitle.filter((x) => !skip.some((k) => x.title.includes(k)));
  const targets = args.limit ? notDone.slice(0, Number(args.limit)) : notDone;
  for (const post of targets) {
    let page: Page | undefined;
    try {
      const [, y, m, d, hh, mm] =
        post.date.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})/) ?? [];
      if (!y) throw new Error(`날짜 파싱 실패: ${post.date}`);

      const o = await openEditor(browser);
      page = o.page;
      await listReserved(o.ed);
      await openPost(o.ed, post.title);

      // 🔴 본문 마지막 문단에 **캐럿을 직접 놓는다**. `:last-of-type` 은 형제 기준이라 문서의
      //    마지막 문단이 아니고, 클릭이 빗나가면 타이핑이 허공으로 가는데 스크립트는 성공으로
      //    보고한다(실제로 1편이 그렇게 예약만 다시 걸렸다).
      const focused = await o.ed.evaluate(
        `(function(){
           var ps=document.querySelectorAll('.se-text-paragraph');
           if(!ps.length) return false;
           var last=ps[ps.length-1];
           last.scrollIntoView({block:'center'});
           var r=document.createRange(); r.selectNodeContents(last); r.collapse(false);
           var s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
           return true;
         })()`
      );
      if (!focused) throw new Error('본문 문단을 못 찾음');
      await sleep(500);
      await page.keyboard.press('Enter');

      const lines = ['탱고북에는 아이와 함께 볼 자연관찰 그림책이 100권 넘게 있어요.'];
      const bookUrl = urlOf.get(post.title);
      lines.push('https://tangobook.co.kr/library');
      if (bookUrl) lines.push('', '📖 이 책 보러가기', bookUrl);
      for (const line of lines) {
        if (line) await page.keyboard.type(line, { delay: 4 });
        await page.keyboard.press('Enter');
        await sleep(line.startsWith('http') ? 1800 : 250); // 링크 카드 변환 대기
      }

      // 🔴 **글이 실제로 바뀐 걸 확인한 뒤에** 발행한다. 클릭이 먹었는지가 아니라
      //    본문에 링크가 들어갔는지를 본다.
      const added = await o.ed.evaluate(
        `Array.prototype.slice.call(document.querySelectorAll('.se-text-paragraph'))
           .map(function(e){return e.textContent||''}).join(' ').indexOf('tangobook.co.kr/library') >= 0`
      );
      if (!added) throw new Error('본문에 링크가 안 들어감');

      // 같은 시각으로 다시 예약
      await o.ed.evaluate(
        `(function(){var b=Array.prototype.slice.call(document.querySelectorAll('button')).filter(function(x){return (x.innerText||'').trim()==='발행'})[0]; if(b) b.click()})()`
      );
      await sleep(2200);
      await o.ed.evaluate(
        `(function(){
           var pub=document.querySelector('#open_public'); if(pub && !pub.checked) pub.click();
           var s=document.querySelector('#publish-option-search'); if(s && !s.checked) s.click();
           var r=document.querySelector('#radio_time2'); if(r && !r.checked) r.click();
         })()`
      );
      await sleep(1000);
      await pickDate(o.ed, Number(y), Number(m), Number(d));
      await o.ed.evaluate(
        `(function(){
           var h=document.querySelector('select.hour_option__J_heO');
           if(h){ h.value=${JSON.stringify(hh)}; h.dispatchEvent(new Event('change',{bubbles:true})); }
           var mi=document.querySelector('select.minute_option__Vb3xB');
           if(mi){ mi.value=${JSON.stringify(mm)}; mi.dispatchEvent(new Event('change',{bubbles:true})); }
         })()`
      );
      await sleep(600);

      // 🔴 재예약은 건수가 안 늘어난다(13→13). 성공 신호는 **에디터를 떠나는 것**.
      await o.ed.evaluate(
        `(function(){var b=document.querySelector('button.confirm_btn__WEaBq'); if(b && !b.disabled) b.click()})()`
      );
      await sleep(6000);
      const still = await o.ed
        .evaluate(`(document.querySelector('button.confirm_btn__WEaBq')||{}).className || ''`)
        .catch(() => '');
      if (String(still).includes('confirm_btn')) {
        await page.screenshot({ path: path.join(OUT, `cta-fail-${Date.now()}.png`) });
        throw new Error('발행 패널이 안 닫힘 — 확정 실패');
      }

      done.push(post.title);
      console.log(`  ✓ ${post.date} — ${post.title.slice(0, 32)}`);
    } catch (e) {
      failed.push(`${post.title.slice(0, 22)} (${(e as Error).message.slice(0, 36)})`);
      console.log(`  ✗ ${post.title.slice(0, 28)}: ${(e as Error).message.slice(0, 60)}`);
    }
    if (page) await page.close().catch(() => {});
    await sleep(rand(5000, 11000));
  }

  if (!args.keep) await browser.close();
  const msg =
    `🐯 네이버 링크 보강 ${done.length}편` +
    (failed.length ? ` · 실패 ${failed.length}편` : '') +
    (failed.length ? `\n\n실패:\n${failed.join('\n')}` : '');
  console.log(`\n${msg}`);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (token && chat)
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: msg }),
    }).catch(() => {});
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
