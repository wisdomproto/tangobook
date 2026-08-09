import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { GameTypeId, Storybook } from '@tangobook/shared';
import {
  CHANT_URLS,
  getChineseActivityPlan,
  getChineseListenCards,
  getChineseToneChoiceCards,
  getChineseUnit,
  getChineseUnitCards,
  hanziFor,
  isBlendUnit,
  isCombineUnit,
  isToneUnit,
  isWordUnit,
  type PinyinCard,
} from '../lib/chinese-phonics-units';
import type { ActivityDef, ReviewCard } from '../lib/korean-phonics-units';
import { useChineseReviewSources } from '../hooks/useChineseReviewSources';
import { ReviewFlipMatchActivity } from '../activities/ReviewFlipMatchActivity';
import { ToneChoiceReviewActivity } from '../activities/ToneChoiceReviewActivity';
import { markActivityCompleted } from '../lib/progress-store';
import { getChineseSyllableUrl } from '@/features/games/hooks/usePhonicsMap';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import {
  phonicsToWordChoices,
  phonicsToLineMatchingData,
  phonicsToConnectTheDotsData,
} from '../lib/phonics-game-adapter';
import { PhonicsGameGate } from './PhonicsGameGate';
import { LineMatchingPlayer } from '@/features/games/components/players/LineMatchingPlayer';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import { WordListenChooseActivity } from '../activities/WordListenChooseActivity';
import { VowelWriteActivity } from '../activities/VowelWriteActivity';
import { LetterHuntActivity } from '../activities/LetterHuntActivity';
import { ChantActivity } from '../activities/ChantActivity';
import { useLogEvent } from '@/features/learning/hooks/useLogEvent';

/**
 * /library/phonics/chinese/:unitId/:activityKey — 병음 활동 호스트.
 *
 * 활동은 전부 기존 컴포넌트 재사용(새 컴포넌트 0):
 *  - `word-listen-choose` = 듣고 배우기 / 성조 듣고 고르기(성조 유닛)
 *  - `vowel-write` = 병음 따라쓰기(LetterFillCanvas 라틴)
 *  - `letter-hunt` = 글자 사냥(병음 모양 변별)
 *
 * 🔴 발음 = 원어민 녹음(`mod_chinese`) 직행. `getChineseSyllableUrl(sound)` 로 URL 을 미리 뽑아
 *    `ttsUrl` 로 넘긴다(word-listen·write). 글자 사냥은 컴포넌트가 `resolveTtsUrl(zh)` 로 직접 읽는다.
 * 🔴 안내·칭찬은 한국어(아이가 알아듣는 말) — 병음은 소리(카드)로만 등장한다.
 */
/** 복습 듣기의 보기 수 — 보기가 병음·성조부호(그림 X)라 학습 단원(3장)보다 하나 더. */
const REVIEW_CHOICES = 4;
/** 복습 짝 맞추기의 쌍 수 — 4~7세 한 화면 한계(한/영 복습과 동일). */
const REVIEW_PAIRS = 4;

