import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import {
  collectFetchFailed,
  deriveAuthoring,
  deriveMarketing,
  deriveTodos,
  filterPipelineTargets,
  shouldCacheBuild,
  SHORTS_STATE_FAILED,
  type MarketingSources,
  type MarketingStatus,
  type PipelineRow,
} from './derive.js';

// ── fixtures ──

function page(n: number, over: Record<string, unknown> = {}) {
  return {
    pageNumber: n,
    text: `페이지 ${n} 글`,
    illustrationUrl: `https://r2/p${n}.webp`,
    ttsUrl: `https://r2/p${n}.mp3`,
    ...over,
  };
}

function book(over: Record<string, unknown> = {}): Storybook {
  return {
    id: '100',
    title: '테스트 책',
    category: '세계 명작',
    coverImage: 'https://r2/cover.webp',
    pages: [page(1), page(2)],
    ...over,
  } as unknown as Storybook;
}

function emptySources(over: Partial<MarketingSources> = {}): MarketingSources {
  return {
    reelsByBook: {},
    longformByBook: {},
    blogBookIds: new Set(),
    cardnewsBookIds: new Set(),
    shortsUploaded: {},
    publishByBook: {},
    ...over,
  };
}

const doneLang = { text: true, tts: true, illust: true, cover: true };

function marketing(over: Partial<MarketingStatus> = {}): MarketingStatus {
  return {
    reels: { ko: false, en: false },
    longform: { ko: [], en: [] },
    blog: false,
    cardnews: false,
    published: { youtubeShorts: false, instagram: false, youtubeLongform: 'none' },
    ...over,
  };
}

function row(over: Partial<PipelineRow> = {}): PipelineRow {
  return {
    bookId: '100',
    title: '테스트 책',
    series: 'classic',
    approved: true,
    authoring: {
      series: 'classic',
      public: true,
      langs: { ko: { ...doneLang }, en: { ...doneLang } },
    },
    marketing: marketing(),
    ...over,
  };
}

// ── deriveAuthoring ──

