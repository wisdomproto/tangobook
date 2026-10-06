/** Explicit one-time cleanup. Dry-run creates a reviewable backup/plan; --apply rechecks it. */
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
dotenv.config({ path: path.resolve('../../.env'), override: true, quiet: true });
const { r2Client, r2BucketName, r2PublicUrl, r2CdnUrl, listR2Objects, deleteManyFromR2 } =
  await import('../src/providers/r2.provider.js');
const { GetObjectCommand, PutObjectCommand } = await import('@aws-sdk/client-s3');
const { getSupabaseAdmin } = await import('../src/providers/supabase-admin.provider.js');
const { resolveMarketingProject } = await import('../src/services/marketing-source.service.js');
const out = path.resolve(
  process.argv.find((a) => a.startsWith('--out='))?.slice(6) ??
    'D:/tangobook-video/legacy-video-cleanup-20261002'
);
const apply = process.argv.includes('--apply');
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const sb = getSupabaseAdmin();
const project = await resolveMarketingProject();
if (!sb || !project) throw new Error('Marketing project unavailable');
const hosts = new Set([r2PublicUrl, r2CdnUrl].filter(Boolean).map((x) => new URL(x).host));
const videoKeys = new Set<string>();
function findVideos(value: unknown): void {
  if (typeof value === 'string') {
    try {
      const u = new URL(value);
      if (hosts.has(u.host) && /\.(mp4|webm|mov|mkv)$/i.test(u.pathname))
        videoKeys.add(decodeURIComponent(u.pathname.slice(1)));
    } catch {
      /* not URL */
    }
  } else if (Array.isArray(value)) value.forEach(findVideos);
  else if (value && typeof value === 'object') Object.values(value).forEach(findVideos);
}
async function rows(table: string) {
  const result: Record<string, any>[] = [];
  for (let i = 0; ; i += 500) {
    const { data, error } = await sb!
      .from(table)
      .select('*')
      .eq('project_id', project!.id)
      .range(i, i + 499);
    if (error) throw error;
    result.push(...(data ?? []));
    if ((data?.length ?? 0) < 500) return result;
  }
}
async function channelRows(table: string, contentIds: string[]) {
  const result: Record<string, any>[] = [];
  for (let i = 0; i < contentIds.length; i += 100) {
    const { data, error } = await sb!
      .from(table)
      .select('*')
      .in('content_id', contentIds.slice(i, i + 100));
    if (error) throw error;
    result.push(...(data ?? []));
  }
  return result;
}
if (process.argv.includes('--verify')) {
  const plan = JSON.parse(await fs.readFile(path.join(out, 'plan.json'), 'utf8'));
  let next = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (next < plan.books.length) {
        const b = plan.books[next++];
        const object = await r2Client.send(
          new GetObjectCommand({ Bucket: r2BucketName, Key: b.key })
        );
        const actual = JSON.parse(await object.Body!.transformToString());
        const expected = { ...b.original };
        delete expected.audiobookProjects;
        delete expected.longformProjects;
        if (!isDeepStrictEqual(actual, expected))
          throw new Error('Book preservation failed: ' + b.key);
      }
    })
  );
  const ids = (await rows('mkt_contents')).map((x) => x.id);
  const youtube = await channelRows('mkt_youtube_contents', ids);
  if (youtube.some((x) => plan.youtube.some((old: Record<string, any>) => old.id === x.id)))
    throw new Error('Old longform still registered');
  const instagram = await channelRows('mkt_instagram_contents', ids);
  for (const old of plan.instagram) {
    const actual = instagram.find((x) => x.id === old.id);
    const expected = { ...old };
    expected.video_settings = { ...old.video_settings };
    delete expected.video_settings.reels;
    delete expected.video_settings.videoUrl;
    if (!actual) throw new Error('Instagram content missing: ' + old.id);
    delete expected.updated_at;
    const current = { ...actual };
    delete current.updated_at;
    if (!isDeepStrictEqual(current, expected))
      throw new Error('Instagram preservation failed: ' + old.id);
  }
  const pending = await rows('mkt_publish_records');
  if (
    plan.pending.some(
      (old: Record<string, any>) => pending.find((x) => x.id === old.id)?.status !== 'draft'
    )
  )
    throw new Error('Old video reservation still active');
  const stored = new Set((await listR2Objects('')).map((x) => x.Key));
  const remaining = plan.videoKeys.filter((key: string) => stored.has(key));
  if (remaining.length) throw new Error('Video files remain: ' + remaining.length);
  const result = {
    verifiedAt: new Date().toISOString(),
    counts: plan.counts,
    bookOtherFieldsPreserved: true,
    instagramOtherFieldsPreserved: true,
    oldFilesRemaining: 0,
  };
  await fs.writeFile(path.join(out, 'verification.json'), JSON.stringify(result, null, 2));
  console.log('VERIFIED', JSON.stringify(result));
} else if (!apply) {
  await fs.mkdir(out, { recursive: true });
  const contents = await rows('mkt_contents');
  const ids = contents.map((x) => x.id);
  const youtube = (await channelRows('mkt_youtube_contents', ids)).filter((x) => x.video_url);
  const instagram = (await channelRows('mkt_instagram_contents', ids)).filter(
    (x) => x.video_settings?.reels || x.video_settings?.videoUrl
  );
  for (const row of youtube) findVideos(row.video_url);
  for (const row of instagram) findVideos(row.video_settings);
  const books: Record<string, any>[] = [];
  const objects = (await listR2Objects('storybook-')).filter((x) => x.Key?.endsWith('.json'));
  let next = 0,
    scanned = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (next < objects.length) {
        const key = objects[next++]!.Key!;
        const object = await r2Client.send(
          new GetObjectCommand({ Bucket: r2BucketName, Key: key })
        );
        const raw = await object.Body!.transformToString();
        const book = JSON.parse(raw);
        if (book.audiobookProjects?.length || book.longformProjects?.length) {
          findVideos(book.audiobookProjects);
          findVideos(book.longformProjects);
          books.push({ key, etag: object.ETag, sha256: sha(raw), original: book });
        }
        scanned++;
        if (scanned % 100 === 0) console.log('Scanned books', scanned, '/', objects.length);
      }
    })
  );
  const pending = (await rows('mkt_publish_records')).filter(
    (x) =>
      ['scheduled', 'publishing', 'pending', 'failed'].includes(x.status) &&
      !x.published_url &&
      !x.platform_post_id &&
      ['longform', 'reels'].includes(x.metadata?.content_kind)
  );
  console.log(
    'PUBLISHING RECORDS',
    JSON.stringify(
      pending
        .filter((x) => x.status === 'publishing')
        .map((x) => ({ id: x.id, updatedAt: x.updated_at, scheduledAt: x.scheduled_at }))
    )
  );
  const stored = new Set(
    (await listR2Objects('')).filter((x) => x.Key && videoKeys.has(x.Key)).map((x) => x.Key!)
  );
  const plan = {
    projectId: project.id,
    createdAt: new Date().toISOString(),
    books,
    youtube,
    instagram,
    pending,
    videoKeys: [...stored].sort(),
    missingVideoKeys: [...videoKeys].filter((k) => !stored.has(k)),
    counts: {
      books: books.length,
      youtube: youtube.length,
      instagram: instagram.length,
      pending: pending.length,
      files: stored.size,
    },
  };
  await fs.writeFile(path.join(out, 'plan.json'), JSON.stringify(plan, null, 2));
  console.log('DRY RUN', JSON.stringify(plan.counts), 'backup', out);
} else {
  const plan = JSON.parse(await fs.readFile(path.join(out, 'plan.json'), 'utf8'));
  if (plan.projectId !== project.id) throw new Error('Project mismatch');
  // Full preflight before any deletion; stale plans must be rebuilt, not blindly applied.
  for (const b of plan.books) {
    const o = await r2Client.send(new GetObjectCommand({ Bucket: r2BucketName, Key: b.key }));
    if (sha(await o.Body!.transformToString()) !== b.sha256)
      throw new Error('Book changed: ' + b.key);
  }
  const pending = await rows('mkt_publish_records');
  if (
    pending.some(
      (x) =>
        x.status === 'publishing' &&
        !x.published_url &&
        ['longform', 'reels'].includes(x.metadata?.content_kind) &&
        Date.now() - Date.parse(x.updated_at) < 24 * 60 * 60 * 1000
    )
  )
    throw new Error('An old video is publishing');
  for (const row of [...plan.youtube, ...plan.instagram]) {
    const table = plan.youtube.includes(row) ? 'mkt_youtube_contents' : 'mkt_instagram_contents';
    const { data, error } = await sb.from(table).select('*').eq('id', row.id).single();
    if (error) throw error;
    if (data.updated_at !== row.updated_at) throw new Error('Marketing video changed: ' + row.id);
  }
  for (const record of plan.pending) {
    const { data, error } = await sb
      .from('mkt_publish_records')
      .update({
        status: 'draft',
        error_message: '사용자 요청: 기존 등록 동영상 정리',
        updated_at: new Date().toISOString(),
      })
      .eq('id', record.id)
      .eq('updated_at', record.updated_at)
      .in('status', ['scheduled', 'pending', 'failed', 'publishing'])
      .select('id');
    if (error) throw error;
    if (data?.length !== 1) throw new Error('Publish record changed: ' + record.id);
  }
  for (const b of plan.books) {
    const copy = { ...b.original };
    delete copy.audiobookProjects;
    delete copy.longformProjects;
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: b.key,
        Body: JSON.stringify(copy),
        ContentType: 'application/json',
        IfMatch: b.etag,
      })
    );
  }
  for (const row of plan.youtube) {
    const { error } = await sb.from('mkt_youtube_contents').delete().eq('id', row.id);
    if (error) throw error;
  }
  for (const row of plan.instagram) {
    const settings = { ...row.video_settings };
    delete settings.reels;
    delete settings.videoUrl;
    const { error } = await sb
      .from('mkt_instagram_contents')
      .update({ video_settings: settings, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    if (error) throw error;
  }
  await deleteManyFromR2(plan.videoKeys);
  await fs.writeFile(
    path.join(out, 'result.json'),
    JSON.stringify(
      {
        completedAt: new Date().toISOString(),
        counts: plan.counts,
        deletedKeys: plan.videoKeys,
        externalPostsDeleted: false,
        localDeliverablesDeleted: false,
      },
      null,
      2
    )
  );
  console.log('CLEANUP COMPLETE', JSON.stringify(plan.counts));
}
