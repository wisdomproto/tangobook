import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
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

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: r2BucketName,
      Key: key,
    })
  );
}

export function urlToR2Key(url: string): string {
  return url.replace(`${r2PublicUrl}/`, '');
}

export async function listR2Objects(prefix: string) {
  const result = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: r2BucketName,
      Prefix: prefix,
    })
  );
  return result.Contents ?? [];
}
