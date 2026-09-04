// 네이버 키워드 축 확장 수집 — 씨앗을 주면 **연관 키워드까지 전부** 모아 축별로 저장한다.
//
//   npx tsx scripts/naver-expand.ts                # 전 축
//   npx tsx scripts/naver-expand.ts --axis=활동     # 한 축만
//   npx tsx scripts/naver-expand.ts --dry-run      # 씨앗만 보고 안 때림
//
// 🔴 `naver-volume.ts` 와 다른 점: 그 스크립트는 "물어본 것만" 남긴다.
//    코퍼스를 넓히려면 딸려 오는 연관 키워드가 본체라서, 여기선 전부 보관한다.
//    (기존 22,289개 코퍼스가 이 방식으로 만들어졌고, 씨앗이 콘텐츠 주제뿐이라
//     활동축·부모도구축이 통째로 비어 있었다.)
//
// 🔴 함정(naver-volume.ts 와 동일 — 전에 당했다):
//   ① 셸 환경변수에 옛 키가 남아 `.env` 를 덮는다 → `dotenv.config({override:true})`.
//   ② `config` 정적 import 는 호이스팅돼 dotenv 보다 먼저 읽힌다 → **동적 import**.
//   ③ 힌트는 **5개 제한**이고 과하게 때리면 429 → 5개씩 끊고 간격을 둔다.
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

/**
 * 축 = 우리가 답하려는 질문 하나. 씨앗은 그 질문의 언어다.
 * 🔴 씨앗이 곧 코퍼스의 경계다 — 안 뿌린 축은 "수요 없음"이 아니라 "안 물어봄"으로 비어 있다.
 */
const AXES: Record<string, string[]> = {
  // 유입 — 검색에서 데려오는 자리. 08-17 에 12개만 손으로 쟀던 축.
  활동: [
    '색칠도안',
    '색칠공부',
    '숨은그림찾기',
    '틀린그림찾기',
    '미로찾기',
    '낱말카드',
    '유아학습지',
    '한글학습지',
    '워크북',
    '유아활동지',
    '종이접기',
    '유아놀이',
  ],
  // 유료 — 구독으로 팔 층. 지금까지 한 번도 안 쟀다.
  부모도구: [
    '책추천',
    '문해력',
    '어휘력',
    '독후활동',
    '읽기독립',
    '유아독서',
    '그림책추천',
    '독서습관',
    '독서록',
    '초등입학준비',
  ],
  // 본업 — 비교 기준선.
  본업: ['한글떼기', '한글공부', '유아한글', '파닉스', '영어파닉스'],
  // 경쟁·대체재 — 가격 근거와 포지셔닝 검증.
  경쟁: [
    '토도한글',
    '소중한글',
    '기적의한글',
    '웅진북클럽',
    '한글이야놀자',
    '유아전집',
    '전집대여',
    '유아영어앱',
    '한글공부앱',
    '아이패드학습',
  ],
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const axisArg = args.find((a) => a.startsWith('--axis='))?.split('=')[1];
const axes = axisArg ? { [axisArg]: AXES[axisArg] } : AXES;
if (axisArg && !AXES[axisArg])
  throw new Error(`모르는 축: ${axisArg} (있는 것: ${Object.keys(AXES).join(', ')})`);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Row {
  keyword: string;
  totalSearchVolume: number;
  competition: string;
  /** 이 키워드를 데려온 씨앗들 — 축 판정과 재현에 쓴다. */
  seeds: string[];
  axes: string[];
}

async function main() {
  const seedCount = Object.values(axes).flat().length;
  console.log(
    `축 ${Object.keys(axes).length}개 · 씨앗 ${seedCount}개 · 요청 ${Math.ceil(seedCount / 5)}회`
  );
  if (dryRun) {
    for (const [axis, seeds] of Object.entries(axes)) console.log(`  ${axis}: ${seeds.join(', ')}`);
    return;
  }

  const { searchKeywords } = await import('../src/services/mkt/external/naver-searchad.js');
  const byKeyword = new Map<string, Row>();
  let asked = 0;
  let failed = 0;

  for (const [axis, seeds] of Object.entries(axes)) {
    for (let i = 0; i < seeds.length; i += 5) {
      const chunk = seeds.slice(i, i + 5);
      asked++;
      for (let attempt = 0; ; attempt++) {
        try {
          const res = await searchKeywords(chunk);
          for (const r of res) {
            const prev = byKeyword.get(r.keyword);
            if (prev) {
              // 같은 키워드가 여러 씨앗에서 나오면 출처를 합친다(축 겹침도 정보다).
              for (const s of chunk) if (!prev.seeds.includes(s)) prev.seeds.push(s);
              if (!prev.axes.includes(axis)) prev.axes.push(axis);
              if (r.totalSearchVolume > prev.totalSearchVolume) {
                prev.totalSearchVolume = r.totalSearchVolume;
                prev.competition = r.competition;
              }
            } else {
              byKeyword.set(r.keyword, {
                keyword: r.keyword,
                totalSearchVolume: r.totalSearchVolume,
                competition: r.competition,
                seeds: [...chunk],
                axes: [axis],
              });
            }
          }
          console.log(
            `  ✓ ${axis} [${chunk.join(', ')}] → +${res.length} (누적 ${byKeyword.size})`
          );
          break;
        } catch (e) {
          const msg = (e as Error)?.message ?? String(e);
          if (attempt >= 3) {
            console.error(`  ! 실패 ${axis} [${chunk.join(', ')}]: ${msg}`);
            failed++;
            break;
          }
          await sleep(2000 * (attempt + 1)); // 429 백오프
        }
      }
      await sleep(500);
    }
  }

  const rows = [...byKeyword.values()].sort((a, b) => b.totalSearchVolume - a.totalSearchVolume);
  const outArg = args.find((a) => a.startsWith('--out='))?.split('=')[1];
  const outDir = outArg ?? path.join(__dirname, '..', '..', '..', 'docs', 'marketing', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const out = path.join(outDir, `naver-axis-${stamp}.json`);
  // 🔴 임시로 쓰고 옮긴다 — 바로 열어 쓰면 실패 시 기존 파일을 비운다.
  const tmp = `${out}.tmp`;
  fs.writeFileSync(
    tmp,
    JSON.stringify(
      {
        meta: {
          collectedAt: new Date().toISOString(),
          axes: Object.keys(axes),
          seedCount,
          requests: asked,
          failed,
          total: rows.length,
        },
        keywords: rows,
      },
      null,
      2
    ),
    'utf8'
  );
  fs.renameSync(tmp, out);

  console.log(
    `\n요청 ${asked}회(실패 ${failed}) · 유니크 ${rows.length}개 → ${path.relative(process.cwd(), out)}`
  );
  for (const axis of Object.keys(axes)) {
    const inAxis = rows.filter((r) => r.axes.includes(axis));
    const sum = inAxis.reduce((a, r) => a + r.totalSearchVolume, 0);
    console.log(`\n── ${axis}: ${inAxis.length}개 · 합 ${sum.toLocaleString()}`);
    for (const r of inAxis.slice(0, 12)) {
      console.log(
        `   ${String(r.totalSearchVolume).padStart(9)}  ${r.competition.padEnd(6)} ${r.keyword}`
      );
    }
  }
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
