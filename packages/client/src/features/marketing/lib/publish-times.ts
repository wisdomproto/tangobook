/**
 * publish-times.ts — makeTime + BEST_POST_TIMES quick-pick helpers.
 *
 * Verbatim port of CF publish-queue.tsx:51 (BEST_POST_TIMES) and :290 (makeTime).
 * The queue converts local-time output → ISO before writing to Supabase
 * (new Date(localStr).toISOString()), so makeTime returns toISOString() directly
 * to match what useUpdateScheduledAt expects (R-5: local vs UTC alignment).
 */

/**
 * Build an ISO string for a moment N days from today at the given local hour.
 * Verbatim from CF publish-queue.tsx:290.
 *
 * @param dayOffset 0 = today, 1 = tomorrow, etc.
 * @param hour      0-23 local hour
 */
export function makeTime(dayOffset: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/**
 * Best posting times by language and channel.
 * Verbatim from CF publish-queue.tsx:51.
 * Fallback for unknown language: BEST_POST_TIMES.ko (CF :301).
 */
export const BEST_POST_TIMES: Record<string, Record<string, string>> = {
  ko: {
    instagram: '오전 7-9시, 점심 12-1시, 저녁 7-9시',
    facebook: '오전 9-10시, 오후 1-3시',
    wordpress: '오전 8-10시 (SEO 크롤링 최적)',
    naver_blog: '오전 6-8시, 저녁 9-11시',
    threads: '오전 8-9시, 저녁 8-10시',
    youtube: '금-토 오후 2-4시, 평일 저녁 6-8시',
  },
  en: {
    instagram: '화-금 오전 10시 (EST), 점심 12시',
    facebook: '수-금 오전 9시-오후 1시 (EST)',
    wordpress: 'Tue-Thu 9-11 AM (EST)',
    youtube: 'Fri-Sat 2-4 PM, Weekdays 5-7 PM (EST)',
    threads: 'Tue-Thu 10 AM - 12 PM (EST)',
  },
  ja: {
    instagram: '오전 7-8시, 점심 12시, 저녁 9-10시 (JST)',
    facebook: '평일 오전 9-11시 (JST)',
    youtube: '금-토 오후 5-7시 (JST)',
  },
  th: {
    instagram: '오전 8-9시, 저녁 7-9시 (ICT)',
    facebook: '오전 10-12시, 저녁 8-10시 (ICT)',
    youtube: '저녁 6-9시 (ICT)',
  },
  vi: {
    instagram: '오전 7-8시, 저녁 8-10시 (ICT)',
    facebook: '오전 9-11시, 저녁 7-9시 (ICT)',
    youtube: '저녁 7-9시 (ICT)',
  },
};

/**
 * Return the best-post-times map for the given language.
 * Falls back to BEST_POST_TIMES.ko for unknown languages (CF :301).
 */
export function pickBestTimes(lang: string): Record<string, string> {
  return BEST_POST_TIMES[lang] ?? BEST_POST_TIMES.ko;
}
