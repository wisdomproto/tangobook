/**
 * 콘텐츠 파이프라인 감사 파생 로직 — 순수 함수만 (I/O 없음).
 * 책 풀 JSON(Storybook)과 마케팅 소스 스냅샷을 받아
 * 저작 완성도(언어별)·마케팅 자산 현황·할 일 목록을 파생한다.
 * I/O 조립은 content-pipeline.service.ts 가 담당.
 */
import type { Storybook, Page } from '@tangobook/shared';
import { resolveSeries, SERIES_RULES, type SeriesRule } from './series-registry.js';

export interface LangDone {
  text: boolean;
  tts: boolean;
  illust: boolean;
  cover: boolean;
}

export interface AuthoringStatus {
  series: SeriesRule['key'] | 'unclassified';
  /** publicByStyleLang 어느 셀이든 공개(명시 false 아님)면 true. 필드 없으면 true. */
  public: boolean;
  /** ko + languages[] 의 각 언어 */
  langs: Record<string, LangDone>;
}

export interface MarketingSources {
  /** bookId → lang → 릴스 자산 존재 여부 */
  reelsByBook: Record<string, Record<string, boolean>>;
  /** bookId → lang → 렌더된 롱폼 artStyle[] */
  longformByBook: Record<string, Record<string, string[]>>;
  blogBookIds: Set<string>;
  cardnewsBookIds: Set<string>;
  /** 유튜브 쇼츠 업로드 상태 (shorts-upload-state.json) */
  shortsUploaded: Record<string, { videoId: string }>;
  /**
   * bookId → 발행 기록. channel 은 서비스가 정규화한 값:
   * 'instagram' | 'youtube-longform' | … / status = 'scheduled' | 'published' 등.
   */
  publishByBook: Record<string, Array<{ channel: string; status: string }>>;
}

export interface MarketingStatus {
  /** 최소 ko/en 키 보장 */
  reels: Record<string, boolean>;
  /** 최소 ko/en 키 보장. lang → artStyle[] */
  longform: Record<string, string[]>;
  blog: boolean;
  cardnews: boolean;
  published: {
    youtubeShorts: boolean;
    instagram: boolean;
    youtubeLongform: 'none' | 'scheduled' | 'published';
  };
}

export interface PipelineRow {
  bookId: string;
  title: string;
  series: SeriesRule['key'] | 'unclassified';
  approved: boolean;
  authoring: AuthoringStatus;
  marketing: MarketingStatus;
  /** 책 실카테고리 (base 시리즈 longform 커맨드의 --category 인자용) */
  category?: string;
}

export interface Todo {
  kind: 'reel-ko' | 'reel-en' | 'longform-ko' | 'longform-en' | 'schedule-longform';
  series: string;
  bookIds: string[];
  label: string;
  command?: string;
  blocked?: 'translation';
}

// ── deriveAuthoring ──

function textPagesOf(sb: Storybook): Page[] {
  return (sb.pages ?? []).filter((p) => (p.text ?? '').trim().length > 0);
}

export function deriveAuthoring(sb: Storybook): AuthoringStatus {
  const rule = resolveSeries(sb.category);
  const series = rule?.key ?? 'unclassified';
  const pages = sb.pages ?? [];
  const textPages = textPagesOf(sb);
  const styleAssets = Object.values(sb.styleAssets ?? {});

  // illust — 언어 무관 (visual content 는 모든 언어 공유)
  const baseIllust = pages.length > 0 && pages.every((p) => !!p.illustrationUrl);
  let illust = baseIllust;
  if (rule?.artStyleMode === 'styles3') {
    // 한 그림체라도 pageIllustrations 가 전 페이지를 커버하면 완성. 없으면 base 폴백
    // (활성 그림체 자산은 top-level pages[].illustrationUrl 에 있으므로).
    const styleCovered =
      pages.length > 0 &&
      styleAssets.some(
        (a) => a && pages.every((p) => !!a.pageIllustrations?.[p.pageNumber]?.illustrationUrl)
      );
    illust = styleCovered || baseIllust;
  }

  const langs: Record<string, LangDone> = {
    ko: {
      text: textPages.length > 0,
      // koCompletion 동일 원칙: 글 있는 페이지만 TTS 요구
      tts: textPages.length > 0 && textPages.every((p) => !!p.ttsUrl),
      illust,
      cover: !!sb.coverImage || !!sb.primaryCoverByLang?.ko,
    },
  };

  for (const lang of sb.languages ?? []) {
    if (lang === 'ko' || langs[lang]) continue;
    const text =
      textPages.length > 0 &&
      textPages.every((p) => (p.translations?.[lang]?.text ?? '').trim().length > 0);
    const tts = textPages.length > 0 && textPages.every((p) => !!p.translations?.[lang]?.ttsUrl);
    // 언어별 표지는 coverImage 폴백 금지 — 표지에 언어 텍스트가 구워져 있어 ko 표지로 대체 불가.
    const cover =
      !!sb.primaryCoverByLang?.[lang] || styleAssets.some((a) => !!a?.primaryCoverByLang?.[lang]);
    langs[lang] = { text, tts, illust, cover };
  }

  // public — 어느 셀이든 명시 false 가 아니면 공개. 필드 없음/빈 맵 = 공개.
  let isPublic = true;
  const pbs = sb.publicByStyleLang;
  if (pbs) {
    const cells = Object.values(pbs).flatMap((byLang) => Object.values(byLang ?? {}));
    if (cells.length > 0) isPublic = cells.some((v) => v !== false);
  }

  return { series, public: isPublic, langs };
}

