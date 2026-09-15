import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ActivityItem } from '@tangobook/shared';
import { ActivityCta } from '../ActivityCta';
import { PanelHeader } from './PanelHeader';
import { OnlineWorksheet } from './OnlineWorksheet';
import { trackActivity } from '../../lib/track';
import { worksheetParts } from '../../lib/online-worksheet';

const PRINT_FILE = {
  hangul: '/worksheet/ko_phonics.html',
  english: '/worksheet/en_phonics.html',
} as const;

/**
 * 한글·영어 학습지 — 🔴 기본 화면 = **온라인 워크지**(2026-09-14 사용자). 인쇄 워크지와 같은 칸을
 * 페이지 안에서 한 칸씩 크게 써 본다. 앱으로 보내는 대신 여기서 해 보게 한다(설치 전 맛보기).
 */
export function WorksheetPanel({
  item,
  next,
}: {
  item: ActivityItem & { kind: 'hangul' | 'english' };
  next: ActivityItem | null;
}) {
  // 조각마다 따로 끝난다 — 다음 조각으로 가면 완료 상자가 사라져야 한다.
  const [finishedPart, setFinishedPart] = useState<string | null>(null);
  const track = item.kind === 'hangul' ? 'korean' : 'english';
  // 영어는 단원을 글자·소리 덩이 조각으로 나눠 한 조각씩(`?part=`). 다 쓰면 다음 조각, 마지막 조각이면 다음 단원.
  const [params] = useSearchParams();
  const parts = worksheetParts(track, item.key);
  const pi = Math.max(
    0,
    parts.findIndex((p) => p.id === params.get('part'))
  );
  const part = parts[pi];
  const finished = finishedPart === (part?.id ?? '');
  const nextStep =
    part && parts[pi + 1]
      ? {
          ...item,
          title: `${item.title} · ${parts[pi + 1].label}`,
          path: `${item.path}?part=${parts[pi + 1].id}`,
        }
      : next;

  return (
    <div>
      <PanelHeader
        title={`${part ? `${part.label} · ` : ''}${item.title} ${item.kind === 'hangul' ? '한글 학습지' : '영어 파닉스 학습지'}`}
        // 🔴 워크지는 여러 쪽 HTML 이라 페이지 인쇄가 아니라 인쇄물을 그 단원으로 새 탭에서 연다(해시로 단원 선택).
        onPrint={() => {
          trackActivity('activity_print', { kind: item.kind, key: item.key });
          window.open(`${PRINT_FILE[item.kind]}#${item.key}`, '_blank', 'noopener');
        }}
      />
      {finished && (
        <div className="mb-3 rounded-xl bg-peach-100 p-3">
          <p className="mb-2 font-bold">다 썼어요! 🎉</p>
          <ActivityCta item={item} next={nextStep} />
        </div>
      )}
      <p className="mb-2 text-sm text-ink-500">{item.group}</p>
      <OnlineWorksheet
        key={`${item.key}-${part?.id ?? ''}`}
        track={track}
        unitId={item.key}
        part={part?.id}
        onDone={() => {
          trackActivity('activity_play', { kind: item.kind, key: item.key });
          setFinishedPart(part?.id ?? '');
        }}
      />
      {/* 다 끝내면 위 완료 상자가 같은 버튼을 들고 있다 — 두 번 보이지 않게 아래는 숨긴다. */}
      {!finished && (
        <div className="mt-4">
          <ActivityCta item={item} next={nextStep} />
        </div>
      )}
    </div>
  );
}
