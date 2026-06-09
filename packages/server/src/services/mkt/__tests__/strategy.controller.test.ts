import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('node:fs/promises');
import fs from 'node:fs/promises';
import { listStrategyTemplates } from '../strategy.service.js';

beforeEach(() => vi.resetAllMocks());

describe('listStrategyTemplates', () => {
  it('returns [] when the template dir is absent (no throw)', async () => {
    (fs.readdir as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('ENOENT'));
    expect(await listStrategyTemplates()).toEqual({ templates: [] });
  });

  it('extracts title/description from the html head', async () => {
    (fs.readdir as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      'a.html',
      'note.txt',
    ] as never);
    (fs.stat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      size: 123,
      mtime: new Date('2026-06-09T00:00:00Z'),
    } as never);
    (fs.readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      '<html><head><title>전략 A</title><meta name="description" content="설명 A"></head><body></body></html>' as never
    );
    const { templates } = await listStrategyTemplates();
    expect(templates).toHaveLength(1); // .txt filtered out
    expect(templates[0]).toMatchObject({
      filename: 'a.html',
      title: '전략 A',
      description: '설명 A',
      size: 123,
      modifiedAt: '2026-06-09T00:00:00.000Z',
      url: '/marketing-strategy-templates/a.html',
    });
  });

  it('sorts results by title.localeCompare', async () => {
    (fs.readdir as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      'z.html',
      'a.html',
    ] as never);
    (fs.stat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      size: 1,
      mtime: new Date('2026-06-09T00:00:00Z'),
    } as never);
    (fs.readFile as unknown as ReturnType<typeof vi.fn>).mockImplementation((async (
      full: string
    ) => {
      const title = full.includes('z.html') ? 'Z' : 'A';
      return `<html><head><title>${title}</title></head><body></body></html>`;
    }) as never);
    const { templates } = await listStrategyTemplates();
    expect(templates.map((t) => t.title)).toEqual(['A', 'Z']);
  });
});
