// R2 고아 영상 정리 — mkt/{projectId}/{longform,reels}/ 아래 mp4/png 중 **어떤 DB 행도 참조하지 않는**
// 파일만 삭제(재렌더로 버려진 옛 버전). 참조 중인 파일은 절대 건드리지 않는다.
//
// 참조 소스:
//   mkt_youtube_contents.video_url / thumbnail_url                      (롱폼)
//   mkt_instagram_contents.video_settings.reels[lang].videoUrl/coverUrl (릴스)
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/clean-orphan-videos.ts            # dry-run
//   pnpm --filter @tangobook/server exec tsx scripts/clean-orphan-videos.ts --apply    # 실제 삭제
import 'dotenv/config';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

const APPLY = process.argv.includes('--apply');
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
const BUCKET = process.env.R2_BUCKET_NAME!;
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/** URL(또는 인코딩된 URL) → R2 key. PUBLIC_URL prefix 제거 + decode. */
function urlToKey(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.replace(/^\//, ''));
  } catch {
    return null;
  }
}

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase admin 미설정');

  // 1. 참조 중인 key 수집
  const referenced = new Set<string>();
  const add = (url?: string | null) => {
    const k = url ? urlToKey(url) : null;
    if (k) referenced.add(k);
  };
  const { data: yt } = await sb.from('mkt_youtube_contents').select('video_url, thumbnail_url');
  for (const r of yt ?? []) {
    add((r as any).video_url);
    add((r as any).thumbnail_url);
  }
  const { data: ig } = await sb.from('mkt_instagram_contents').select('video_settings');
  for (const r of ig ?? []) {
    const reels = ((r as any).video_settings?.reels ?? {}) as Record<string, any>;
    for (const v of Object.values(reels)) {
      add(v?.videoUrl);
      add(v?.coverUrl);
    }
  }
  console.log(`참조 중인 영상/썸네일 key ${referenced.size}개`);

  // 2. R2 mkt/ 아래 longform/·reels/ 의 mp4·png 나열
  const orphans: { key: string; size: number }[] = [];
  let scanned = 0;
  let token: string | undefined;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'mkt/', ContinuationToken: token })
    );
    for (const o of out.Contents ?? []) {
      const key = o.Key ?? '';
      if (!/\/(longform|reels)\/.+\.(mp4|png)$/i.test(key)) continue; // 영상/썸네일만
      scanned++;
      if (!referenced.has(key)) orphans.push({ key, size: o.Size ?? 0 });
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);

  const bytes = orphans.reduce((s, o) => s + o.size, 0);
  console.log(
    `스캔 ${scanned}개 · 고아 ${orphans.length}개 · ~${(bytes / 1e9).toFixed(2)}GB${APPLY ? '' : ' (dry-run)'}`
  );
  for (const o of orphans.slice(0, 15))
    console.log(`  ${APPLY ? 'DEL' : 'would'} ${o.key} (${(o.size / 1e6).toFixed(1)}MB)`);
  if (orphans.length > 15) console.log(`  … 외 ${orphans.length - 15}개`);

  if (!APPLY) {
    console.log('\nDry-run. 실제 삭제는 --apply.');
    return;
  }
  // 3. 배치 삭제(1000개씩)
  for (let i = 0; i < orphans.length; i += 1000) {
    const batch = orphans.slice(i, i + 1000).map((o) => ({ Key: o.key }));
    await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: batch } }));
    console.log(`  삭제 ${Math.min(i + 1000, orphans.length)}/${orphans.length}`);
  }
  console.log(`완료 — ${orphans.length}개 삭제 (~${(bytes / 1e9).toFixed(2)}GB 회수).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
