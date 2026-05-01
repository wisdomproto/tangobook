import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  type _Object,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/index.js';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
  maxAttempts: 3,
});

/** R2 SDK 호출에 timeout 보호. 개별 요청이 hang 해도 cache refresh 가 영원히 stuck 되지 않도록. */
async function withR2Timeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`R2 timeout (${label}, ${ms}ms)`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const r2BucketName = config.r2.bucketName;
export const r2PublicUrl = config.r2.publicUrl;

export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${r2PublicUrl}/${key}`;
}

export async function uploadBase64ToR2(base64: string, key: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');
  return uploadBufferToR2(buffer, key, 'image/png');
}

export async function uploadJsonToR2(data: unknown, key: string): Promise<string> {
  const buffer = Buffer.from(JSON.stringify(data), 'utf-8');
  return uploadBufferToR2(buffer, key, 'application/json');
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  const result = await withR2Timeout(
    r2Client.send(
      new GetObjectCommand({
        Bucket: r2BucketName,
        Key: key,
      })
    ),
    20_000,
    `download:${key}`
  );
  const bytes = await withR2Timeout(
    result.Body?.transformToByteArray() ?? Promise.reject(new Error(`R2 파일 없음: ${key}`)),
    15_000,
    `read:${key}`
  );
  if (!bytes) throw new Error(`R2 파일 없음: ${key}`);
  return Buffer.from(bytes);
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: r2BucketName,
      Key: key,
    })
  );
}

export async function deleteManyFromR2(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  // S3 DeleteObjects는 1회 최대 1000개
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    await r2Client.send(
      new DeleteObjectsCommand({
        Bucket: r2BucketName,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      })
    );
  }
}

export function urlToR2Key(url: string): string {
  return url.replace(`${r2PublicUrl}/`, '');
}

/** 같은 버킷 내 zero-copy. 마이그·재배치에 사용. */
export async function copyR2Object(srcKey: string, destKey: string): Promise<void> {
  await r2Client.send(
    new CopyObjectCommand({
      Bucket: r2BucketName,
      CopySource: `${r2BucketName}/${encodeURIComponent(srcKey).replace(/%2F/g, '/')}`,
      Key: destKey,
    })
  );
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: config.r2.bucketName, Key: key }));
    return true;
  } catch (e: unknown) {
    const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return false;
    throw e;
  }
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 1800
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: r2BucketName,
    Key: key,
    ContentType: contentType,
  });
  // @smithy/types 버전 충돌 회피 (presigner vs client-s3)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uploadUrl = await getSignedUrl(r2Client as any, command as any, { expiresIn });
  const publicUrl = `${r2PublicUrl}/${key}`;
  return { uploadUrl, publicUrl };
}

export async function listR2Objects(prefix: string) {
  const allContents: _Object[] = [];
  let continuationToken: string | undefined;

  do {
    const result = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: r2BucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    if (result.Contents) allContents.push(...result.Contents);
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);

  return allContents;
}
