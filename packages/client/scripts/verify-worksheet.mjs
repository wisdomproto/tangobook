/**
 * 워크지 쪽 맞춤 검사 — 각 `.page` 가 A4 한 장 안에 들어가는지 실측하고 PDF 를 뽑는다.
 *
 * 🔴 이게 필요한 이유: `.page` 는 높이가 고정이라 내용이 넘치면 **잘려서 조용히 사라진다**.
 *    PDF 쪽수는 그대로 4쪽이라 눈으로 안 보고는 알 수 없다(실측으로 한 번 당했다).
 *    단원 15개 × 4쪽 = 60쪽을 찍을 참이라, 사람 눈에 기대면 반드시 샌다.
 *
 * 사용: node scripts/verify-worksheet.mjs <url> [--pdf <경로>]
 */
import puppeteer from 'puppeteer';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--'));
const pdfIdx = args.indexOf('--pdf');
const pdfPath = pdfIdx >= 0 ? args[pdfIdx + 1] : null;

if (!url) {
  console.error('usage: verify-worksheet.mjs <url> [--pdf out.pdf]');
  process.exit(1);
}

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle0' });

if (pdfPath) await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });

// 인쇄 미디어에서 재야 한다 — 화면용 규칙(패딩·그림자)이 높이를 바꾼다.
await page.emulateMediaType('print');
await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

const rows = await page.evaluate(() =>
  [...document.querySelectorAll('.page')].map((el, i) => {
    // 🔴 가로도 재야 한다 — 세로만 보다가 넷째 쓰기 칸이 오른쪽으로 잘린 걸 놓쳤다.
    //    자식 중 하나라도 쪽 오른쪽 끝을 넘으면 인쇄에서 그만큼 사라진다.
    const right = el.getBoundingClientRect().right - parseFloat(getComputedStyle(el).paddingRight || 0);
    const spill = [...el.querySelectorAll('*')].reduce(
      (m, c) => Math.max(m, Math.round(c.getBoundingClientRect().right - right)),
      0
    );
    // 🔴 낱말이 두 줄로 접히면 한 낱말로 안 읽힌다. 넘침이 아니라 줄바꿈이라 위 검사엔 안 걸린다
    //    (실측: 카드를 키웠더니 「고기」가 「고/기」로 접혔다).
    const wrapped = [...el.querySelectorAll('.meet b, .wordchip, .syl')].filter((n) => {
      const lh = parseFloat(getComputedStyle(n).fontSize) * 1.6;
      return n.getBoundingClientRect().height > lh;
    }).length;

    return {
      쪽: i + 1,
      세로여백: Math.round(el.clientHeight - el.scrollHeight),
      가로넘침: spill,
      접힌낱말: wrapped,
    };
  })
);
await browser.close();

console.table(rows);

const bad = rows.filter((r) => r.세로여백 < 0 || r.가로넘침 > 1 || r.접힌낱말 > 0);
if (bad.length) {
  console.error(
    '\nFAIL\n' +
      bad
        .map((r) =>
          [
            r.세로여백 < 0 && ` - ${r.쪽}쪽 아래로 ${-r.세로여백}px 넘침 (잘려서 사라진다)`,
            r.가로넘침 > 1 && ` - ${r.쪽}쪽 오른쪽으로 ${r.가로넘침}px 넘침 (잘려서 사라진다)`,
            r.접힌낱말 > 0 && ` - ${r.쪽}쪽 낱말 ${r.접힌낱말}개가 두 줄로 접힘 (한 낱말로 안 읽힌다)`,
          ]
            .filter(Boolean)
            .join('\n')
        )
        .join('\n')
  );
  process.exit(1);
}
// ⚠️ 「아래가 휑하다」는 못 잡는다 — footer 의 `margin-top:auto` 가 남은 공간을 먹어
//    언제나 세로여백 0 으로 나온다. 빈 곳은 눈으로 볼 것.
console.log(`\nPASS — ${rows.length}쪽 전부 A4 안에 들어감 (넘침만 검사. 빈 곳은 눈으로)`);
