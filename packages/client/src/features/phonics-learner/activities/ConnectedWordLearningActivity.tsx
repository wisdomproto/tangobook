import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameTypeId, Storybook } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLogEvent } from '@/features/learning/hooks/useLogEvent';
import { VocabSourceProvider } from '@/features/learning/context/VocabSourceContext';
import { useColoringItems } from '@/features/games/hooks/useColoringSheets';
import { ColoringPlayer } from '@/features/games/components/players/ColoringPlayer';
import { KoreanBlockPlayer } from '@/features/games/components/players/KoreanBlockPlayer';
import { EnglishBlockPlayer } from '@/features/games/components/players/EnglishBlockPlayer';
import { KoreanWordWritingPlayer } from '@/features/games/components/players/KoreanWordWritingPlayer';
import { EnglishWordWritingPlayer } from '@/features/games/components/players/EnglishWordWritingPlayer';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import { ActivityShell } from '../components/ActivityShell';
import { PhonicsGameGate } from '../components/PhonicsGameGate';
import {
  findImageData,
  phonicsToKoreanBlockData,
  phonicsToEnglishBlockData,
  phonicsToWordWritingData,
  phonicsToEnglishWordWritingData,
  phonicsToConnectTheDotsData,
} from '../lib/phonics-game-adapter';
import { getBasicConsonantBlockTray } from '../lib/korean-block-tray';
import { withKoreanLearningScope } from '../lib/korean-learning-source';
import {
  advanceWordLearning,
  loadWordLearningRun,
  saveWordLearningRun,
  wordLearningStorageKey,
  wordLearningStages,
} from '../lib/word-learning-run';
import { useLearningWorkspace } from '../components/learning-workspace-context';
import { WordMeetingActivity } from './WordMeetingActivity';
import { WordLearningProgress } from '../components/WordLearningProgress';
import './word-meeting.css';

interface Props {
  unitId: string;
  book: Storybook;
  lang: 'korean' | 'english';
  onComplete: () => void;
  onBack: () => void;
}

export function ConnectedWordLearningActivity(props: Props) {
  const { activeProfile } = useAuth();
  const workspace = useLearningWorkspace();
  return (
    <WordLearningRun
      key={`${activeProfile?.id ?? 'guest'}:${props.lang}:${props.unitId}:${workspace?.practiceStage ?? 'sequence'}`}
      {...props}
    />
  );
}

