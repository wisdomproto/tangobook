/**
 * 창작동화 원고 채점 — 규격 위반만 찍어 준다
 *
 *   node packages/client/scripts/check-changjak-book.mjs d15        한 권
 *   node packages/client/scripts/check-changjak-book.mjs            전권
 *
 * 🔴 왜 스크립트인가. 이 측정을 하루에 스무 번 넘게 손으로 다시 쳤다. 매번 정규식을 다시
 *    쓰니 매번 조금씩 달랐고, 「들었다 놨다 했어요」를 `~았다` 위반으로 잘못 잡은 것도
 *    그래서다. 이 라인 기록의 「규칙은 문서가 아니라 부를 수 있는 함수여야 한다」가
 *    나한테도 그대로 적용된다.
 *
 * 규격 출처 = docs/changjak-books/CLAUDE.md 「문체」·「통과 조건」
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../../../docs/changjak-books');
const only = process.argv[2];

// 🔴 나레이션 문장 끝의 `~았다/었다/했다` 만 위반이다. 두 가지가 위반이 아니다 —
//    ① 「들었다 놨다 했어요」 같은 반복 구문(문장이 `했어요` 로 끝난다)
//    ② **따옴표 안 대사**(「"딱 붙었다!"」는 아이가 하는 말이라 반말이 정상이다)
//    둘 다 실제로 한 번씩 잘못 잡았다. 그래서 대사를 먼저 지우고 잰다.
const PAST_END = /(았|었|했|이)다[.!?」\s]*$/;
const stripDialog = (s) => s.replace(/"[^"]*"/g, '');

// 착지에 붙으면 안 되는 정리·교훈 문장
const MORAL = /(배웠어요|깨달았|알게 됐어요|안 돼요\.|해야 해요|사이좋게|고맙다고|미안하다고 해|용감해졌|자신감|나누면)/;

function check(id) {
  const md = readFileSync(join(SRC, `${id}.md`), 'utf8').replace(/\r\n/g, '\n');
  const fm = md.split('---')[1] || '';
  const pages = md.split(/^## p/m).slice(1);
  const bodies = pages.map((p) => p.split(/^### SCENE/m)[0].split('\n').slice(1).join('\n').trim());
  const text = bodies.join('\n');
  const chars = text.replace(/[\s\d]/g, '').length;

  const past = text
    .split('\n')
    .filter((l) => PAST_END.test(stripDialog(l).trim()))
    .map((l) => l.trim());
  // 🔴 해요체는 어미가 다양하다 — 누레져요·올라와요·돌려요·보여요·말끔해요.
  //    `어요|아요` 만 찾다가 셋을 잘못 잡았다. 판정은 **문장이 「요」로 끝나나** 하나뿐이다.
  // 🔴 그리고 대사·의성어만 있는 쪽(e120 p5·g88 p3)은 나레이션이 없으니 위반이 아니다.
  const noAction = bodies
    .map((b, i) => [i + 1, stripDialog(b)])
  // 🔴 이 항목은 **위반이 아니라 확인**이다. 그 쪽에 해요체가 한 줄도 없다는 뜻이고, 대개는
  //    의도한 장치다 — e03 p5「건초가 사르르 무너지고 꼭대기가 텅.」· g88 p12「…지나서, 타다다닥.」
  //    은 소리 내 읽을 때 박자를 주려고 일부러 그렇게 쓴 쪽이고 실제 그림책이 늘 쓴다.
  //    🔴 자동으로 봐주게 만들려다 세 번 틀렸다 — 글자 수로 갈랐더니 47자짜리 g88 이 걸리고,
  //    `[.!?]` 로 문장을 세었더니 의성어 느낌표가 문장 끝으로 읽혀 「발을 탁! 굴러요」가 쪼개졌고,
  //    줄로 세었더니 한 문장을 세 줄에 나눠 쓴 쪽이 걸렸다. 판정이 사람 몫인 걸 기계에 미루면
  //    그때마다 멀쩡한 쪽이 대신 걸린다. 48권에 둘이면 눈으로 보면 된다.
    .filter(([, n]) => !/요[.!?,]|요\s*$/m.test(n))
    .map(([n]) => `p${n}`);
  const moral = (bodies[bodies.length - 1] || '').match(MORAL);
  const dialog = (text.match(/"[^"]+"/g) || []).length;
  const per = pages.length ? Math.round(chars / pages.length) : 0;
  const sceneMissing = pages.map((p, i) => (/^### SCENE/m.test(p) ? null : `p${i + 1}`)).filter(Boolean);

  const bad = [];
  if (past.length) bad.push(`~았다 종결 ${past.length}건 → ${past[0].slice(0, 40)}`);
  if (pages.length < 8 || pages.length > 20) bad.push(`쪽수 ${pages.length} (8~20)`);
  if (per < 40 || per > 75) bad.push(`쪽당 ${per}자 (40~75)`);
  if (dialog < 10) bad.push(`대사 ${dialog}개 (13~15 기준, 10 미만은 확인)`);
  if (noAction.length) bad.push(`해요체 한 줄도 없는 쪽 ${noAction.join(",")} (장치면 확인만 하고 넘어간다)`);
  if (sceneMissing.length) bad.push(`SCENE 없는 쪽 ${sceneMissing.join(',')}`);
  if (moral) bad.push(`착지에 정리 문장 「${moral[0]}」`);
  if (!/^landing:/m.test(fm)) bad.push('frontmatter 에 landing 없음');

  return { id, pages: pages.length, chars, per, dialog, bad };
}

const ids = only
  ? [only]
  : readdirSync(SRC).filter((f) => /^[a-h]\d+\.md$/.test(f)).sort().map((f) => f.replace('.md', ''));

let fail = 0;
for (const id of ids) {
  const r = check(id);
  const mark = r.bad.length ? '⚠️' : '✅';
  if (r.bad.length) fail++;
  console.log(`${mark} ${r.id.padEnd(5)} ${String(r.pages).padStart(2)}쪽 ${String(r.chars).padStart(4)}자 쪽당${String(r.per).padStart(3)} 대사${String(r.dialog).padStart(3)}`);
  r.bad.forEach((b) => console.log(`     🔴 ${b}`));
}
console.log(`\n${ids.length}권 중 ${fail}권에 지적사항`);
