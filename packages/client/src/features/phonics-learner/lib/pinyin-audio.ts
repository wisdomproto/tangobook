import { resolveUnitTtsUrl } from '@/features/tts';

/**
 * 병음(拼音) 발음 URL resolver — 기존 zh 런타임 TTS 경로(`/api/tts/vocab-unit`, Google `cmn-CN`
 * native + R2 캐시)를 그대로 재사용한다(어휘 게임과 동일). 새 R2 카테고리·bake 스크립트 없이
 * 첫 재생만 생성하고 이후 캐시 hit.
 *
 * 🔴 **Google cmn-CN 은 병음이 아니라 한자를 읽는다** — `ā` 같은 라틴 병음을 그대로 주면 성조를
 *    제대로 못 낸다. 그래서 각 병음 음절을 **대표 한자**로 매핑해 TTS 에 넘긴다.
 *    · 성조 유닛 mā/má/mǎ/mà = 妈/麻/马/骂 (성조까지 정확) ✓
 *    · 단운모 a o e i u ü = 啊/哦/鹅/一/屋/鱼 — **모음 음가는 맞으나 성조는 근사**다(한자마다 성조가
 *      다르다: 鹅=é 2성, 鱼=yú 2성 등). 단운모 「배우기」의 목표는 모음 소릿결이라 MVP 로는 충분하나,
 *      🔴 **성조까지 정확한 단운모 음원은 사전 녹음 병음 클립이 필요**하다(다운로드 zip 은 n~z 절반뿐
 *      + a/e 누락이라 못 씀 — docs/phonics-chinese/feasibility.md §1.2·§3). 프로덕션은 여기를 교체.
 */
export const PINYIN_TTS_HANZI: Record<string, string> = {
  // 단운모 (bare finals) — 대표 한자. 성조는 근사(모음 음가 우선).
  a: '啊',
  o: '哦',
  e: '鹅',
  i: '一',
  u: '屋',
  ü: '鱼',
  // 성조 유닛 (ma 4성) — 성조까지 정확한 대표 한자.
  mā: '妈',
  má: '麻',
  mǎ: '马',
  mà: '骂',
};

/** 병음 음절 → 발음 URL. 매핑에 없으면 병음 자체를 넘긴다(폴백). 실패는 undefined(무음). */
export function resolveChinesePinyinAudio(pinyin: string): Promise<string | undefined> {
  const hanzi = PINYIN_TTS_HANZI[pinyin] ?? pinyin;
  return resolveUnitTtsUrl(hanzi, 'zh');
}
