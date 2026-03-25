import { useMutation, useQueryClient } from '@tanstack/react-query';
import { audiobookApi } from '../api/audiobook.api';

export function useAudiobookRender() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: { storybookId: string; projectId: string }) => audiobookApi.render(req),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['storybook', variables.storybookId] });
    },
  });
}
