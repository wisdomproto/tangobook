import { createHash, randomUUID } from 'node:crypto';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import {
  SUPPORTED_LANGUAGES,
  videoSubtitleError,
  type BookVideoFile,
  type BookVideoLibrary,
  type BookVideoProduction,
  type BookVideoFormat,
  type BookVideoVersion,
  type BookVideoRegistration,
} from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';
import { BookVideoRepository, videoPrefix } from '../repositories/book-video.repository.js';
import { R2Repository } from '../repositories/r2.repository.js';
import {
  createPresignedUploadUrl,
  r2Client,
  r2BucketName,
  r2PublicUrl,
} from '../providers/r2.provider.js';
import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import {
  resolveMarketingProject,
  syncStorybookMarketingSource,
} from './marketing-source.service.js';
import { loadApprovals } from './content-pipeline/approval-store.js';

const formats: BookVideoFormat[] = ['long', 'short'];
const languageCodes = new Set<string>(SUPPORTED_LANGUAGES.map((l) => l.code));
const mimeExtensions: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
function uuidFor(value: string): string {
  const h = createHash('sha256').update(value).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
async function requireBook(bookId: string) {
  videoPrefix(bookId);
  const book = await R2Repository.getStorybook(bookId);
  if (!book) throw new AppError(404, '동화책을 찾을 수 없습니다.');
  return book;
}
async function checkFile(
  bookId: string,
  file: BookVideoFile | undefined,
  kind: string
): Promise<void> {
  if (!file) return;
  if (
    typeof file.key !== 'string' ||
    !file.key.startsWith(`${videoPrefix(bookId)}files/`) ||
    !/^[0-9a-f-]{36}\.(mp4|webm|mp3|wav|m4a|ogg|png|jpg|webp)$/.test(
      file.key.slice(`${videoPrefix(bookId)}files/`.length)
    ) ||
    file.url !== `${r2PublicUrl}/${file.key}` ||
    !file.contentType?.startsWith(`${kind}/`) ||
    !mimeExtensions[file.contentType] ||
    !Number.isSafeInteger(file.bytes) ||
    file.bytes <= 0 ||
    file.bytes > 2 * 1024 ** 3 ||
    typeof file.name !== 'string' ||
    file.name.length > 240
  )
    throw new AppError(400, '잘못된 영상 자료입니다. 이 책에 업로드한 파일을 선택해 주세요.');
  const object = await r2Client.send(
    new HeadObjectCommand({ Bucket: r2BucketName, Key: file.key })
  );
  if (object.ContentLength !== file.bytes || object.ContentType !== file.contentType)
    throw new AppError(400, '업로드한 파일의 크기 또는 형식이 다릅니다.');
}
export function validateVideoProductions(
  value: unknown
): asserts value is Record<BookVideoFormat, BookVideoProduction> {
  if (!value || typeof value !== 'object') throw new AppError(400, '영상 제작 자료가 없습니다.');
  for (const format of formats) {
    const p = (value as Record<string, BookVideoProduction>)[format];
    if (!p || !p.languages || typeof p.languages !== 'object' || Array.isArray(p.languages))
      throw new AppError(400, '언어별 자료가 잘못되었습니다.');
    for (const [lang, track] of Object.entries(p.languages)) {
      if (
        !languageCodes.has(lang) ||
        !track ||
        typeof track.subtitleSrt !== 'string' ||
        track.subtitleSrt.length > 200000 ||
        typeof track.narrationText !== 'string' ||
        track.narrationText.length > 200000
      )
        throw new AppError(400, '언어 또는 자막/나레이션이 잘못되었습니다.');
      const subtitleError = videoSubtitleError(track.subtitleSrt);
      if (subtitleError) throw new AppError(400, subtitleError);
    }
  }
}
export const BookVideoService = {
  async get(bookId: string): Promise<BookVideoLibrary> {
    await requireBook(bookId);
    return (await BookVideoRepository.read(bookId)).library;
  },
  async presign(bookId: string, input: { name?: string; contentType?: string; bytes?: number }) {
    await requireBook(bookId);
    if (
      typeof input.name !== 'string' ||
      !input.name ||
      input.name.length > 240 ||
      typeof input.contentType !== 'string' ||
      !input.contentType ||
      !mimeExtensions[input.contentType] ||
      !Number.isSafeInteger(input.bytes) ||
      input.bytes! <= 0 ||
      input.bytes! > 2 * 1024 ** 3
    )
      throw new AppError(400, 'MP4/WebM 영상, 음원 또는 표지 파일(최대 2GB)을 선택해 주세요.');
    const key = `${videoPrefix(bookId)}files/${randomUUID()}.${mimeExtensions[input.contentType]}`;
    const signed = await createPresignedUploadUrl(key, input.contentType);
    return {
      ...signed,
      file: {
        key,
        url: signed.publicUrl,
        name: input.name,
        contentType: input.contentType,
        bytes: input.bytes,
      } as BookVideoFile,
    };
  },
  async save(
    bookId: string,
    input: { revision: number; productions: Record<BookVideoFormat, BookVideoProduction> }
  ): Promise<BookVideoLibrary> {
    await requireBook(bookId);
    validateVideoProductions(input.productions);
    const { library, etag } = await BookVideoRepository.read(bookId);
    if (input.revision !== library.revision)
      throw new AppError(409, '다른 창에서 영상을 변경했습니다. 다시 불러온 뒤 저장해 주세요.');
    for (const format of formats) {
      const p = input.productions[format];
      await checkFile(bookId, p.original, 'video');
      for (const track of Object.values(p.languages)) {
        await checkFile(bookId, track.video, 'video');
        await checkFile(bookId, track.narration, 'audio');
        await checkFile(bookId, track.cover, 'image');
      }
    }
    const version: BookVideoVersion = {
      id: randomUUID(),
      number: library.revision + 1,
      createdAt: new Date().toISOString(),
      productions: input.productions,
    };
    const next = { ...library, revision: version.number, versions: [...library.versions, version] };
    await BookVideoRepository.write(next, etag);
    return next;
  },
  async register(bookId: string, versionId: string): Promise<BookVideoRegistration> {
    const book = await requireBook(bookId);
    const library = (await BookVideoRepository.read(bookId)).library;
    const version = library.versions.find((v) => v.id === versionId);
    if (!version) throw new AppError(404, '저장된 영상 버전을 찾을 수 없습니다.');
    const complete = formats.flatMap((format) =>
      Object.entries(version.productions[format].languages)
        .filter(([, track]) => track.video)
        .map(([lang, track]) => ({ format, lang, track }))
    );
    if (!complete.length)
      throw new AppError(400, '등록할 언어별 완성 영상을 먼저 업로드하고 저장해 주세요.');
    const sb = getSupabaseAdmin();
    const project = await resolveMarketingProject();
    if (!sb || !project) throw new AppError(503, '마케팅 저장소가 설정되지 않았습니다.');
    const approvals = await loadApprovals();
    const source = await syncStorybookMarketingSource(
      book,
      approvals[bookId] ? 'approved' : 'unapproved'
    );
    if (!source.sourceId) throw new AppError(503, '마케팅 책 원본을 등록할 수 없습니다.');
    const contentId = uuidFor(`book-video:${project.id}:${bookId}:${version.id}`);
    const { data: existing, error: selectError } = await sb
      .from('mkt_contents')
      .select('id')
      .eq('id', contentId)
      .maybeSingle();
    if (selectError) throw new AppError(502, selectError.message);
    const now = new Date().toISOString();
    const { error: contentError } = await sb.from('mkt_contents').upsert(
      {
        id: contentId,
        project_id: project.id,
        user_id: project.user_id,
        content_source_id: source.sourceId,
        title: `${book.title} · 영상 v${version.number}`,
        category: book.category || null,
        memo: `book-video:${bookId}:${version.id}`,
        content_kind: 'regular',
        status: 'draft',
        confirmed: false,
        sort_order: 0,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (contentError) throw new AppError(502, `마케팅 등록 실패: ${contentError.message}`);
    for (const { format, lang, track } of complete.filter((x) => x.format === 'long')) {
      const { error } = await sb.from('mkt_youtube_contents').upsert(
        {
          id: uuidFor(`${contentId}:${format}:${lang}`),
          content_id: contentId,
          user_id: project.user_id,
          video_url: track.video!.url,
          thumbnail_url:
            track.cover?.url || book.primaryCoverByLang?.[lang] || book.coverImage || null,
          video_title: book.titleTranslations?.[lang] || book.title,
          video_description: '',
          video_tags: [],
          video_category: '27',
          target_duration: 'long',
          status: 'draft',
          video_settings: {
            bookId,
            artStyle: book.artStyle || '기본 그림체',
            language: lang,
            aspectRatio: '16:9',
            captions: { [lang]: track.subtitleSrt },
            videoAssetId: version.id,
            videoAssetVersion: version.number,
            narrationUrl: track.narration?.url,
          },
          created_at: now,
          updated_at: now,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      if (error) throw new AppError(502, `롱폼 연결 실패: ${error.message}`);
    }
    const shorts = complete.filter((x) => x.format === 'short');
    if (shorts.length) {
      const reels = Object.fromEntries(
        shorts.map(({ lang, track }) => [
          lang,
          {
            videoUrl: track.video!.url,
            coverUrl:
              track.cover?.url || book.primaryCoverByLang?.[lang] || book.coverImage || null,
            subtitleSrt: track.subtitleSrt,
            narrationUrl: track.narration?.url,
            videoAssetId: version.id,
            videoAssetVersion: version.number,
          },
        ])
      );
      const { error } = await sb.from('mkt_instagram_contents').upsert(
        {
          id: uuidFor(`${contentId}:short`),
          content_id: contentId,
          user_id: project.user_id,
          content_type: 'carousel',
          status: 'draft',
          video_settings: { reels },
          created_at: now,
          updated_at: now,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      if (error) throw new AppError(502, `숏폼 연결 실패: ${error.message}`);
    }
    return { contentId, projectId: project.id, versionId, reused: Boolean(existing) };
  },
};
