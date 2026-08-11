import { useCallback, useMemo, type ReactNode, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameTypeId } from '@tangobook/shared';
import { PhonicsGameGate } from './PhonicsGameGate';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getActivityPlan,
  getKoreanUnit,
  randomReviewSyllable,
  shuffleReviewCards,
  type ActivityDef,
} from '../lib/korean-phonics-units';
import { markActivityCompleted } from '../lib/progress-store';
import { activityTitle } from '../lib/activity-title';
import { VowelListenActivity } from '../activities/VowelListenActivity';
import { VowelWriteActivity } from '../activities/VowelWriteActivity';
import { ConsonantTapActivity } from '../activities/ConsonantTapActivity';
import { ConsonantBlendListenActivity } from '../activities/ConsonantBlendListenActivity';
import { VowelSyllablePickerActivity } from '../activities/VowelSyllablePickerActivity';
import { ConsonantWriteActivity } from '../activities/ConsonantWriteActivity';
import { ReviewWriteActivity } from '../activities/ReviewWriteActivity';
import { LetterHuntActivity } from '../activities/LetterHuntActivity';
import { ReviewFlipMatchActivity } from '../activities/ReviewFlipMatchActivity';
import { WordListenChooseActivity } from '../activities/WordListenChooseActivity';
import { useReviewCardSources } from '../hooks/useReviewCardSources';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useLogEvent } from '@/features/learning/hooks/useLogEvent';
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
 * 복습 짝 찾기의 **쌍 수**.
 *
 * 🔴 복습 묶음은 4장이 아닐 수 있다 — `chunkForReview` 가 꼬리 ≤2 를 앞 묶음에 합쳐서
 *    한글1 자음 14개가 **4·4·6** 으로 갈린다. 다른 복습 활동은 전부 앞에서 4장만 쓰는데
 *    짝 찾기만 안 잘라서 「ㅈ~ㅎ 복습」이 **6쌍(12칸)** 으로 떴다(사용자 지적). 4~7세 한 화면에
 *    12칸은 스크롤 없이 안 들어오고, 같은 복습인데 활동마다 분량이 달라 보인다.
 * 🔴 카드는 진입할 때 이미 섞여 있으므로(`shuffleReviewCards`) **어느 넷이 뽑히는지는 판마다 다르다**.
 */
const REVIEW_PAIRS = 4;

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
/**
 * 🔴 라우트 결합은 **여기 둘뿐**이다 — `useParams` 로 받는 id 와 「나가기」가 가는 곳.
 *    그 둘을 prop 으로 빼면 이 파일 전체(활동 9종 + 게임 4종 배선)를 라우터 밖에서도 쓴다.
 *    광고 랜딩(`/hangul`)이 활동을 진짜로 돌리는 게 그 방식이다 — 배선을 복사하면 갈라진다.
 */
export interface KoreanPhonicsActivityProps {
  unitId: string;
  activityKey: string;
  /** 「← 돌아가기」와 활동 완료 후 이동. 임베드는 갈 데가 없으므로 아무것도 안 한다. */
  onExit: () => void;
}

