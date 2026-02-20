import { useMutation, useQueryClient } from '@tanstack/react-query';
import { audiobookApi } from '../api/audiobook.api';
import type { AudiobookGenerateRequest } from '@tangobook/shared';

export function useAudiobookGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: AudiobookGenerateRequest) => audiobookApi.generate(req),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['storybook', variables.storybookId] });
    },
  });
}
