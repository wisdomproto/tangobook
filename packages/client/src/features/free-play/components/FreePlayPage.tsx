import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StorybookBackdrop } from '@/design-system/primitives/StorybookBackdrop';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import { VocabSourceProvider } from '@/features/learning/context/VocabSourceContext';
import { GameHomeContext } from '@/features/games/components/GameHomeContext';
import { useSeo } from '@/lib/useSeo';
import { useFreePlayRound } from '../hooks/useFreePlayRound';
import {
  freePlayArt,
  freePlayLabelKey,
  freePlayLanguage,
  isFreePlayKind,
  type FreePlayKind,
  type FreePlayLanguage,
} from '../lib/free-play-options';
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
const EnglishBlockPlayer = lazy(() =>
  import('@/features/games/components/players/EnglishBlockPlayer').then((m) => ({
    default: m.EnglishBlockPlayer,
  }))
);
const EnglishWritingPlayer = lazy(() =>
  import('@/features/games/components/players/EnglishWordWritingPlayer').then((m) => ({
    default: m.EnglishWordWritingPlayer,
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
  lang,
  message,
  retry,
}: {
  kind: FreePlayKind;
  lang: FreePlayLanguage;
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
        onClick={() => navigate(`/library?playLang=${lang}`)}
        aria-label={t('freePlay.home')}
      >
        <StorybookSprite name="home" size={42} />
      </button>
      <img
        src={`/images/learning/vocabulary-menu-v1/${freePlayArt(kind, lang)}`}
        alt=""
        width={240}
        height={180}
      />
      <h1>{t(freePlayLabelKey(kind, lang))}</h1>
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
  lang,
  session,
  restart,
}: {
  kind: FreePlayKind;
  lang: FreePlayLanguage;
  session: string;
  restart: () => void;
}) {
  const { t } = useTranslation('shell');
  const navigate = useNavigate();
  const round = useFreePlayRound(kind, session, lang);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const back = () => navigate(`/library?playLang=${lang}`);
  if (round.isError)
    return <Preparation kind={kind} lang={lang} message={t('freePlay.error')} retry={restart} />;
  if (round.isPending)
    return <Preparation kind={kind} lang={lang} message={t('freePlay.preparing')} />;
  const data = round.data;
  if (!data)
    return <Preparation kind={kind} lang={lang} message={t('freePlay.empty')} retry={restart} />;
  const WordWritingPlayer = lang === 'en' ? EnglishWritingPlayer : WritingPlayer;
  return (
    <GameHomeContext.Provider value={`/library?playLang=${lang}`}>
      <VocabSourceProvider source="storybook" unitId={data.bookId}>
        <Suspense
          fallback={<Preparation kind={kind} lang={lang} message={t('freePlay.preparing')} />}
        >
          {result ? (
            <Result
              score={result.score}
              total={result.total}
              storybookId={data.bookId}
              lang={lang}
              onRestart={() => setResult(null)}
              onBack={back}
            />
          ) : data.kind === 'blocks' ? (
            data.data.type === 'english-block' ? (
              <EnglishBlockPlayer
                storybookId={data.bookId}
                gameData={data.data}
                difficulty="easy"
                initialInputMode="screen"
                onComplete={() => {}}
                onBack={back}
              />
            ) : (
              <BlockPlayer
                storybookId={data.bookId}
                gameData={data.data}
                difficulty="easy"
                initialInputMode="screen"
                trayLetters={{
                  consonants: [
                    ...new Set(
                      data.data.items.flatMap((item) =>
                        item.syllables.map((syllable) => syllable.cho)
                      )
                    ),
                  ],
                  vowels: ['ㅣ', 'ㅏ', 'ㅑ'],
                }}
                onComplete={() => {}}
                onBack={back}
              />
            )
          ) : data.kind === 'writing' ? (
            <WordWritingPlayer
              storybookId={data.bookId}
              gameData={data.data}
              difficulty="easy"
              onComplete={(score, total) => setResult({ score, total })}
              onBack={back}
            />
          ) : data.kind === 'hidden-object' ? (
            <HiddenPlayer
              lang={lang}
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
                  ttsUrl: data.ttsUrl,
                  language: lang === 'en' ? 'english' : 'korean',
                  lang,
                },
              ]}
              onBack={back}
            />
          )}
        </Suspense>
      </VocabSourceProvider>
    </GameHomeContext.Provider>
  );
}

function FreePlay({ kind, lang }: { kind: FreePlayKind; lang: FreePlayLanguage }) {
  const { t } = useTranslation('shell');
  const [session, setSession] = useState(() => crypto.randomUUID());
  useSeo({
    title: `${t(freePlayLabelKey(kind, lang))} | ${t('freePlay.title')} | 탱고북`,
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
      lang={lang}
      session={session}
      restart={() => setSession(crypto.randomUUID())}
    />
  );
}

export default function FreePlayPage() {
  const { kind } = useParams();
  const [params] = useSearchParams();
  const lang = freePlayLanguage(params.get('lang'));
  return isFreePlayKind(kind) ? (
    <FreePlay key={`${kind}-${lang}`} kind={kind} lang={lang} />
  ) : (
    <Navigate to="/library" replace />
  );
}