function shuffleArr<T>(arr: ReadonlyArray<T>): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ChinesePhonicsActivityPage() {
  const { unitId = '', activityKey = '' } = useParams<{ unitId: string; activityKey: string }>();
  const navigate = useNavigate();
  const unit = getChineseUnit(unitId);
  const plan = getChineseActivityPlan(unitId);
  const activity: ActivityDef | undefined = useMemo(
    () => plan.activities.find((a) => a.key === activityKey),
    [plan, activityKey]
  );

  // 단어(L4) 유닛은 삽화·keypoints·mod_chinese 음원이 storybook 에 있다 — 낱말 연습·게임이 그걸 읽는다.
  // 소리 유닛(L1~L3)은 storybook 이 없으므로 fetch 하지 않는다(undefined → 훅이 쉰다).
  const wordUnit = isWordUnit(unitId);
  const storybookQuery = useStorybook(wordUnit ? unitId : undefined);
  const storybook = storybookQuery.data as Storybook | undefined;

  // 복습 단원 — 되짚는 낱말 유닛들의 그림·음원을 로드한다(early return 앞에서 호출 — 훅 순서 고정).
  // 🔴 unit 은 렌더마다 새 객체라 coveredUnitIds 신원이 매번 바뀐다 → id 목록(내용)으로 안정화한다.
  const reviewUnit = !!unit?.isReview;
  const coveredKey = (unit?.coveredUnitIds ?? []).join(',');
  const coveredIds = useMemo(() => (coveredKey ? coveredKey.split(',') : []), [coveredKey]);
  const { sources: rawReviewSources, isLoading: reviewLoading } =
    useChineseReviewSources(coveredIds);
  // 🔴 진입당 한 번만 섞는다 — 렌더마다 섞으면 뒤집기 판이 춤춘다(한글 복습과 같은 규칙).
  const reviewSources = useMemo(() => shuffleArr(rawReviewSources), [rawReviewSources]);
  // 🔎 글자 사냥 판 — 낱말(병음)만으로 즉시. 소스(storybook)를 안 기다린다.
  const reviewHuntCards = useMemo<ReviewCard[]>(
    () =>
      reviewUnit
        ? shuffleArr(unit?.targetWords ?? []).map((w) => ({
            unitId,
            letter: w,
            syllable: w,
            sound: w,
            matchPosition: 'cho' as const,
          }))
        : [],
    [reviewUnit, coveredKey, unitId]
  );
  // 🔴 게임 데이터는 **한 번만** 뽑는다 — 어댑터가 내부에서 shuffle().slice(0,4) 하므로 렌더마다 부르면
  //    다른 낱말이 뽑혀 진입 게이트 자산 키가 바뀌고 판이 리셋된다(Korean 과 같은 memo).
  const gameMemoRef = useRef<{ key: string; data: unknown } | null>(null);
  const memoGame = <T,>(build: () => T): T => {
    const key = `${unitId}:${activityKey}:${storybookQuery.dataUpdatedAt}`;
    if (gameMemoRef.current?.key !== key) gameMemoRef.current = { key, data: build() };
    return gameMemoRef.current.data as T;
  };

  /**
   * 이 활동이 쓰는 카드 — 활동 종류로 갈린다:
   *  - 성조 고르기 = 성조 부호 보기(`getChineseToneChoiceCards`)
   *  - 듣고 배우기 = 4성 카드(성조 유닛) / 낱 모음+4성 순서(`getChineseListenCards`)
   *  - 따라쓰기·글자 사냥 = 낱 모음 글자 하나(`getChineseUnitCards`)
   */
  const cards: PinyinCard[] = useMemo(() => {
    if (activityKey === 'tone-choose') return getChineseToneChoiceCards(unitId);
    if (activity?.kind === 'word-listen-choose') return getChineseListenCards(unitId);
    return getChineseUnitCards(unitId);
  }, [unitId, activityKey, activity?.kind]);

  // 진입 시 카드 발음을 전부 resolve(프리워밍) → sound→URL 맵. 4성 순서(`sounds`)까지 포함. resolve 전엔 로딩.
  // 🔴 글자 사냥은 여기서 안 데운다 — `resolveTtsUrl(zh)` 가 방해꾼까지 런타임에 읽는다.
  const needsPreresolve = activity?.kind !== 'letter-hunt';
  const soundsToResolve = useMemo(
    () => Array.from(new Set(cards.flatMap((c) => (c.sounds?.length ? c.sounds : [c.sound])))),
    [cards]
  );
  const [ttsBySound, setTtsBySound] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (!needsPreresolve) {
      setTtsBySound({});
      return;
    }
    let alive = true;
    setTtsBySound(null);
    void (async () => {
      const entries = await Promise.all(
        soundsToResolve.map(async (s) => [s, await getChineseSyllableUrl(s)] as const)
      );
      if (alive) {
        setTtsBySound(Object.fromEntries(entries.filter(([, url]) => url) as [string, string][]));
      }
    })();
    return () => {
      alive = false;
    };
  }, [soundsToResolve, needsPreresolve]);

  const backToUnit = useCallback(
    () => navigate(`/library/phonics/chinese/${unitId}`),
    [navigate, unitId]
  );

  // 활동 완료 → 학습 이벤트(부모 리포트 파닉스 진행). 한/영과 같은 형태(page_read + lang).
  const logEvent = useLogEvent();
  const handleMarkComplete = useCallback(() => {
    markActivityCompleted('chinese', unitId, activityKey);
    if (unitId) {
      logEvent({
        type: 'page_read',
        storybookId: unitId,
        metadata: { source: 'phonics', unitId, lang: 'zh' },
      });
    }
  }, [unitId, activityKey, logEvent]);

  // 게임은 완료 후 단원으로 돌아간다(익히기 활동은 자체 「돌아가기」 UI 를 노출해 머문다).
  const handleGameComplete = useCallback(() => {
    handleMarkComplete();
    backToUnit();
  }, [handleMarkComplete, backToUnit]);

  // 낱말 연습 카드 — storybook flashcards(그림 있는 타겟 낱말) + 한자 병기. 병음 위 / 한자 아래.
  // 🔴 발음(ttsUrl)은 flashcard 의 mod_chinese 직행 URL — say() 가 그걸 우선하므로 concat 왕복이 없다.
  const wordItems = useMemo(
    () =>
      storybook
        ? phonicsToWordChoices(storybook).map((w) => ({
            id: w.word,
            label: w.word,
            sublabel: hanziFor(w.word),
            sound: w.word,
            imageUrl: w.imageUrl,
            ...(w.ttsUrl ? { ttsUrl: w.ttsUrl } : {}),
          }))
        : [],
    [storybook]
  );

  if (!unit || !activity) {
    return (
      <div className="px-6 py-6 max-w-[800px] mx-auto">
        <p className="text-base font-bold text-ink-700">알 수 없는 활동입니다.</p>
        <Link
          to={`/library/phonics/chinese/${unitId}`}
          className="inline-block mt-3 text-coral-600 font-black underline"
        >
          ← 단원으로
        </Link>
      </div>
    );
  }

  // ── 🎵 노래(찬트) = 마무리 노래 듣기. 소리·낱말 유닛 어디에나 붙으므로 wordUnit 분기보다 먼저. ──
  if (activity.kind === 'chant') {
    const urls = CHANT_URLS[unitId];
    if (!urls?.length)
      return <ChineseUnavailable activity={activity} onBack={backToUnit} reason="노래가 없어요" />;
    return (
      <ChantActivity
        unitId={unitId}
        urls={urls}
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  // ── 단어(L4) 유닛 = 낱말 놀이(낱말 연습 + 게임 2종). storybook 로드 후 렌더. ──────────────
  if (wordUnit) {
    if (storybookQuery.isLoading || !storybook) {
      return (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-cream-50 to-peach-100 text-center">
          <div className="text-6xl">{activity.emoji}</div>
          <h2 className="text-2xl sm:text-3xl font-black text-ink-900">{activity.title}</h2>
          <p className="text-base font-bold text-ink-500">불러오는 중…</p>
        </div>
      );
    }

    // 낱말 연습 — 그림 + 병음 위/한자 아래, 소리 듣고 고르기. 그림은 상시(낱말 학습이라 그림이 근거).
    if (activity.kind === 'word-listen-choose') {
      if (wordItems.length < 2) {
        return (
          <ChineseUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="낱말 그림이 필요해요"
          />
        );
      }
      return (
        <WordListenChooseActivity
          unitId={unitId}
          language="zh"
          items={wordItems}
          choices={wordItems.length}
          exploreFirst
          onMarkComplete={handleMarkComplete}
          onBack={backToUnit}
        />
      );
    }

    // 게임 — 진입 게이트로 감싸 이번 판 자산을 다 데운 뒤 시작(한/영과 같은 경로).
    const commonProps = {
      storybookId: unitId,
      difficulty: 'medium' as const,
      onComplete: handleGameComplete,
      onBack: backToUnit,
    };
    const gate = (game: GameTypeId, gameData: object, node: ReactNode) => (
      <PhonicsGameGate
        game={game}
        gameData={gameData as { type: string; items?: Array<Record<string, unknown>> }}
        storybook={storybook}
        storybookId={unitId}
        lang="zh"
      >
        {node}
      </PhonicsGameGate>
    );

    if (activity.kind === 'game-line-matching') {
      const gameData = memoGame(() => phonicsToLineMatchingData(storybook));
      if (!gameData)
        return (
          <ChineseUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="낱말 그림이 필요해요"
          />
        );
      // 🔴 lang="zh" — 낱말(병음)은 flashcard.ttsUrl(mod_chinese 직행)로 재생, 칭찬은 한국어.
      return gate(
        'english-line-matching',
        gameData,
        <LineMatchingPlayer {...commonProps} gameData={gameData} lang="zh" />
      );
    }
    if (activity.kind === 'game-connect-dots') {
      const gameData = memoGame(() => phonicsToConnectTheDotsData(storybook));
      if (!gameData)
        return (
          <ChineseUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="낱말 그림과 점이 필요해요"
          />
        );
      // 🔴 lang="zh" — 완성 시 병음 낱말을 읽는다(안 넘기면 한국어로 읽는 기존 버그).
      return gate(
        'connect-the-dots',
        gameData,
        <ConnectTheDotsPlayer {...commonProps} gameData={gameData} lang="zh" />
      );
    }
    return <ChineseUnavailable activity={activity} onBack={backToUnit} reason="아직 준비 중" />;
  }

  // ── 복습 단원 = 게임 5종(낱말 유닛의 그림·병음·mod_chinese 음원을 되짚는다) ─────────────────
  if (reviewUnit) {
    // 🔎 글자 사냥 — 소스 없이 낱말(병음)만으로 즉시 렌더(그림 없는 단원에서도 돈다).
    if (activity.kind === 'letter-hunt') {
      return (
        <LetterHuntActivity
          unitId={unitId}
          cards={reviewHuntCards}
          language="zh"
          onComplete={handleGameComplete}
          onBack={backToUnit}
        />
      );
    }
    // 나머지 4종 = 되짚는 낱말의 그림·음원이 필요하다(그림·음원 프리로드 후 렌더).
    if (reviewLoading) {
      return (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-cream-50 to-peach-100 text-center">
          <div className="text-6xl">{activity.emoji}</div>
          <h2 className="text-2xl sm:text-3xl font-black text-ink-900">{activity.title}</h2>
          <p className="text-base font-bold text-ink-500">불러오는 중…</p>
        </div>
      );
    }
    const withImage = reviewSources.filter((s) => s.imageUrl);

    // 🎴 뒤집기 짝 맞추기 — 병음(글자면) ↔ 그림. letterFace=false 라 앞면이 병음 낱말이다.
    if (activity.kind === 'review-flip') {
      if (withImage.length < 3)
        return (
          <ChineseUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="낱말 그림이 필요해요"
          />
        );
      return (
        <ReviewFlipMatchActivity
          unitId={unitId}
          language="zh"
          sources={withImage}
          onComplete={handleGameComplete}
          onBack={backToUnit}
        />
      );
    }

    // 🔊 듣고 낱말 맞추기 — 낱말 소리를 듣고 병음 4개 중 고르기. 그림은 **맞힌 뒤에만**(소리→글자 방향).
    if (activity.kind === 'review-word-listen') {
      const words = reviewSources.filter((s) => s.word);
      if (words.length < 3)
        return (
          <ChineseUnavailable activity={activity} onBack={backToUnit} reason="낱말이 필요해요" />
        );
      return (
        <WordListenChooseActivity
          unitId={unitId}
          language="zh"
          items={words.map((s) => ({
            id: s.word,
            label: s.word,
            sublabel: s.hanzi,
            sound: s.word,
            revealImageUrl: s.imageUrl,
            ...(s.ttsUrl ? { ttsUrl: s.ttsUrl } : {}),
          }))}
          choices={REVIEW_CHOICES}
          onMarkComplete={handleMarkComplete}
          onBack={backToUnit}
        />
      );
    }

    // 🔗 그림 짝 찾기 — 병음 ↔ 그림. lang="zh" — 낱말 소리는 flashcard ttsUrl(mod_chinese) 직행.
    if (activity.kind === 'review-match') {
      if (withImage.length < 3)
        return (
          <ChineseUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="낱말 그림이 필요해요"
          />
        );
      return (
        <LineMatchingPlayer
          storybookId={unitId}
          difficulty="easy"
          lang="zh"
          onComplete={handleGameComplete}
          onBack={backToUnit}
          gameData={{
            type: 'korean-line-matching',
            items: withImage.slice(0, REVIEW_PAIRS).map((s) => ({
              word: s.word,
              imageUrl: s.imageUrl,
              imageLabel: s.word,
              ...(s.ttsUrl ? { ttsUrl: s.ttsUrl } : {}),
            })),
          }}
        />
      );
    }

    // 🎵 성조 듣고 고르기 — 낱말 소리를 듣고 **그 낱말의 4성 변이**(māo·máo·mǎo·mào) 중 원래 낱말을
    //    고른다. 문항마다 보기가 그 낱말의 4형이라 성조만 변별한다(모음 confound 없음).
    if (activity.kind === 'tone-choice-review') {
      const words = reviewSources.filter((s) => s.word).slice(0, REVIEW_CHOICES);
      if (words.length < 2)
        return (
          <ChineseUnavailable
            activity={activity}
            onBack={backToUnit}
            reason="성조를 뽑을 낱말이 필요해요"
          />
        );
      return (
        <ToneChoiceReviewActivity
          unitId={unitId}
          words={words.map((s) => ({ word: s.word, ...(s.ttsUrl ? { ttsUrl: s.ttsUrl } : {}) }))}
          onMarkComplete={handleMarkComplete}
          onBack={backToUnit}
        />
      );
    }

    return <ChineseUnavailable activity={activity} onBack={backToUnit} reason="아직 준비 중" />;
  }

  // 글자 사냥 — 병음 낱 글자를 ReviewCard 로 (letter=보이는 글자, sound=성조 발음).
  if (activity.kind === 'letter-hunt') {
    const huntCards: ReviewCard[] = cards.map((c) => ({
      unitId,
      letter: c.label,
      syllable: c.label,
      sound: c.sound,
      matchPosition: 'cho',
    }));
    return (
      <LetterHuntActivity
        unitId={unitId}
        cards={huntCards}
        language="zh"
        onComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  if (!ttsBySound) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-cream-50 to-peach-100 text-center">
        <div className="text-6xl">{activity.emoji}</div>
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900">{activity.title}</h2>
        <p className="text-base font-bold text-ink-500">불러오는 중…</p>
      </div>
    );
  }

  // 병음 따라쓰기 — 쓰는 글자는 낱 모음(label), 읽는 소리는 tone-1 녹음(ttsUrl).
  if (activity.kind === 'vowel-write') {
    return (
      <VowelWriteActivity
        unitId={unitId}
        language="zh"
        vowels={cards.map((c) => ({
          vowel: c.label,
          syllable: c.label,
          ttsUrl: ttsBySound[c.sound],
        }))}
        onComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  // 듣고 배우기 / 성조 듣고 고르기 — 성조 유닛 4장(2×2) / 단운모 3장(한 줄).
  // 🔴 단운모 카드는 `sounds`(4성)를 순서로 재생 — 미리 resolve 한 URL 을 `soundUrls` 로 넘긴다.
  const items = cards.map((c) => {
    const seq = (c.sounds ?? []).map((s) => ttsBySound[s]).filter(Boolean);
    return {
      id: c.label,
      label: c.label,
      sound: c.sound,
      ...(ttsBySound[c.sound] ? { ttsUrl: ttsBySound[c.sound] } : {}),
      ...(seq.length > 1 ? { soundUrls: seq } : {}),
    };
  });
  // 성조·병음조합 = 2×2 격자(4장). 그 외(단운모·성모)는 장수로.
  const columns = isToneUnit(unitId) || isBlendUnit(unitId) ? 2 : Math.min(items.length, 3);
  return (
    <WordListenChooseActivity
      unitId={unitId}
      // 🔴 콘텐츠 소리 = 병음(`zh`) → warm·폴백이 라이브러리 직행(korean 이면 concat 400).
      //    안내·칭찬은 여전히 한국어 — 칭찬은 `en` 만 가르고 `zh` 는 `ko` 로 매핑된다.
      language="zh"
      items={items}
      choices={items.length}
      // 🔴 병음조합(L3)은 성모를 탐색에 전부 깔되(놀이판) 퀴즈만 6장으로 줄인다 — u05(17) 17지선다 방지.
      //    성조·복운모 등 작은 판은 미지정(퀴즈=판 전체, 기존 동작 불변).
      quizChoices={isCombineUnit(unitId) ? Math.min(items.length, 6) : undefined}
      columns={columns}
      // 🔴 「배우기」(listen-choose)만 탐색 먼저 — 병음조합 배우기는 눌러 블렌드를 듣고, 성조/병음조합
      //    「고르기」(tone-choose·listen-quiz)는 되짚는 자리라 바로 퀴즈.
      exploreFirst={activityKey === 'listen-choose'}
      onMarkComplete={handleMarkComplete}
      onBack={backToUnit}
    />
  );
}

/** 게임 데이터(그림·keypoints)가 아직 없을 때 — 막다른 길 대신 안내 + 「돌아가기」. */
function ChineseUnavailable({
  activity,
  onBack,
  reason,
}: {
  activity: ActivityDef;
  onBack: () => void;
  reason: string;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-cream-50 to-peach-100 text-center px-6">
      <div className="text-6xl">{activity.emoji}</div>
      <h2 className="text-2xl sm:text-3xl font-black text-ink-900">{activity.title}</h2>
      <p className="text-base font-bold text-ink-600">{reason}</p>
      <button
        onClick={onBack}
        className="mt-2 px-6 py-3 rounded-full bg-white border-2 border-ink-200 text-ink-700 font-black shadow-soft"
      >
        ← 돌아가기
      </button>
    </div>
  );
}
