import { useQuery } from '@tanstack/react-query';
import { mktKeys } from '../api/queries';
import { getChannelTranslationUrl, type ChannelKind } from '../lib/channel-translator';

export interface ChannelTranslationState {
  loading: boolean;
  html: string | null;
  /** True when a translation record exists but the HTML couldn't be fetched. */
  missingFetch: boolean;
}

/**
 * Loads the translated HTML for a given (content, channel, language).
 * Returns `{ html: null }` on Korean or when no translation exists.
 * TanStack-Query port of the CF useEffect hook; proxy path is the mkt namespace.
 */
export function useChannelTranslation(
  contentId: string | null,
  channel: ChannelKind,
  language: string
): ChannelTranslationState {
  const query = useQuery({
    queryKey: mktKeys.translationHtml(contentId ?? '', channel, language),
    enabled: !!contentId && language !== 'ko',
    queryFn: async (): Promise<{ html: string | null; missing: boolean }> => {
      const url = await getChannelTranslationUrl(contentId as string, language, channel);
      if (!url) return { html: null, missing: false };
      const res = await fetch(`/api/mkt/storage/proxy?url=${encodeURIComponent(url)}`);
      if (!res.ok) return { html: null, missing: true };
      return { html: await res.text(), missing: false };
    },
  });

  return {
    loading: query.isLoading && query.fetchStatus !== 'idle',
    html: query.data?.html ?? null,
    missingFetch: query.data?.missing ?? false,
  };
}
