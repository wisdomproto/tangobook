import type { Lang } from '../types/learning-events.js';

/**
 * 단어를 "블록 타일 / 쓰기 zone" 단위로 분해한다. 언어별 문자 체계에 맞춤.
 *
 * 이 유닛이 곧 블록 타일이자 (나중에) 오디오 재생 키다 — 한 곳에서 정의해 일관 유지.
 *
 *  - zh(한자)·vi(라틴+성조)·en: 코드포인트 단위. vi 는 NFC 정규화로 성조가 붙은
 *    글자(è, ố)를 단일 유닛으로 유지. zh 는 한자 1자 = 1유닛(희귀자 서로게이트 포함).
 *  - th(아부기다): 모음·성조가 자음에 결합되므로 코드포인트로 쪼개면 타일이 깨진다
 *    (◌ 떠다니는 마크). 결합 단위(grapheme cluster)를 유지해 각 유닛이 온전한 글자로
 *    보이게 한다. 예: ไก่ → ["ไ","ก่"], ช้าง → ["ช้","า","ง"].
 *  - ko: 한글 블록은 자모 조합형이라 이 함수를 쓰지 않는다(별도 플레이어). 호출 시엔
 *    안전하게 코드포인트(음절) 단위로 분해.
 */
export function splitUnits(word: string, lang: Lang): string[] {
  const w = (word ?? '').normalize('NFC').trim();
  if (!w) return [];
  // 공백 있는 구(주로 vi: "cây đũa thần")는 어절 단위로 — 낱자로 쪼개면 공백이 빈 타일이 되고
  // 순서 맞추기가 과하게 길어진다. 어절 타일이 의미도 있고 표시 단어와도 일치.
  if (/\s/.test(w)) return w.split(/\s+/).filter(Boolean);
  if (lang === 'th') return splitGraphemeClusters(w, 'th');
  return Array.from(w);
}

/** 결합 단위(grapheme cluster) 분해 — Intl.Segmenter 우선, 미지원 환경은 코드포인트 폴백. */
export function splitGraphemeClusters(word: string, locale = 'und'): string[] {
  const w = (word ?? '').normalize('NFC');
  if (!w) return [];
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Seg) {
    try {
      const seg = new Seg(locale, { granularity: 'grapheme' });
      const out: string[] = [];
      for (const part of seg.segment(w)) out.push(part.segment);
      return out;
    } catch {
      /* fall through to codepoint split */
    }
  }
  return Array.from(w);
}
