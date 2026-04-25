import { apiClient, apiGet, apiPatch } from '@/lib/axios';
import type {
  ApiResponse,
  BookIndex,
  BookManifest,
  BookTextSlice,
  ParentGuide,
  CurriculumMeta,
  ReadingLevel,
} from '@tangobook/shared';

async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.put<ApiResponse<T>>(url, data);
  return (res.data as { success: true; data: T }).data;
}

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

  /** GET /api/v2/books/:bid/texts/:level/:lang */
  getTextSlice: (bid: string, level: ReadingLevel, lang: string) =>
    apiGet<BookTextSlice>(`/v2/books/${bid}/texts/${level}/${lang}`),

  /** PUT /api/v2/books/:bid/texts/:level/:lang */
  saveTextSlice: (bid: string, level: ReadingLevel, lang: string, slice: BookTextSlice) =>
    apiPut<BookTextSlice>(`/v2/books/${bid}/texts/${level}/${lang}`, slice),
};
