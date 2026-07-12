import { apiPost } from '@/lib/axios';

/**
 * 어휘 게임 낱유닛(zh 한자·vi 어절/성조글자·th 결합단위) 발음 URL resolver.
 *
 * ko/en 은 phonics 음절 mp3 라이브러리(usePhonicsMap)로 낱유닛을 발음하지만 vi/zh/th 는 그런
 * 라이브러리가 없다 → 서버 `/api/tts/vocab-unit` 이 Google native TTS 로 lazy 생성 + R2 캐시
 * (결정적 키라 첫 재생만 생성, 이후 캐시 hit). 여기서는 세션 in-memory 캐시 + in-flight 공유로
 * 같은 유닛 중복 요청을 막는다.
 *
 * 블록 타일 배치(OrderBlockPlayer)·따라쓰기 유닛 완성(LangWordWritingPlayer)에서 사용.
 */
type UnitLang = 'vi' | 'zh' | 'th';

const cache = new Map<string, string | undefined>();
const inflight = new Map<string, Promise<string | undefined>>();

export async function resolveUnitTtsUrl(
  rawText: string,
  lang: UnitLang
): Promise<string | undefined> {
  const text = rawText.trim();
  if (!text) return undefined;
  const key = `${lang}:${text}`;
  if (cache.has(key)) return cache.get(key);
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = apiPost<{ audioUrl: string }>('/tts/vocab-unit', { text, lang })
    .then((d) => {
      cache.set(key, d.audioUrl);
      return d.audioUrl;
    })
    .catch(() => {
      // 실패는 무음 처리(게임 흐름 유지). 캐시엔 안 넣어 다음 기회에 재시도.
      return undefined;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

/** 라운드 진입 시 유닛들을 미리 생성/캐시(백그라운드) — 첫 배치 지연 최소화. */
export function prewarmUnitTts(units: string[], lang: UnitLang): void {
  for (const u of units) void resolveUnitTtsUrl(u, lang);
}
