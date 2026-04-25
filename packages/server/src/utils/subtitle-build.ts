// 페이지 텍스트 → 문장 분할 + 자막 타이밍 빌더 (longform 분석용).
// v1 longform.service에서 분리 — v2 분석에서도 재사용.

import type { LongformSubtitleEntry } from '@tangobook/shared';

export function splitSentences(text: string): string[] {
  const raw = text
    .split(/(?<=[.!?。])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const cleaned = raw
    .map((s) =>
      s
        .replace(/\s*[""''"']\s*$/, '')
        .replace(/^[""''"']\s*/, '')
        .trim()
    )
    .filter((s) => s.length > 0);

  const merged: string[] = [];
  for (const s of cleaned) {
    if (s.length < 5 && merged.length > 0) {
      merged[merged.length - 1] += ' ' + s;
    } else if (s.length < 5) {
      // skip leading tiny fragments
    } else {
      merged.push(s);
    }
  }
  return merged;
}

export function buildSubtitles(
  sentences: string[],
  totalDuration: number
): LongformSubtitleEntry[] {
  if (sentences.length === 0) return [];
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  if (totalChars === 0) return [];

  let cursor = 0;
  return sentences.map((text) => {
    const weight = text.length / totalChars;
    const duration = totalDuration * weight;
    const startTime = +cursor.toFixed(2);
    cursor += duration;
    const endTime = +cursor.toFixed(2);
    return { id: crypto.randomUUID(), text, startTime, endTime };
  });
}
