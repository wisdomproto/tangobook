// 2026-04-30 — educational_content.vocabulary[] → key_objects[] 통합 후 호환 read 헬퍼.
//
// 두 source 합치되 중복 제거 (lowercase 영어 단어 기준):
// 1. key_objects 우선 (가장 최신 정보 — 마이그 후 모든 정보 포함)
// 2. vocabulary 는 key_objects 에 없는 항목만 보충 (안전 fallback)
//
// 신규 책: vocabulary 빈 배열 + key_objects 풍부 → key_objects 만으로 동작
// 레거시 책 (마이그 X): vocabulary 풍부 + key_objects 영어 없을 수 있음 → vocabulary 보충

import type { Storybook, VocabularyItem } from '../types/storybook.js';

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;

function lc(s: string | undefined): string {
  return (s || '').toLowerCase().trim();
}

/**
 * 책의 학습 어휘를 통합 형태로 반환. game/marketing/UI 가 단일 진입점으로 사용.
 *
 * 반환 형식: VocabularyItem[] (word/korean/definition/example) — 기존 호출부와 100% 호환.
 */
export function getEffectiveVocabulary(sb: Storybook): VocabularyItem[] {
  const seen = new Set<string>();
  const result: VocabularyItem[] = [];

  // 1. key_objects 우선
  for (const k of sb.key_objects ?? []) {
    const en = k.nameEn || k.nameTranslations?.en || '';
    if (!en) continue;
    const key = lc(en);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    // korean 결정: korean 필드 → name(한글일 때) → 빈 문자열
    const koCandidate = k.korean || (k.name && HANGUL_RE.test(k.name) ? k.name : '') || '';
    result.push({
      word: en,
      korean: koCandidate,
      definition: k.definition || '',
      example: k.example || '',
    });
  }

  // 2. vocabulary 보충 (key_objects 에 영어 없거나 매칭 안 된 항목)
  for (const v of sb.educational_content?.vocabulary ?? []) {
    const key = lc(v.word);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(v);
  }

  return result;
}
