import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookVideoLibrary, BookVideoProduction, BookVideoFormat } from '@tangobook/shared';
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  write: vi.fn(),
  head: vi.fn(),
  presign: vi.fn(),
  lookup: vi.fn(),
  upserts: [] as Array<{
    table: string;
    payload: Record<string, unknown>;
    options: Record<string, unknown>;
  }>,
}));
vi.mock('../repositories/book-video.repository.js', () => ({
  videoPrefix: (id: string) => `book-videos/${id}/`,
  BookVideoRepository: { read: mocks.read, write: mocks.write },
}));
vi.mock('../repositories/r2.repository.js', () => ({
  R2Repository: {
    getStorybook: vi.fn(async () => ({
      id: 'book-1',
      title: '백설공주',
      artStyle: 'watercolor',
      pages: [],
    })),
  },
}));
vi.mock('../providers/r2.provider.js', () => ({
  r2Client: { send: mocks.head },
  r2BucketName: 'bucket',
  r2PublicUrl: 'https://assets.test',
  createPresignedUploadUrl: mocks.presign,
}));
vi.mock('./marketing-source.service.js', () => ({
  resolveMarketingProject: vi.fn(async () => ({ id: 'project-1', user_id: 'owner' })),
  syncStorybookMarketingSource: vi.fn(async () => ({ sourceId: 'source-1' })),
}));
vi.mock('./content-pipeline/approval-store.js', () => ({ loadApprovals: vi.fn(async () => ({})) }));
vi.mock('../providers/supabase-admin.provider.js', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: mocks.lookup,
        upsert: async (payload: Record<string, unknown>, options: Record<string, unknown>) => {
          mocks.upserts.push({ table, payload, options });
          return { error: null };
        },
      };
      return chain;
    },
  }),
}));
import { BookVideoService, validateVideoProductions } from './book-video.service.js';
const productions = (): Record<BookVideoFormat, BookVideoProduction> => ({
  long: { languages: { ko: { subtitleSrt: '', narrationText: '' } } },
  short: { languages: {} },
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.upserts.length = 0;
  mocks.read.mockResolvedValue({
    library: { bookId: 'book-1', revision: 0, versions: [] },
    etag: 'old-etag',
  });
  mocks.write.mockResolvedValue(undefined);
  mocks.lookup.mockResolvedValue({ data: null, error: null });
});
describe('book video library', () => {
  it('rejects a stale draft before writing or inspecting uploaded files', async () => {
    await expect(
      BookVideoService.save('book-1', { revision: 2, productions: productions() })
    ).rejects.toThrow('다른 창');
    expect(mocks.write).not.toHaveBeenCalled();
    expect(mocks.head).not.toHaveBeenCalled();
  });
  it('preserves previous versions and uses the conditional write token', async () => {
    const previous = { id: 'old-version', number: 1, createdAt: 'old', productions: productions() };
    mocks.read.mockResolvedValue({
      library: { bookId: 'book-1', revision: 1, versions: [previous] },
      etag: 'etag-1',
    });
    const result = await BookVideoService.save('book-1', {
      revision: 1,
      productions: productions(),
    });
    expect(result.versions[0]).toEqual(previous);
    expect(result.revision).toBe(2);
    expect(mocks.write).toHaveBeenCalledWith(result, 'etag-1');
  });
  it('refuses foreign files instead of linking arbitrary public URLs', async () => {
    const p = productions();
    p.long.original = {
      key: 'another-book/video.mp4',
      url: 'https://assets.test/another-book/video.mp4',
      name: 'x.mp4',
      contentType: 'video/mp4',
      bytes: 20,
    };
    await expect(BookVideoService.save('book-1', { revision: 0, productions: p })).rejects.toThrow(
      '잘못된 영상 자료'
    );
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it('does not register a raw original as a language-complete movie', async () => {
    const p = productions();
    p.long.original = { key: 'raw', url: 'raw', name: 'x', contentType: 'video/mp4', bytes: 20 };
    mocks.read.mockResolvedValue({
      library: {
        bookId: 'book-1',
        revision: 1,
        versions: [{ id: 'v1', number: 1, createdAt: 'now', productions: p }],
      },
    });
    await expect(BookVideoService.register('book-1', 'v1')).rejects.toThrow('언어별 완성 영상');
    expect(mocks.upserts).toHaveLength(0);
  });
  it('keeps URLs in one place, retries deterministic IDs and preserves edited marketing rows', async () => {
    const p = productions();
    const file = {
      key: 'book-videos/book-1/files/a.mp4',
      url: 'https://assets.test/book-videos/book-1/files/a.mp4',
      name: 'movie.mp4',
      contentType: 'video/mp4',
      bytes: 20,
    };
    p.long.languages.ko!.video = file;
    p.short.languages.en = { subtitleSrt: '', narrationText: 'English', video: file };
    const library: BookVideoLibrary = {
      bookId: 'book-1',
      revision: 1,
      versions: [{ id: 'v1', number: 1, createdAt: 'now', productions: p }],
    };
    mocks.read.mockResolvedValue({ library });
    const first = await BookVideoService.register('book-1', 'v1');
    mocks.lookup.mockResolvedValue({ data: { id: first.contentId }, error: null });
    const second = await BookVideoService.register('book-1', 'v1');
    expect(first.contentId).toBe(second.contentId);
    expect(second.reused).toBe(true);
    expect(mocks.upserts.every((x) => x.options.ignoreDuplicates)).toBe(true);
    expect(mocks.upserts.find((x) => x.table === 'mkt_youtube_contents')?.payload.video_url).toBe(
      file.url
    );
    const settings = mocks.upserts.find((x) => x.table === 'mkt_instagram_contents')?.payload
      .video_settings as { reels: Record<string, { videoUrl: string }> };
    expect(settings.reels.en.videoUrl).toBe(file.url);
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it('rejects unknown language and malformed later SRT cues', () => {
    const p = productions();
    p.long.languages.invalid = { subtitleSrt: '', narrationText: '' };
    expect(() => validateVideoProductions(p)).toThrow('언어');
    delete p.long.languages.invalid;
    p.long.languages.ko!.subtitleSrt =
      '1\n00:00:00,000 --> 00:00:02,000\nHello\n\n2\n00:00:05,000 --> 00:00:04,000\nBad';
    expect(() => validateVideoProductions(p)).toThrow('자막 시간');
  });
  it('verifies real uploaded metadata before saving a book-owned file', async () => {
    const p = productions();
    p.long.original = {
      key: 'book-videos/book-1/files/12345678-1234-1234-1234-123456789abc.mp4',
      url: 'https://assets.test/book-videos/book-1/files/12345678-1234-1234-1234-123456789abc.mp4',
      name: 'movie.mp4',
      contentType: 'video/mp4',
      bytes: 20,
    };
    mocks.head.mockResolvedValue({ ContentLength: 10, ContentType: 'video/mp4' });
    await expect(BookVideoService.save('book-1', { revision: 0, productions: p })).rejects.toThrow(
      '크기 또는 형식'
    );
    expect(mocks.write).not.toHaveBeenCalled();
    mocks.head.mockResolvedValue({ ContentLength: 20, ContentType: 'video/mp4' });
    const saved = await BookVideoService.save('book-1', { revision: 0, productions: p });
    expect(saved.versions[0].productions.long.original).toEqual(p.long.original);
  });
});
