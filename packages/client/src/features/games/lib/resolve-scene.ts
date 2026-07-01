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
  const pageNum = ko?.pages?.[0];
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