// ── deriveMarketing ──

export function deriveMarketing(bookId: string, src: MarketingSources): MarketingStatus {
  const reels: Record<string, boolean> = {
    ko: false,
    en: false,
    ...(src.reelsByBook[bookId] ?? {}),
  };
  const longform: Record<string, string[]> = {
    ko: [],
    en: [],
    ...(src.longformByBook[bookId] ?? {}),
  };
  const records = src.publishByBook[bookId] ?? [];
  const longformRecords = records.filter((r) => r.channel === 'youtube-longform');
  const youtubeLongform: MarketingStatus['published']['youtubeLongform'] = longformRecords.some(
    (r) => r.status === 'published'
  )
    ? 'published'
    : longformRecords.length > 0
      ? 'scheduled'
      : 'none';

  return {
    reels,
    longform,
    blog: src.blogBookIds.has(bookId),
    cardnews: src.cardnewsBookIds.has(bookId),
    published: {
      youtubeShorts: !!src.shortsUploaded[bookId],
      instagram: records.some((r) => r.channel === 'instagram' && r.status === 'published'),
      youtubeLongform,
    },
  };
}

// ── filterPipelineTargets ──

const VARIANT_RE = /__L\d+$/;

export function filterPipelineTargets<T extends { id: string; phonicsLanguage?: unknown }>(
  summaries: T[]
): T[] {
  return summaries.filter((s) => s.phonicsLanguage == null && !VARIANT_RE.test(s.id));
}

// ── deriveTodos ──

const RUN = 'pnpm --filter server exec tsx';

function ruleFor(series: string): SeriesRule | undefined {
  return SERIES_RULES.find((r) => r.key === series);
}

function reelCommand(rule: SeriesRule, bookIds: string[]): string | undefined {
  const list = bookIds.join(',');
  switch (rule.reelPipeline) {
    case 'storyboard':
      return `${RUN} scripts/render-book-reels.ts --books=${list}`;
    case 'nature':
      return `${RUN} scripts/render-nature-reels.ts --books=${list}`;
    case 'derive':
      // 생활/유치원동화 = 기본글+블로그 → 스토리보드 파생 체인 후 자연 릴스 렌더러 공용.
      return `node packages/server/scripts/derive-cardnews-storyboards.mjs 후 ${RUN} scripts/render-nature-reels.ts --books=${list}`;
    default:
      return undefined;
  }
}

function longformCommand(rule: SeriesRule, rows: PipelineRow[], lang: 'ko' | 'en'): string {
  const langFlag = lang === 'en' ? ' --lang=en' : '';
  if (rule.artStyleMode === 'styles3') {
    return `${RUN} scripts/render-book-audiobooks.ts --book=${rows.map((r) => r.bookId).join(',')}${langFlag}`;
  }
  // base 시리즈 = render-nature-ko 가 카테고리 단위로 일괄 렌더 (책 실카테고리 사용).
  const cats = [...new Set(rows.map((r) => r.category).filter((c): c is string => !!c))];
  const targets = cats.length > 0 ? cats : rule.categories;
  return targets.map((c) => `${RUN} scripts/render-nature-ko.ts --category '${c}'`).join(' && ');
}

function isEnComplete(row: PipelineRow): boolean {
  const en = row.authoring.langs.en;
  return !!en && en.text && en.tts && en.illust && en.cover;
}

