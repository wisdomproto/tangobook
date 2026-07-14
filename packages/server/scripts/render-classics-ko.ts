// 전 명작 × 메인 3그림체 × 한국어(ko) 롱폼 오디오북 일괄 렌더 러너.
//
// 각 (book, style, ko) 조합을 render-book-audiobooks.ts 서브프로세스로 순차 렌더한다.
// 서브프로세스 격리 = 150+ 렌더에서 Chromium 메모리 누수 방지. 재개 가능(이미 등록된 조합 스킵).
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/render-classics-ko.ts --dry-run   # 조합 목록만
//   pnpm --filter @tangobook/server exec tsx scripts/render-classics-ko.ts --limit=5   # 앞 5개만
//   pnpm --filter @tangobook/server exec tsx scripts/render-classics-ko.ts             # 전체(수십 시간)
//   pnpm --filter @tangobook/server exec tsx scripts/render-classics-ko.ts --force     # 완료분도 재렌더
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { fetchStorybook, loadGenreMap } from '../src/services/reel/reel-targets.js';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

const LANG = 'ko';
const GENRES = ['watercolor', 'paper3d', 'collage']; // 메인 3그림체
const API = process.env.TTS_API_ORIGIN || 'http://localhost:3500';

/**
 * 현재 라이브 공개 세계명작 id. books-by-category.json(스크립트용 stale 스냅샷)이 아니라
 * 서버 요약 API 로 실시간 조회 — 신규 공개(예: 헨젤과 그레텔) 반영 + 비공개/삭제 제외.
 */
async function fetchPublicClassicIds(): Promise<string[]> {
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
    .filter((b) => /세계|명작/.test(b.category ?? '') && b.isPublic !== false)
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
  genre: string;
  title: string;
}

async function main() {
  const genreMap = await loadGenreMap(); // styleId -> slug
  const bookIds = await fetchPublicClassicIds();
  console.log(
    `명작 ${bookIds.length}권 · 그림체 매핑 ${Object.keys(genreMap).length}개 · lang=${LANG}${FORCE ? ' · FORCE' : ''}`
  );

  // 이미 완료된 (book|style|lang) 조합 — video_url 있는 mkt_youtube_contents 행에서 수집.
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

  // 조합 구성: 책마다 메인 3장르에 매핑된 style id 하나씩.
  const combos: Combo[] = [];
  const noMapping: string[] = [];
  for (const bookId of bookIds) {
    let book: any;
    try {
      book = await fetchStorybook(bookId);
    } catch {
      noMapping.push(`${bookId}(fetch실패)`);
      continue;
    }
    const styles = Object.keys(book?.styleAssets ?? {});
    let picked = 0;
    for (const genre of GENRES) {
      const styleId = styles.find((s) => genreMap[s] === genre);
      if (!styleId) continue;
      picked++;
      if (done.has(`${bookId}|${styleId}|${LANG}`)) continue;
      combos.push({ bookId, styleId, genre, title: book.title ?? bookId });
    }
    if (picked === 0) noMapping.push(book?.title ?? bookId);
  }

  let list = combos;
  if (LIMIT > 0) list = list.slice(0, LIMIT);

  console.log(
    `\n렌더 대상 ${list.length}개 (전체 미완 후보 ${combos.length}) · 메인그림체 매핑 없는 책 ${noMapping.length}`
  );
  if (noMapping.length) {
    console.log(
      '  ⚠️ 매핑 없음(스킵):',
      noMapping.slice(0, 25).join(', ') + (noMapping.length > 25 ? ' …' : '')
    );
  }

  if (DRY) {
    for (const c of list) console.log(`  [dry] ${c.title} · ${c.genre}(${c.styleId}) · ${LANG}`);
    console.log(`\nDry-run. 실제 실행은 --dry-run 제거. (--limit N, --force)`);
    return;
  }

  // 순차 렌더 (조합당 서브프로세스).
  let ok = 0;
  let fail = 0;
  const t0 = Date.now();
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    console.log(`\n===== [${i + 1}/${list.length}] ${c.title} · ${c.genre} · ${LANG} =====`);
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
