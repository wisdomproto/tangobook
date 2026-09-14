import { useState } from 'react';
import type { ActivityItem } from '@tangobook/shared';
import { ActivityCta } from '../ActivityCta';
import { PanelHeader } from './PanelHeader';
import { OnlineWorksheet } from './OnlineWorksheet';
import { trackActivity } from '../../lib/track';

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
  const [finished, setFinished] = useState(false);
  const track = item.kind === 'hangul' ? 'korean' : 'english';

  return (
    <div>
      <PanelHeader
        title={`${item.title} ${item.kind === 'hangul' ? '한글 학습지' : '영어 파닉스 학습지'}`}
        // 🔴 워크지는 여러 쪽 HTML 이라 페이지 인쇄가 아니라 인쇄물을 그 단원으로 새 탭에서 연다(해시로 단원 선택).
        onPrint={() => {
          trackActivity('activity_print', { kind: item.kind, key: item.key });
          window.open(`${PRINT_FILE[item.kind]}#${item.key}`, '_blank', 'noopener');
        }}
      />
      {finished && (
        <div className="mb-3 rounded-xl bg-peach-100 p-3">
          <p className="mb-2 font-bold">다 썼어요! 🎉</p>
          <ActivityCta item={item} next={next} />
        </div>
      )}
      <p className="mb-2 text-sm text-ink-500">{item.group}</p>
      <OnlineWorksheet
        key={item.key}
        track={track}
        unitId={item.key}
        onDone={() => {
          trackActivity('activity_play', { kind: item.kind, key: item.key });
          setFinished(true);
        }}
      />
      {/* 다 끝내면 위 완료 상자가 같은 버튼을 들고 있다 — 두 번 보이지 않게 아래는 숨긴다. */}
      {!finished && (
        <div className="mt-4">
          <ActivityCta item={item} next={next} />
        </div>
      )}
    </div>
  );
}
