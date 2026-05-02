/**
 * Cambridge Pre-A1 Starters 토픽 ID → public/icons/{path} 매핑.
 *
 * 옵션 A: 처음에 만든 9 PNG 카테고리 자산을 Cambridge 토픽에 느슨하게 매핑.
 * 매칭되지 않는 토픽은 unit.emoji 폴백 (Cambridge constants 에 emoji 정의됨).
 */
const CAMBRIDGE_TOPIC_ICON: Record<string, string> = {
  animals: 'category/animal.png',
  family: 'category/family.png',
  food: 'category/food.png',
  home: 'category/daily.png',
  world: 'category/nature.png',
  health: 'category/job.png', // 청진기 — 의료/건강
  places: 'category/adventure.png', // 로켓 — 탐험/장소
};

export function getCambridgeTopicIconSrc(topicId?: string): string | null {
  if (!topicId) return null;
  return CAMBRIDGE_TOPIC_ICON[topicId] ?? null;
}

/**
 * 어휘 단원의 토픽 ID 가 Cambridge 매핑에 있으면 AppIcon 경로,
 * 없으면 null (호출 측에서 emoji 폴백).
 */
export function getCambridgeTopicIcon(topicId?: string): string | null {
  return getCambridgeTopicIconSrc(topicId);
}
