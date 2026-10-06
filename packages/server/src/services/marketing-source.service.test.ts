import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Storybook } from '@tangobook/shared';

const mocks = vi.hoisted(() => ({
  sourceUpsert: vi.fn(),
  projectEq: vi.fn(),
}));

vi.mock('../providers/supabase-admin.provider.js', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'mkt_projects') {
        const chain = {
          select: vi.fn(() => chain),
          eq: mocks.projectEq.mockImplementation(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          maybeSingle: vi.fn(async () => ({
            data: { id: 'project-1', user_id: 'user-1' },
            error: null,
          })),
        };
        return chain;
      }
      if (table === 'mkt_content_sources') {
        const chain = {
          upsert: mocks.sourceUpsert.mockImplementation(() => chain),
          select: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: { id: 'source-1' }, error: null })),
        };
        return chain;
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import {
  buildStorybookSourceSnapshot,
  syncStorybookMarketingSource,
} from './marketing-source.service.js';

describe('buildStorybookSourceSnapshot', () => {
  beforeEach(() => vi.clearAllMocks());

  it('copies only source-owned metadata and derives every available language', () => {
    const storybook = {
      id: '1772107608499',
      title: '신데렐라',
      category: '세계 명작',
      artStyle: 'paper-craft',
      readingLevel: 'L2',
      isPublic: true,
      coverImage: 'https://assets.example/cover.webp',
      languages: ['ko', 'en'],
      titleTranslations: { en: 'Cinderella', vi: 'Lọ Lem' },
      primaryCoverByLang: { en: 'https://assets.example/cover-en.webp' },
      updatedAt: '2026-09-22T00:00:00.000Z',
      pages: [
        {
          id: 'p1',
          pageNumber: 1,
          text: '옛날 옛적에',
          translations: { th: { text: 'กาลครั้งหนึ่ง' } },
        },
      ],
    } as unknown as Storybook;

    expect(buildStorybookSourceSnapshot(storybook)).toEqual({
      title: '신데렐라',
      category: '세계 명작',
      coverImageUrl: 'https://assets.example/cover.webp',
      languages: ['ko', 'en', 'th', 'vi'],
      sourceUpdatedAt: '2026-09-22T00:00:00.000Z',
      payload: {
        artStyle: 'paper-craft',
        readingLevel: 'L2',
        pageCount: 1,
        isPublic: true,
        titleTranslations: { en: 'Cinderella', vi: 'Lọ Lem' },
        coversByLanguage: { en: 'https://assets.example/cover-en.webp' },
      },
    });
  });

  it('upserts one explicit storybook source by its project-scoped identity', async () => {
    const storybook = {
      id: '1772107608499',
      title: '신데렐라',
      category: '세계 명작',
      pages: [],
    } as unknown as Storybook;

    await expect(syncStorybookMarketingSource(storybook)).resolves.toEqual({
      synced: true,
      sourceId: 'source-1',
    });
    expect(mocks.sourceUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'project-1',
        user_id: 'user-1',
        source_type: 'storybook',
        source_id: '1772107608499',
        source_state: 'approved',
        title: '신데렐라',
      }),
      { onConflict: 'project_id,source_type,source_id' }
    );
  });
});
