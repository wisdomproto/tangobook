import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '@/features/settings/api/settings.api';
import { styleGenreMapOf, findLibraryStyle, type LearnerStyleGenre } from '@tangobook/shared';

/**
 * 학습자/부모/게임 화면에 노출하는 그림체 장르명.
 *
 * 정책: 실제 스튜디오/작가명(지브리·에릭칼 등)은 노출하지 않고 **장르명**만 표시한다.
 * 🔴 갈래는 그림체 라이브러리 항목의 `genre` 한 칸이다(2026-09-14 — 따로 두던 `_index/style-genre-map.json`
 *    표를 없앴다. 명작 그림체를 셋으로 합치자 표가 그림체와 1:1 이 됐다). 합쳐진 옛 id 는 `aliases` 로 읽는다.
 *    갈래가 없으면 "그림체 N".
 */
export const STYLE_GENRES = [
  { slug: 'watercolor', label: '수채동화풍' },
  { slug: 'paper3d', label: '페이퍼 3D 아트' },
  { slug: 'collage', label: '콜라주' },
] as const;
export type StyleGenreSlug = LearnerStyleGenre;
const SLUG_LABEL: Record<string, string> = Object.fromEntries(
  STYLE_GENRES.map((g) => [g.slug, g.label])
);

export type GenreLabel = (typeof STYLE_GENRES)[number]['label'];

// 장르 라벨 다국어 — key=한국어 라벨(데이터 값). ko 는 원본이라 폴백.
const GENRE_LABEL_I18N: Record<string, Record<string, string>> = {
  수채동화풍: { en: 'Watercolor', vi: 'Màu nước', zh: '水彩童话风', th: 'สีน้ำ' },
  '페이퍼 3D 아트': {
    en: 'Paper 3D Art',
    vi: 'Nghệ thuật giấy 3D',
    zh: '纸艺3D',
    th: 'อาร์ตกระดาษ 3D',
  },
  콜라주: { en: 'Collage', vi: 'Cắt dán', zh: '拼贴画', th: 'คอลลาจ' },
};

/** 그림풍 장르 한국어 라벨 → 현재 UI 언어 라벨 (매핑/언어 없으면 원본). */
export function genreLabel(koLabel: string, lang: string): string {
  if (!koLabel || lang === 'ko') return koLabel;
  return GENRE_LABEL_I18N[koLabel]?.[lang] ?? koLabel;
}

// "그림체 N" 폴백 라벨 다국어 (장르 매핑/분류 실패 시).
const GENRE_FALLBACK_WORD: Record<string, string> = {
  en: 'Style',
  vi: 'Phong cách',
  zh: '画风',
  th: 'สไตล์',
};
function genreFallback(index: number, lang: string): string {
  const n = index + 1;
  if (lang === 'ko') return `그림체 ${n}`;
  const word = GENRE_FALLBACK_WORD[lang];
  return word ? `${word} ${n}` : `그림체 ${n}`;
}

/** 컴포넌트용 훅 — `const gl = useGenreLabel(); gl('수채동화풍')`. */
export function useGenreLabel(): (koLabel: string) => string {
  const { i18n } = useTranslation();
  return (koLabel: string) => genreLabel(koLabel, i18n.language);
}

const LIBRARY_KEY = ['art-style-library'] as const;

function useLibrary() {
  const { data } = useQuery({
    queryKey: LIBRARY_KEY,
    queryFn: () => settingsApi.getArtStyleLibrary(),
    staleTime: 60 * 60 * 1000,
  });
  return data;
}

/** styleId(옛 id 포함) → 갈래 슬러그 — 그림체 라이브러리에서 만든다. */
export function useStyleGenreMap(): { map: Record<string, StyleGenreSlug> } {
  const library = useLibrary();
  return { map: styleGenreMapOf(library) };
}

/** (styleId, fallbackIndex) → 학습자용 라벨. 라이브러리 갈래 → 없으면 "그림체 N". */
export function useStyleGenreLabel(): (
  styleId: string | undefined,
  fallbackIndex: number
) => string {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const library = useLibrary();
  return (styleId, fallbackIndex) => {
    const genre = findLibraryStyle(library, styleId)?.genre;
    return genre ? genreLabel(SLUG_LABEL[genre], lang) : genreFallback(fallbackIndex, lang);
  };
}
