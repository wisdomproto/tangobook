// 동화책→마케팅 기본글 시딩 순수 헬퍼. DB·FS 의존 없음.

/**
 * 페이지 수 기반 카테고리 분류.
 * <=17 명작 / >=18 자연관찰 (152권 전수 검증됨).
 */
export function classifyByPageCount(pageCount) {
  return pageCount <= 17 ? 'classic' : 'nature';
}

/**
 * plain text 단어 수 (공백 토큰 기준).
 */
export function wordCount(plainText) {
  if (!plainText) return 0;
  return plainText.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * storybookId → mkt_contents.memo 안정 태그.
 */
export function storybookMemoTag(storybookId) {
  return `storybook:${storybookId}`;
}

/**
 * memo → storybookId (매칭 안 되면 null).
 */
export function parseStorybookMemoTag(memo) {
  if (!memo) return null;
  const m = /^storybook:(.+)$/.exec(memo.trim());
  return m ? m[1] : null;
}

/**
 * TipTap HTML → plain text (body_plain_text 폴백 + word_count용).
 */
export function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<(h[1-6]|p|li|br|div)\b[^>]*>/gi, '\n')
    .replace(/<\/(h[1-6]|p|li|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
