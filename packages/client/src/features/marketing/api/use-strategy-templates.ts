import { useQuery } from '@tanstack/react-query';
import { mktKeys } from './queries';
import type { StrategyTemplateMeta } from '../types/monitoring';

/**
 * 마케팅 전략 HTML 템플릿 목록을 조회한다.
 * 서버 `GET /api/mkt/strategy/templates` (envelope `{ success, data: { templates } }`)를
 * 스캔한 `public/marketing-strategy-templates/*.html` 메타데이터를 반환.
 */
export function useStrategyTemplates() {
  return useQuery({
    queryKey: mktKeys.strategyTemplates(),
    queryFn: () =>
      fetch('/api/mkt/strategy/templates')
        .then((r) => r.json())
        .then((j) => (j.data?.templates ?? []) as StrategyTemplateMeta[]),
  });
}
