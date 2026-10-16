import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@/i18n';
import '@/index.css';
import '@/lib/audio-unlock';
import { HangulPopitActivity } from '@/features/phonics-learner/activities/HangulPopitActivity';
import { ActivityShell } from '@/features/phonics-learner/components/ActivityShell';
import { HangulPopit } from '@/features/phonics-learner/components/HangulPopit';
import {
  POPIT_ALPHABET,
  POPIT_LETTERS,
  hasPopitLetter,
} from '@/features/phonics-learner/lib/popit-letter-designs';
import './letter-popit-check.css';
import { useTranslation } from 'react-i18next';

const sizes = [
  [1280, 720],
  [1024, 768],
  [844, 390],
  [568, 320],
];
const params = new URLSearchParams(location.search);
function Stage() {
  const { t } = useTranslation('phonics');
  const [passed, setPassed] = useState(false);
  const l = params.get('letter') ?? 'ㅏ';
  const letter = hasPopitLetter(l) ? l : 'ㅏ';
  const english = /^[A-Za-z]$/.test(letter);
  return (
    <>
      <HangulPopitActivity
        unitId={english ? 'en-b1-u01' : 'kr-h1-u01'}
        letter={letter}
        sound={english ? letter.toLowerCase() : letter}
        language={english ? 'english' : 'korean'}
        caption={
          english
            ? t(letter === letter.toUpperCase() ? 'alphabetWrite.upper' : 'alphabetWrite.lower', {
                letter,
              })
            : undefined
        }
        prefix={english ? 'en-letter' : /[ㅏ-ㅣ]/.test(letter) ? 'phonics-vowel' : 'consonant-tap'}
        onComplete={() => setPassed(true)}
        onBack={() => history.back()}
      />
      <output className="popit-check-result" data-passed={passed}>
        {passed ? '완료' : '입력 대기'}
      </output>
    </>
  );
}
/** All real SVG/button layouts share one shell for a fast read-only geometry audit.
 * This mode does not play audio, dispatch input or write learning progress. */
function LayoutAudit() {
  const { t } = useTranslation('phonics');
  return (
    <ActivityShell unitId="kr-h1-u01" kind="explore" onBack={() => history.back()}>
      <div className="popit-layout-stack">
        {POPIT_ALPHABET.map((letter) => (
          <section className="popit-stage" key={letter} data-layout-letter={letter}>
            <h2 className="popit-prompt">
              {/[A-Za-z]/.test(letter) && (
                <small>
                  {t(
                    letter === letter.toUpperCase() ? 'alphabetWrite.upper' : 'alphabetWrite.lower',
                    { letter }
                  )}
                </small>
              )}
              {t('popit.prompt')}
            </h2>
            <div className="popit-play-space">
              <HangulPopit letter={letter} popped={new Set()} onPop={() => {}} complete={false} />
            </div>
            <div className="popit-footer">
              <div className="popit-progress">
                {POPIT_LETTERS[letter].points.map((_, i) => (
                  <span key={i} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </ActivityShell>
  );
}
function Review() {
  const [letter, setLetter] = useState('ㅏ');
  const [size, setSize] = useState(0);
  const [version, setVersion] = useState(0);
  const [gallery, setGallery] = useState(false);
  const [layout, setLayout] = useState(false);
  const [page, setPage] = useState(0);
  return (
    <div className="popit-check">
      <header>
        <strong>팝잇 92자 검수</strong>
        <select
          aria-label="글자 선택"
          value={letter}
          onChange={(e) => {
            setLetter(e.target.value);
            setGallery(false);
            setLayout(false);
          }}
        >
          {POPIT_ALPHABET.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select
          aria-label="화면 크기"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        >
          {sizes.map(([w, h], i) => (
            <option key={w} value={i}>
              {w}×{h}
            </option>
          ))}
        </select>
        <button onClick={() => setVersion((v) => v + 1)}>다시 누르기</button>
        <button
          onClick={() => {
            setLetter(POPIT_ALPHABET[(POPIT_ALPHABET.indexOf(letter) + 1) % POPIT_ALPHABET.length]);
            setGallery(false);
          }}
        >
          다음 글자
        </button>
        <button onClick={() => setGallery((v) => !v)}>
          {gallery ? '활동 보기' : '전체 모양 보기'}
        </button>
        <button
          onClick={() => {
            setGallery(false);
            setLayout((v) => !v);
          }}
        >
          전체 크기 검사
        </button>
        <span>학생 진도에 기록하지 않는 개발용 검수입니다.</span>
      </header>
      {gallery ? (
        <>
          <div className="popit-gallery-controls">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))}>이전 묶음</button>
            <span>
              {page + 1} / {Math.ceil(POPIT_ALPHABET.length / 12)}
            </span>
            <button onClick={() => setPage((p) => Math.min(7, p + 1))}>다음 묶음</button>
          </div>
          <div className="popit-gallery">
            {POPIT_ALPHABET.slice(page * 12, page * 12 + 12).map((l) => (
              <article key={l}>
                <div className="popit-play-space">
                  <HangulPopit
                    letter={l}
                    popped={new Set()}
                    onPop={() => {}}
                    complete={false}
                    locked
                  />
                </div>
                <b>{l}</b>
              </article>
            ))}
          </div>
        </>
      ) : (
        <iframe
          key={`${letter}-${version}`}
          title="실제 팝잇 활동"
          width={sizes[size][0]}
          height={sizes[size][1]}
          src={`/letter-popit-check.html?view=${layout ? 'layout' : 'stage'}&letter=${encodeURIComponent(letter)}`}
        />
      )}
    </div>
  );
}
if (import.meta.env.DEV) {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    params.get('view') === 'stage' ? (
      <Stage />
    ) : params.get('view') === 'layout' ? (
      <LayoutAudit />
    ) : (
      <Review />
    )
  );
  import.meta.hot?.dispose(() => root.unmount());
}
