// Verify book-v2 R2 integrity — manifest의 usedVariants에 명시된 모든 조합에 대해
// 필수 자산이 존재하는지 list 1회로 검증.

import { listR2Objects } from '../providers/r2.provider.js';
import { getManifest } from '../repositories/book-v2.repository.js';
import {
  bookPrefix,
  textSliceKey,
  audioFileKey,
  styleCharactersKey,
  styleCoverKey,
  stylePageImageKey,
  styleKeyObjectImageKey,
  styleVocabImageKey,
} from '../utils/book-v2-keys.js';
import type { BookTextSlice, ReadingLevel } from '@tangobook/shared';
import { downloadFromR2 } from '../providers/r2.provider.js';

export interface BookVerifyResult {
  bid: string;
  status: 'pass' | 'warn' | 'fail';
  missingTextSlices: string[];
  missingCharacters: string[]; // styles
  missingCovers: string[];
  missingPageImages: string[];
  missingAudio: string[];
  missingKeyObjImages: string[];
  missingVocabImages: string[];
  notes: string[];
}

export async function verifyBookV2(bid: string): Promise<BookVerifyResult> {
  const r: BookVerifyResult = {
    bid,
    status: 'pass',
    missingTextSlices: [],
    missingCharacters: [],
    missingCovers: [],
    missingPageImages: [],
    missingAudio: [],
    missingKeyObjImages: [],
    missingVocabImages: [],
    notes: [],
  };

  const manifest = await getManifest(bid);
  if (!manifest) {
    return { ...r, status: 'fail', notes: [`manifest missing`] };
  }

  // R2 list 1회로 모든 객체 키 set
  const objects = await listR2Objects(bookPrefix(bid));
  const keys = new Set(objects.map((o) => o.Key!).filter(Boolean));

  const { levels, languages, styles } = manifest.usedVariants;

  // Style 검증
  for (const style of styles) {
    if (!keys.has(styleCharactersKey(bid, style))) r.missingCharacters.push(style);
    // 표지: webp 우선, 없으면 png/jpg 허용
    const coverKeys = ['webp', 'png', 'jpg'].map((ext) => styleCoverKey(bid, style, ext as 'webp'));
    if (!coverKeys.some((k) => keys.has(k))) r.missingCovers.push(style);

    // keyObjectImages — keyObjectIds 모두 매핑 (없으면 OK가 아님)
    for (const id of manifest.keyObjectIds) {
      const candidates = ['webp', 'png', 'jpg'].map((ext) =>
        styleKeyObjectImageKey(bid, style, id, ext as 'webp')
      );
      if (!candidates.some((k) => keys.has(k))) {
        r.missingKeyObjImages.push(`${style}/${id}`);
      }
    }
    for (const id of manifest.vocabIds) {
      const candidates = ['webp', 'png', 'jpg'].map((ext) =>
        styleVocabImageKey(bid, style, id, ext as 'webp')
      );
      if (!candidates.some((k) => keys.has(k))) {
        r.missingVocabImages.push(`${style}/${id}`);
      }
    }
  }

  // Text slice + audio 검증 (level × language)
  for (const level of levels) {
    for (const lang of languages) {
      const tk = textSliceKey(bid, level, lang);
      if (!keys.has(tk)) {
        r.missingTextSlices.push(`${level}.${lang}`);
        continue;
      }
      // text slice 로드해서 페이지 수만큼 audio + style page 검증
      try {
        const buf = await downloadFromR2(tk);
        const slice = JSON.parse(buf.toString('utf-8')) as BookTextSlice;
        for (const page of slice.pages ?? []) {
          // audio
          const ak = audioFileKey(bid, level, lang, page.pageNumber);
          if (!keys.has(ak)) r.missingAudio.push(`${level}.${lang}/p${page.pageNumber}`);

          // 페이지 이미지 — usedVariants.styles 각각에서 검증
          for (const style of styles) {
            const candidates = ['webp', 'png', 'jpg'].map((ext) =>
              stylePageImageKey(
                bid,
                style,
                level as ReadingLevel,
                page.illustrationKey,
                ext as 'webp'
              )
            );
            if (!candidates.some((k) => keys.has(k))) {
              r.missingPageImages.push(`${style}/${level}/${page.illustrationKey}`);
            }
          }
        }
      } catch (e) {
        r.notes.push(`textSlice load failed ${tk}: ${(e as Error).message}`);
      }
    }
  }

  // 상태 결정
  const totalMissing =
    r.missingTextSlices.length +
    r.missingCharacters.length +
    r.missingCovers.length +
    r.missingPageImages.length +
    r.missingAudio.length +
    r.missingKeyObjImages.length +
    r.missingVocabImages.length;
  if (totalMissing > 0) r.status = 'warn';
  // text slice 자체가 없으면 fail (구조 자체 문제)
  if (
    r.missingTextSlices.length > 0 &&
    r.missingTextSlices.length === levels.length * languages.length
  ) {
    r.status = 'fail';
  }
  return r;
}
