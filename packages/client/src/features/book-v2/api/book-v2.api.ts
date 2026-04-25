import { apiClient, apiGet, apiPatch } from '@/lib/axios';
import type {
  ApiResponse,
  AudiobookProjectV2,
  AudiobookRenderV2,
  BookIndex,
  BookManifest,
  BookStyleSlice,
  BookCharacter,
  BookGameInstance,
  BookTextSlice,
  BlogPostV2,
  CardNewsProjectV2,
  LongformProjectV2,
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

  /** GET /api/v2/books/:bid/audiobook/render/progress?taskId=... */
  getAudiobookRenderProgress: (bid: string, taskId: string) =>
    apiGet<{ progress: number; step: string; error?: string } | null>(
      `/v2/books/${bid}/audiobook/render/progress?taskId=${encodeURIComponent(taskId)}`
    ),

  // ── Longform ────────────────────────────────────────────────────────────

  /** GET /api/v2/books/:bid/longform?level=&lang=&style= (모두 옵셔널) */
  listLongform: (
    bid: string,
    filter?: { level?: ReadingLevel; language?: string; style?: string }
  ) => {
    const qs = new URLSearchParams();
    if (filter?.level) qs.set('level', filter.level);
    if (filter?.language) qs.set('lang', filter.language);
    if (filter?.style) qs.set('style', filter.style);
    const q = qs.toString();
    return apiGet<LongformProjectV2[]>(`/v2/books/${bid}/longform${q ? `?${q}` : ''}`);
  },

  /** GET /api/v2/books/:bid/longform/:projectId */
  getLongform: (bid: string, projectId: string) =>
    apiGet<LongformProjectV2>(`/v2/books/${bid}/longform/${projectId}`),

  /** POST /api/v2/books/:bid/longform */
  createLongform: (
    bid: string,
    body: { level: ReadingLevel; language: string; style: string; parentProjectId?: string }
  ) =>
    apiClient
      .post<ApiResponse<LongformProjectV2>>(`/v2/books/${bid}/longform`, body)
      .then((res) => (res.data as { success: true; data: LongformProjectV2 }).data),

  /** PUT /api/v2/books/:bid/longform/:projectId */
  saveLongform: (bid: string, projectId: string, patch: Partial<LongformProjectV2>) =>
    apiPut<LongformProjectV2>(`/v2/books/${bid}/longform/${projectId}`, patch),

  /** DELETE /api/v2/books/:bid/longform/:projectId */
  deleteLongform: (bid: string, projectId: string) =>
    apiClient
      .delete<ApiResponse<{ deleted: true }>>(`/v2/books/${bid}/longform/${projectId}`)
      .then((res) => (res.data as { success: true; data: { deleted: true } }).data),

  /** POST /api/v2/books/:bid/longform/:projectId/analyze */
  startLongformAnalyze: (
    bid: string,
    projectId: string,
    body?: { systemPrompt?: string; model?: string; excludePages?: number[] }
  ) =>
    apiClient
      .post<ApiResponse<{ ok: true }>>(`/v2/books/${bid}/longform/${projectId}/analyze`, body ?? {})
      .then((res) => (res.data as { success: true; data: { ok: true } }).data),

  /** GET /api/v2/books/:bid/longform/:projectId/analyze/progress */
  getLongformAnalyzeProgress: (bid: string, projectId: string) =>
    apiGet<{ progress: number; step: string; error?: string; updatedAt: number } | null>(
      `/v2/books/${bid}/longform/${projectId}/analyze/progress`
    ),

  // ── Games ──────────────────────────────────────────────────────────────

  /** GET /api/v2/books/:bid/games?level=&lang= */
  listGames: (bid: string, filter?: { level?: ReadingLevel; language?: string }) => {
    const qs = new URLSearchParams();
    if (filter?.level) qs.set('level', filter.level);
    if (filter?.language) qs.set('lang', filter.language);
    const q = qs.toString();
    return apiGet<BookGameInstance[]>(`/v2/books/${bid}/games${q ? `?${q}` : ''}`);
  },

  /** GET /api/v2/books/:bid/games/:gameId */
  getGame: (bid: string, gameId: string) =>
    apiGet<BookGameInstance>(`/v2/books/${bid}/games/${gameId}`),

  /** DELETE /api/v2/books/:bid/games/:gameId */
  deleteGame: (bid: string, gameId: string) =>
    apiClient
      .delete<ApiResponse<{ deleted: true }>>(`/v2/books/${bid}/games/${gameId}`)
      .then((res) => (res.data as { success: true; data: { deleted: true } }).data),

  // ── Marketing — Blog ───────────────────────────────────────────────────

  listBlogs: (bid: string, language?: string) => {
    const q = language ? `?lang=${encodeURIComponent(language)}` : '';
    return apiGet<BlogPostV2[]>(`/v2/books/${bid}/marketing/blog${q}`);
  },
  getBlog: (bid: string, postId: string) =>
    apiGet<BlogPostV2>(`/v2/books/${bid}/marketing/blog/${postId}`),
  createBlog: (bid: string, body: { language: string; title?: string }) =>
    apiClient
      .post<ApiResponse<BlogPostV2>>(`/v2/books/${bid}/marketing/blog`, body)
      .then((res) => (res.data as { success: true; data: BlogPostV2 }).data),
  saveBlog: (bid: string, postId: string, patch: Partial<BlogPostV2>) =>
    apiPut<BlogPostV2>(`/v2/books/${bid}/marketing/blog/${postId}`, patch),
  deleteBlog: (bid: string, postId: string) =>
    apiClient
      .delete<ApiResponse<{ deleted: true }>>(`/v2/books/${bid}/marketing/blog/${postId}`)
      .then((res) => (res.data as { success: true; data: { deleted: true } }).data),

  // ── Marketing — Card News ──────────────────────────────────────────────

  listCardNews: (bid: string, language?: string) => {
    const q = language ? `?lang=${encodeURIComponent(language)}` : '';
    return apiGet<CardNewsProjectV2[]>(`/v2/books/${bid}/marketing/card-news${q}`);
  },
  getCardNews: (bid: string, projectId: string) =>
    apiGet<CardNewsProjectV2>(`/v2/books/${bid}/marketing/card-news/${projectId}`),
  createCardNews: (bid: string, body: { language: string; title?: string }) =>
    apiClient
      .post<ApiResponse<CardNewsProjectV2>>(`/v2/books/${bid}/marketing/card-news`, body)
      .then((res) => (res.data as { success: true; data: CardNewsProjectV2 }).data),
  saveCardNews: (bid: string, projectId: string, patch: Partial<CardNewsProjectV2>) =>
    apiPut<CardNewsProjectV2>(`/v2/books/${bid}/marketing/card-news/${projectId}`, patch),
  deleteCardNews: (bid: string, projectId: string) =>
    apiClient
      .delete<ApiResponse<{ deleted: true }>>(`/v2/books/${bid}/marketing/card-news/${projectId}`)
      .then((res) => (res.data as { success: true; data: { deleted: true } }).data),
};
