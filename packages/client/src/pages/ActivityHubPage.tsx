import { Link } from 'react-router-dom';
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABEL,
  activityKindPath,
  worksheetItems,
} from '@tangobook/shared';
import { useSeo } from '@/lib/useSeo';
import { PublicNav } from '@/components/PublicNav';
import { trackActivity } from '@/features/activity/lib/track';
import { useActivitySummary } from '@/features/activity/hooks/useActivityCatalog';

const BLURB = {
  hangul: '자음·모음부터 받침까지 32단원',
  english: '알파벳 소리부터 매직 e 까지 39단원',
  coloring: '동화책·파닉스 낱말 그림을 색칠해요',
  'hidden-object': '동화 속 장면에서 숨은 것을 찾아요',
} as const;

/** 🔴 허브는 900KB 목록을 받지 않는다 — 워크지는 커리큘럼, 색칠·숨은그림은 `summary.json`(개수 · 첫 키). */
function KindCard({ kind }: { kind: (typeof ACTIVITY_KINDS)[number] }) {
  const { data } = useActivitySummary();
  const ws = kind === 'hangul' || kind === 'english' ? worksheetItems(kind) : null;
  const count = ws ? ws.length : data?.[kind]?.count;
  return (
    <Link
      to={activityKindPath(kind)}
      className="block rounded-3xl bg-white p-6 shadow-sm hover:shadow-md"
    >
      <h2 className="font-display text-2xl font-extrabold text-ink-900">
        {ACTIVITY_KIND_LABEL[kind]}
      </h2>
      <p className="mt-2 text-ink-700 break-keep">{BLURB[kind]}</p>
      <p className="mt-3 text-sm font-bold text-coral-700">
        {count ? `${count}개 · 인쇄 · 온라인` : '불러오는 중…'}
      </p>
    </Link>
  );
}

export default function ActivityHubPage() {
  useSeo({
    title: '무료 색칠도안 · 숨은그림찾기 · 한글/영어 학습지 | 탱고북',
    description:
      '인쇄해서 하고, 온라인에서도 바로 하는 무료 활동 모음 — 색칠도안 · 숨은그림찾기 · 한글 학습지 · 영어 파닉스 학습지.',
    path: '/activity',
  });
  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-center font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            활동 모음
          </h1>
          <p className="mt-3 text-center text-ink-700 break-keep">
            인쇄해서 하고, 온라인에서도 바로 해요. 가입 없이 무료.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {ACTIVITY_KINDS.map((k) => (
              <KindCard key={k} kind={k} />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link
              to="/library"
              onClick={() => trackActivity('activity_cta', { kind: 'hub', key: 'library' })}
              className="inline-flex min-h-[48px] items-center rounded-full bg-coral-600 px-6 font-extrabold text-white"
            >
              📖 동화책 보러 가기
            </Link>
            <Link
              to="/"
              onClick={() => trackActivity('activity_cta', { kind: 'hub', key: 'home' })}
              className="inline-flex min-h-[48px] items-center rounded-full border-2 border-coral-300 bg-white px-6 font-bold text-coral-700"
            >
              탱고북 둘러보기
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
