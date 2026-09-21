import { describe, expect, it } from 'vitest';
import { renderBlocksSeo, renderBlockTrackSeo } from './seo-blocks.service.js';

describe('renderBlocksSeo', () => {
  it('exposes both languages and both input modes to crawlers', () => {
    const seo = renderBlocksSeo();
    expect(seo.canonical).toBe('https://www.tangobook.co.kr/blocks');
    expect(seo.title).toContain('한글·영어 파닉스 블록 게임');
    expect(seo.bodyHtml).toContain('/blocks/hangul?mode=screen');
    expect(seo.bodyHtml).toContain('/blocks/hangul?mode=camera');
    expect(seo.bodyHtml).toContain('/blocks/english?mode=screen');
    expect(seo.bodyHtml).toContain('/blocks/english?mode=camera');
    expect(seo.jsonLdHtml).toContain('CollectionPage');
  });

  it.each([
    ['hangul', '한글 블록 게임', '/library/phonics/korean'],
    ['english', '영어 파닉스 블록 게임', '/library/phonics/english'],
  ] as const)('renders a dedicated %s discovery page', (track, title, phonicsPath) => {
    const seo = renderBlockTrackSeo(track);
    expect(seo.canonical).toBe(`https://www.tangobook.co.kr/blocks/${track}`);
    expect(seo.title).toContain(title);
    expect(seo.bodyHtml).toContain(`/blocks/${track}?mode=screen`);
    expect(seo.bodyHtml).toContain(`/blocks/${track}?mode=camera`);
    expect(seo.bodyHtml).toContain(phonicsPath);
    expect(seo.jsonLdHtml).toContain('Game');
  });
});
