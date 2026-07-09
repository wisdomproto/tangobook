// 발행 전 순수 헬퍼: 플랫폼-콘텐츠 호환 검증, 페이지→타겟 id, HTML→텍스트.
// dflo(ai-server/services/metaPublishPrep.ts)에서 이식 — tangobook은 별도 채널 테이블이 없어
// targetIdFor 를 연동 번들의 MetaPage 기준(targetIdForPage)으로 바꿨다.
import type { MetaPage } from './meta-connection.store.js';

export type Platform = 'facebook' | 'instagram' | 'threads';

export function validatePublish(
  platform: Platform,
  imageUrls: string[]
): { ok: boolean; reason?: string } {
  if (platform === 'instagram' && imageUrls.length === 0) {
    return { ok: false, reason: 'Instagram은 이미지가 1장 이상 필요합니다(텍스트 전용 불가).' };
  }
  return { ok: true };
}

/** 연동 번들의 페이지에서 플랫폼별 Graph 타겟 id 를 고른다. */
export function targetIdForPage(page: MetaPage, platform: Platform): string | null {
  if (platform === 'instagram') return page.instagram?.id ?? null;
  if (platform === 'facebook') return page.id ?? null;
  return page.threadsId ?? page.id ?? null;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