function WordLearningRun({ unitId, book, lang, onComplete, onBack }: Props) {
  const { t } = useTranslation('phonics');
  const logEvent = useLogEvent();
  const key = wordLearningStorageKey(lang, unitId);
  const workspace = useLearningWorkspace();
  const practiceStage = workspace?.practiceStage;
  const publishWordActivity = workspace?.setWordActivity;
  // A ref pins the source definition for the run: query refetches cannot reset a canvas or reroll words.
  const source = useRef(lang === 'korean' ? withKoreanLearningScope(book)! : book).current;
  const [run, setRun] = useState(() => {
    const saved = loadWordLearningRun(key, source.phonicsConfig?.targetWords ?? []);
    return practiceStage ? { ...saved, id: crypto.randomUUID(), stage: practiceStage } : saved;
  });
  const completed = useRef(new Set<string>());
  const word = run.words[run.index];
  const code = lang === 'korean' ? 'ko' : 'en';
  const { items: coloring, loading: coloringLoading } = useColoringItems(source, code, true);
  const single = useMemo(
    () => ({
      ...source,
      phonicsConfig: { ...source.phonicsConfig!, targetWords: word ? [word] : [] },
    }),
    [source, word]
  );
  const tray = useMemo(
    () => (lang === 'korean' ? getBasicConsonantBlockTray(unitId) : undefined),
    [lang, unitId]
  );
  const blocks = useMemo(
    () =>
      lang === 'korean'
        ? phonicsToKoreanBlockData(single, tray)
        : unitId.startsWith('en-b1')
          ? null
          : phonicsToEnglishBlockData(single, 8),
    [single, lang, tray, unitId]
  );
  const writing = useMemo(
    () =>
      lang === 'korean'
        ? phonicsToWordWritingData(single)
        : phonicsToEnglishWordWritingData(single),
    [single, lang]
  );
  const dots = useMemo(() => phonicsToConnectTheDotsData(single), [single]);
  const colorItems = useMemo(
    () => coloring.filter((item) => item.word.toLowerCase() === word?.toLowerCase()),
    [coloring, word]
  );
  const extra = useMemo(() => (word ? findImageData(source, word) : {}), [source, word]);
  const stages = wordLearningStages(unitId);
  useEffect(() => {
    publishWordActivity?.(word ? { unitId, word, stage: run.stage } : null);
    return () => publishWordActivity?.(null);
  }, [publishWordActivity, unitId, word, run.stage]);
  const finishStage = () => {
    const id = `${run.id}:${run.index}:${run.stage}`;
    if (completed.current.has(id)) return;
    completed.current.add(id);
    const next = advanceWordLearning(run, stages);
    if (!practiceStage) saveWordLearningRun(key, next);
    logEvent({
      type: run.stage === 'meet' ? 'word_exposed' : 'word_correct',
      storybookId: unitId,
      word,
      metadata: {
        schemaVersion: 2,
        source: 'phonics',
        unitId,
        lang: code,
        activityId: 'word-learning',
        activityRunId: run.id,
        skill:
          run.stage === 'block'
            ? 'building'
            : run.stage === 'write'
              ? 'tracing'
              : run.stage === 'color'
                ? 'drawing'
                : 'participation',
        evidence: 'completion',
        learningMode: 'practice',
        modelVisible: true,
        practiceCompleted: true,
        independent: false,
        practiceStage: run.stage,
        targetWord: word,
        practiceTarget:
          run.stage === 'write' ? (writing?.items[0]?.traceWord ?? writing?.items[0]?.word) : word,
      },
    });
    if (practiceStage) onBack();
    else if (next.index >= run.words.length) onComplete();
    else setRun(next);
  };
  if (!word || !writing || (!unitId.startsWith('en-b1') && !blocks))
    return (
      <ActivityShell unitId={unitId} onBack={onBack}>
        <p role="alert" className="word-learning-missing">
          {t('wordJourney.noTargets')}
        </p>
      </ActivityShell>
    );

  let content;
  const playerProps = {
    storybookId: source.id,
    difficulty: 'easy' as const,
    onBack,
    onComplete: (score: number, maxScore: number) => {
      if (maxScore > 0 && score >= maxScore) finishStage();
    },
    connectedPractice: true,
    initialInputMode: run.inputMode,
    onInputModeSelected: (inputMode: 'screen' | 'camera') => {
      const next = { ...run, inputMode };
      if (!practiceStage) saveWordLearningRun(key, next);
      setRun(next);
    },
  };
  let game: GameTypeId | undefined;
  let data: unknown;
  if (run.stage === 'meet')
    content = (
      <WordMeetingActivity
        word={word}
        words={run.words}
        book={source}
        unitId={unitId}
        lang={lang}
        imageUrl={extra.imageUrl}
        ttsUrl={extra.ttsUrl}
        onBack={onBack}
        onComplete={finishStage}
      />
    );
  if (run.stage === 'block' && blocks) {
    data = blocks;
    game = lang === 'korean' ? 'korean-block' : 'english-block';
    content =
      lang === 'korean' ? (
        <KoreanBlockPlayer {...playerProps} gameData={blocks} trayLetters={tray} />
      ) : (
        <EnglishBlockPlayer {...playerProps} gameData={blocks} />
      );
  }
  if (run.stage === 'write') {
    data = writing;
    game = lang === 'korean' ? 'korean-word-writing' : 'english-word-writing';
    content =
      lang === 'korean' ? (
        <KoreanWordWritingPlayer {...playerProps} gameData={writing} />
      ) : (
        <EnglishWordWritingPlayer {...playerProps} gameData={writing} />
      );
  }
  if (run.stage === 'color') {
    if (coloringLoading)
      content = (
        <ActivityShell unitId={unitId} onBack={onBack}>
          <p className="word-learning-missing" role="status">
            {t('wordJourney.preparingColor')}
          </p>
        </ActivityShell>
      );
    else if (colorItems.length)
      content = (
        <ColoringPlayer items={colorItems} onBack={onBack} onDone={finishStage} connectedPractice />
      );
    else if (dots) {
      data = dots;
      game = 'connect-the-dots';
      content = <ConnectTheDotsPlayer {...playerProps} lang={code} gameData={dots} />;
    } else
      content = (
        <ActivityShell unitId={unitId} onBack={onBack}>
          <div className="word-learning-missing" role="alert">
            <p>{t('wordJourney.colorUnavailable')}</p>
            <button className="word-meet-button" onClick={onBack}>
              {t('common.back')}
            </button>
          </div>
        </ActivityShell>
      );
  }
  // A legacy URL/session cannot silently claim a stage that the current source cannot supply.
  if (!content)
    return (
      <ActivityShell unitId={unitId} onBack={onBack}>
        <p role="alert" className="word-learning-missing">
          {t('wordJourney.sourceChanged')}
        </p>
      </ActivityShell>
    );
  const ownedContent = (
    <VocabSourceProvider source="phonics" unitId={unitId} suppressGameEvents>
      {content}
    </VocabSourceProvider>
  );
  return (
    <>
      <div key={`${run.id}:${run.index}:${run.stage}`} data-word-learning-active>
        {game && data ? (
          <PhonicsGameGate
            game={game}
            gameData={data as Parameters<typeof PhonicsGameGate>[0]['gameData']}
            storybook={source}
            storybookId={source.id}
            lang={code}
          >
            {ownedContent}
          </PhonicsGameGate>
        ) : (
          ownedContent
        )}
      </div>
      <WordLearningProgress
        language={code}
        stages={stages}
        current={run.stage}
        index={run.index}
        total={run.words.length}
      />
    </>
  );
}
