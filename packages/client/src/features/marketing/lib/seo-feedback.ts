import type { SeoDetail } from './seo-scorer';

export const SEO_THRESHOLD = 0.9; // 90%

/** Build a retry-feedback string from failing SEO categories (excludes image + title). */
export function buildSeoFeedback(details: SeoDetail[]): string | null {
  const failedItems = details
    .filter(
      (d) =>
        d.category !== 'image' && d.category !== 'title' && d.score < d.maxScore * SEO_THRESHOLD
    )
    .map((d) => `- ${d.label}: ${d.score}/${d.maxScore} (${d.message})`);
  if (failedItems.length === 0) return null;
  return failedItems.join('\n');
}
