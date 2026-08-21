/* eslint-disable no-console */
/**
 * 이미 **발행된** 글의 네이버 카테고리를 편집(수정 발행)으로 바꾼다.
 *
 * 🔴 왜 별도 스크립트: 발행된 글은 예약 팝업/임시저장에 없어 스케줄러가 못 연다. 편집 URL
 *    (PostWriteForm.naver?logNo=…)로 열어 발행 패널의 카테고리만 바꿔 수정 발행한다.
 *    (2026-08-11 카테고리 누락으로 3편이 자연관찰로 잘못 발행된 걸 사후 교정.)
 *
 * 사용: npx tsx scripts/fix-published-category.ts        (아래 TARGETS 처리)
 */
import 'dotenv/config';
import path from 'node:path';
import puppeteer, { type Browser, type Frame, type Page } from 'puppeteer';
import { loadSession, applySession } from '../src/services/naver/naver-session.js';
import { naverCategory } from './lib/naver-category.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const OUT = path.resolve(process.cwd(), 'out/naver');

// [logNo, 우리 카테고리, 표시용 이름]
const TARGETS: [string, string, string][] = [
  ['224375416115', 'classic', '금발 머리 소녀'],
  ['224375416613', 'classic', '구둣방 할아버지'],
  ['224375420647', 'phonics', '받침 ㄱ'],
];

async function findEditor(page: Page): Promise<Frame | undefined> {
  for (let i = 0; i < 45; i++) {
    await sleep(1000);
    for (const f of page.frames()) {
      if (!/PostWriteForm/.test(f.url())) continue;
      try {
        if (await f.evaluate('!!document.querySelector(\'[contenteditable="true"]\')')) return f;
      } catch {
        /* 로딩 */
      }
    }
  }
  return undefined;
}

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

async function fixOne(browser: Browser, logNo: string, cat: string, name: string): Promise<void> {
  const naverName = naverCategory(cat).naverName;
  const page = await browser.newPage();
  try {
    await applySession(page, loadSession()!);
    await page.goto(`https://blog.naver.com/PostWriteForm.naver?blogId=tangobooks&logNo=${logNo}`, {
      waitUntil: 'networkidle2',
    });
    if (/nidlogin|nid\.naver\.com/.test(page.url())) throw new Error('세션 만료');
    const ed = await findEditor(page);
    if (!ed) throw new Error('에디터 프레임 없음');
    await sleep(1500);
    // 「작성 중인 글」 팝업 있으면 취소(현재 편집 글 유지)
    await ed.evaluate(
      `(function(){var b=Array.prototype.slice.call(document.querySelectorAll('button')).find(function(x){return (x.innerText||'').trim()==='취소'}); if(b)b.click()})()`
    );
    await sleep(700);
    const title = (await ed.evaluate(
      `(document.querySelector('.se-title-text')||{}).innerText || ''`
    )) as string;
    if (!title.trim()) throw new Error('글 안 열림(제목 비어있음)');

    // 발행 패널 열기
    await ed.evaluate(
      `(function(){var b=Array.prototype.slice.call(document.querySelectorAll('button')).find(function(x){return (x.innerText||'').trim()==='발행'}); if(b)b.click()})()`
    );
    await sleep(2800);
    await selectCategory(ed, naverName);
    await sleep(700);
    // 수정 발행(확정) — 즉시 상태 그대로, 카테고리만 바뀐다. 날짜는 원래 발행일 유지.
    await ed.evaluate(
      `(function(){var b=document.querySelector('button.confirm_btn__WEaBq'); if(b && !b.disabled) b.click()})()`
    );
    await sleep(6000);
    let stillPanel: boolean;
    try {
      stillPanel = (await ed.evaluate(
        `!!document.querySelector('button.confirm_btn__WEaBq')`
      )) as boolean;
    } catch {
      stillPanel = false; // 프레임 이동 = 성공
    }
    if (stillPanel) {
      await page.screenshot({ path: path.join(OUT, `fixcat-fail-${logNo}.png`) });
      throw new Error('확정 후 패널 유지');
    }
    console.log(`  ✓ ${name} (${logNo}) → ${naverName}`);
  } finally {
    await page.close().catch(() => {});
  }
}

const browser: Browser = await puppeteer.launch({ headless: false, defaultViewport: null });
const done: string[] = [];
const failed: string[] = [];
for (const [logNo, cat, name] of TARGETS) {
  try {
    await fixOne(browser, logNo, cat, name);
    done.push(name);
  } catch (e) {
    console.log(`  ✗ ${name}: ${(e as Error).message}`);
    failed.push(`${name} (${(e as Error).message})`);
  }
  await sleep(6000);
}
await browser.close();
console.log(`\n완료 — 이동 ${done.length} · 실패 ${failed.length}`);
if (failed.length) console.log(failed.join('\n'));
