import { Link, Navigate, useParams } from 'react-router-dom';
import { findActivity, nextInGroup, activityPageTitle, type ActivityKind } from '@tangobook/shared';
import { useSeo } from '@/lib/useSeo';
import { ActivityLayout } from '@/features/activity/components/ActivityLayout';
import { useActivityItems } from '@/features/activity/hooks/useActivityCatalog';
import { ColoringPanel } from '@/features/activity/components/panels/ColoringPanel';
import { HiddenObjectPanel } from '@/features/activity/components/panels/HiddenObjectPanel';
import { WorksheetPanel } from '@/features/activity/components/panels/WorksheetPanel';

/** 활동 한 장 — 서버 SSR(`seo-activity.service`)의 짝 페이지. 🔴 게이트로 감싸지 않는다. */
export default function ActivityPage({ kind }: { kind: ActivityKind }) {
  const { slug = '' } = useParams<{ slug: string }>();
  const { items, coloringEntries, hiddenEntries, loading, error } = useActivityItems(kind);
  const found = findActivity(kind, items, slug);

  useSeo({
    title: found ? activityPageTitle(found.item) : undefined,
    description: found?.item.blurb,
    // 서버 canonical 과 같게 slug 는 인코딩한다(주소를 두 벌로 말하지 않게).
    path: found
      ? `/activity/${kind}/${encodeURIComponent(found.item.slug)}`
      : `/activity/${kind}/${encodeURIComponent(slug)}`,
    image: found?.item.image,
  });

  if (error)
    return (
      <ActivityLayout kind={kind} items={items}>
        <div className="rounded-2xl bg-white p-8">
          <h1 className="text-2xl font-extrabold">목록을 불러오지 못했어요</h1>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-block font-bold text-coral-700 underline"
          >
            다시 시도
          </button>
        </div>
      </ActivityLayout>
    );
  if (loading)
    return (
      <ActivityLayout kind={kind} items={items}>
        <p className="p-8 text-ink-500">불러오는 중…</p>
      </ActivityLayout>
    );
  if (!found) {
    return (
      <ActivityLayout kind={kind} items={items}>
        <div className="rounded-2xl bg-white p-8">
          <h1 className="text-2xl font-extrabold">찾는 활동이 없어요</h1>
          <Link to="/activity" className="mt-4 inline-block font-bold text-coral-700 underline">
            활동 모음으로
          </Link>
        </div>
      </ActivityLayout>
    );
  }
  if (!found.canonical) return <Navigate to={found.item.path} replace />;

  const { item } = found;
  const next = nextInGroup(items, item.key);
  return (
    <ActivityLayout kind={kind} items={items} currentKey={item.key}>
      {kind === 'coloring' && (
        <ColoringPanel
          key={item.key}
          item={item}
          entry={coloringEntries.get(item.key)!}
          next={next}
        />
      )}
      {kind === 'hidden-object' && (
        <HiddenObjectPanel
          key={item.key}
          item={item}
          entry={hiddenEntries.get(item.key)!}
          next={next}
        />
      )}
      {(kind === 'hangul' || kind === 'english') && (
        <WorksheetPanel
          key={item.key}
          item={item as typeof item & { kind: 'hangul' | 'english' }}
          next={next}
        />
      )}
    </ActivityLayout>
  );
}
