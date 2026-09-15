import { Link } from 'react-router-dom';
import {
  activityKindLanding,
  activityKindPath,
  activityLandingSections,
  type ActivityKind,
} from '@tangobook/shared';
import { useSeo } from '@/lib/useSeo';
import { ActivityLayout } from '@/features/activity/components/ActivityLayout';
import { useActivityItems } from '@/features/activity/hooks/useActivityCatalog';

/**
 * 종류 대표 페이지 `/activity/{kind}` — 서버 SSR(`renderActivityKindSeo`)의 짝.
 * 🔴 **고르기가 먼저, 설명·자주 묻는 질문은 맨 아래 접어서**(2026-09-15 사용자). 글은 숨기지 않는다 —
 *    접힌 글은 검색엔진이 읽지만 완전히 숨긴 글은 벌점이다. 문구는 shared 한 벌이라 SSR 과 같다.
 */
export default function ActivityKindPage({ kind }: { kind: ActivityKind }) {
  const { items, loading } = useActivityItems(kind);
  const copy = activityKindLanding(kind, items.length);
  useSeo({ title: copy.title, description: copy.lead, path: activityKindPath(kind) });
  const sections = activityLandingSections(items);

  return (
    <ActivityLayout kind={kind} items={items}>
      <h1 className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">{copy.h1}</h1>
      <p className="mt-2 text-ink-600 break-keep">{loading ? '불러오는 중…' : copy.lead}</p>

      <div className="mt-6 flex flex-col gap-6">
        {sections.map((sec) => (
          <section key={sec.group}>
            <h2 className="mb-2 text-base font-bold text-ink-700">{sec.group}</h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {sec.links.map((l) => (
                <li key={l.path}>
                  <Link
                    to={l.path}
                    className="flex min-h-[52px] items-center justify-between gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-ink-800 shadow-sm hover:bg-peach-100 break-keep"
                  >
                    <span className="min-w-0">{l.title}</span>
                    {l.count > 1 && (
                      <span className="shrink-0 text-xs font-medium text-ink-500">{l.count}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <details className="mt-10 rounded-2xl bg-white p-4 text-sm text-ink-700">
        <summary className="min-h-[44px] cursor-pointer py-2 font-bold text-ink-700">
          {copy.h1} 안내 · 자주 묻는 질문
        </summary>
        <div className="mt-2 flex flex-col gap-3 break-keep">
          {copy.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <dl className="flex flex-col gap-3">
            {copy.faq.map(([q, a]) => (
              <div key={q}>
                <dt className="font-bold text-ink-800">{q}</dt>
                <dd className="mt-0.5">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>
    </ActivityLayout>
  );
}
