import type { Lang, VocabularyUnitWord } from '@tangobook/shared';

const HANGUL_RE = /[가-힣]/;
const ENGLISH_RE = /^[a-zA-Z]+$/;

/** 어휘 학습 언어 토글 — 콘텐츠 완비 5개(런칭 타겟) 고정 순서. */
export const VOCAB_LANG_CHIPS: { code: Lang; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '中文' },
  { code: 'th', label: 'ไทย' },
];

/** 단원 단어 목록에 lang 데이터가 충분한지 — 토글 노출/disabled 결정용 */
export function hasLangData(words: VocabularyUnitWord[], lang: Lang): boolean {
  if (lang === 'ko') {
    return words.some((w) => (w.korean && w.korean.trim()) || HANGUL_RE.test(w.word));
  }
  if (lang === 'en') {
    return words.some((w) => (w.nameEn && w.nameEn.trim()) || ENGLISH_RE.test(w.word));
  }
  // vi/zh/th: 번역된 단어가 하나라도 있으면 노출
  return words.some((w) => !!w.nameTranslations?.[lang]?.trim());
}

/** 데이터가 있는 언어 칩만 (고정 순서 유지). */
export function availableVocabLangs(words: VocabularyUnitWord[]) {
  return VOCAB_LANG_CHIPS.filter((c) => hasLangData(words, c.code));
}

/**
 * 실제 표시 언어 결정 — 명시 선택 > UI 언어 > 단원 기본 언어 > 첫 사용가능 > ko.
 * "UI 에서 고른 언어를 메인으로" 정책: 사용자가 이 화면에서 따로 안 고르면 UI 언어로 뜬다.
 */
export function resolveVocabLang(opts: {
  selected: Lang | null;
  words: VocabularyUnitWord[];
  uiLang: string;
  unitLang?: Lang;
}): Lang {
  const { selected, words, uiLang, unitLang } = opts;
  const ok = (l: Lang | null | undefined): l is Lang => !!l && hasLangData(words, l);
  if (ok(selected)) return selected;
  if (ok(uiLang as Lang)) return uiLang as Lang;
  if (ok(unitLang)) return unitLang;
  return availableVocabLangs(words)[0]?.code ?? 'ko';
}
