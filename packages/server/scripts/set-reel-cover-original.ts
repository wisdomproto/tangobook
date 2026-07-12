// 릴스 커버(썸네일)를 책의 원본 표지(coverImage)로 설정. 렌더 없이 coverUrl 만 교체(영상 유지).
// 사용자 결정: 커스텀 썸네일/클린표지 대신 "원래 표지 그대로" 사용(제목 이미 구워져 있음).
//   pnpm --filter @tangobook/server exec tsx scripts/set-reel-cover-original.ts [--dry-run]
import 'dotenv/config';
import {
  resolveClassicBookIds,
  resolveNatureBookIds,
  fetchStorybook,
} from '../src/services/reel/reel-targets.js';
import { updateReelCover } from '../src/services/reel/reel-publish.js';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const classics = (() => {
    try {
      return resolveClassicBookIds();
    } catch {
      return [];
    }
  })();
  const ids = [...new Set([...classics, ...resolveNatureBookIds()])];
  console.log(`[reel-cover-original] 대상 ${ids.length}권 · dryRun=${dryRun}`);
  const summary = { ok: 0, skip: 0, fail: 0 };

  for (const id of ids) {
    try {
      const sb = await fetchStorybook(id);
      const cover = sb?.coverImage;
      if (!cover) {
        summary.skip++;
        continue;
      }
      if (dryRun) {
        console.log(`  · ${id} ${sb.title} → ${cover.split('/').pop()}`);
        summary.ok++;
        continue;
      }
      const res = await updateReelCover({ bookId: id, coverUrl: encodeURI(cover) });
      if (res === 'skipped') {
        summary.skip++;
      } else {
        summary.ok++;
        console.log(`  ✓ ${id} ${sb.title}`);
      }
    } catch (e) {
      console.error(`  ✗ ${id} FAILED: ${(e as Error).message}`);
      summary.fail++;
    }
  }
  console.log(
    `\n[reel-cover-original] 완료 — ok=${summary.ok} skip=${summary.skip} fail=${summary.fail}`
  );
}

main().catch((e) => {
  console.error('[reel-cover-original] 치명적 오류:', e);
  process.exit(1);
});