describe('deriveAuthoring', () => {
  it('글 없는 페이지는 TTS 를 면제한다 (koCompletion 동일 원칙)', () => {
    const sb = book({
      pages: [page(1), page(2), page(3, { text: '', ttsUrl: undefined })],
    });
    const a = deriveAuthoring(sb);
    expect(a.langs.ko.tts).toBe(true);
    expect(a.langs.ko.text).toBe(true);
  });

  it('글 있는 페이지 중 TTS 누락이 있으면 ko.tts=false', () => {
    const sb = book({ pages: [page(1), page(2, { ttsUrl: undefined })] });
    expect(deriveAuthoring(sb).langs.ko.tts).toBe(false);
  });

  it('translations 부분 완성이면 해당 언어 text/tts=false', () => {
    const sb = book({
      languages: ['ko', 'en'],
      pages: [
        page(1, { translations: { en: { text: 'Hello', ttsUrl: 'https://r2/en1.mp3' } } }),
        page(2, { translations: { en: { text: '' } } }), // en text·tts 미완
      ],
    });
    const a = deriveAuthoring(sb);
    expect(a.langs.en.text).toBe(false);
    expect(a.langs.en.tts).toBe(false);
    expect(a.langs.ko.text).toBe(true);
  });

  it('en 완비 시 en text/tts=true, illust 는 ko 와 동일값', () => {
    const sb = book({
      languages: ['ko', 'en'],
      primaryCoverByLang: { en: 'https://r2/cover-en.webp' },
      pages: [
        page(1, { translations: { en: { text: 'One', ttsUrl: 'https://r2/en1.mp3' } } }),
        page(2, { translations: { en: { text: 'Two', ttsUrl: 'https://r2/en2.mp3' } } }),
      ],
    });
    const a = deriveAuthoring(sb);
    expect(a.langs.en).toEqual({ text: true, tts: true, illust: true, cover: true });
  });

  it('en cover 는 coverImage 폴백 금지 — primaryCoverByLang 없으면 false', () => {
    const sb = book({ languages: ['ko', 'en'] }); // coverImage 만 있음
    const a = deriveAuthoring(sb);
    expect(a.langs.ko.cover).toBe(true);
    expect(a.langs.en.cover).toBe(false);
  });

  it('en cover 는 styleAssets[*].primaryCoverByLang 도 인정', () => {
    const sb = book({
      languages: ['ko', 'en'],
      styleAssets: { watercolor: { primaryCoverByLang: { en: 'https://r2/wc-en.webp' } } },
    });
    expect(deriveAuthoring(sb).langs.en.cover).toBe(true);
  });

  it('styles3: styleAssets 한 그림체가 전 페이지 커버하면 illust=true (base 미완이어도)', () => {
    const sb = book({
      pages: [page(1, { illustrationUrl: undefined }), page(2, { illustrationUrl: undefined })],
      styleAssets: {
        watercolor: {
          pageIllustrations: {
            1: { illustrationUrl: 'https://r2/wc1.webp' },
            2: { illustrationUrl: 'https://r2/wc2.webp' },
          },
        },
      },
    });
    expect(deriveAuthoring(sb).langs.ko.illust).toBe(true);
  });

  it('styles3: styleAssets 부분 커버뿐이면 base 폴백 — base 완비 시 true, 미완 시 false', () => {
    const partialAssets = {
      watercolor: { pageIllustrations: { 1: { illustrationUrl: 'https://r2/wc1.webp' } } },
    };
    expect(deriveAuthoring(book({ styleAssets: partialAssets })).langs.ko.illust).toBe(true);
    expect(
      deriveAuthoring(
        book({
          styleAssets: partialAssets,
          pages: [page(1), page(2, { illustrationUrl: undefined })],
        })
      ).langs.ko.illust
    ).toBe(false);
  });

  it('base 시리즈(자연관찰)는 pages[].illustrationUrl 전부로 판단', () => {
    const sb = book({ category: '육지 동물 친구들', pages: [page(1), page(2)] });
    const a = deriveAuthoring(sb);
    expect(a.series).toBe('nature');
    expect(a.langs.ko.illust).toBe(true);
    expect(
      deriveAuthoring(
        book({
          category: '육지 동물 친구들',
          pages: [page(1), page(2, { illustrationUrl: undefined })],
        })
      ).langs.ko.illust
    ).toBe(false);
  });

  it('미분류 카테고리는 series=unclassified', () => {
    expect(deriveAuthoring(book({ category: '알 수 없음' })).series).toBe('unclassified');
  });

  it('public: 필드 없으면 true / 전 셀 명시 false 면 false / 한 셀이라도 공개면 true', () => {
    expect(deriveAuthoring(book()).public).toBe(true);
    expect(
      deriveAuthoring(book({ publicByStyleLang: { watercolor: { ko: false, en: false } } })).public
    ).toBe(false);
    expect(
      deriveAuthoring(book({ publicByStyleLang: { watercolor: { ko: false, en: true } } })).public
    ).toBe(true);
  });
});

// ── deriveMarketing ──

describe('deriveMarketing', () => {
  it('빈 소스에서도 ko/en 키가 보장된다', () => {
    const m = deriveMarketing('100', emptySources());
    expect(m.reels).toEqual({ ko: false, en: false });
    expect(m.longform).toEqual({ ko: [], en: [] });
    expect(m.blog).toBe(false);
    expect(m.cardnews).toBe(false);
    expect(m.published).toEqual({
      youtubeShorts: false,
      instagram: false,
      youtubeLongform: 'none',
    });
  });

  it('소스 매핑이 그대로 반영된다 (릴스·롱폼·블로그·쇼츠·발행)', () => {
    const m = deriveMarketing(
      '100',
      emptySources({
        reelsByBook: { '100': { ko: true } },
        longformByBook: { '100': { ko: ['paper-craft', 'watercolor'] } },
        blogBookIds: new Set(['100']),
        cardnewsBookIds: new Set(['100']),
        shortsUploaded: { '100': { videoId: 'abc' } },
        publishByBook: {
          '100': [
            { channel: 'instagram', status: 'published' },
            { channel: 'youtube-longform', status: 'scheduled' },
          ],
        },
      })
    );
    expect(m.reels).toEqual({ ko: true, en: false });
    expect(m.longform.ko).toEqual(['paper-craft', 'watercolor']);
    expect(m.blog).toBe(true);
    expect(m.cardnews).toBe(true);
    expect(m.published.youtubeShorts).toBe(true);
    expect(m.published.instagram).toBe(true);
    expect(m.published.youtubeLongform).toBe('scheduled');
  });

  it('youtube-longform published 기록이 있으면 published', () => {
    const m = deriveMarketing(
      '100',
      emptySources({
        publishByBook: { '100': [{ channel: 'youtube-longform', status: 'published' }] },
      })
    );
    expect(m.published.youtubeLongform).toBe('published');
  });
});

