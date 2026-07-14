import { useQuery } from '@tanstack/react-query';
import { mktKeys } from './queries';

export interface FeedbackItem {
  id: string;
  message: string;
  contact: string | null;
  createdAt: string;
}

/**
 * 사용자 건의 전체 목록(최신순)을 조회한다.
 * 서버 `GET /api/mkt/feedback` (service-role 로 RLS 우회, envelope `{ success, data: { items } }`).
 */
export function useFeedback() {
  return useQuery({
    queryKey: mktKeys.feedback(),
    queryFn: () =>
      fetch('/api/mkt/feedback')
        .then((r) => r.json())
        .then((j) => (j.data?.items ?? []) as FeedbackItem[]),
  });
}
