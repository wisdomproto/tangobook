import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '@/features/settings/api/settings.api';
import { apiGet, apiPut } from '@/lib/axios';

/**
 * 학습자/부모/게임 화면에 노출하는 그림체 장르명.
 *
 * 정책: 실제 스튜디오/작가명(지브리·에릭칼 등)은 노출하지 않고 **장르명**만 표시한다.
 * 원본 데이터가 지저분해(고아 style id 등) 자동 분류가 어려우므로, /editor2 에서
 * **styleId → 장르**를 수동 지정(R2 `_index/style-genre-map.json`)한 값을 최우선으로 쓴다.
 * 지정이 없으면 프롬프트 자동 분류 → 그래도 없으면 "그림체 N".
 */
export const STYLE_GENRES = [
  { slug: 'watercolor', label: '수채동화풍' },
  { slug: 'paper3d', label: '페이퍼 3D 아트' },
  { slug: 'collage', label: '콜라주' },
] as const;
export type StyleGenreSlug = (typeof STYLE_GENRES)[number]['slug'];
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

/** 컴포넌트용 훅 — `const gl = useGenreLabel(); gl('수채동화풍')`. */
export function useGenreLabel(): (koLabel: string) => string {
  const { i18n } = useTranslation();
  return (koLabel: string) => genreLabel(koLabel, i18n.language);
}

/** 프롬프트/ID 기반 자동 분류 (수동 지정이 없을 때의 폴백). */
export function classifyGenre(prompt: string | undefined, id?: string): GenreLabel | null {
  const p = (prompt ?? '').toLowerCase();
  const has = (kw: string[]) => kw.some((k) => p.includes(k));
  if (id === 'collage' || has(['collage', '콜라주', '에릭', 'eric carle', 'torn'])) return '콜라주';
  if (
    id === 'paper-craft' ||
    has(['paper craft', 'papercraft', '종이공예', '종이', 'cut paper', 'layered', '입체'])
  )
    return '페이퍼 3D 아트';
  if (id === 'watercolor' || has(['watercolor', '수채', '지브리', 'ghibli'])) return '수채동화풍';
  return null;
}

const MAP_KEY = ['style-genre-map'] as const;
type StyleGenreMap = Record<string, string>;

/** 전역 styleId → 장르 슬러그 맵 (R2). editor2 지정 결과. */
export function useStyleGenreMap() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: MAP_KEY,
    queryFn: () => apiGet<StyleGenreMap>('/style-genre-map'),
    staleTime: 60 * 60 * 1000,
  });
  const map = data ?? {};

  const mutation = useMutation({
    mutationFn: (next: StyleGenreMap) => apiPut<StyleGenreMap>('/style-genre-map', next),
    onSuccess: (saved) => qc.setQueryData(MAP_KEY, saved),
  });

  /** 한 styleId 의 장르를 지정/해제하고 저장. slug=null 이면 지정 해제. */
  const setGenre = (styleId: string, slug: StyleGenreSlug | null) => {
    const next: StyleGenreMap = { ...map };
    if (slug) next[styleId] = slug;
    else delete next[styleId];
    mutation.mutate(next);
  };

  return { map, setGenre, saving: mutation.isPending };
}

/**
 * (styleId, fallbackIndex) → 학습자용 라벨.
 * 1) editor2 수동 지정(style-genre-map) 2) art-style-library 프롬프트 자동 분류 3) "그림체 N".
 */
export function useStyleGenreLabel(): (
  styleId: string | undefined,
  fallbackIndex: number
) => string {
  const { data: mapData } = useQuery({
    queryKey: MAP_KEY,
    queryFn: () => apiGet<StyleGenreMap>('/style-genre-map'),
    staleTime: 60 * 60 * 1000,
  });
  const { data: libData } = useQuery({
    queryKey: ['art-style-library'],
    queryFn: () => settingsApi.getArtStyleLibrary(),
    staleTime: 60 * 60 * 1000,
  });
  const map = mapData ?? {};
  const byId = new Map((libData ?? []).map((s) => [s.id, s]));
  return (styleId, fallbackIndex) => {
    const fallback = `그림체 ${fallbackIndex + 1}`;
    if (!styleId) return fallback;
    const manual = map[styleId];
    if (manual && SLUG_LABEL[manual]) return SLUG_LABEL[manual];
    return classifyGenre(byId.get(styleId)?.prompt, styleId) ?? fallback;
  };
}