// ── filterPipelineTargets ──

describe('filterPipelineTargets', () => {
  it('phonics 문서와 __L 변형(variant)을 제외한다', () => {
    const out = filterPipelineTargets([
      { id: '100' },
      { id: '200', phonicsLanguage: 'korean' },
      { id: '300__L2' },
      { id: '400__L10' },
      { id: '500L2' }, // __L 패턴 아님 — 유지
    ]);
    expect(out.map((s) => s.id)).toEqual(['100', '500L2']);
  });
});

// ── collectFetchFailed / shouldCacheBuild ──

describe('collectFetchFailed / shouldCacheBuild', () => {
  it('로드 실패(null) 책 id 만 수집한다 (targets[i]↔books[i] 짝)', () => {
    const failed = collectFetchFailed(['1', '2', '3'], [{ id: '1' }, null, { id: '3' }]);
    expect(failed).toEqual(['2']);
  });

  it('책 실패율 >10% 면 캐시 저장 스킵, shorts-state 마커는 비율에서 제외', () => {
    expect(shouldCacheBuild(100, [])).toBe(true);
    expect(shouldCacheBuild(95, ['1', '2', '3', '4', '5'])).toBe(true); // 5% ≤ 10%
    expect(
      shouldCacheBuild(
        50,
        Array.from({ length: 20 }, (_, i) => String(i))
      )
    ).toBe(false); // ~29%
    expect(shouldCacheBuild(100, [SHORTS_STATE_FAILED])).toBe(true); // 소스 마커만 = 저장 OK
    expect(shouldCacheBuild(0, [])).toBe(true); // 빈 감사도 저장
  });
});

// ── deriveTodos ──

