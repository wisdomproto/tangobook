import type { Lang, Storybook } from '@tangobook/shared';

export interface WordScene {
  /** 단어가 처음 등장하는 페이지의 장면 일러스트 */
  illustrationUrl: string;
  pageNumber: number;
  /** 해당 페이지의 (언어별) 본문 텍스트 */
  pageText?: string;
  /** 해당 페이지의 (언어별) 나레이션 오디오 URL — 없으면 무음 */
  pageTtsUrl?: string;
}

/** 블록 게임의 정답 단어(문자열)와 매칭되는 KeyObject 찾기. */
function matchKeyObject(word: string, lang: Lang, storybook: Storybook) {
  const w = word.trim();
  const wl = w.toLowerCase();
  return storybook.key_objects?.find((k) => {
    if (lang === 'ko') return k.korean === w || k.name === w;
    // 영어(또는 그 외): nameEn / name 을 대소문자 무시 매칭
    return (
      (!!k.nameEn && k.nameEn.toLowerCase() === wl) || (!!k.name && k.name.toLowerCase() === wl)
    );
  });
}

/**
 * keyObject.pages[] 를 본문 텍스트로 검증한 페이지 번호.
 * pages[] 는 저작 과정(페이지 추가/삭제, 초기 AI 분류)에서 drift 될 수 있어
 * (키다리 아저씨: 8개 중 7개 불일치, 2026-07-02) 실제 한국어 본문에 단어가
 * 등장하는 페이지만 신뢰하고, 아니면 전체 페이지 스캔으로 대체.
 *
 * @param koreanWord 검증 기준 한국어 단어 (모든 책의 page.text 는 ko) — 없으면 검증 불가로 claimed 신뢰
 * @returns 검증된 페이지 번호. 본문 어디에도 없으면 null (엉뚱한 장면 대신 미표시).
 */
export function findValidatedPageNumber(
  koreanWord: string | undefined,
  storybook: Storybook,
  claimed: number[] | undefined
): number | null {
  const pages = storybook.pages ?? [];
  const first = claimed?.[0] ?? null;
  if (!koreanWord) return first;
  // 텍스트가 아예 없는 책(이미지 전용 등)은 검증 불가 — 기존대로 claimed 신뢰
  if (!pages.some((p) => !!p?.text)) return first;
  for (const num of claimed ?? []) {
    if (pages[num - 1]?.text?.includes(koreanWord)) return num;
  }
  for (let i = 0; i < pages.length; i++) {
    if (pages[i]?.text?.includes(koreanWord)) return pages[i].pageNumber ?? i + 1;
  }
  return null;
}

/**
 * 게임 정답 단어 → 그 단어가 나오는 동화 장면(일러스트 + 페이지 텍스트 + 나레이션).
 * 소스 동화책(book context)이 있어야 매핑됨 — 없거나 매칭 실패 시 null (graceful).
 * WordDetailModal 의 findPageIllustration 패턴을 게임용(문자열 단어)으로 정리.
 */
export function resolveSceneFromWord(
  word: string,
  lang: Lang,
  storybook?: Storybook,
  style?: string
): WordScene | null {
  if (!storybook || !word) return null;
  const ko = matchKeyObject(word, lang, storybook);
  if (!ko) return null;
  const pageNum = findValidatedPageNumber(
    ko.korean ?? (lang === 'ko' ? word : undefined),
    storybook,
    ko.pages
  );
  if (!pageNum) return null;

  const page = storybook.pages?.[pageNum - 1];
  const styleUrl =
    style && storybook.styleAssets?.[style]?.pageIllustrations?.[pageNum]?.illustrationUrl;
  const url = styleUrl ?? page?.illustrationUrl;
  if (!url) return null;

  const pageText = lang === 'ko' ? page?.text : (page?.translations?.[lang]?.text ?? page?.text);
  const pageTtsUrl = lang === 'ko' ? page?.ttsUrl : page?.translations?.[lang]?.ttsUrl;

  return { illustrationUrl: url, pageNumber: pageNum, pageText, pageTtsUrl };
}
