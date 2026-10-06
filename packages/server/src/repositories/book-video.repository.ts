import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { BookVideoLibrary } from '@tangobook/shared';
import { r2Client, r2BucketName } from '../providers/r2.provider.js';
import { AppError } from '../middleware/error.middleware.js';

export function videoPrefix(bookId: string): string {
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(bookId)) throw new AppError(400, '잘못된 책 ID입니다.');
  return `book-videos/${bookId}/`;
}

export const BookVideoRepository = {
  async read(bookId: string): Promise<{ library: BookVideoLibrary; etag?: string }> {
    try {
      const result = await r2Client.send(
        new GetObjectCommand({ Bucket: r2BucketName, Key: `${videoPrefix(bookId)}index.json` })
      );
      return {
        library: JSON.parse(await result.Body!.transformToString()) as BookVideoLibrary,
        etag: result.ETag,
      };
    } catch (error) {
      const e = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404)
        return { library: { bookId, revision: 0, versions: [] } };
      throw error;
    }
  },
  async write(library: BookVideoLibrary, etag?: string): Promise<void> {
    try {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: r2BucketName,
          Key: `${videoPrefix(library.bookId)}index.json`,
          Body: JSON.stringify(library),
          ContentType: 'application/json',
          ...(etag ? { IfMatch: etag } : { IfNoneMatch: '*' }),
        })
      );
    } catch (error) {
      const e = error as { $metadata?: { httpStatusCode?: number } };
      if (e.$metadata?.httpStatusCode === 412)
        throw new AppError(409, '다른 창에서 영상을 변경했습니다. 다시 불러온 뒤 저장해 주세요.');
      throw error;
    }
  },
};
