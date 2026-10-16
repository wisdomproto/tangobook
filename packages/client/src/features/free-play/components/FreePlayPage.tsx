import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StorybookBackdrop } from '@/design-system/primitives/StorybookBackdrop';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import { VocabSourceProvider } from '@/features/learning/context/VocabSourceContext';
import { useSeo } from '@/lib/useSeo';
import { useFreePlayRound } from '../hooks/useFreePlayRound';
import { FREE_PLAYS, isFreePlayKind, type FreePlayKind } from '../lib/free-play-options';
import './free-play-page.css';

const BlockPlayer = lazy(() =>
  import('@/features/games/components/players/KoreanBlockPlayer').then((m) => ({
    default: m.KoreanBlockPlayer,
  }))
);
const WritingPlayer = lazy(() =>
  import('@/features/games/components/players/KoreanWordWritingPlayer').then((m) => ({
    default: m.KoreanWordWritingPlayer,
  }))
);
const ColoringPlayer = lazy(() =>
  import('@/features/games/components/players/ColoringPlayer').then((m) => ({
    default: m.ColoringPlayer,
  }))
);
const HiddenPlayer = lazy(() =>
  import('@/features/games/components/players/HiddenObjectPlayer').then((m) => ({
    default: m.HiddenObjectPlayer,
  }))
);
const Result = lazy(() =>
  import('@/features/games/components/GameResultScreen').then((m) => ({
    default: m.GameResultScreen,
  }))
);

function Preparation({
  kind,
  message,
  retry,
}: {
  kind: FreePlayKind;
  message: string;
  retry?: () => void;
}) {
  const { t } = useTranslation('shell');
  const navigate = useNavigate();
  return (
    <main className="storybook-scope free-play-preparation">
      <StorybookBackdrop />
      <button
        className="free-play-home"
        onClick={() => navigate('/library')}
        aria-label={t('freePlay.home')}
      >
        <StorybookSprite name="home" size={42} />
      </button>
      <img
        src={`/images/learning/vocabulary-menu-v1/${FREE_PLAYS.find((entry) => entry.kind === kind)!.art}`}
        alt=""
        width={240}
        height={180}
      />
      <h1>{t(`freePlay.${kind}`)}</h1>
      <p role="status">{message}</p>
      {retry && (
        <button className="free-play-retry" onClick={retry}>
          {t('freePlay.retry')}
        </button>
      )}
    </main>
  );
}

function PlaySession({
  kind,
  session,
  restart,
}: {
  kind: FreePlayKind;
  session: string;
  restart: () => void;
}) {
  const { t } = useTranslation('shell');
  const navigate = useNavigate();
  const round = useFreePlayRound(kind, session);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const back = () => navigate('/library');
  if (round.isError)
    return <Preparation kind={kind} message={t('freePlay.error')} retry={restart} />;
  if (round.isPending) return <Preparation kind={kind} message={t('freePlay.preparing')} />;
  const data = round.data;
  if (!data) return <Preparation kind={kind} message={t('freePlay.empty')} retry={restart} />;
  return (
    <VocabSourceProvider source="storybook" unitId={data.bookId}>
      <Suspense fallback={<Preparation kind={kind} message={t('freePlay.preparing')} />}>
        {result ? (
          <Result
            score={result.score}
            total={result.total}
            storybookId={data.bookId}
            lang="ko"
            onRestart={() => setResult(null)}
            onBack={back}
          />
        ) : data.kind === 'blocks' ? (
          <BlockPlayer
            storybookId={data.bookId}
            gameData={data.data}
            difficulty="easy"
            initialInputMode="screen"
            trayLetters={{
              consonants: [
                ...new Set(
                  data.data.items.flatMap((item) => item.syllables.map((syllable) => syllable.cho))
                ),
              ],
              vowels: ['ㅣ', 'ㅏ', 'ㅑ'],
            }}
            onComplete={() => {}}
            onBack={back}
          />
        ) : data.kind === 'writing' ? (
          <WritingPlayer
            storybookId={data.bookId}
            gameData={data.data}
            difficulty="easy"
            onComplete={(score, total) => setResult({ score, total })}
            onBack={back}
          />
        ) : data.kind === 'hidden-object' ? (
          <HiddenPlayer
            storybookId={data.bookId}
            gameData={data.data}
            difficulty="easy"
            onComplete={() => {}}
            onBack={back}
          />
        ) : (
          <ColoringPlayer
            items={[
              {
                word: data.entry.word,
                lineartUrl: data.entry.lineartUrl,
                originalUrl: data.entry.originalUrl,
                colorSourceUrl:
                  data.entry.answerUrl || data.entry.originalUrl || data.entry.lineartUrl,
                storybookId: data.bookId,
                language: 'korean',
                lang: 'ko',
              },
            ]}
            onBack={back}
          />
        )}
      </Suspense>
    </VocabSourceProvider>
  );
}

function FreePlay({ kind }: { kind: FreePlayKind }) {
  const { t } = useTranslation('shell');
  const [session, setSession] = useState(() => crypto.randomUUID());
  useSeo({
    title: `${t(`freePlay.${kind}`)} | ${t('freePlay.title')} | 탱고북`,
    path: `/library/play/${kind}`,
  });
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <PlaySession
      key={session}
      kind={kind}
      session={session}
      restart={() => setSession(crypto.randomUUID())}
    />
  );
}

export default function FreePlayPage() {
  const { kind } = useParams();
  return isFreePlayKind(kind) ? (
    <FreePlay key={kind} kind={kind} />
  ) : (
    <Navigate to="/library" replace />
  );
}
