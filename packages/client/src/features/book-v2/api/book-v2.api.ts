import { apiGet } from '@/lib/axios';
import type { BookIndex, BookManifest } from '@tangobook/shared';

export const bookV2Api = {
  /** GET /api/v2/books — 라이브러리 인덱스 (BookIndex.books = BookIndexEntry[]) */
  listIndex: () => apiGet<BookIndex>('/v2/books'),

  /** GET /api/v2/books/:bid — 단일 manifest */
  getManifest: (bid: string) => apiGet<BookManifest>(`/v2/books/${bid}`),
};