export function KoreanPhonicsActivity({ unitId, activityKey, onExit }: KoreanPhonicsActivityProps) {
  const { t } = useTranslation('phonics');
  const unit = getKoreanUnit(unitId);
  const plan = getActivityPlan(unitId);
  const activity: ActivityDef | undefined = useMemo(
    () => plan.activities.find((a) => a.key === activityKey),
    [plan, activityKey]
  );

  const storybookQuery = useStorybook(unit?.isReview ? undefined : unitId);
  const storybook = storybookQuery.data as Storybook | undefined;

  // 복습 활동은 되짚는 단원들의 그림·단어가 필요하다 (early return 앞에서 호출 — 훅 순서 고정).
  // 🔴 **섞어서** 넘긴다 — 활동들이 앞에서 4장만 쓰기 때문에 순서가 고정이면 뒤쪽 글자가 영영 안 나온다.
  const reviewCards = useMemo(() => shuffleReviewCards(activity?.reviewCards ?? []), [activity]);
  /** 🔴 한 번만 뽑는다 — 렌더마다 다시 뽑으면 보기가 계속 바뀌고 자동재생이 다시 울린다. */
  const syllableChoices = useMemo(
    () => reviewCards.map((c) => randomReviewSyllable(c)),
    [reviewCards]
  );
  /**
   * 🔎 글자 사냥 판 — **복습만** 낱자를 음절로 바꿔 깐다.
   *
   * 🔴 **한글은 음소 하나를 음절 묶음으로 배운다**(2026-07-30 사용자) — ㄱ 단원에서 `가갸거겨고교구규그기`
   *    를 다 익히므로, 여러 모음에 걸쳐 ㄱ 을 알아보는 것이 곧 그 단원이 가르친 것이다. 그래서
   *    대표 음절(가) 고정이 아니라 **매번 무작위**(`randomReviewSyllable` — 자음은 고정, 모음이 바뀐다).
   *    받침 복습은 받침을 고정하고 앞 음절이 바뀐다(`앙`→`옹`), 복잡한 모음은 그 모음이 고정된다.
   * 🔴 학습 단원의 사냥은 이미 음절(가갸거겨)이거나 모음이라 **그대로 둔다**.
   * 🔴 진입당 한 번만 — 렌더마다 뽑으면 누를 때마다 판이 바뀐다.
   */
  const huntCards = useMemo(
    () =>
      unit?.isReview
        ? reviewCards.map((c) => {
            const s = randomReviewSyllable(c);
            return { ...c, letter: s, syllable: s, sound: s };
          })
        : reviewCards,
    [reviewCards, unit?.isReview]
  );
  const { sources: reviewSources, isLoading: reviewLoading } = useReviewCardSources(reviewCards);

  /**
   * 🔴 게임 데이터는 **한 번만 뽑는다** — 어댑터가 내부에서 `shuffle().slice(0,4)` 를 해서,
   *    렌더할 때마다 새로 부르면 다른 단어가 뽑힌다. 그러면 진입 게이트의 자산 키가 바뀌어
   *    **게임 도중에 로딩 화면이 다시 뜨고 판이 리셋**된다(창 포커스 복귀 시 refetch 로 재현).
   */
  const gameMemoRef = useRef<{ key: string; data: unknown } | null>(null);
  const memoGame = <T,>(build: () => T): T => {
    const key = `${unitId}:${activityKey}:${storybookQuery.dataUpdatedAt}`;
    if (gameMemoRef.current?.key !== key) {
      gameMemoRef.current = { key, data: build() };
    }
    return gameMemoRef.current.data as T;
  };

  const backToUnit = onExit;

  /**
   * 🔴 **활동을 마치면 학습 이벤트를 남긴다** (2026-07-27).
   * 예전엔 파닉스 학습 화면이 이벤트를 **하나도** 안 보냈다. 진척은 localStorage 에만 쌓여서,
   * 아이가 저녁 내내 파닉스를 해도 **부모 리포트의 파닉스 탭은 늘 0%** 였다 — 화면이 비는 게 아니라
   * 없는 사실을 보고하고 있었던 것이라 더 나빴다.
   * `phonics-progress.ts` 가 `page_read` 의 `storybook_id` 로 단원 진행을 세므로 그 형태로 남긴다.
   * (음절·음소 정오답은 활동이 실제로 그걸 판정할 때 따로 남긴다 — 없는 정답을 지어내지 않는다.)
   */
  const logEvent = useLogEvent();
  const logUnitProgress = useCallback(() => {
    if (!unitId) return;
    logEvent({
      type: 'page_read',
      storybookId: unitId,
      metadata: { source: 'phonics', unitId, lang: 'ko' },
    });
  }, [logEvent, unitId]);

  const handleComplete = useCallback(() => {
    markActivityCompleted('korean', unitId, activityKey);
    logUnitProgress();
    backToUnit();
  }, [unitId, activityKey, backToUnit, logUnitProgress]);

  // 자동 back 없이 진척만 마킹 (activity 가 직접 retry/back UI 노출용)
  /** 퀴즈 판정 → 낱말 정오답. 부모 리포트의 「다시 한번 보면 좋을 단어」가 이걸로 뽑힌다. */
  const judgeWord = useCallback(
    (correct: boolean, item: { sound: string; label: string }) => {
      logEvent({
        type: correct ? 'word_correct' : 'word_wrong',
        storybookId: unitId,
        word: item.sound || item.label,
        metadata: { source: 'phonics', unitId, lang: 'ko' },
      });
    },
    [logEvent, unitId]
  );

  const handleMarkComplete = useCallback(() => {
    markActivityCompleted('korean', unitId, activityKey);
    logUnitProgress();
  }, [unitId, activityKey, logUnitProgress]);

  if (!unit || !activity) {
    return (
      <div className="px-6 py-6 max-w-[800px] mx-auto">
        <p className="text-base font-bold text-ink-700">{t('common.unknownActivity')}</p>
        <Link
          to={`/library/phonics/korean/${unitId}`}
          className="inline-block mt-3 text-coral-600 font-black underline"
        >
          {t('common.backToUnit')}
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
  // 복잡한 모음 음절 (한글4) — 모음 선택 → 그 모음의 자음 음절 만들기(듣기)/쓰기
  if (
    (activity.kind === 'vowel-blend-listen' || activity.kind === 'vowel-blend-write') &&
    activity.vowels &&
    activity.blendConsonants
  ) {
    return (
      <VowelSyllablePickerActivity
        unitId={unitId}
        vowels={activity.vowels}
        blendConsonants={activity.blendConsonants}
        mode={activity.kind === 'vowel-blend-listen' ? 'listen' : 'write'}
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
      return <ActivityLoading activity={activity} onBack={backToUnit} />;
    }
    const choices = phonicsToWordChoices(storybook);
    if (choices.length < 3)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="unavailable.needWordImages"
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
        onJudge={judgeWord}
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
        // 🔴 보기와 음원이 **같은 글자**여야 한다 — 예전엔 보기가 `가` 인데 음원이 `ㄱ` 이었다.
        //    음절은 매번 무작위로 만든다(자음 단원=모음 랜덤, 받침 단원=앞 음절 랜덤).
        items={syllableChoices.map((s) => ({ label: s, sound: s }))}
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
      return <ActivityLoading activity={activity} onBack={backToUnit} />;
    }
    const words = reviewSources.filter((s) => s.word);
    if (words.length < 3) {
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="unavailable.needWords"
        />
      );
    }
    return (
      <WordListenChooseActivity
        unitId={unitId}
        /**
         * 🔴 **그림을 넣지 않는다** — 넣으면 들린 낱말의 그림이 늘 정답 칸에 있어서 글자를 안 보고도
         *    통과한다(학습 단원의 「듣고 고르기」와 같은 활동이 된다). 복습은 소리→**글자** 방향이다.
         * 🔴 한글은 **낱말 그대로** 보기로 둘 수 있다 — 이 복습에 오기까지 `고`·`기` 를 이미 배웠으므로
         *    `고기` 는 **읽히는 낱말**이다(2026-07-29 사용자). 예전 주석의 "못 읽는 아이에겐 네 칸이
         *    똑같아 보인다" 는 학습 단원 얘기지 복습에는 안 맞는다.
         *    ⚠️ 영어 Book 1 은 반대다 — 거긴 **음소**만 배운 단계라 `alligator` 가 안 읽힌다.
         *    그래서 영어 Book 1 만 보기를 **글자(Aa)** 로 바꾼다(`EnglishPhonicsActivityPage`).
         */
        items={words.map((s) => ({
          label: s.word,
          sound: s.word,
          // 🔴 보기가 아니라 **맞힌 뒤에** 열리는 그림이다 — 고르는 근거는 여전히 소리↔글자다.
          revealImageUrl: s.imageUrl,
        }))}
        onJudge={judgeWord}
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
  // 🔎 글자 사냥 — 글자만 쓰는 활동이라 단어 그림을 기다리지 않는다(자산 없는 단원에서도 돈다).
  if (activity.kind === 'letter-hunt' && huntCards.length) {
    return (
      <LetterHuntActivity
        unitId={unitId}
        cards={huntCards}
        onComplete={handleComplete}
        onBack={backToUnit}
      />
    );
  }

  if (
    activity.kind === 'review-match' ||
    activity.kind === 'review-write' ||
    activity.kind === 'review-flip'
  ) {
    if (reviewLoading) {
      return <ActivityLoading activity={activity} onBack={backToUnit} />;
    }
    const withImage = reviewSources.filter((s) => s.imageUrl);
    if (activity.kind === 'review-flip') {
      if (withImage.length < 3)
        return (
          <ActivityUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="unavailable.needWordImages"
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
    if (activity.kind === 'review-write') {
      if (!withImage.length)
        return (
          <ActivityUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="unavailable.needWordImages"
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
    // 짝 찾기 — 카드의 **낱말**과 그 그림을 잇는다. 최소 3쌍이 있어야 게임이 성립.
    if (withImage.length < 3)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="unavailable.needWordImages"
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
          /**
           * 🔴 카드는 **음소가 아니라 낱말**이다(2026-07-30 사용자: "여기도 그냥 단어로 넣어줘.
           *    음소 말고"). 복습에 온 아이는 그 자음의 음절을 다 배운 뒤라 `도마` 가 읽히고,
           *    낱말↔그림이 실제로 하는 일과 맞는다. 예전엔 카드가 `ㄷ` 이고 낱말은 그 아래
           *    작은 글씨였는데, 정작 그림과 짝지어지는 건 낱말이라 큰 글자가 겉돌았다.
           * 🔴 글자 활동이 사라지는 게 아니다 — 같은 복습의 **글자 사냥**(모양)·**듣고 음절**(소리)이
           *    음소를 맡는다. 활동마다 겨루는 층이 다른 것이 이 복습의 구성이다.
           */
          items: withImage.slice(0, REVIEW_PAIRS).map((s) => ({
            word: s.word,
            imageUrl: s.imageUrl,
          })),
        }}
      />
    );
  }

  // ── 게임 액티비티 ──
  if (!storybook) {
    return <ActivityLoading activity={activity} onBack={backToUnit} />;
  }

  const noopComplete = () => handleComplete();
  // 파닉스 unit level 별 Block 게임 picker 난이도:
  // - 한글1 (기본 음절 가/갸 등) → easy: 기본 자음 14 + 기본 모음 10. 쌍자음/복잡모음 X.
  // - 한글2 (받침 산/강 등) → medium: 🔴 easy 는 「순서대로 눌러봐」 strip(정답 자모만 4개)이라
  //   받침을 배운 아이에겐 고를 것이 없다. 받침 단원부터는 **전체 자모 패널**에서 직접 찾는다.
  // - 한글3 (쌍자음 까/뱀 등) → medium: 쌍자음 picker 필요 (ㄲㄸㅃㅆㅉ).
  // - 한글4 (복잡 모음 ㅐㅔㅒㅖㅘㅝ 등) → medium: 복잡 모음 picker 필요.
  // (다른 게임은 difficulty 사용 안 함 → 영향 없음)
  const blockDifficulty: 'easy' | 'medium' | 'hard' = unit.levelIndex >= 2 ? 'medium' : 'easy';
  const commonProps = {
    storybookId: unitId,
    difficulty: blockDifficulty,
    onComplete: noopComplete,
    onBack: backToUnit,
  };

  // 🔴 게임은 **진입 게이트**로 감싼다 — 동화 게임과 같은 방식으로 이번 판 자산을 다 데운 뒤 시작한다.
  //    `game` 은 활동 kind 가 아니라 수집기가 아는 게임 id 다(어긋나면 정답 TTS 가 조용히 안 데워진다).
  const gate = (game: GameTypeId, gameData: object, node: ReactNode) => (
    <PhonicsGameGate
      game={game}
      gameData={gameData as { type: string; items?: Array<Record<string, unknown>> }}
      storybook={storybook}
      storybookId={unitId}
      lang="ko"
    >
      {node}
    </PhonicsGameGate>
  );

  if (activity.kind === 'game-korean-block') {
    const gameData = memoGame(() => phonicsToKoreanBlockData(storybook));
    if (!gameData)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="unavailable.needMoreWords"
        />
      );
    return gate(
      'korean-block',
      gameData,
      <KoreanBlockPlayer {...commonProps} gameData={gameData} />
    );
  }
  if (activity.kind === 'game-word-writing') {
    const gameData = memoGame(() => phonicsToWordWritingData(storybook));
    if (!gameData)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="unavailable.needMoreWords"
        />
      );
    return gate(
      'korean-word-writing',
      gameData,
      <KoreanWordWritingPlayer {...commonProps} gameData={gameData} />
    );
  }
  if (activity.kind === 'game-line-matching') {
    const gameData = phonicsToLineMatchingData(storybook);
    if (!gameData)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="unavailable.needWordImages"
        />
      );
    return gate(
      'korean-line-matching',
      gameData,
      <LineMatchingPlayer {...commonProps} gameData={gameData} lang="ko" />
    );
  }
  if (activity.kind === 'game-connect-dots') {
    const gameData = memoGame(() => phonicsToConnectTheDotsData(storybook));
    if (!gameData)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="unavailable.needWordDots"
        />
      );
    return gate(
      'connect-the-dots',
      gameData,
      <ConnectTheDotsPlayer {...commonProps} gameData={gameData} />
    );
  }

  return (
    <ActivityUnavailable activity={activity} onBack={backToUnit} reason="unavailable.comingSoon" />
  );
}