describe('deriveTodos', () => {
  it('미승인 책은 할 일에 포함되지 않는다', () => {
    const todos = deriveTodos([row({ approved: false })]);
    expect(todos).toEqual([]);
  });

  it('classic reel-ko: 릴스 없는 승인 책을 시리즈별 한 건으로 묶고 render-book-reels 커맨드', () => {
    const todos = deriveTodos([
      row({ bookId: '1' }),
      row({ bookId: '2' }),
      row({ bookId: '3', marketing: marketing({ reels: { ko: true, en: false } }) }),
    ]);
    const t = todos.find((x) => x.kind === 'reel-ko');
    expect(t).toBeTruthy();
    expect(t!.series).toBe('classic');
    expect(t!.bookIds).toEqual(['1', '2']);
    expect(t!.command).toContain('render-book-reels.ts');
    expect(t!.command).toContain('--books=1,2');
  });

  it('nature reel-ko 는 render-nature-reels 커맨드', () => {
    const todos = deriveTodos([
      row({
        series: 'nature',
        authoring: { series: 'nature', public: true, langs: { ko: { ...doneLang } } },
      }),
    ]);
    const t = todos.find((x) => x.kind === 'reel-ko');
    expect(t!.command).toContain('render-nature-reels.ts');
  });

  it('life reel-ko: command 는 단일 실행 커맨드, 파생 체인 안내는 label 로', () => {
    const todos = deriveTodos([
      row({
        series: 'life',
        authoring: { series: 'life', public: true, langs: { ko: { ...doneLang } } },
      }),
    ]);
    const t = todos.find((x) => x.kind === 'reel-ko');
    expect(t!.label).toContain('derive-cardnews-storyboards.mjs');
    expect(t!.command).toContain('render-nature-reels.ts');
    expect(t!.command).not.toContain('derive-cardnews-storyboards.mjs');
  });

  it('longform-ko: styles3 는 render-classics-ko 일괄 러너 / base 는 render-nature-ko --category', () => {
    const todos = deriveTodos([
      row({ bookId: '1' }),
      row({
        bookId: '2',
        series: 'nature',
        category: '공룡 친구들',
        authoring: { series: 'nature', public: true, langs: { ko: { ...doneLang } } },
      }),
    ]);
    const classic = todos.find((x) => x.kind === 'longform-ko' && x.series === 'classic');
    // render-book-audiobooks 는 --book 단일 id + --style/--lang 필수라 일괄 커맨드 불가 —
    // 재개 가능한(이미 렌더된 조합 자동 스킵) 일괄 러너를 쓴다. bookIds 는 라벨용으로 유지.
    expect(classic!.command).toContain('render-classics-ko.ts');
    expect(classic!.command).not.toContain('render-book-audiobooks.ts');
    expect(classic!.bookIds).toEqual(['1']);
    const nature = todos.find((x) => x.kind === 'longform-ko' && x.series === 'nature');
    expect(nature!.command).toContain('render-nature-ko.ts');
    expect(nature!.command).toContain("--category '공룡 친구들'");
  });

  it('en 계열: en 렌더 파이프라인 미구축 — 완비 책도 커맨드 없음(blocked:pipeline), 미완 책은 blocked:translation 으로 분리', () => {
    const todos = deriveTodos([
      row({ bookId: '1' }), // en 완비
      row({
        bookId: '2',
        authoring: {
          series: 'classic',
          public: true,
          langs: { ko: { ...doneLang }, en: { ...doneLang, cover: false } },
        },
      }),
      row({
        bookId: '3',
        authoring: { series: 'classic', public: true, langs: { ko: { ...doneLang } } }, // en 자체 없음
      }),
    ]);
    const reelEn = todos.filter((x) => x.kind === 'reel-en');
    const ready = reelEn.find((x) => x.blocked === 'pipeline');
    const blocked = reelEn.find((x) => x.blocked === 'translation');
    expect(ready!.bookIds).toEqual(['1']);
    expect(ready!.command).toBeUndefined();
    expect(ready!.label).toContain('파이프라인 미구축');
    expect(blocked!.bookIds).toEqual(['2', '3']);
    expect(blocked!.command).toBeUndefined();

    // longform-en 도 동일 원칙 — styles3/base 모두 en 배치 러너 미구축이라 커맨드 없음.
    const lfEn = todos.filter((x) => x.kind === 'longform-en');
    const lfReady = lfEn.find((x) => x.blocked === 'pipeline');
    expect(lfReady!.bookIds).toEqual(['1']);
    expect(lfReady!.command).toBeUndefined();
    expect(lfEn.find((x) => x.blocked === 'translation')!.bookIds).toEqual(['2', '3']);
    expect(todos.filter((x) => x.kind === 'longform-en' && !x.blocked)).toEqual([]);
  });

  it('reelPipeline none 시리즈(comic)는 릴스/롱폼 할일을 만들지 않는다', () => {
    const todos = deriveTodos([
      row({
        series: 'comic',
        authoring: { series: 'comic', public: true, langs: { ko: { ...doneLang } } },
      }),
    ]);
    expect(todos).toEqual([]);
  });

  it('schedule-longform: 롱폼 자산 있는데 발행 기록 없으면 --apply 커맨드', () => {
    const todos = deriveTodos([
      row({
        bookId: '1',
        marketing: marketing({
          reels: { ko: true, en: true },
          longform: { ko: ['paper-craft'], en: [] },
        }),
      }),
    ]);
    const t = todos.find((x) => x.kind === 'schedule-longform');
    expect(t).toBeTruthy();
    expect(t!.bookIds).toEqual(['1']);
    expect(t!.command).toContain('schedule-longform-youtube.ts --apply');
  });

  it('schedule-longform: 이미 scheduled/published 면 생성하지 않는다', () => {
    const todos = deriveTodos([
      row({
        marketing: marketing({
          longform: { ko: ['paper-craft'], en: [] },
          published: { youtubeShorts: false, instagram: false, youtubeLongform: 'scheduled' },
        }),
      }),
    ]);
    expect(todos.find((x) => x.kind === 'schedule-longform')).toBeUndefined();
  });
});
