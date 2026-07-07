import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/features/settings/api/settings.api';

/**
 * 학습자/부모 화면에 노출하는 그림체 장르명.
 *
 * 정책: 실제 스튜디오/작가명(지브리·에릭칼 등)은 노출하지 않고 **장르명**만 표시한다.
 * 아래 분류기는 그림체 프롬프트(또는 preset id)를 보고 3대 장르 중 하나로 매핑하고,
 * 매핑되지 않는 그림체는 "그림체 N" 으로 폴백한다.
 */
export type GenreLabel = '수채동화풍' | '페이퍼 3D 아트' | '콜라주';

export function classifyGenre(prompt: string | undefined, id?: string): GenreLabel | null {
  const p = (prompt ?? '').toLowerCase();
  const has = (kw: string[]) => kw.some((k) => p.includes(k));
  // 콜라주 (에릭 칼) — 종이 찢어 붙이기
  if (id === 'collage' || has(['collage', '콜라주', '에릭', 'eric carle', 'torn'])) return '콜라주';
  // 페이퍼 3D 아트 — 종이공예/입체
  if (
    id === 'paper-craft' ||
    has(['paper craft', 'papercraft', '종이공예', '종이', 'cut paper', 'layered', '입체'])
  )
    return '페이퍼 3D 아트';
  // 수채동화풍 — 수채/지브리
  if (id === 'watercolor' || has(['watercolor', '수채', '지브리', 'ghibli'])) return '수채동화풍';
  return null;
}

/**
 * (styleId, fallbackIndex) → 학습자용 라벨. art-style-library(R2)를 로드해 프롬프트로 장르 분류.
 * 라이브러리 로드 전/매핑 실패 시 "그림체 N".
 */
export function useStyleGenreLabel(): (
  styleId: string | undefined,
  fallbackIndex: number
) => string {
  const { data } = useQuery({
    queryKey: ['art-style-library'],
    queryFn: () => settingsApi.getArtStyleLibrary(),
    staleTime: 60 * 60 * 1000,
  });
  const byId = new Map((data ?? []).map((s) => [s.id, s]));
  return (styleId, fallbackIndex) => {
    const fallback = `그림체 ${fallbackIndex + 1}`;
    if (!styleId) return fallback;
    const genre = classifyGenre(byId.get(styleId)?.prompt, styleId);
    return genre ?? fallback;
  };
}