function ActivityLoading({ activity, onBack }: { activity: ActivityDef; onBack: () => void }) {
  const { t } = useTranslation('phonics');
  return (
    <div className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden">
      <button
        onClick={onBack}
        className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
      >
        {t('common.back')}
      </button>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-3">
        <div className="text-6xl">{activity.emoji}</div>
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900">
          {activityTitle(t, activity)}
        </h2>
        <p className="text-base font-bold text-ink-500">{t('common.loading')}</p>
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
  /** `phonics` 네임스페이스 키(`unavailable.*`) — 문구는 로케일이 갖는다. */
  reason: string;
}) {
  const { t } = useTranslation('phonics');
  return (
    <div className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden">
      <button
        onClick={onBack}
        className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
      >
        {t('common.back')}
      </button>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-3">
        <div className="text-6xl">{activity.emoji}</div>
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900">
          {activityTitle(t, activity)}
        </h2>
        <p className="text-base font-bold text-ink-600">{t(reason)}</p>
      </div>
    </div>
  );
}

/**
 * `/library/phonics/korean/:unitId/:activityKey` — 라우트 껍데기.
 * 파라미터를 읽어 위 컴포넌트에 넘기고, 나가기는 단원 화면으로 보낸다.
 */
export default function KoreanPhonicsActivityPage() {
  const { unitId = '', activityKey = '' } = useParams<{ unitId: string; activityKey: string }>();
  const navigate = useNavigate();
  const onExit = useCallback(
    () => navigate(`/library/phonics/korean/${unitId}`),
    [navigate, unitId]
  );
  return <KoreanPhonicsActivity unitId={unitId} activityKey={activityKey} onExit={onExit} />;
}
