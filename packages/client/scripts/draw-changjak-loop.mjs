// 창작동화 삽화 — 다 그릴 때까지 도는 드라이버.
// 🔴 러너는 한 번 돌고 끝난다. 그래서 「백그라운드로 그리는 중」은 이 루프가 있어야 참이 된다.
// 한 바퀴 = 5권 굽기 → 다 채워진 권 R2 업로드(업로드가 곧 진행 기록) → 다음 바퀴.
import { execFileSync } from 'node:child_process';
import { SERIES as SERIES_CFG } from './_series-config.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const OUT = path.join(ROOT, '.draw');
const API = 'https://www.tangobook.co.kr';
const argv = process.argv.slice(2);
// 🔴 시리즈당 상한 — 없으면 한 시리즈를 50권까지 채우고서야 다음으로 넘어간다.
//    「모든 시리즈가 최소 절반은 서 있게」가 목적이라 25로 끊고 한 바퀴 돈다.
const CAP = /^\d+$/.test(argv[0]) ? Number(argv.shift()) : 0;
const SERIES = argv;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 🔴 네트워크가 한 번 튀면 레인이 통째로 죽는다(ECONNABORTED 실측) — 물어보는 것에는 재시도를 둔다.
async function countsOf(key) {
  for (let i = 0; i < 6; i++) {
    try {
      const j = await fetch(`${API}/api/comic-assets/series/${key}`).then((r) => r.json());
      return j.data ?? {};
    } catch (e) {
      console.log(`!! R2 조회 실패 ${i + 1}/6: ${e.message}`);
      await sleep(10000 * (i + 1));
    }
  }
  return null;
}

// 🔴 권수는 설정에서 파생한다 — 키 목록을 손으로 들면 시리즈가 늘 때 조용히 틀린다.
const run = (cwd, file, args) => execFileSync('node', [file, ...args], { cwd, stdio: 'inherit', maxBuffer: 1 << 28 });

for (const key of SERIES) {
  for (let round = 1; round <= 60; round++) {
    const counts = await countsOf(key);
    if (!counts) { console.log('!! R2 현황을 못 읽었다 — 60초 뒤 같은 라운드를 다시 시도한다'); await sleep(60000); round -= 1; continue; }
    const total = Object.values(counts).filter((n) => n >= 10).length;
    const vols = SERIES_CFG[key].no <= '15' ? 50 : 25;
    const goal = CAP ? Math.min(CAP, vols) : vols;
    if (total >= goal) { console.log(`\n### ${key} 완료 ${total}/${goal}권`); break; }
    console.log(`\n### ${key} 라운드 ${round} — R2 에 ${total}/${goal}권`);
    try { run(ROOT, 'packages/client/scripts/draw-changjak.mjs', [key, '--limit=5']); }
    catch (e) { console.log(`!! 굽기 실패: ${e.message}`); }

    // 로컬에 10장 다 있는데 R2 에 덜 있는 권만 올린다
    const ready = fs.existsSync(OUT)
      ? fs.readdirSync(OUT).filter((d) => d.startsWith(`${key}-`)
          && fs.readdirSync(path.join(OUT, d)).filter((f) => /^p\d+\.png$/.test(f)).length >= 10
          && (counts[d] ?? 0) < 10)
      : [];
    if (ready.length) {
      try { run(path.join(ROOT, 'packages/server'), 'scripts/upload-changjak-art.mjs', ready); }
      catch (e) { console.log(`!! 업로드 실패: ${e.message}`); }
      // 🔴 올리기까지만 하면 그림이 editor2 에 안 보인다 — 책 쪽의 `illustrationUrl` 에
      //    물리는 것은 링커의 일이고, 그걸 빼먹어 1,700장을 아무도 못 보고 있었다(2026-09-10).
      //    그리기 → 올리기 → 링크 가 한 벌이다. 멱등이라 매 바퀴 돌아도 안전하다.
      try { run(path.join(ROOT, 'packages/server'), 'scripts/link-changjak-series.mjs', [key, '--apply']); }
      catch (e) { console.log(`!! 링크 실패: ${e.message}`); }
    } else { console.log('올릴 권 없음 — 이번 바퀴에 완성된 게 없다'); }
  }
}
console.log('\n=== 드라이버 종료 ===');
