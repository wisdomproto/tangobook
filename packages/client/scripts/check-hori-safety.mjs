// 호리 은행에서 옮긴 권의 **안전 항목이 원본대로 살아 있나**를 전 시리즈에서 센다.
// 🔴 편집장 넷이 낱권으로 신고한 것을 원본 기준으로 재니 훨씬 컸다(호리 16 = 11권 중 10권).
//    고칠 곳이 낱권이 아니라 「같은 원본을 옮긴 자리 전부」임을 이 자가 보여 준다.
// 🔴 무대가 다르면 항목도 다르다 — 찻길은 「좌우 보기」, 징검돌 개울은 「잠긴 돌이면 안 건너」가
//    같은 일을 한다. 한 자로 다 재면 멀쩡한 권을 고치게 된다(실제로 세 권을 그렇게 잘못 잡았다).
import fs from 'node:fs';
const D = 'docs/changjak-books';
const RULES = {
  16: {
    name: '길 건너기',
    checks: [
      // 어른 손 — 「손 잡고」·「앞발 잡고」·「엄마 잡고」·「날개 잡고」 어느 표기든 받는다
      [/(손|앞발|날개|코)[을 ]{0,2}잡|[가-힣]{1,4}\s*잡고\s*(건너|한 발)/, '어른 손'],
      // 눈으로 하는 판정 — 찻길은 좌우, 징검돌 개울은 잠긴 돌
      [/왼쪽|오른쪽|좌우|이쪽저쪽|양쪽|잠긴 돌|물 보고/, '눈으로 판정'],
    ],
  },
  '05': {
    name: '꼭꼭 씹기',
    // 원본은 딸꾹질이다. 질식으로 올려놓고 딸꾹질 처치(물)를 그대로 두면 안 된다.
    checks: [[/컥|캑|목에 걸|목이 막/, '질식으로 안 올림', true]],
  },
};
let bad = 0;
for (const [H, spec] of Object.entries(RULES)) {
  console.log(`=== 호리 ${H} (${spec.name})`);
  for (const k of fs.readdirSync(D, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const f = `${D}/${k.name}/26-50.md`;
    if (!fs.existsSync(f)) continue;
    const md = fs.readFileSync(f, 'utf8');
    for (const m of md.matchAll(/^## (\d+)\. (.+)$/gm)) {
      let nx = md.indexOf('\n## ', m.index + 1); if (nx < 0) nx = md.length;
      const body = md.slice(m.index, nx);
      if (((body.match(/\*\*호리\*\* (\d+)/) || [])[1] ?? '') !== String(H)) continue;
      const miss = spec.checks.filter(([re, , invert]) => (invert ? re.test(body) : !re.test(body)));
      if (miss.length) bad += 1;
      console.log(`  ${k.name.padEnd(9)}${m[1]} ${m[2].slice(0, 20).padEnd(22)}${miss.map((x) => '🔴' + x[1]).join(' ') || '✅'}`);
    }
  }
}
console.log(bad ? `\n🔴 ${bad}권` : '\n✅ 전부 통과');
process.exit(bad ? 1 : 0);
