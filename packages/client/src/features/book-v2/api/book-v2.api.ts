import { apiGet, apiPatch } from '@/lib/axios';
import type {
  BookIndex,
  BookManifest,
  ParentGuide,
  CurriculumMeta,
  ReadingLevel,
} from '@tangobook/shared';

export interface UpdateBookMetaPatch {
  title?: string;
  category?: string;
  folder?: string;
  isPublic?: boolean;
  parentGuide?: ParentGuide;
  curriculumMeta?: CurriculumMeta;
  bgmUrl?: string;
}

export interface VariantPatch {
  addLevels?: ReadingLevel[];
  removeLevels?: ReadingLevel[];
  addLanguages?: string[];
  removeLanguages?: string[];
  addStyles?: string[];
  removeStyles?: string[];
}

export const bookV2Api = {
  /** GET /api/v2/books — 라이브러리 인덱스 */
  listIndex: () => apiGet<BookIndex>('/v2/books'),

  /** GET /api/v2/books/:bid — 단일 manifest */
  getManifest: (bid: string) => apiGet<BookManifest>(`/v2/books/${bid}`),

  /** PATCH /api/v2/books/:bid — 메타 업데이트 */
  updateMeta: (bid: string, patch: UpdateBookMetaPatch) =>
    apiPatch<BookManifest>(`/v2/books/${bid}`, patch),

  /** PATCH /api/v2/books/:bid/variants — usedVariants 추가/제거 */
  patchVariants: (bid: string, patch: VariantPatch) =>
    apiPatch<BookManifest>(`/v2/books/${bid}/variants`, patch),
};
