import { useCallback, useMemo, type ReactNode, useRef } from 'react';
import type { GameTypeId } from '@tangobook/shared';
import { PhonicsGameGate } from './PhonicsGameGate';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getEnglishActivityPlan,
  getEnglishUnit,
  wordMatchesPattern,
  patternWriteOrder,
  getUnitPatterns,
} from '../lib/english-phonics-units';
import { shuffleReviewCards } from '../lib/korean-phonics-units';
import type { ActivityDef } from '../lib/korean-phonics-units';
import { markActivityCompleted } from '../lib/progress-store';
import { CvcPatternLearnActivity } from '../activities/CvcPatternLearnActivity';
import { CvcPatternWriteActivity } from '../activities/CvcPatternWriteActivity';
import { AlphabetLetterLearnActivity } from '../activities/AlphabetLetterLearnActivity';
import { AlphabetLetterWriteActivity } from '../activities/AlphabetLetterWriteActivity';
import { WordListenChooseActivity } from '../activities/WordListenChooseActivity';
import { WordFamilyLearnActivity } from '../activities/WordFamilyLearnActivity';
import { VowelListenActivity } from '../activities/VowelListenActivity';
import { ReviewWriteActivity } from '../activities/ReviewWriteActivity';
import { LetterHuntActivity } from '../activities/LetterHuntActivity';
import { ReviewFlipMatchActivity } from '../activities/ReviewFlipMatchActivity';
import { useReviewCardSources } from '../hooks/useReviewCardSources';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useLogEvent } from '@/features/learning/hooks/useLogEvent';
import { EnglishBlockPlayer } from '@/features/games/components/players/EnglishBlockPlayer';
import { EnglishWordWritingPlayer } from '@/features/games/components/players/EnglishWordWritingPlayer';
import { LineMatchingPlayer } from '@/features/games/components/players/LineMatchingPlayer';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import {
  phonicsToEnglishBlockData,
  phonicsToEnglishWordWritingData,
  phonicsToEnglishLineMatchingData,
  phonicsToConnectTheDotsData,
  findImageData,
} from '../lib/phonics-game-adapter';
import type { Storybook } from '@tangobook/shared';

/**
 * /library/phonics/english/:unitId/:activityKey — 영어 활동 호스트.
 *
 * activity.kind 에 따라 분기:
 *   - `cvc-pattern-learn` → CvcPatternLearnActivity (a + n → an Phase A + 4 CVC 단어 Phase B)
 *   - `cvc-pattern-write` → CvcPatternWriteActivity (4 단어 VC 부분만 따라쓰기)
 *   - `game-english-block` → EnglishBlockPlayer
 *   - `game-word-writing` → EnglishWordWritingPlayer (글로벌 letter-stroke-library 기반 stroke 채점)
 *   - `game-connect-dots` → ConnectTheDotsPlayer (이미지+keypoints)
 *   - `game-line-matching` → LineMatchingPlayer (이미지-영단어 매칭)
 *
 * 게임 데이터: storybook 의 `phonicsConfig.targetWords` (8개) 중 어댑터가 랜덤 4개.
 */
/** 알파벳 단원에서 글자 하나에 깔 카드 수 (= 서로 다른 낱말 개수). */
const WORDS_PER_LETTER = 2;

/** 복습 듣기 보기 수 — 보기가 그림이 아니라 글자·낱말이라 학습 단원(4장)과 같게 둔다. */
const REVIEW_CHOICES = 4;

/**
 * 복습 짝 찾기의 **쌍 수** — 한글과 같은 이유로 4.
 * 🔴 영어 복습은 한 단원이 글자를 3~4개씩 내서 카드가 **5~8장**이다. 안 자르면 8쌍(16칸)이 된다.
 */
const REVIEW_PAIRS = 4;

