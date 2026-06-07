import { describe, it, expect } from 'vitest';
import { resolveTranslationSource } from '../ContentTabs';
import type { ContentGraph } from '../../../api/queries';

const graph = {
  content: { id: 'c-1' },
  baseArticle: { body: '<p>기본글 본문</p>' },
  blogContents: [
    { channel: 'naver_blog', cards: [{ sort_order: 0, content: { text: '네이버' } }] },
    { channel: 'self_hosted', cards: [{ sort_order: 0, content: { text: '내부' } }] },
  ],
  instagramContents: [
    {
      caption: 'CAP',
      cards: [{ sort_order: 0, text_content: '카드', text_style: { title: 'T' } }],
    },
  ],
  threadsContents: [{ cards: [{ sort_order: 0, text_content: '스레드' }] }],
  youtubeContents: [
    {
      cards: [
        { sort_order: 0, narration_text: '나레', subtitle_text: '자막', screen_direction: '연출' },
      ],
    },
  ],
} as unknown as ContentGraph;

describe('resolveTranslationSource', () => {
  it('maps base-article → base with the article body', () => {
    const r = resolveTranslationSource('base-article', graph);
    expect(r).not.toBeNull();
    expect(r!.channel).toBe('base');
    expect(r!.sourceHtml).toContain('기본글 본문');
  });
  it('maps self_hosted → self_hosted via the matching blog content', () => {
    const r = resolveTranslationSource('self_hosted', graph);
    expect(r!.channel).toBe('self_hosted');
    expect(r!.sourceHtml).toContain('내부');
  });
  it('maps blog → naver_blog (isNaver true)', () => {
    const r = resolveTranslationSource('blog', graph);
    expect(r!.channel).toBe('naver_blog');
    expect(r!.isNaver).toBe(true);
    expect(r!.sourceHtml).toContain('네이버');
  });
  it('maps cardnews → instagram with caption + slides', () => {
    const r = resolveTranslationSource('cardnews', graph);
    expect(r!.channel).toBe('instagram');
    expect(r!.sourceHtml).toContain('CAP');
    expect(r!.sourceHtml).toContain('data-slide="1"');
  });
  it('maps threads → threads and youtube → youtube', () => {
    expect(resolveTranslationSource('threads', graph)!.channel).toBe('threads');
    expect(resolveTranslationSource('youtube', graph)!.channel).toBe('youtube');
  });
  it('returns null for shorts (unsupported)', () => {
    expect(resolveTranslationSource('shorts', graph)).toBeNull();
  });
  it('returns null when the channel source is empty', () => {
    const empty = { ...graph, threadsContents: [] } as unknown as ContentGraph;
    expect(resolveTranslationSource('threads', empty)).toBeNull();
  });
});
