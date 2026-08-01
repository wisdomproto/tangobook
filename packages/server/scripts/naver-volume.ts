// 네이버 검색량 조회 — 키워드를 인자로 주면 월 검색량·경쟁도를 표로 뱉는다.
//   npx tsx scripts/naver-volume.ts 한글떼기 파닉스 …
//   npx tsx scripts/naver-volume.ts --file keywords.txt
//
// 🔴 함정 두 개(전에 당했다, memory `youtube-korea-redesign-2026-07-28`):
//   ① **셸 환경변수에 옛 키가 남아 `.env` 를 덮는다** → `dotenv.config({override:true})` 로 강제.
//   ② `config` 를 정적 import 하면 **호이스팅돼 dotenv 보다 먼저** 읽힌다 → **동적 import**.
// 🔴 네이버 키워드 도구는 **힌트 5개 제한**이고 과하게 때리면 429 다 — 5개씩 끊고 간격을 둔다.
//    응답 매퍼는 `totalSearchVolume`(pc+mobile)·`competition` 을 주고, 원본 `monthlyPcQcCnt` 가 아니다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV = [path.join(__dirname, '..', '.env'), 'C:/projects/tangobook/packages/server/.env'].find(
  (f) => fs.existsSync(f)
);
if (!ENV) throw new Error('.env 를 못 찾았다');
dotenv.config({ path: ENV, override: true });

const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
const words =
  fileIdx >= 0
    ? fs
        .readFileSync(args[fileIdx + 1], 'utf8')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
    : args.filter((a) => !a.startsWith('--'));
if (!words.length) throw new Error('키워드를 주세요');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { searchKeywords } = await import('../src/services/mkt/external/naver-searchad.js');
  const rows: Array<{ keyword: string; totalSearchVolume: number; competition: string }> = [];
  for (let i = 0; i < words.length; i += 5) {
    const chunk = words.slice(i, i + 5);
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await searchKeywords(chunk);
        // 응답엔 연관 키워드가 딸려 오므로 **물어본 것만** 남긴다(공백 제거해 비교).
        const asked = new Set(chunk.map((w) => w.replace(/\s+/g, '')));
        for (const r of res) if (asked.has(r.keyword.replace(/\s+/g, ''))) rows.push(r);
        break;
      } catch (e) {
        const msg = (e as Error)?.message ?? String(e);
        if (attempt >= 3) {
          console.error(`  ! 실패(${chunk.join(', ')}): ${msg}`);
          break;
        }
        await sleep(2000 * (attempt + 1)); // 429 백오프
      }
    }
    await sleep(400);
  }
  rows.sort((a, b) => b.totalSearchVolume - a.totalSearchVolume);
  const w = Math.max(...rows.map((r) => r.keyword.length), 8);
  console.log(`${'키워드'.padEnd(w)}  월검색량   경쟁도`);
  for (const r of rows) {
    console.log(
      `${r.keyword.padEnd(w)}  ${String(r.totalSearchVolume).padStart(7)}   ${r.competition}`
    );
  }
  const missing = words.filter(
    (q) => !rows.some((r) => r.keyword.replace(/\s+/g, '') === q.replace(/\s+/g, ''))
  );
  if (missing.length) console.log(`\n(응답 없음: ${missing.join(', ')})`);
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
