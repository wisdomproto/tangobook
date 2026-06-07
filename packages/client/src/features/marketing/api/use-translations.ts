import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mktKeys } from './queries';
import {
  translateAndSaveChannel,
  getChannelTranslationUrl,
  type ChannelKind,
  type ChannelTranslationInput,
} from '../lib/channel-translator';

/** Read the saved R2 URL for a (content, channel, language). Null for ko / no translation. */
export function useChannelTranslationUrl(
  contentId: string | null,
  channel: ChannelKind,
  language: string
) {
  return useQuery({
    queryKey: mktKeys.translation(contentId ?? '', channel, language),
    queryFn: () => getChannelTranslationUrl(contentId as string, language, channel),
    enabled: !!contentId && language !== 'ko',
  });
}

/** Translate the active channel + persist (R2 + mkt_translations); invalidate the view's keys. */
export function useTranslateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChannelTranslationInput) => translateAndSaveChannel(input),
    onSuccess: (_url, input) => {
      queryClient.invalidateQueries({
        queryKey: mktKeys.translation(input.contentId, input.channel, input.targetLang),
      });
      queryClient.invalidateQueries({
        queryKey: mktKeys.translationHtml(input.contentId, input.channel, input.targetLang),
      });
    },
  });
}
