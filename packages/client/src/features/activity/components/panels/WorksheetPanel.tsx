import { lazy, Suspense, useState } from 'react';
import { flattenPhonicsUnits, type ActivityItem } from '@tangobook/shared';
import { ActivityCta } from '../ActivityCta';
import { PanelHeader } from './ColoringPanel';
import { trackActivity } from '../../lib/track';

const PhonicsTryIt = lazy(() =>
  import('@/features/phonics-learner/components/PhonicsTryIt').then((m) => ({
    default: m.PhonicsTryIt,
  }))
);

const PRINT_FILE = {
  hangul: '/worksheet/ko_phonics.html',
  english: '/worksheet/en_phonics.html',
} as const;

export function WorksheetPanel({
  item,
  next,
}: {
  item: ActivityItem & { kind: 'hangul' | 'english' };
  next: ActivityItem | null;
}) {
  const [playing, setPlaying] = useState(false);
  const track = item.kind === 'hangul' ? 'korean' : 'english';
  const u = flattenPhonicsUnits(track).find((x) => x.id === item.key);
  const combos = u ? (u.syllables.length ? u.syllables : u.patterns) : [];

  return (
    <div>
      <PanelHeader
        title={`${item.title} ${item.kind === 'hangul' ? '한글 학습지' : '영어 파닉스 학습지'}`}
        onPlay={() => {
          trackActivity('activity_play', { kind: item.kind, key: item.key });
          setPlaying(true);
        }}
        // 🔴 워크지는 여러 쪽 HTML 이라 페이지 인쇄가 아니라 인쇄물을 그 단원으로 새 탭에서 연다(해시로 단원 선택).
        onPrint={() => {
          trackActivity('activity_print', { kind: item.kind, key: item.key });
          window.open(`${PRINT_FILE[item.kind]}#${item.key}`, '_blank', 'noopener');
        }}
      />
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-ink-500">{item.group}</p>
        {u?.phonemes.length ? (
          <p className="mt-2">
            <b>배우는 소리</b> · {u.phonemes.join(' · ')}
          </p>
        ) : null}
        {combos.length ? (
          <p className="mt-1">
            <b>만드는 글자</b> · {combos.slice(0, 20).join(' ')}
          </p>
        ) : null}
        {u?.sampleWords.length ? (
          <p className="mt-1">
            <b>읽는 낱말</b> · {u.sampleWords.join(' · ')}
          </p>
        ) : null}
      </div>
      {playing && (
        <div className="mt-4 print:hidden">
          <Suspense fallback={null}>
            <PhonicsTryIt unitId={item.key} language={track} />
          </Suspense>
        </div>
      )}
      <div className="mt-4">
        <ActivityCta item={item} next={next} />
      </div>
    </div>
  );
}