export default function EnglishPhonicsActivityPage() {
  const { unitId = '', activityKey = '' } = useParams<{ unitId: string; activityKey: string }>();
  const navigate = useNavigate();
  const unit = getEnglishUnit(unitId);
  const plan = getEnglishActivityPlan(unitId);
  const activity: ActivityDef | undefined = useMemo(
    () => plan.activities.find((a) => a.key === activityKey),
    [plan, activityKey]
  );

  // 복습은 되짚는 단원들의 그림·단어가 필요하다 (early return 앞에서 호출 — 훅 순서 고정).
  // 🔴 **섞어서** 넘긴다 — 활동들이 앞에서 4장만 쓰기 때문에 순서가 고정이면 뒤쪽 글자가 영영 안 나온다.
  const reviewCards = useMemo(() => shuffleReviewCards(activity?.reviewCards ?? []), [activity]);
  /** Book 1 = 글자가 목표인 권. 낱말은 첫 글자만 크게 쓴다. */
  const isBook1 = unitId.startsWith('en-b1');
  /** Book 2 복습 카드의 letter 는 **패턴("ap")** 이라, 쓰기는 대표 낱말("cap")로 한다(Book 3~5 는 letter 가 이미 낱말). */
  const isBook2 = unitId.startsWith('en-b2');
  /**
   * 🔴 글자 사냥·듣고 글자는 **패턴**(ake/bl/ee)을 찾게 한다 — Book 2 가 an/at 를 찾는 것과 같은 결.
   * Book 3~5 복습 카드는 낱말(`bake`)이라 그대로 쓰면 "rake 찾기"가 된다(사용자 지적 2026-08-09).
   *
   * 🔴 패턴은 **커버하는 단원들의 커리큘럼 패턴 전체**에서 뽑는다 — 복습 낱말 4개(bake·cake·lake…)는
   *    같은 rime(ake) 으로 뭉쳐 2~3개뿐이라 듣고 글자 보기가 3개로 모자랐다(사용자: "4개 나와야"). 단원
   *    패턴(`_ake`·`_ame`·`_ane`·`_ape`…)에서 코어만 떼면 rime 이 넉넉해 보기 4개·방해꾼도 형제 패턴이 된다.
   */
  const isWordBook = /^en-b[345]/.test(unitId);
  const patternCards = useMemo(() => {
    if (!isWordBook) return reviewCards;
    const units = [...new Set(reviewCards.map((c) => c.unitId))];
    const seen = new Set<string>();
    const out = units.flatMap((uid) =>
      getUnitPatterns(uid).flatMap((p) => {
        const tok = p.replace(/_/g, '').toLowerCase();
        if (!tok || seen.has(tok)) return [];
        seen.add(tok);
        return [
          { unitId: uid, letter: tok, syllable: tok, sound: tok, matchPosition: 'cho' as const },
        ];
      })
    );
    return out.length ? shuffleReviewCards(out) : reviewCards;
  }, [isWordBook, reviewCards]);
  const { sources: reviewSources, isLoading: reviewLoading } = useReviewCardSources(reviewCards);

  const storybookQuery = useStorybook(unitId);
  const storybook = storybookQuery.data as Storybook | undefined;

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

  const backToUnit = useCallback(
    () => navigate(`/library/phonics/english/${unitId}`),
    [navigate, unitId]
  );
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
      metadata: { source: 'phonics', unitId, lang: 'en' },
    });
  }, [logEvent, unitId]);

  const handleComplete = useCallback(() => {
    markActivityCompleted('english', unitId, activityKey);
    logUnitProgress();
    backToUnit();
  }, [unitId, activityKey, backToUnit, logUnitProgress]);
  /**
   * 퀴즈 판정 → 영어는 **음소**로 남긴다(부모 리포트 스킬트리가 `phoneme` 으로 칸을 채운다).
   * 카드 라벨이 `Aa` 라 소문자 한 글자로 정규화한다.
   */
  const judgePhoneme = useCallback(
    (correct: boolean, item: { sound: string; label: string }) => {
      const phoneme = (item.label || item.sound).trim().toLowerCase().slice(0, 1);
      if (!phoneme) return;
      logEvent({
        type: correct ? 'phoneme_correct' : 'phoneme_wrong',
        storybookId: unitId,
        metadata: { source: 'phonics', unitId, lang: 'en', phoneme },
      });
    },
    [logEvent, unitId]
  );

  const handleMarkComplete = useCallback(() => {
    markActivityCompleted('english', unitId, activityKey);
    logUnitProgress();
  }, [unitId, activityKey, logUnitProgress]);

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

  // 🔤 낱말가족 배우기 (Book 3·4·5) — 그 패턴 낱말들을 나란히 놓고 공통 철자를 강조해 듣는다.
  //    이퓨처 「Learn: Listen and repeat」 대응 — Book 2 의 cvc-pattern-learn 이 CVC 전용이라 못 쓴다.
  if (activity.kind === 'word-family-learn' && activity.pattern) {
    const sb = storybookQuery.data as Storybook | undefined;
    if (storybookQuery.isLoading || !sb) {
      return <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />;
    }
    const pattern = activity.pattern;
    const seen = new Set<string>();
    const words = (sb.phonicsLesson?.wordFamilies ?? [])
      .flatMap((f) => f.words ?? [])
      .filter((w) => !!w.word && wordMatchesPattern(w.word, pattern))
      .filter((w) => !seen.has(w.word) && !!seen.add(w.word))
      .map((w) => {
        const img = findImageData(sb, w.word);
        // 🔴 예문(텍스트+자연음원)은 flashcard 에 있다 — 낱말 매칭(대소문자 무시).
        const fc = sb.flashcards?.find((f) => f.word?.toLowerCase() === w.word.toLowerCase());
        return {
          word: w.word,
          ...(img.imageUrl ? { imageUrl: img.imageUrl } : {}),
          ...(w.ttsUrl ? { ttsUrl: w.ttsUrl } : {}),
          ...(fc?.sentence ? { sentence: fc.sentence } : {}),
          ...(fc?.sentenceTtsUrl ? { sentenceTtsUrl: fc.sentenceTtsUrl } : {}),
        };
      });
    if (words.length < 2) {
      return (
        <ActivityUnavailable activity={activity} onBack={backToUnit} reason="낱말이 부족해요" />
      );
    }
    return (
      <WordFamilyLearnActivity
        unitId={unitId}
        pattern={pattern}
        words={words}
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  // 🔊 듣고 고르기 — Book 1 은 알파벳 글자만 보기로 낸다 (그림·단어 철자 없음)
  if (activity.kind === 'word-listen-choose' && activity.letters?.length) {
    /**
     * 🔴 **글자 하나에 카드 두 장** — 같은 `Aa` 라도 하나는 apple, 하나는 alligator 다.
     *    위·아래 두 줄로 같은 글자가 깔리고, 누른 카드만 그림이 열리며 그 단어를 읽어준다
     *    (`a a apple` / `a a alligator` — 저작 음원이 이미 그 형태다).
     *    한 글자에 한 카드면 "A 는 사과" 로만 남는데, 글자 소리는 여러 낱말에서 같다는 게
     *    이 권의 학습 내용이다.
     */
    const sb = storybookQuery.data as Storybook | undefined;
    const families = sb?.phonicsLesson?.wordFamilies ?? [];
    const perLetter = activity.letters.map((L, i) => {
      const label = `${L.toUpperCase()}${L.toLowerCase()}`;
      // 🔴 그림은 `wordFamilies` 가 아니라 **단어 카드(flashcards)** 에 있다 — 여기서 찾으면 늘 비어서
      //    글자 카드 3장으로 끝난다(내가 낸 버그). 게임 어댑터와 같은 조회를 쓴다.
      const words = (families[i]?.words ?? [])
        .map((w) => ({ word: w.word, ...findImageData(sb!, w.word), ttsUrl: w.ttsUrl }))
        .filter((w) => w.imageUrl)
        .slice(0, WORDS_PER_LETTER);
      if (!sb || words.length === 0) return [{ id: label, label, sound: L.toLowerCase() }];
      return words.map((w) => ({
        id: `${label}-${w.word}`,
        label,
        sound: w.word,
        // 탐색: 눌러서 그림을 연다. 퀴즈: 글자만 깔고 맞히면 이 그림으로 뒤집힌다(2026-07-31 사용자).
        imageUrl: w.imageUrl,
        revealImageUrl: w.imageUrl,
        ...(w.ttsUrl ? { ttsUrl: w.ttsUrl } : {}),
      }));
    });
    /**
     * 🔴 **한 세로줄에 글자 하나**(2026-07-29 사용자 지시) — `A A / B B / C C` 가 **위아래로** 서서
     *    3열 × 2행이 된다. 이 권의 학습 내용이 "같은 A 소리가 apple 에도 alligator 에도 있다" 라
     *    **그 둘이 붙어 보여야** 한 칸이 곧 한 글자가 된다.
     * 🔴 그래서 배열은 **행 우선으로 섞어** 넣는다(`A B C / A B C`) — 3열 grid 에 그대로 흘리면
     *    세로로 같은 글자가 만난다. `perLetter.flat()`(A A B B C C)을 넣으면 첫 줄이 `A A B` 가 된다.
     */
    const depth = Math.max(...perLetter.map((w) => w.length));
    const items = Array.from({ length: depth }).flatMap((_, d) =>
      perLetter.map((w) => w[d]).filter((c): c is NonNullable<typeof c> => !!c)
    );
    return (
      <WordListenChooseActivity
        unitId={unitId}
        language="english"
        items={items}
        choices={items.length}
        // 열 수 = 글자 수(A·B·C) — 세로 한 줄이 글자 하나가 된다.
        columns={perLetter.length}
        revealImageOnTap
        onJudge={judgePhoneme}
        // 🔴 바로 퀴즈로 밀어넣지 않는다 — 먼저 눌러 소리를 들어보고 「🎯 퀴즈」 로 넘어간다
        //    (한글 「단어 연습」과 같은 순서. 처음 보는 걸 소리만 듣고 고르라면 찍기가 된다.)
        exploreFirst
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  // ── Book 3·4·5: 낱말 기반 듣고 고르기 (letters 없음 → 낱말 소리 듣고 그림 고르기) ──
  if (activity.kind === 'word-listen-choose') {
    const sb = storybookQuery.data as Storybook | undefined;
    if (storybookQuery.isLoading || !sb) {
      return <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />;
    }
    // 🔴 발음은 flashcards 가 아니라 **wordFamilies** 에 있다(findImageData 는 그림·keypoints 만 준다).
    //    낱말·발음은 wordFamilies 에서, 그림은 findImageData 에서 가져와 합친다.
    const seen = new Set<string>();
    const items = (sb.phonicsLesson?.wordFamilies ?? [])
      .flatMap((f) => f.words ?? [])
      // 🔴 패턴별 배우기 — 그 패턴에 속하는 낱말만(`activity.pattern`). 없으면 단원 전체.
      .filter((w) => !activity.pattern || wordMatchesPattern(w.word, activity.pattern))
      .filter((w) => !!w.word && !seen.has(w.word) && !!seen.add(w.word))
      .map((w) => {
        const img = findImageData(sb, w.word);
        return {
          id: w.word,
          label: w.word,
          sound: w.word,
          ...(img.imageUrl ? { imageUrl: img.imageUrl, revealImageUrl: img.imageUrl } : {}),
          ...(w.ttsUrl ? { ttsUrl: w.ttsUrl } : {}),
        };
      })
      .filter((it) => it.imageUrl);
    // 패턴 배우기는 2낱말이어도 성립(1 of 2 고르기) — 단원 전체는 3+.
    if (items.length < (activity.pattern ? 2 : 3)) {
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="낱말 그림이 필요해요"
        />
      );
    }
    return (
      <WordListenChooseActivity
        unitId={unitId}
        language="english"
        items={items}
        choices={4}
        columns={2}
        exploreFirst
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  // ── 🏅 복습 액티비티 ──
  // 🔴 예전엔 「영어는 그림이 0장」이라 글자만으로 도는 2종뿐이었다. 단어 카드가 붙은 뒤로는
  //    한글과 같은 6종을 돌린다(사용자: "a~f review 너무 뭐가 없는데?").

  // 🎧 듣고 글자 맞추기 — 카드에 글자·발음이 들어 있어 storybook 을 안 기다린다.
  //    🔴 Book 3~5 는 패턴 카드(ake/bl/ee) — 낱말이면 「듣고 낱말」과 겹치고 소리도 라이브러리에 없다.
  if (activity.kind === 'review-syllable-listen' && patternCards.length) {
    return (
      <WordListenChooseActivity
        unitId={unitId}
        language="english"
        items={patternCards.map((c) => ({ label: c.syllable, sound: c.sound }))}
        choices={REVIEW_CHOICES}
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  // 🔎 글자 사냥 — 글자만 쓰는 활동이라 단어 그림을 기다리지 않는다.
  //    영어는 Book 2 가 word family(at·an)라 방해꾼도 같은 꼴로 만들어진다(모음·끝소리 교체).
  //    🔴 Book 3~5 는 패턴 카드(ake/bl/ee)를 찾는다 — 낱말(rake)이 아니라(사용자 2026-08-09).
  if (activity.kind === 'letter-hunt' && patternCards.length) {
    return (
      <LetterHuntActivity
        unitId={unitId}
        cards={patternCards}
        language="english"
        onComplete={handleComplete}
        onBack={backToUnit}
      />
    );
  }

  if (
    activity.kind === 'review-word-listen' ||
    activity.kind === 'review-flip' ||
    activity.kind === 'review-match'
  ) {
    if (reviewLoading) {
      return <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />;
    }
    const withImage = reviewSources.filter((s) => s.imageUrl);
    if (withImage.length < 3) {
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="낱말 그림이 필요해요"
        />
      );
    }
    if (activity.kind === 'review-word-listen') {
      return (
        <WordListenChooseActivity
          unitId={unitId}
          language="english"
          items={withImage.map((s) => ({
            /**
             * 🔴 Book 1 은 **보기가 글자**다 — 낱말 소리(`alligator`)를 듣고 **첫 글자**를 고른다.
             *    예전엔 낱말↔그림이라 이 화면에 알파벳이 한 글자도 안 나왔다(글자를 몰라도 통과).
             *    Book 2 는 낱말 그대로 — 거긴 패턴이 낱말 안에 있다.
             */
            label: isBook1 ? `${s.letter.toUpperCase()}${s.letter.toLowerCase()}` : s.word,
            sound: s.word,
            /**
             * 🔴 Book 1 은 **그림을 빼야** 소리→글자가 된다(2026-07-29 검수). 라벨만 글자로 바꾸고
             *    그림을 남겼더니 들린 낱말의 그림이 늘 정답 칸에 있어서 **글자를 안 보고도 만점**이었다
             *    — 모듈 문서에 이미 적혀 있던 규칙("단어 듣기 보기에 그림을 넣지 않는다")을 내가 어겼다.
             *    보기가 `Aa`·`Bb` 라 그림이 없어도 넷이 서로 구분된다(낱말 넷이면 못 읽는 아이에게
             *    다 똑같아 보이지만, 글자는 다르다).
             */
            ...(!isBook1 && s.imageUrl ? { imageUrl: s.imageUrl } : {}),
            // 🔴 **맞힌 뒤에** 열리는 그림은 별개다 — 판정이 끝난 뒤라 고르는 근거가 되지 않는다.
            //    Book 1 도 여기선 그림을 준다(글자를 고른 뒤 "그게 alligator 였구나"를 본다).
            revealImageUrl: s.imageUrl,
          }))}
          choices={REVIEW_CHOICES}
          onMarkComplete={handleMarkComplete}
          onBack={backToUnit}
        />
      );
    }
    if (activity.kind === 'review-flip') {
      return (
        <ReviewFlipMatchActivity
          unitId={unitId}
          sources={withImage}
          // 🔴 Book 1 은 **글자↔그림**으로 짝을 짓는다(글자가 목표인 권).
          //    Book 2 는 낱말↔그림 그대로 — 거긴 패턴(`_am`)이 낱말 안에 있다.
          letterFace={isBook1}
          // 🔴 이 파일에서 **여기만** language 가 빠져 있었다 — 컴포넌트 기본값이 'korean' 이라
          //    영어 낱말(dam·dad)을 한국어 음성으로 읽고 칭찬도 한국어가 나왔다.
          language="english"
          onComplete={handleComplete}
          onBack={backToUnit}
        />
      );
    }
    return (
      <LineMatchingPlayer
        storybookId={unitId}
        difficulty="easy"
        onComplete={handleComplete}
        onBack={backToUnit}
        lang="en"
        // Book 1 = 글자가 목표 — 낱말은 첫 글자만 크게.
        emphasizeFirstLabel={isBook1}
        gameData={{
          type: 'english-line-matching',
          items: withImage.slice(0, REVIEW_PAIRS).map((s) => ({
            word: s.letter,
            imageUrl: s.imageUrl,
            imageLabel: s.word,
            // 🔴 맞히면 "b b bag" 저작 녹음을 읽는다 — 없으면 LineMatchingPlayer 가 글자 소리로 폴백.
            ...(s.ttsUrl ? { ttsUrl: s.ttsUrl } : {}),
          })),
        }}
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
        language="english"
        onMarkComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }
  if (activity.kind === 'review-write' && reviewCards.length) {
    /**
     * 🔴 Book 1 은 **글자(C)를 쓰지만 소리는 낱말 "c c cat"** — reviewSources 로 대표 낱말·저작 녹음을
     *    얻어 쓰기 대상(letter)과 소리(word/ttsUrl)를 분리한다. 다른 권은 기존대로 글자/패턴을 읽는다.
     */
    if (isBook1) {
      if (reviewLoading) {
        return (
          <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />
        );
      }
      return (
        <ReviewWriteActivity
          unitId={unitId}
          language="english"
          // 🔴 글자(C)를 쓰되 소리는 낱말("c c cat"), 그림은 다 쓴 뒤에 연다(imageUrl 유지 + reveal 모드).
          revealImageOnComplete
          sources={reviewSources.map((s) => ({
            ...s,
            // 🔴 **소문자로** 쓴다 — 완성하면 나오는 낱말(apple)이 소문자라 대문자 'A' 를 쓰면 어긋난다
            //    (사용자: "쓰는 건 대문자인데 정답 단어는 소문자로 나오네"). `letter` 는 키/라벨용이라 그대로 둔다.
            word: s.letter.toLowerCase(),
            // 완성하면 낱말 전체(apple)를 보여준다 — 첫 글자(소문자)가 방금 쓴 글자와 같다.
            ...(s.word ? { soundWord: s.word, revealWord: s.word } : {}),
            ...(s.ttsUrl ? { soundUrl: s.ttsUrl } : {}),
          }))}
          onComplete={handleComplete}
          onBack={backToUnit}
        />
      );
    }
    if (isBook2) {
      // 🔴 Book 2 복습은 letter 가 패턴("ap")이라 그걸 쓰면 낱말이 아니다 — reviewSources 의 대표 낱말
      //    ("cap")을 써서 **낱말 전체**를 쓰게 한다(사용자: "ap 만 하지 말고 낱말을 써야지").
      if (reviewLoading) {
        return (
          <ActivityLoading title={activity.title} emoji={activity.emoji} onBack={backToUnit} />
        );
      }
      return (
        <ReviewWriteActivity
          unitId={unitId}
          language="english"
          sources={reviewSources.map((s) => {
            const word = s.word || s.letter;
            const patterns = getUnitPatterns(s.unitId);
            return {
              ...s,
              word,
              // 🔴 그림을 프롬프트로 보여준다(2026-08-07 사용자: "이미지도 나와줘야지") — 그림(jam)을
              //    보고 낱말을 쓴다. `...s` 의 대표 낱말 그림(s.imageUrl)이 곧 그 낱말이라 일치한다.
              // 🔴 패턴 먼저 쓰기 + 이어읽기 규칙 — 익히기·게임과 통일(각 낱말의 단원 패턴으로).
              order: patternWriteOrder(word, patterns),
              pattern: patterns.find((p) => wordMatchesPattern(word, p)),
            };
          })}
          onComplete={handleComplete}
          onBack={backToUnit}
        />
      );
    }
    // Book 3·4·5 = letter 가 이미 낱말(`bake`)이라 그대로 쓴다.
    return (
      <ReviewWriteActivity
        unitId={unitId}
        language="english"
        sources={reviewCards.map((c) => {
          const patterns = getUnitPatterns(c.unitId);
          return {
            ...c,
            word: c.letter,
            imageUrl: '',
            order: patternWriteOrder(c.letter, patterns),
            pattern: patterns.find((p) => wordMatchesPattern(c.letter, p)),
          };
        })}
        onComplete={handleComplete}
        onBack={backToUnit}
      />
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

  // 🔴 게임은 **진입 게이트**로 감싼다 — 동화 게임과 같은 방식(한글판과 동일).
  //    `game` 은 활동 kind 가 아니라 수집기가 아는 게임 id 다.
  const gate = (game: GameTypeId, gameData: object, node: ReactNode) => (
    <PhonicsGameGate
      game={game}
      gameData={gameData as { type: string; items?: Array<Record<string, unknown>> }}
      storybook={storybook}
      storybookId={unitId}
      lang="en"
    >
      {node}
    </PhonicsGameGate>
  );

  if (activity.kind === 'game-english-block') {
    const gameData = memoGame(() => phonicsToEnglishBlockData(storybook));
    if (!gameData)
      return (
        <ActivityUnavailable activity={activity} onBack={backToUnit} reason="낱말이 부족해요" />
      );
    return gate(
      'english-block',
      gameData,
      <EnglishBlockPlayer {...commonProps} gameData={gameData} />
    );
  }
  if (activity.kind === 'game-word-writing') {
    const gameData = memoGame(() => {
      // 🔴 패턴별 써보기(Book 3·4·5 익히기) — 그 패턴 낱말만. 없으면 단원 전체(Book 2 게임).
      if (!activity.pattern) return phonicsToEnglishWordWritingData(storybook);
      const seen = new Set<string>();
      const items = (storybook.phonicsLesson?.wordFamilies ?? [])
        .flatMap((f) => f.words ?? [])
        .filter(
          (w) =>
            !!w.word &&
            wordMatchesPattern(w.word, activity.pattern!) &&
            !seen.has(w.word) &&
            !!seen.add(w.word)
        )
        .map((w) => {
          const img = findImageData(storybook, w.word);
          return {
            word: w.word,
            displayWord: w.word,
            referenceImageUrl: img.imageUrl ?? '',
            ...(img.imageUrl ? { imageUrl: img.imageUrl } : {}),
            ...(w.ttsUrl ? { ttsUrl: w.ttsUrl } : {}),
          };
        });
      return items.length ? { type: 'english-word-writing' as const, items } : null;
    });
    if (!gameData)
      return (
        <ActivityUnavailable activity={activity} onBack={backToUnit} reason="낱말이 부족해요" />
      );
    return gate(
      'english-word-writing',
      gameData,
      <EnglishWordWritingPlayer {...commonProps} gameData={gameData} />
    );
  }
  if (activity.kind === 'game-line-matching') {
    const gameData = memoGame(() => phonicsToEnglishLineMatchingData(storybook));
    if (!gameData)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="낱말 그림이 필요해요"
        />
      );
    return gate(
      'english-line-matching',
      gameData,
      <LineMatchingPlayer
        {...commonProps}
        gameData={gameData}
        lang="en"
        emphasizeFirstLabel={isBook1}
      />
    );
  }
  if (activity.kind === 'game-connect-dots') {
    const gameData = memoGame(() => phonicsToConnectTheDotsData(storybook));
    if (!gameData)
      return (
        <ActivityUnavailable
          activity={activity}
          onBack={backToUnit}
          reason="낱말 그림과 점이 필요해요"
        />
      );
    return gate(
      'connect-the-dots',
      gameData,
      // 🔴 `lang` 을 안 주면 한국어로 읽는다 — 영어 단원인데 정답을 한글로 읽어주던 버그.
      <ConnectTheDotsPlayer {...commonProps} gameData={gameData} lang="en" />
    );
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
