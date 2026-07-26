import { useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getActivityPlan, getKoreanUnit, type ActivityDef } from '../lib/korean-phonics-units';
import { markActivityCompleted } from '../lib/progress-store';
import { VowelListenActivity } from '../activities/VowelListenActivity';
import { VowelWriteActivity } from '../activities/VowelWriteActivity';
import { ConsonantTapActivity } from '../activities/ConsonantTapActivity';
import { ConsonantBlendListenActivity } from '../activities/ConsonantBlendListenActivity';
import { ConsonantWriteActivity } from '../activities/ConsonantWriteActivity';
import { ReviewWriteActivity } from '../activities/ReviewWriteActivity';
import { ReviewMazeActivity } from '../activities/ReviewMazeActivity';
import { ReviewFlipMatchActivity } from '../activities/ReviewFlipMatchActivity';
import { WordListenChooseActivity } from '../activities/WordListenChooseActivity';
import { useReviewCardSources } from '../hooks/useReviewCardSources';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { KoreanBlockPlayer } from '@/features/games/components/players/KoreanBlockPlayer';
import { KoreanWordWritingPlayer } from '@/features/games/components/players/KoreanWordWritingPlayer';
import { LineMatchingPlayer } from '@/features/games/components/players/LineMatchingPlayer';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import {
  phonicsToKoreanBlockData,
  phonicsToWordWritingData,
  phonicsToLineMatchingData,
  phonicsToConnectTheDotsData,
  phonicsToWordChoices,
} from '../lib/phonics-game-adapter';
import type { Storybook } from '@tangobook/shared';

