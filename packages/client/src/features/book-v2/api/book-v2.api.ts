import { apiClient, apiGet, apiPatch } from '@/lib/axios';
import type {
  ApiResponse,
  AudiobookProjectV2,
  AudiobookRenderV2,
  BookIndex,
  BookManifest,
  BookStyleSlice,
  BookCharacter,
  BookTextSlice,
  ParentGuide,
  CurriculumMeta,
  ReadingLevel,
} from '@tangobook/shared';

async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.put<ApiResponse<T>>(url, data);
  return (res.data as { success: true; data: T }).data;
}

async function apiUpload<T>(url: string, file: File, fieldName = 'image'): Promise<T> {
  const fd = new FormData();
  fd.append(fieldName, file);
  const res = await apiClient.post<ApiResponse<T>>(url, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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

  /** GET /api/v2/books/:bid/styles/:style */
  getStyleSlice: (bid: string, style: string) =>
    apiGet<BookStyleSlice>(`/v2/books/${bid}/styles/${style}`),

  /** GET /api/v2/books/:bid/styles/:style/characters */
  getCharacters: (bid: string, style: string) =>
    apiGet<BookCharacter[]>(`/v2/books/${bid}/styles/${style}/characters`),

  /** PUT /api/v2/books/:bid/styles/:style/characters */
  saveCharacters: (bid: string, style: string, characters: BookCharacter[]) =>
    apiPut<BookCharacter[]>(`/v2/books/${bid}/styles/${style}/characters`, characters),

  /** POST style asset 업로드 (multipart, image field) */
  uploadCover: (bid: string, style: string, file: File) =>
    apiUpload<{ url: string }>(`/v2/books/${bid}/styles/${style}/cover`, file),

  uploadKeyObjectImage: (bid: string, style: string, refId: string, file: File) =>
    apiUpload<{ url: string }>(`/v2/books/${bid}/styles/${style}/key-objects/${refId}`, file),

  uploadVocabImage: (bid: string, style: string, refId: string, file: File) =>
    apiUpload<{ url: string }>(`/v2/books/${bid}/styles/${style}/vocabulary/${refId}`, file),

  uploadPageImage: (
    bid: string,
    style: string,
    level: ReadingLevel,
    illustrationKey: string,
    file: File
  ) =>
    apiUpload<{ url: string }>(
      `/v2/books/${bid}/styles/${style}/pages/${level}/${illustrationKey}`,
      file
    ),

  /** GET /api/v2/books/:bid/audiobook */
  getAudiobookProject: (bid: string) => apiGet<AudiobookProjectV2>(`/v2/books/${bid}/audiobook`),

  /** PUT /api/v2/books/:bid/audiobook */
  saveAudiobookProject: (bid: string, project: AudiobookProjectV2) =>
    apiPut<AudiobookProjectV2>(`/v2/books/${bid}/audiobook`, project),

  /** GET /api/v2/books/:bid/audiobook/renders */
  listAudiobookRenders: (bid: string) =>
    apiGet<AudiobookRenderV2[]>(`/v2/books/${bid}/audiobook/renders`),

  /** POST /api/v2/books/:bid/audiobook/render */
  startAudiobookRender: (
    bid: string,
    body: { level: ReadingLevel; language: string; style: string }
  ) =>
    apiClient
      .post<ApiResponse<{ taskId: string }>>(`/v2/books/${bid}/audiobook/render`, body)
      .then((res) => (res.data as { success: true; data: { taskId: string } }).data),
};
