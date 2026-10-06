import { apiGet, apiPost } from '@/lib/axios';
import type {
  BookVideoLibrary,
  BookVideoProduction,
  BookVideoFormat,
  BookVideoFile,
  BookVideoRegistration,
} from '@tangobook/shared';

const path = (bookId: string) => `/storybooks/${encodeURIComponent(bookId)}/videos`;
export const bookVideoApi = {
  get: (bookId: string) => apiGet<BookVideoLibrary>(path(bookId)),
  save: (
    bookId: string,
    revision: number,
    productions: Record<BookVideoFormat, BookVideoProduction>
  ) => apiPost<BookVideoLibrary>(path(bookId), { revision, productions }),
  register: (bookId: string, versionId: string) =>
    apiPost<BookVideoRegistration>(`${path(bookId)}/marketing`, { versionId }),
  async upload(bookId: string, file: File): Promise<BookVideoFile> {
    const contentType =
      file.type ||
      (/\.mp4$/i.test(file.name)
        ? 'video/mp4'
        : /\.wav$/i.test(file.name)
          ? 'audio/wav'
          : /\.mp3$/i.test(file.name)
            ? 'audio/mpeg'
            : /\.m4a$/i.test(file.name)
              ? 'audio/mp4'
              : 'application/octet-stream');
    const signed = await apiPost<{ uploadUrl: string; file: BookVideoFile }>(
      `${path(bookId)}/presign`,
      { name: file.name, bytes: file.size, contentType }
    );
    const response = await fetch(signed.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
    if (!response.ok) throw new Error('파일 업로드에 실패했습니다. 다시 시도해 주세요.');
    return signed.file;
  },
};
