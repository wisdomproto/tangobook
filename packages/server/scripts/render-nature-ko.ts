// 전 자연관찰(실사) 책 × 한국어(ko) 롱폼 오디오북 일괄 렌더 러너.
//
// 명작(render-classics-ko.ts)과 달리 자연관찰 책은 그림체가 없는 실사 단일본이다.
// 이미지가 styleAssets 가 아니라 base pages[].illustrationUrl 에 있어 render-book-audiobooks 가
// base 렌더 경로로 처리한다(--style=<styleAssets 키, 보통 photographic>). 조합당 서브프로세스 격리 + 재개 가능.
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/render-nature-ko.ts --dry-run   # 대상 목록만
//   pnpm --filter @tangobook/server exec tsx scripts/render-nature-ko.ts --limit=2   # 앞 2권만
//   pnpm --filter @tangobook/server exec tsx scripts/render-nature-ko.ts             # 전체(수 시간)
//   pnpm --filter @tangobook/server exec tsx scripts/render-nature-ko.ts --force     # 완료분도 재렌더
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { fetchStorybook } from '../src/services/reel/reel-targets.js';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

const LANG = 'ko';
const API = process.env.TTS_API_ORIGIN || 'http://localhost:3500';

// 자연관찰 카테고리(동물/곤충/공룡/몸/우주/식물). 명작·생활동화·파닉스는 제외.
const NATURE_CATEGORY = /동물|곤충|공룡|우리 몸|우주와 자연|식물/;

/** 현재 라이브 공개 자연관찰 id (서버 요약 API 실시간 조회). */
async function fetchPublicNatureIds(): Promise<string[]> {
  const res = await fetch(`${API}/api/storybooks`);
  if (!res.ok)
    throw new Error(`storybooks 목록 조회 실패: HTTP ${res.status} (로컬 서버 ${API} 필요)`);
  const json = (await res.json()) as { data?: any[] } | any[];
  const list = (Array.isArray(json) ? json : (json.data ?? [])) as Array<{
    id: string;
    category?: string;
    isPublic?: boolean;
  }>;
  return list
    .filter((b) => NATURE_CATEGORY.test(b.category ?? '') && b.isPublic !== false)
    .map((b) => String(b.id));
}

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};
const DRY = has('--dry-run');
const FORCE = has('--force');
const LIMIT = Number(val('--limit') || 0);

interface Combo {
  bookId: string;
  styleId: string;
  title: string;
}

/** 실사책의 styleAssets 키(보통 'photographic'). 없으면 'photographic' 폴백. */
function pickBaseStyle(book: any): string {
  const keys = Object.keys(book?.styleAssets ?? {});
  return keys[0] || 'photographic';
}

async function main() {
  const bookIds = await fetchPublicNatureIds();
  console.log(`자연관찰 ${bookIds.length}권 · lang=${LANG}${FORCE ? ' · FORCE' : ''}`);

  // 이미 완료된 (book|style|lang) — video_url 있는 mkt_youtube_contents 행에서 수집.
  const done = new Set<string>();
  if (!FORCE) {
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data, error } = await sb
        .from('mkt_youtube_contents')
        .select('video_url, video_settings');
      if (error) console.warn('done-check 조회 실패:', error.message);
      for (const r of (data ?? []) as Array<{ video_url: string | null; video_settings: any }>) {
        const vs = r.video_settings;
        if (vs?.bookId && vs?.artStyle && vs?.language && r.video_url) {
          done.add(`${vs.bookId}|${vs.artStyle}|${vs.language}`);
        }
      }
    }
  }

  const combos: Combo[] = [];
  const skipped: string[] = [];
  for (const bookId of bookIds) {
    let book: any;
    try {
      book = await fetchStorybook(bookId);
    } catch {
      skipped.push(`${bookId}(fetch실패)`);
      continue;
    }
    const styleId = pickBaseStyle(book);
    const hasPages = (book?.pages ?? []).some((p: any) => p.illustrationUrl);
    if (!hasPages) {
      skipped.push(book?.title ?? bookId);
      continue;
    }
    if (done.has(`${bookId}|${styleId}|${LANG}`)) continue;
    combos.push({ bookId, styleId, title: book.title ?? bookId });
  }

  let list = combos;
  if (LIMIT > 0) list = list.slice(0, LIMIT);

  console.log(
    `\n렌더 대상 ${list.length}개 (전체 미완 후보 ${combos.length}) · 삽화 없음/실패 스킵 ${skipped.length}`
  );
  if (skipped.length) {
    console.log('  ⚠️ 스킵:', skipped.slice(0, 25).join(', ') + (skipped.length > 25 ? ' …' : ''));
  }

  if (DRY) {
    for (const c of list) console.log(`  [dry] ${c.title} · ${c.styleId} · ${LANG}`);
    console.log(`\nDry-run. 실제 실행은 --dry-run 제거. (--limit N, --force)`);
    return;
  }

  let ok = 0;
  let fail = 0;
  const t0 = Date.now();
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    console.log(`\n===== [${i + 1}/${list.length}] ${c.title} · ${c.styleId} · ${LANG} =====`);
    const cmd = `pnpm --filter @tangobook/server exec tsx scripts/render-book-audiobooks.ts --book=${c.bookId} --style=${c.styleId} --lang=${LANG}`;
    const r = spawnSync(cmd, { stdio: 'inherit', shell: true });
    if (r.status === 0) ok++;
    else {
      fail++;
      console.error(`  ✗ 실패(exit ${r.status}) — 계속 진행`);
    }
  }
  const mins = ((Date.now() - t0) / 60000).toFixed(0);
  console.log(`\n완료 — 성공 ${ok} · 실패 ${fail} · ${mins}분`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
