import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  type _Object,
} from '@aws-sdk/client-s3';
import { config } from '../config/index.js';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

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
  const result = await r2Client.send(
    new GetObjectCommand({
      Bucket: r2BucketName,
      Key: key,
    })
  );
  const bytes = await result.Body?.transformToByteArray();
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
