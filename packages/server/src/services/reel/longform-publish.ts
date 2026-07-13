export interface YoutubeRowLike {
  id: string;
  video_settings: Record<string, any> | null;
}

/**
 * mkt_youtube_contents 행들 중 (artStyle, language) 조합이 일치하는 행을 찾는다.
 * 조합당 1행 보장(중복 생성 방지)에 쓰인다. 없으면 null.
 */
export function matchYoutubeRow<T extends YoutubeRowLike>(
  rows: T[],
  artStyle: string,
  language: string
): T | null {
  return (
    rows.find(
      (r) => r.video_settings?.artStyle === artStyle && r.video_settings?.language === language
    ) ?? null
  );
}
