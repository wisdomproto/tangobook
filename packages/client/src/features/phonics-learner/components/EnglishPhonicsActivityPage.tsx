import { useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getEnglishActivityPlan, getEnglishUnit } from '../lib/english-phonics-units';
import type { ActivityDef } from '../lib/korean-phonics-units';
import { markActivityCompleted } from '../lib/progress-store';
import { CvcPatternLearnActivity } from '../activities/CvcPatternLearnActivity';
import { CvcPatternWriteActivity } from '../activities/CvcPatternWriteActivity';
import { AlphabetLetterLearnActivity } from '../activities/AlphabetLetterLearnActivity';
import { AlphabetLetterWriteActivity } from '../activities/AlphabetLetterWriteActivity';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { EnglishBlockPlayer } from '@/features/games/components/players/EnglishBlockPlayer';
import { WordWritingPlayer } from '@/features/games/components/players/WordWritingPlayer';
import { LineMatchingPlayer } from '@/features/games/components/players/LineMatchingPlayer';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import {
  phonicsToEnglishBlockData,
  phonicsToEnglishWordWritingData,
  phonicsToEnglishLineMatchingData,
  phonicsToConnectTheDotsData,
} from '../lib/phonics-game-adapter';
import type { Storybook } from '@tangobook/shared';

/**
 * /library/phonics/english/:unitId/:activityKey — 영어 활동 호스트.
 *
 * activity.kind 에 따라 분기:
 *   - `cvc-pattern-learn` → CvcPatternLearnActivity (a + n → an Phase A + 4 CVC 단어 Phase B)
 *   - `cvc-pattern-write` → CvcPatternWriteActivity (4 단어 VC 부분만 따라쓰기)
 *   - `game-english-block` → EnglishBlockPlayer
 *   - `game-word-writing` → WordWritingPlayer (영어 단어 첫 글자)
 *   - `game-connect-dots` → ConnectTheDotsPlayer (이미지+keypoints)
 *   - `game-line-matching` → LineMatchingPlayer (이미지-영단어 매칭)
 *
 * 게임 데이터: storybook 의 `phonicsConfig.targetWords` (8개) 중 어댑터가 랜덤 4개.
 */
export default function EnglishPhonicsActivityPage() {
  const { unitId = '', activityKey = '' } = useParams<{ unitId: string; activityKey: string }>();
  const navigate = useNavigate();
  const unit = getEnglishUnit(unitId);
  const plan = getEnglishActivityPlan(unitId);
  const activity: ActivityDef | undefined = useMemo(
    () => plan.activities.find((a) => a.key === activityKey),
    [plan, activityKey]
  );

  const storybookQuery = useStorybook(unitId);
  const storybook = storybookQuery.data as Storybook | undefined;

  const backToUnit = useCallback(
    () => navigate(`/library/phonics/english/${unitId}`),
    [navigate, unitId]
  );
  const handleComplete = useCallback(() => {
    markActivityCompleted('english', unitId, activityKey);
    backToUnit();
  }, [unitId, activityKey, backToUnit]);
  const handleMarkComplete = useCallback(() => {
    markActivityCompleted('english', unitId, activityKey);
  }, [unitId, activityKey]);

  if (!unit || !activity) {
    return (
      <div className="px-6 py-6 max-w-[800px] mx-auto">
        <p className="text-base font-bold text-ink-700">알 수 없는 활동입니다.</p>
        <Link
          to={`/library/phonics/english/${unitId}`}
          className="inline-block mt-3 text-coral-600 font-black underline"
        >
          ← 단원으로
        </Link>
      </div>
    );
  }

  // ── 학습 활동 ──
  if (
    activity.kind === 'alphabet-letter-learn' &&
    activity.letters &&
    activity.letters.length > 0
  ) {
    return (
      <AlphabetLetterLearnActivity
        unitId={unitId}
        letters={activity.letters}
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }
  if (
    activity.kind === 'alphabet-letter-write' &&
    activity.letters &&
    activity.letters.length > 0
  ) {
    return (
      <AlphabetLetterWriteActivity
        unitId={unitId}
        letters={activity.letters}
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }
  if (activity.kind === 'cvc-pattern-learn' && activity.cvcPattern) {
    return (
      <CvcPatternLearnActivity
        unitId={unitId}
        pattern={activity.cvcPattern}
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }
  if (activity.kind === 'cvc-pattern-write' && activity.cvcPattern) {
    return (
      <CvcPatternWriteActivity
        unitId={unitId}
        pattern={activity.cvcPattern}
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  // ── 게임 활동 ──
  if (!storybook) {
    return <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />;
  }

  const commonProps = {
    storybookId: unitId,
    difficulty: 'easy' as const,
    onComplete: handleComplete,
    onBack: backToUnit,
  };

  if (activity.kind === 'game-english-block') {
    const gameData = phonicsToEnglishBlockData(storybook);
    if (!gameData)
      return (
        <ActivityUnavailable activity={activity} onBack={backToUnit} reason="단어가 부족해요" />
      );
    return <EnglishBlockPlayer {...commonProps} gameData={gameData} />;
  }
  if (activity.kind === 'game-word-writing') {
    const gameData = phonicsToEnglishWordWritingData(storybook);
    if (!gameData)
      return (
        <ActivityUnavailable activity={activity} onBack={backToUnit} reason="단어가 부족해요" />
      );
    return <WordWritingPlayer {...commonProps} gameData={gameData} />;
  }
  if (activity.kind === 'game-line-matching') {
    const gameData = phonicsToEnglishLineMatchingData(storybook);
    if (!gameData)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="단어 그림이 필요해요"
        />
      );
    return <LineMatchingPlayer {...commonProps} gameData={gameData} lang="en" />;
  }
  if (activity.kind === 'game-connect-dots') {
    const gameData = phonicsToConnectTheDotsData(storybook);
    if (!gameData)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="단어 그림과 점이 필요해요"
        />
      );
    return <ConnectTheDotsPlayer {...commonProps} gameData={gameData} />;
  }

  return <ActivityUnavailable activity={activity} onBack={backToUnit} reason="아직 준비 중" />;
}

function ActivityLoading({
  title,
  emoji,
  onBack,
}: {
  title: string;
  emoji: string;
  onBack: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden">
      <button
        onClick={onBack}
        className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
      >
        ← 돌아가기
      </button>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-3">
        <div className="text-6xl">{emoji}</div>
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900">{title}</h2>
        <p className="text-base font-bold text-ink-500">불러오는 중…</p>
      </div>
    </div>
  );
}

function ActivityUnavailable({
  activity,
  onBack,
  reason,
}: {
  activity: ActivityDef;
  onBack: () => void;
  reason: string;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden">
      <button
        onClick={onBack}
        className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
      >
        ← 돌아가기
      </button>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-3">
        <div className="text-6xl">{activity.emoji}</div>
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900">{activity.title}</h2>
        <p className="text-base font-bold text-ink-600">{reason}</p>
      </div>
    </div>
  );
}
