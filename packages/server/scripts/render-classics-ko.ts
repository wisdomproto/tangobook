// 전 명작 × 그림체 × 언어 롱폼 오디오북 일괄 렌더 러너.
//
// 각 (book, style, lang) 조합을 render-book-audiobooks.ts 서브프로세스로 순차 렌더한다.
// 서브프로세스 격리 = 150+ 렌더에서 Chromium 메모리 누수 방지. 재개 가능(이미 등록된 조합 스킵).
//
// 🔴 로컬 서버(:3500)가 필요한데, 프로덕션 `.env` 로 띄우면 발행 스케줄러가 같이 돈다.
//    반드시 `DISABLE_PUBLISH_SCHEDULER=1` 로 띄울 것(안 그러면 중복 업로드 — 실측 2026-07-28).
//
// 사용:
//   … --dry-run              # 조합 목록만
//   … --limit=5              # 앞 5개만
//   … --force                # 완료분도 재렌더
//   … --lang=en --one-style  # 영어, 책당 그림체 1종(해시로 고정 선택)
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { fetchStorybook, loadGenreMap } from '../src/services/reel/reel-targets.js';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

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
// 🔴 `--flag value` 와 `--flag=value` 를 **둘 다** 받는다. indexOf 만 쓰면 `--lang=en` 을
//    에러 없이 조용히 무시하고 ko 로 헛렌더한다(render-nature-ko.ts 에서 실제로 겪은 버그).
const val = (f: string) => {
  const eq = argv.find((a) => a.startsWith(`${f}=`));
  if (eq) return eq.slice(f.length + 1);
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};
const DRY = has('--dry-run');
const FORCE = has('--force');
const LIMIT = Number(val('--limit') || 0);
const LANG = val('--lang') || 'ko';
/**
 * `--books=id,id` = 그 책만. 완료 판정(mkt_youtube_contents)은 이 파이프라인으로 올린 것만 알기
 * 때문에, **파이프라인 밖에서 이미 발행된 책**(영어 명작 20편)을 빼려면 명시적으로 지정해야 한다.
 */
const ONLY = (val('--books') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
/**
 * `--one-style` = 책마다 그림체 **1종만** 렌더한다.
 *
 * 왜(2026-07-28): 같은 이야기를 3그림체로 3번 올리면 유튜브 「inauthentic content」 정책이 말하는
 * "같은 상황 반복"에 가깝다. 한국 채널은 이 이유로 135→48 로 줄였다.
 * 🔴 고르는 방식은 **bookId 해시**다 — Math.random 이면 재개할 때마다 다른 그림체를 골라
 *    이미 렌더한 것을 못 알아보고 중복 렌더한다.
 */
const ONE_STYLE = has('--one-style');

function pickOne<T>(bookId: string, arr: T[]): T {
  let h = 0;
  for (const ch of bookId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}

interface Combo {
  bookId: string;
  styleId: string;
  genre: string;
  title: string;
}

async function main() {
  const genreMap = await loadGenreMap(); // styleId -> slug
  const allIds = await fetchPublicClassicIds();
  const bookIds = ONLY.length ? allIds.filter((id) => ONLY.includes(id)) : allIds;
  if (ONLY.length && bookIds.length !== ONLY.length) {
    console.warn(`⚠️ --books ${ONLY.length}개 중 공개 명작에서 찾은 건 ${bookIds.length}개`);
  }
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
    const styleAssets = book?.styleAssets ?? {};
    const styles = Object.keys(styleAssets);
    // 그 장르에 매핑된 style 중 페이지 삽화가 실제로 있는 것만 (photographic 등 삽화 없는 style 제외).
    const available = GENRES.map((genre) => ({
      genre,
      styleId: styles.find(
        (s) =>
          genreMap[s] === genre && Object.keys(styleAssets[s]?.pageIllustrations ?? {}).length > 0
      ),
    })).filter((x): x is { genre: string; styleId: string } => !!x.styleId);

    if (!available.length) {
      noMapping.push(book?.title ?? bookId);
      continue;
    }
    for (const { genre, styleId } of ONE_STYLE ? [pickOne(bookId, available)] : available) {
      if (done.has(`${bookId}|${styleId}|${LANG}`)) continue;
      combos.push({ bookId, styleId, genre, title: book.title ?? bookId });
    }
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