function partition<T>(arr: T[], pred: (v: T) => boolean): [T[], T[]] {
  const yes: T[] = [];
  const no: T[] = [];
  for (const v of arr) (pred(v) ? yes : no).push(v);
  return [yes, no];
}

export function deriveTodos(rows: PipelineRow[]): Todo[] {
  const todos: Todo[] = [];
  const approved = rows.filter((r) => r.approved);

  const bySeries = new Map<string, PipelineRow[]>();
  for (const r of approved) {
    const arr = bySeries.get(r.series);
    if (arr) arr.push(r);
    else bySeries.set(r.series, [r]);
  }

  for (const [series, group] of bySeries) {
    const rule = ruleFor(series);
    // 미분류·reelPipeline 'none'(comic/original) 시리즈는 릴스/롱폼 할일 생성 안 함.
    if (!rule || rule.reelPipeline === 'none') continue;

    // reel-ko
    const needReelKo = group.filter((r) => !r.marketing.reels.ko);
    if (needReelKo.length > 0) {
      todos.push({
        kind: 'reel-ko',
        series,
        bookIds: needReelKo.map((r) => r.bookId),
        label: `${rule.label} 한국어 릴스 렌더 (${needReelKo.length}권)`,
        command: reelCommand(
          rule,
          needReelKo.map((r) => r.bookId)
        ),
      });
    }

    // reel-en — en 저작 4항목 완비 책만 커맨드, 미완은 번역 blocked 로 분리
    const needReelEn = group.filter((r) => !r.marketing.reels.en);
    const [reelEnReady, reelEnBlocked] = partition(needReelEn, isEnComplete);
    if (reelEnReady.length > 0) {
      todos.push({
        kind: 'reel-en',
        series,
        bookIds: reelEnReady.map((r) => r.bookId),
        label: `${rule.label} 영어 릴스 렌더 (${reelEnReady.length}권)`,
        command: reelCommand(
          rule,
          reelEnReady.map((r) => r.bookId)
        ),
      });
    }
    if (reelEnBlocked.length > 0) {
      todos.push({
        kind: 'reel-en',
        series,
        bookIds: reelEnBlocked.map((r) => r.bookId),
        label: `${rule.label} 영어 릴스 — 영어 저작(번역/TTS/표지) 미완 (${reelEnBlocked.length}권)`,
        blocked: 'translation',
      });
    }

    // longform-ko
    const needLfKo = group.filter((r) => (r.marketing.longform.ko ?? []).length === 0);
    if (needLfKo.length > 0) {
      todos.push({
        kind: 'longform-ko',
        series,
        bookIds: needLfKo.map((r) => r.bookId),
        label: `${rule.label} 한국어 롱폼 렌더 (${needLfKo.length}권)`,
        command: longformCommand(rule, needLfKo, 'ko'),
      });
    }

    // longform-en
    const needLfEn = group.filter((r) => (r.marketing.longform.en ?? []).length === 0);
    const [lfEnReady, lfEnBlocked] = partition(needLfEn, isEnComplete);
    if (lfEnReady.length > 0) {
      todos.push({
        kind: 'longform-en',
        series,
        bookIds: lfEnReady.map((r) => r.bookId),
        label: `${rule.label} 영어 롱폼 렌더 (${lfEnReady.length}권)`,
        command: longformCommand(rule, lfEnReady, 'en'),
      });
    }
    if (lfEnBlocked.length > 0) {
      todos.push({
        kind: 'longform-en',
        series,
        bookIds: lfEnBlocked.map((r) => r.bookId),
        label: `${rule.label} 영어 롱폼 — 영어 저작(번역/TTS/표지) 미완 (${lfEnBlocked.length}권)`,
        blocked: 'translation',
      });
    }

    // schedule-longform — 롱폼 자산은 있는데 유튜브 발행 기록이 전혀 없는 책
    const needSchedule = group.filter(
      (r) =>
        Object.values(r.marketing.longform).some((styles) => styles.length > 0) &&
        r.marketing.published.youtubeLongform === 'none'
    );
    if (needSchedule.length > 0) {
      todos.push({
        kind: 'schedule-longform',
        series,
        bookIds: needSchedule.map((r) => r.bookId),
        label: `${rule.label} 롱폼 유튜브 예약 (${needSchedule.length}권)`,
        command: `${RUN} scripts/schedule-longform-youtube.ts --apply`,
      });
    }
  }

  return todos;
}
