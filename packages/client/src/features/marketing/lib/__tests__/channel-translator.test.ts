import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (declare before importing the SUT) ────────────────────────────────
vi.mock('../sse-stream-parser', () => ({
  fetchSSEText: vi.fn().mockResolvedValue('<p>translated</p>'),
}));
vi.mock('../../api/use-r2-upload', () => ({
  uploadToR2: vi.fn().mockResolvedValue({ publicUrl: 'https://r2.example/x.html', key: 'k' }),
}));
// supabase client mock — chainable insert/update + maybeSingle for the existence check
const maybeSingleMock = vi.fn();
const insertMock = vi.fn().mockResolvedValue({ error: null });
const updateEqMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });
const selectChain = {
  eq: vi.fn().mockReturnThis(),
  maybeSingle: maybeSingleMock,
};
const fromMock = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue(selectChain),
  insert: insertMock,
  update: updateMock,
});
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
  },
}));

import { fetchSSEText } from '../sse-stream-parser';
import {
  translateAndSaveChannel,
  getChannelTranslationUrl,
  buildBlogCardsHtml,
  buildCardnewsHtml,
  buildThreadsHtml,
  buildYoutubeHtml,
} from '../channel-translator';
import type { Project } from '../../types/database';

const project = { id: 'p-1', brand_name: 'Tangobook', industry: 'edu' } as unknown as Project;

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(selectChain, { eq: vi.fn().mockReturnThis(), maybeSingle: maybeSingleMock });
  fromMock.mockReturnValue({
    select: vi.fn().mockReturnValue(selectChain),
    insert: insertMock,
    update: updateMock,
  });
  maybeSingleMock.mockResolvedValue({ data: null }); // no existing row → INSERT path
});

describe('HTML builders (verbatim port — drift guard)', () => {
  it('buildCardnewsHtml sorts by sort_order, prefixes caption, emits role spans', () => {
    const html = buildCardnewsHtml(
      [
        { sort_order: 1, text_content: 'B', text_style: { title: 'T1' } } as never,
        { sort_order: 0, text_content: 'A', text_style: { header: 'H0', body: 'Body0' } } as never,
      ],
      'CAP'
    );
    expect(html).toContain('data-role="caption">CAP');
    // slide 1 (sort_order 0) comes before slide 2 (sort_order 1)
    expect(html.indexOf('data-slide="1"')).toBeLessThan(html.indexOf('data-slide="2"'));
    expect(html).toContain('data-role="header">H0');
  });
  it('buildThreadsHtml emits one data-post per card in sort_order', () => {
    const html = buildThreadsHtml([
      { sort_order: 1, text_content: 'second' } as never,
      { sort_order: 0, text_content: 'first' } as never,
    ]);
    expect(html.indexOf('first')).toBeLessThan(html.indexOf('second'));
    expect(html).toContain('data-post="1"');
  });
  it('buildYoutubeHtml emits subtitle/narration/direction roles', () => {
    const html = buildYoutubeHtml([
      { sort_order: 0, narration_text: 'N', subtitle_text: 'S', screen_direction: 'D' } as never,
    ]);
    expect(html).toContain('data-role="subtitle">S');
    expect(html).toContain('data-role="narration">N');
    expect(html).toContain('data-role="direction"');
  });
  it('buildBlogCardsHtml joins text + figure blocks', () => {
    const html = buildBlogCardsHtml([
      { content: { text: 'hello', url: 'https://img/x.png', alt: 'a', caption: 'c' } } as never,
    ]);
    expect(html).toContain('hello');
    expect(html).toContain('<figure><img src="https://img/x.png"');
    expect(html).toContain('<figcaption>c</figcaption>');
  });
});

describe('translateAndSaveChannel (C-1 table + C-2 user_id + C-3 contract)', () => {
  it('builds the prompt client-side and POSTs {prompt,model} to /api/mkt/ai/translate', async () => {
    await translateAndSaveChannel({
      projectId: 'p-1',
      contentId: 'c-1',
      project,
      targetLang: 'en',
      channel: 'base',
      sourceHtml: '<p>안녕</p>',
    });
    expect(fetchSSEText).toHaveBeenCalledTimes(1);
    const [url, body] = (fetchSSEText as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
    expect(url).toBe('/api/mkt/ai/translate'); // C-3 (worktree namespace)
    const b = body as { prompt: string; model?: string };
    expect(typeof b.prompt).toBe('string');
    // the system prompt (buildTranslationPrompt) must be present, not just the raw text
    expect(b.prompt).toContain('professional translator');
    expect(b.prompt).toContain('안녕'); // source text appended after the system prompt
  });

  it('inserts into mkt_translations with user_id + status:completed + body=R2 url (C-1/C-2)', async () => {
    await translateAndSaveChannel({
      projectId: 'p-1',
      contentId: 'c-1',
      project,
      targetLang: 'en',
      channel: 'instagram',
      sourceHtml: '<p>x</p>',
    });
    // C-1: the table name
    expect(fromMock).toHaveBeenCalledWith('mkt_translations');
    // C-2: user_id stamped on insert
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.user_id).toBe('user-1');
    expect(row.content_id).toBe('c-1');
    expect(row.language).toBe('en');
    expect(row.channel_type).toBe('instagram');
    expect(row.status).toBe('completed');
    expect(row.body).toBe('https://r2.example/x.html');
  });

  it('updates (not inserts) when a row already exists', async () => {
    maybeSingleMock.mockResolvedValue({ data: { id: 'tr-1' } }); // existing → UPDATE path
    await translateAndSaveChannel({
      projectId: 'p-1',
      contentId: 'c-1',
      project,
      targetLang: 'en',
      channel: 'threads',
      sourceHtml: '<p>x</p>',
    });
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateEqMock).toHaveBeenCalledWith('id', 'tr-1');
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('getChannelTranslationUrl (C-1 table)', () => {
  it('returns null for ko without touching the DB', async () => {
    const out = await getChannelTranslationUrl('c-1', 'ko', 'base');
    expect(out).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });
  it('queries mkt_translations for non-ko', async () => {
    maybeSingleMock.mockResolvedValue({ data: { body: 'https://r2/x.html' } });
    const out = await getChannelTranslationUrl('c-1', 'en', 'base');
    expect(fromMock).toHaveBeenCalledWith('mkt_translations');
    expect(out).toBe('https://r2/x.html');
  });
});
