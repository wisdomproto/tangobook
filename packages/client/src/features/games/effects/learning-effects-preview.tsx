// Local Vite entry only: no production route, TTS generation, account or progress requests.
import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@/i18n';
import '@/index.css';
import '@/design-system/learning-layouts.css';
import './learning-effects.css';
import './learning-effects-preview.css';
import { ToyHangul } from '@/features/phonics-learner/components/ToyHangul';
import { ActivityShell } from '@/features/phonics-learner/components/ActivityShell';
import { GlobalUiSound } from '@/components/GlobalUiSound';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { FeedbackOverlay } from '../components/FeedbackOverlay';
import { useGameSound } from '../hooks/useGameSound';
import { LearningEffectsHost } from './LearningEffectsHost';
import {
  clearLearningEffects,
  emitLearningEffect,
  prepareLearningEffects,
  LEARNING_EFFECTS,
} from './learning-effects';
import { playUi } from '@/lib/uiSound';

function Preview() {
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [artMode, setArtMode] = useState<'consonant' | 'vowel' | 'blend'>('consonant');
  const [showAll, setShowAll] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [complete, setComplete] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [writing, setWriting] = useState(false);
  const [version, setVersion] = useState(0);
  const seal = useRef<HTMLDivElement>(null);
  const { playCorrect, playIncorrect, isMuted, toggleMuted } = useGameSound();
  useEffect(() => {
    prepareLearningEffects();
    return clearLearningEffects;
  }, []);
  useEffect(() => {
    if (complete) {
      emitLearningEffect('complete', seal.current);
      playUi('learning-complete');
    }
  }, [complete]);
  const reset = () => {
    clearLearningEffects();
    setComplete(false);
    setFeedback(null);
    setVersion((v) => v + 1);
  };
  const content = (
    <>
      <div className="fx-preview-heading">
        <span>{language === 'ko' ? '한글 익히기' : 'Phonics'}</span>
        <h1>
          {complete
            ? '오늘의 배움이 완성됐어요'
            : writing
              ? '글자를 채워 보세요'
              : '글자를 눌러 보세요'}
        </h1>
        <p>말랑한 글자 · 자음은 살구 · 모음은 민트</p>
      </div>
      {complete ? (
        <div ref={seal} className="learning-completion-seal fx-preview-seal">
          <svg viewBox="0 0 80 80">
            <path d="M18 40 L33 55 L63 25" />
          </svg>
        </div>
      ) : writing ? (
        <LetterFillCanvas
          key={`${language}-${version}`}
          letter={language === 'ko' ? '가' : 'a'}
          autoCheck
          onResult={(passed) => {
            if (passed) setFeedback('correct');
          }}
        />
      ) : (
        <div className={`fx-preview-cards ${showAll ? 'fx-preview-cards--all' : ''}`}>
          {(language === 'en'
            ? ['a', 'b', 'c']
            : artMode === 'blend'
              ? showAll
                ? Array.from('가갸거겨고교구규그기까차강과')
                : ['ㄱ', 'ㅏ', '가']
              : artMode === 'vowel'
                ? Array.from(showAll ? 'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ' : 'ㅏㅑㅗ')
                : Array.from(showAll ? 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ' : 'ㄱㅊㅎ')
          ).map((letter, index) => (
            <button
              key={letter}
              ref={index === 0 ? cardRef : undefined}
              data-learning-fx="tap"
              aria-label={`${letter} 글자`}
              onClick={() => {}}
            >
              <span>
                {language === 'ko' ? (
                  <ToyHangul text={letter} className={showAll ? '' : '!w-[1.45em] !h-[1.45em]'} />
                ) : (
                  letter
                )}
              </span>
            </button>
          ))}
        </div>
      )}
      {!writing && !complete && (
        <div className="fx-preview-gallery" aria-label="이펙트 종류">
          {['리본 춤', '꽃 피기', '하트 물결'].map((label, variant) => (
            <button
              key={label}
              data-sound="none"
              onClick={() => {
                emitLearningEffect('correct', cardRef.current, undefined, variant);
                playCorrect();
              }}
            >
              {label}
            </button>
          ))}
          {LEARNING_EFFECTS.filter(({ kind }) => kind !== 'complete').map(({ kind, label }) => (
            <button
              key={kind}
              data-sound="none"
              onClick={() => {
                emitLearningEffect(kind, cardRef.current);
                if (kind === 'retry') playIncorrect();
                else if (['correct', 'letter', 'word', 'match', 'blend', 'streak'].includes(kind))
                  playCorrect();
                else playUi('learning-tap');
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="fx-preview-controls">
        <button
          data-sound="none"
          onClick={() => {
            emitLearningEffect('correct');
            playCorrect();
            setFeedback('correct');
          }}
        >
          정답 연출
        </button>
        <button
          data-sound="none"
          onClick={() => {
            emitLearningEffect('retry');
            playIncorrect();
            setFeedback('incorrect');
          }}
        >
          다시 시도
        </button>
        <button
          data-sound="none"
          onClick={() => {
            setFeedback(null);
            setComplete(true);
          }}
        >
          단원 완성
        </button>
        <button onClick={reset}>처음부터</button>
      </div>
    </>
  );
  return (
    <>
      <GlobalUiSound />
      <LearningEffectsHost />
      <main className="fx-preview">
        <header>
          <a href="/library">TangoBook</a>
          <span>학습 연출 검수 · 로컬</span>
        </header>
        <nav aria-label="연출 검수 설정">
          <button
            onClick={() => {
              reset();
              setLanguage('ko');
            }}
            aria-pressed={language === 'ko'}
          >
            한글
          </button>
          <button
            onClick={() => {
              reset();
              setLanguage('en');
            }}
            aria-pressed={language === 'en'}
          >
            English
          </button>
          <button
            onClick={() => {
              reset();
              setWriting(false);
              setArtMode('consonant');
              setLanguage('ko');
            }}
          >
            자음 그림
          </button>
          <button
            onClick={() => {
              reset();
              setWriting(false);
              setArtMode('vowel');
              setLanguage('ko');
            }}
          >
            모음 그림
          </button>
          <button
            onClick={() => {
              reset();
              setWriting(false);
              setArtMode('blend');
              setShowAll(false);
              setLanguage('ko');
            }}
          >
            자모 합성
          </button>
          <button
            onClick={() => {
              reset();
              setShowAll(!showAll);
            }}
          >
            {showAll ? '대표 글자' : '전체 그림'}
          </button>
          <button
            onClick={() => {
              reset();
              setWriting(!writing);
            }}
          >
            {writing ? '카드 보기' : '쓰기 보기'}
          </button>
          <button onClick={toggleMuted}>{isMuted ? '효과음 켜기' : '효과음 끄기'}</button>
          <button
            onClick={() => {
              reset();
              setFullScreen(true);
            }}
          >
            실제 활동 배치
          </button>
        </nav>
        {fullScreen ? (
          <ActivityShell
            onBack={() => {
              reset();
              setFullScreen(false);
            }}
            scroll
          >
            <div className="fx-preview-stage">{content}</div>
          </ActivityShell>
        ) : (
          <section className="learning-stage fx-preview-stage" data-learning-effects>
            {content}
          </section>
        )}
        <p className="fx-preview-note">
          실제 공통 렌더러·쓰기 캔버스·피드백·효과음을 사용합니다. 발음·학습 기록은 요청하지
          않습니다.
        </p>
      </main>
      <FeedbackOverlay
        visible={feedback !== null}
        kind={feedback ?? 'correct'}
        onDismiss={() => setFeedback(null)}
      />
    </>
  );
}
const previewRoot =
  import.meta.hot?.data.previewRoot ?? createRoot(document.getElementById('root')!);
previewRoot.render(
  <StrictMode>
    <Preview />
  </StrictMode>
);

if (import.meta.hot)
  import.meta.hot.dispose((data) => {
    data.previewRoot = previewRoot;
  });