/** 복습 듣기 활동의 보기 수 — 보기가 글자·낱말(그림 X)이라 학습 단원(3장)보다 하나 더 둔다. */
const REVIEW_CHOICES = 4;

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

  const storybookQuery = useStorybook(unit?.isReview ? undefined : unitId);
  const storybook = storybookQuery.data as Storybook | undefined;

  // 복습 활동은 되짚는 단원들의 그림·단어가 필요하다 (early return 앞에서 호출 — 훅 순서 고정).
  const reviewCards = useMemo(() => activity?.reviewCards ?? [], [activity]);
  const { sources: reviewSources, isLoading: reviewLoading } = useReviewCardSources(reviewCards);

  const backToUnit = useCallback(
    () => navigate(`/library/phonics/korean/${unitId}`),
    [navigate, unitId]
  );

  const handleComplete = useCallback(() => {
    markActivityCompleted('korean', unitId, activityKey);
    backToUnit();
  }, [unitId, activityKey, backToUnit]);

  // 자동 back 없이 진척만 마킹 (activity 가 직접 retry/back UI 노출용)
  const handleMarkComplete = useCallback(() => {
    markActivityCompleted('korean', unitId, activityKey);
  }, [unitId, activityKey]);

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
        onMarkComplete={handleMarkComplete}
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
  // 자음 누르기 (unit 2 활동 1) — 받침 단원은 soundText 로 예시 음절을 읽는다
  if (activity.kind === 'consonant-tap' && activity.consonant) {
    return (
      <ConsonantTapActivity
        unitId={unitId}
        consonant={activity.consonant}
        soundText={activity.soundText}
        // 카드마다 타겟 단어 그림 하나 — storybook 이 아직 안 왔으면 글자만 있는 화면으로 뜬다.
        words={storybook ? phonicsToWordChoices(storybook) : []}
        onComplete={handleComplete}
        onBack={backToUnit}
      />
    );
  }
  // 받침 붙이기 (한글2) — [가] + [ㅇ] → [강]
  if (activity.kind === 'coda-blend-listen' && activity.coda && activity.codaOnsets) {
    return (
      <ConsonantBlendListenActivity
        unitId={unitId}
        coda={activity.coda}
        codaOnsets={activity.codaOnsets}
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
        soundText={activity.soundText}
        blendVowels={activity.blendVowels}
        coda={activity.coda}
        codaOnsets={activity.codaOnsets}
        onComplete={handleComplete}
        onBack={backToUnit}
      />
    );
  }

  // 🔊 듣고 고르기 — 단원 storybook 의 단어·그림이 필요하다
  if (activity.kind === 'word-listen-choose') {
    if (!storybook) {
      return <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />;
    }
    const choices = phonicsToWordChoices(storybook);
    if (choices.length < 3)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="단어 그림이 필요해요"
        />
      );
    return (
      <WordListenChooseActivity
        unitId={unitId}
        items={choices.map((c) => ({
          label: c.word,
          sound: c.word,
          imageUrl: c.imageUrl,
          ...(c.ttsUrl ? { ttsUrl: c.ttsUrl } : {}),
        }))}
        letter={activity.consonant}
        // 학습 단원은 카드를 눌러 들어본 뒤 「퀴즈」 로 넘어간다(복습은 바로 퀴즈).
        exploreFirst
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  // ── 복습 액티비티 ──

  // 🎧 듣고 음절 맞추기 — 카드에 이미 음절·발음이 들어 있어 storybook 을 안 기다린다.
  //    🔴 받침 카드는 글자 'ㅇ' 이 아니라 음절 '앙' 을 보기로 쓴다(글자만 두면 넷 다 같아 보인다).
  if (activity.kind === 'review-syllable-listen' && reviewCards.length) {
    return (
      <WordListenChooseActivity
        unitId={unitId}
        items={reviewCards.map((c) => ({ label: c.syllable, sound: c.sound }))}
        choices={REVIEW_CHOICES}
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  // 🔊 듣고 단어 맞추기 — 되짚는 단원의 대표 단어. 보기 = **그림 + 낱말**.
  //    (낱말만 두면 아직 못 읽는 아이에게는 네 칸이 다 똑같아 보인다.)
  if (activity.kind === 'review-word-listen' && reviewCards.length) {
    if (reviewLoading) {
      return <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />;
    }
    const words = reviewSources.filter((s) => s.word);
    if (words.length < 3) {
      return (
        <ActivityUnavailable activity={activity} onBack={backToUnit} reason="단어가 필요해요" />
      );
    }
    return (
      <WordListenChooseActivity
        unitId={unitId}
        items={words.map((s) => ({
          label: s.word,
          sound: s.word,
          ...(s.imageUrl ? { imageUrl: s.imageUrl } : {}),
        }))}
        choices={REVIEW_CHOICES}
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  if (activity.kind === 'review-listen' && reviewCards.length) {
    return (
      <VowelListenActivity
        unitId={unitId}
        vowels={reviewCards.map((c) => ({
          vowel: c.letter,
          syllable: c.syllable,
          sound: c.sound,
        }))}
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }
  if (
    activity.kind === 'review-match' ||
    activity.kind === 'review-write' ||
    activity.kind === 'review-maze' ||
    activity.kind === 'review-flip'
  ) {
    if (reviewLoading) {
      return <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />;
    }
    const withImage = reviewSources.filter((s) => s.imageUrl);
    if (activity.kind === 'review-flip') {
      if (withImage.length < 3)
        return (
          <ActivityUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="단어 그림이 필요해요"
          />
        );
      return (
        <ReviewFlipMatchActivity
          unitId={unitId}
          sources={withImage}
          onComplete={handleComplete}
          onBack={backToUnit}
        />
      );
    }
    if (activity.kind === 'review-maze') {
      if (!withImage.length)
        return (
          <ActivityUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="단어 그림이 필요해요"
          />
        );
      return (
        <ReviewMazeActivity
          unitId={unitId}
          sources={withImage}
          onComplete={handleComplete}
          onBack={backToUnit}
        />
      );
    }
    if (activity.kind === 'review-write') {
      if (!withImage.length)
        return (
          <ActivityUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="단어 그림이 필요해요"
          />
        );
      return (
        <ReviewWriteActivity
          unitId={unitId}
          sources={withImage}
          onComplete={handleComplete}
          onBack={backToUnit}
        />
      );
    }
    // 짝 찾기 — 카드의 글자와 그 글자로 배운 단어 그림을 잇는다. 최소 3쌍이 있어야 게임이 성립.
    if (withImage.length < 3)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="단어 그림이 필요해요"
        />
      );
    return (
      <LineMatchingPlayer
        storybookId={unitId}
        difficulty="easy"
        onComplete={handleComplete}
        onBack={backToUnit}
        lang="ko"
        gameData={{
          type: 'korean-line-matching',
          // imageLabel = 그림 아래 낱말. 복습은 우측이 글자(ㄱ·ㄹ)뿐이라 그림이 애매하면 짝을 못 짓는다.
          items: withImage.map((s) => ({
            word: s.letter,
            imageUrl: s.imageUrl,
            imageLabel: s.word,
          })),
        }}
      />
    );
  }

  // ── 게임 액티비티 ──
  if (!storybook) {
    return <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />;
  }

  const noopComplete = () => handleComplete();
  // 파닉스 unit level 별 Block 게임 picker 난이도:
  // - 한글1 (기본 음절 가/갸 등) → easy: 기본 자음 14 + 기본 모음 10. 쌍자음/복잡모음 X.
  // - 한글2 (받침 산/강 등) → easy: 받침도 기본 자음 (ㄱㄴㄷㄹㅁㅂㅇ) 안에 있어 충분.
  // - 한글3 (쌍자음 까/뱀 등) → medium: 쌍자음 picker 필요 (ㄲㄸㅃㅆㅉ).
  // - 한글4 (복잡 모음 ㅐㅔㅒㅖㅘㅝ 등) → medium: 복잡 모음 picker 필요.
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
    return <KoreanWordWritingPlayer {...commonProps} gameData={gameData} />;
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
