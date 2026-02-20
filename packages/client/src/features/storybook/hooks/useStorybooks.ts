import { useQuery } from '@tanstack/react-query';
import { storybookApi } from '../api/storybook.api';

export function useStorybooks() {
  return useQuery({
    queryKey: ['storybooks'],
    queryFn: storybookApi.list,
  });
}

export function useStorybook(id: string | undefined) {
  return useQuery({
    queryKey: ['storybook', id],
    queryFn: () => storybookApi.getById(id!),
    enabled: !!id,
  });
}
