import { useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getActivityPlan, getKoreanUnit, type ActivityDef } from '../lib/korean-phonics-units';
import { markActivityCompleted } from '../lib/progress-store';
import { VowelListenActivity } from '../activities/VowelListenActivity';
import { VowelWriteActivity } from '../activities/VowelWriteActivity';
import { ConsonantTapActivity } from '../activities/ConsonantTapActivity';
import { ConsonantBlendListenActivity } from '../activities/ConsonantBlendListenActivity';
import { ConsonantWriteActivity } from '../activities/ConsonantWriteActivity';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { KoreanBlockPlayer } from '@/features/games/components/players/KoreanBlockPlayer';
import { WordWritingPlayer } from '@/features/games/components/players/WordWritingPlayer';
import { LineMatchingPlayer } from '@/features/games/components/players/LineMatchingPlayer';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import {
  phonicsToKoreanBlockData,
  phonicsToWordWritingData,
  phonicsToLineMatchingData,
  phonicsToConnectTheDotsData,
} from '../lib/phonics-game-adapter';
import type { Storybook } from '@tangobook/shared';

/**
 * /library/phonics/korean/:unitId/:activityKey — 액티비티 호스트.
 *
 * activity.kind 에 따라 알맞은 컴포넌트 마운트.
 * onComplete 발생 시 progress 마킹 + 단원 페이지로 복귀.
 *
 * 게임 4종 — 단원 storybook 의 `phonicsConfig.targetWords` 로 게임 데이터 빌드.
 *   - 한글블록 / 낱말쓰기: 텍스트만으로 작동 (이미지 없어도 OK)
 *   - 매칭 / 점잇기: 이미지/keypoints 필수 → 부족 시 "이미지가 필요해요" 안내
 */
export default function KoreanPhonicsActivityPage() {
  const { unitId = '', activityKey = '' } = useParams<{ unitId: string; activityKey: string }>();
  const navigate = useNavigate();

  const unit = getKoreanUnit(unitId);
  const plan = getActivityPlan(unitId);
  const activity: ActivityDef | undefined = useMemo(
    () => plan.activities.find((a) => a.key === activityKey),
    [plan, activityKey]
  );

  const storybookQuery = useStorybook(unitId);
  const storybook = storybookQuery.data as Storybook | undefined;

  const backToUnit = useCallback(
    () => navigate(`/library/phonics/korean/${unitId}`),
    [navigate, unitId]
  );

  const handleComplete = useCallback(() => {
    markActivityCompleted('korean', unitId, activityKey);
    backToUnit();
  }, [unitId, activityKey, backToUnit]);

  if (!unit || !activity) {
    return (
      <div className="px-6 py-6 max-w-[800px] mx-auto">
        <p className="text-base font-bold text-ink-700">알 수 없는 활동입니다.</p>
        <Link
          to={`/library/phonics/korean/${unitId}`}
          className="inline-block mt-3 text-coral-600 font-black underline"
        >
          ← 단원으로
        </Link>
      </div>
    );
  }

  // 모음 듣기
  if (activity.kind === 'vowel-listen' && activity.vowels) {
    return (
      <VowelListenActivity
        unitId={unitId}
        vowels={activity.vowels}
        onComplete={handleComplete}
        onBack={backToUnit}
      />
    );
  }
  // 모음 쓰기
  if (activity.kind === 'vowel-write' && activity.vowels) {
    return (
      <VowelWriteActivity
        unitId={unitId}
        vowels={activity.vowels}
        onComplete={handleComplete}
        onBack={backToUnit}
      />
    );
  }
  // 자음 누르기 (unit 2 활동 1)
  if (activity.kind === 'consonant-tap' && activity.consonant) {
    return (
      <ConsonantTapActivity
        unitId={unitId}
        consonant={activity.consonant}
        onComplete={handleComplete}
        onBack={backToUnit}
      />
    );
  }
  // 자음+모음 음절 (unit 2 활동 2/3)
  if (activity.kind === 'consonant-blend-listen' && activity.consonant && activity.blendVowels) {
    return (
      <ConsonantBlendListenActivity
        unitId={unitId}
        consonant={activity.consonant}
        blendVowels={activity.blendVowels}
        onComplete={handleComplete}
        onBack={backToUnit}
      />
    );
  }
  // 자음 쓰기 (unit 2 활동 4)
  if (activity.kind === 'consonant-write' && activity.consonant) {
    return (
      <ConsonantWriteActivity
        unitId={unitId}
        consonant={activity.consonant}
        onComplete={handleComplete}
        onBack={backToUnit}
      />
    );
  }

  // ── 게임 액티비티 ──
  if (!storybook) {
    return <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />;
  }

  const noopComplete = () => handleComplete();
  // 파닉스 unit level 별 Block 게임 picker 난이도:
  // - 한글1 (기본 음절 가/갸 등) → easy: 기본 자음 14 + 기본 모음 10. 쌍자음/이중모음 X.
  // - 한글2 (받침 산/강 등) → easy: 받침도 기본 자음 (ㄱㄴㄷㄹㅁㅂㅇ) 안에 있어 충분.
  // - 한글3 (쌍자음 까/뱀 등) → medium: 쌍자음 picker 필요.
  // (다른 게임은 difficulty 사용 안 함 → 영향 없음)
  const blockDifficulty: 'easy' | 'medium' | 'hard' = unit.levelIndex >= 3 ? 'medium' : 'easy';
  const commonProps = {
    storybookId: unitId,
    difficulty: blockDifficulty,
    onComplete: noopComplete,
    onBack: backToUnit,
  };

  if (activity.kind === 'game-korean-block') {
    const gameData = phonicsToKoreanBlockData(storybook);
    if (!gameData)
      return (
        <ActivityUnavailable activity={activity} onBack={backToUnit} reason="단어가 부족해요" />
      );
    return <KoreanBlockPlayer {...commonProps} gameData={gameData} />;
  }
  if (activity.kind === 'game-word-writing') {
    const gameData = phonicsToWordWritingData(storybook);
    if (!gameData)
      return (
        <ActivityUnavailable activity={activity} onBack={backToUnit} reason="단어가 부족해요" />
      );
    return <WordWritingPlayer {...commonProps} gameData={gameData} />;
  }
  if (activity.kind === 'game-line-matching') {
    const gameData = phonicsToLineMatchingData(storybook);
    if (!gameData)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="단어 그림이 필요해요"
        />
      );
    return <LineMatchingPlayer {...commonProps} gameData={gameData} lang="ko" />;
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
