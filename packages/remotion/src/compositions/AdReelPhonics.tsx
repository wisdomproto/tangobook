import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import { layout, bgmLevelAt, absoluteSfx, type Scene } from './adreel/timeline';

// 한글 파닉스 광고 릴스 — docs/marketing/drafts/ad-reel-phonics-2026-07-28-plan.md.
// 9:16 · 1080×1920 · 30fps. 화면은 전부 실촬 클립(public/phonics/clips)이고
// 여기서 얹는 것은 자막·오디오·CTA 뿐이다.
//
// 🔴 **순서는 「사용자 여정」이 아니라 「광고 구조」다**(2026-08-13 개편).
//    예전엔 라이브러리 ☰ → 파닉스 → 한글 파닉스 → 단원 → 게임 순으로 앱을 그대로 따라갔다.
//    그 결과 **첫 앱 소리가 13.40초**(릴스의 33%)였고 앞부분이 통째로 「메뉴 여는 구경」이었다.
//    광고에서 스크롤을 멈추는 건 첫 2~3초라 이 구조는 그 자체가 이탈 지점이다.
//    → 소리가 나는 게임 씬(c4-tap)을 **맨 앞으로** 올려 첫 소리를 **1.43초**로 당겼다.
//      게임 → 라이브러리로 되돌아가는 컷은 의도된 **패턴 인터럽트**다.
//    → 썸네일 60f→30f. 인스타·유튜브 커버용 f0 은 지켜야 하니 없애진 않고 1초로 줄였다.
// 🔴 탭과 합체를 떼어놓으면 「ㄱ ㅏ ㄱ ㅏ」에 결말이 없다 — 한 클립(c5-blend)으로 붙였다.
// 🔴 오디오 앵커는 전부 클립 픽셀 실측이다. 클립을 다시 자르면 여기 숫자도 다시 재야 한다.
// 🔴 클립은 전부 씬 길이와 프레임 단위로 정확히 일치한다(footage 여유 0) — 씬을 **늘릴 수는
//    없고 줄일 수만** 있다. 줄이면 클립 뒷부분이 잘린다.
// 기존 AdReel / AdReelV2 / components/reels 는 라이브 릴스와 얽혀 있어 건드리지 않는다.

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

export const PHX_FPS = 30;
export const PHX_WIDTH = 1080;
export const PHX_HEIGHT = 1920;

const CORAL = '#FF5E3A';
const ACCENT = '#FFE08A'; // 무료 메시지 강조 — 어두운 스크림 위에서 흰색과 구분된다
const CREAM = '#FFF6EE';

const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// 자막은 각 씬이 끝나기 0.15초(4.5f) 전에 사라진다.
const tail = (frame: number, dur: number) => interpolate(frame, [dur - 7.5, dur - 4.5], [1, 0], C);

type Line = { text: string; at: number; accent?: boolean };

// 실촬 배경이 밝은 크림·복숭아색이라 흰 글씨만으로는 안 읽힌다 → 하단 스크림 + 그림자.
const Subtitle: React.FC<{ lines: Line[]; dur: number }> = ({ lines, dur }) => {
  const frame = useCurrentFrame();
  const out = tail(frame, dur);
  const first = lines[0].at;
  const scrim = interpolate(frame, [first, first + 6], [0, 1], C) * out;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 66%, rgba(0,0,0,0.28) 86%, rgba(0,0,0,0.4) 100%)',
          opacity: scrim,
        }}
      />
      <div
        style={{
          position: 'relative',
          // 🔴 인스타 릴스 하단 UI(캡션·버튼)가 1920px 의 아래 ~13% 를 먹는다 — 132 이면 가려진다.
          paddingBottom: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
        }}
      >
        {lines.map((l) => (
          <div
            key={l.text}
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 64,
              color: l.accent ? ACCENT : '#fff',
              textAlign: 'center',
              lineHeight: 1.28,
              wordBreak: 'keep-all',
              maxWidth: 920,
              // 🔴 실촬 배경엔 흰 카드가 자주 깔린다 — 그라데이션만으로는 흰 글씨가 묻히므로
              //    줄마다 어두운 판을 깐다.
              backgroundColor: 'rgba(18,14,12,0.62)',
              borderRadius: 28,
              padding: '12px 34px',
              textShadow: '0 4px 18px rgba(0,0,0,0.55)',
              opacity: interpolate(frame, [l.at, l.at + 6], [0, 1], C) * out,
              transform: `translateY(${interpolate(frame, [l.at, l.at + 6], [26, 0], C)}px)`,
            }}
          >
            {l.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// 씬의 `overlap` 만큼 페이드인 = 디졸브. 앞 씬 Sequence 가 그만큼 겹쳐 살아 있으니
// 위에 얹히는 이 씬이 서서히 나타나면 크로스페이드가 된다.
// 🔴 실촬 씬끼리의 하드컷이 뒤로 갈수록 세졌다(프레임간 변화 중앙값 0.02 기준 11.7 → 50.1).
//    전환 프레임이 0이라 화면이 쾅 바뀌는데, 마침 소리도 그 자리에서 끊겨 거칠게 느껴졌다.
//    소리는 절대 프레임으로 빼서 컷을 넘기고(L-cut), 그림은 여기서 겹친다.
const SceneFade: React.FC<{ overlap: number; children: React.ReactNode }> = ({
  overlap,
  children,
}) => {
  const frame = useCurrentFrame();
  if (!overlap) return <>{children}</>;
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [0, overlap], [0, 1], C) }}>
      {children}
    </AbsoluteFill>
  );
};

const Clip: React.FC<{ src: string; zoomTo?: number; dur?: number }> = ({ src, zoomTo, dur }) => {
  const frame = useCurrentFrame();
  const scale = zoomTo && dur ? interpolate(frame, [0, dur], [1, zoomTo], C) : 1;
  return (
    <OffthreadVideo
      src={staticFile(src)}
      muted
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${scale})`,
      }}
    />
  );
};

// ── 합체 씬 오버레이 (씬5 = 탭 4번 → 합체 → 이어읽기) ──────────────────────
// 🔴 알약·큰 글씨는 앱의 `가` 카드(y≈1200~1450)와 안내문(y≈1100)을 피해
//    음절 목록 아래 빈 띠(y≈550~1050)에 놓는다.
// 🔴 소리를 「가」 단독(syl-ga)으로 바꾸면서 큰 글씨도 **붙는 순간(로컬 f74)** 에 맞춘다.
//    이어읽기(blend-ga)를 쓰던 때는 그 음원 안에서 「가」가 1.71초 뒤에 나와 f125 였다 —
//    소리를 갈면 이 숫자도 같이 옮겨야 한다.
//    알약(ㄱ 하고 ㅏ 하고)은 탭하는 동안만 떠 있고 합체 직전에 걷힌다.
const S5_MERGE = 74;
const S5_GA = 74;

const BlendOverlay: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pillOp =
    interpolate(frame, [0, 6], [0, 1], C) *
    interpolate(frame, [S5_MERGE - 8, S5_MERGE - 2], [1, 0], C);
  const gaPop = spring({ frame: frame - S5_GA, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 520 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 52,
            color: CORAL,
            backgroundColor: '#fff',
            borderRadius: 999,
            padding: '20px 48px',
            opacity: pillOp,
            wordBreak: 'keep-all',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          }}
        >
          ㄱ 하고 ㅏ 하고
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 470 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 300,
            lineHeight: 1,
            color: CORAL,
            textShadow: '0 0 26px rgba(255,255,255,0.95), 0 10px 30px rgba(0,0,0,0.2)',
            opacity: frame < S5_GA ? 0 : tail(frame, dur),
            transform: `scale(${frame < S5_GA ? 0 : gaPop})`,
          }}
        >
          가
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── 썸네일 (맨 앞) ──────────────────────────────────────────────────────────
// 🔴 인스타·유튜브가 **첫 프레임을 기본 커버로** 쓴다 — 그래서 f0 부터 완성된 상태로 보이게
//    페이드인을 두지 않고, 요소만 살짝 늦게 앉힌다.
const Thumbnail: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CORAL,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 44,
          padding: '30px 46px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          transform: `scale(${0.94 + 0.06 * pop})`,
        }}
      >
        <Img src={staticFile('reels/logo/logo-kr.webp')} style={{ width: 560 }} />
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 132,
          color: '#fff',
          lineHeight: 1.1,
          textAlign: 'center',
          wordBreak: 'keep-all',
          textShadow: '0 8px 26px rgba(0,0,0,0.22)',
        }}
      >
        한글 파닉스
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 56,
          color: '#fff',
          backgroundColor: 'rgba(0,0,0,0.16)',
          borderRadius: 999,
          padding: '18px 46px',
          wordBreak: 'keep-all',
        }}
      >
        4~7세 · 32단원
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 48,
          color: ACCENT,
          marginTop: 8,
          wordBreak: 'keep-all',
          // 🔴 페이드인을 두지 않는다 — f0 이 그대로 커버라 이 줄이 빠져 보인다.
        }}
      >
        회원가입만 하면 한 달 무료
      </div>
    </AbsoluteFill>
  );
};

// ── 커리큘럼 블록 (합성) ────────────────────────────────────────────────────
// 🔴 숫자는 실제 커리큘럼이다(한글1 기본음절 15 · 한글2 받침 7 · 한글3 쌍자음 5 · 한글4 복잡한 모음 5 = 32).
const BOOKS = [
  { n: 1, title: '기본 음절', sample: 'ㄱ ㄴ ㄷ · ㅏ ㅑ ㅓ', units: 15 },
  { n: 2, title: '받침', sample: 'ㄱ ㄴ ㄹ ㅁ ㅂ ㅅ ㅇ', units: 7 },
  { n: 3, title: '쌍자음', sample: 'ㄲ ㄸ ㅃ ㅆ ㅉ', units: 5 },
  { n: 4, title: '복잡한 모음', sample: 'ㅘ ㅙ ㅚ ㅝ ㅞ', units: 5 },
];

const CurriculumBlocks: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 26,
        padding: '0 56px',
      }}
    >
      {BOOKS.map((b, i) => {
        const pop = spring({ frame: frame - i * 7, fps, config: { damping: 13 } });
        return (
          <div
            key={b.n}
            style={{
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: 40,
              borderLeft: `18px solid ${CORAL}`,
              padding: '30px 40px',
              boxShadow: '0 14px 34px rgba(0,0,0,0.09)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              transform: `scale(${pop})`,
              opacity: pop,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily, fontWeight: 800, fontSize: 38, color: CORAL }}>
                Book {b.n}
              </div>
              <div
                style={{
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 78,
                  color: '#241a16',
                  lineHeight: 1.1,
                  wordBreak: 'keep-all',
                }}
              >
                {b.title}
              </div>
              <div style={{ fontFamily, fontWeight: 700, fontSize: 40, color: '#8a7a72' }}>
                {b.sample}
              </div>
            </div>
            <div
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: 44,
                color: CORAL,
                backgroundColor: '#FFEDE6',
                borderRadius: 999,
                padding: '14px 28px',
                whiteSpace: 'nowrap',
              }}
            >
              {b.units}단원
            </div>
          </div>
        );
      })}
      <div
        style={{
          marginTop: 14,
          fontFamily,
          fontWeight: 800,
          fontSize: 76,
          color: CORAL,
          opacity: interpolate(frame, [dur - 27, dur - 18], [0, 1], C),
          transform: `translateY(${interpolate(frame, [dur - 27, dur - 18], [30, 0], C)}px)`,
        }}
      >
        한글 32단원
      </div>
    </AbsoluteFill>
  );
};

// ── CTA ────────────────────────────────────────────────────────────────────
// 🔴 씬이 44프레임(1.47초)뿐이라 내부 타이밍을 압축했다 — 로고 팝 0 → 2줄 6~14 →
//    알약 14 → 작은 글씨 22~30. 원래 값(12/27/39~48)이면 알약과 작은 글씨가 화면에 못 온다.
const Cta: React.FC = () => {
  const raw = useCurrentFrame();
  const frame = raw - 4; // 디졸브 4프레임 뒤가 씬의 0초
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  const pillPop = spring({ frame: frame - 26, fps, config: { damping: 11 } });
  return (
    // 디졸브는 SceneFade(overlap)가 건다 — 여기서 또 페이드하면 두 번 겹친다.
    <AbsoluteFill
      style={{ backgroundColor: CORAL, justifyContent: 'center', alignItems: 'center' }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 44,
          padding: '40px 56px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          transform: `scale(${pop})`,
        }}
      >
        <Img src={staticFile('reels/logo/logo-kr.webp')} style={{ width: 700 }} />
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          // 96 이면 「회원가입만 하면」이 1080 폭을 넘는다.
          fontSize: 84,
          color: '#fff',
          marginTop: 48,
          textAlign: 'center',
          lineHeight: 1.2,
          whiteSpace: 'pre-line',
          wordBreak: 'keep-all',
          transform: `translateY(${interpolate(frame, [10, 22], [40, 0], C)}px)`,
          opacity: interpolate(frame, [10, 22], [0, 1], C),
        }}
      >
        {'회원가입만 하면\n한 달 무료'}
      </div>
      <div
        style={{
          marginTop: 48,
          backgroundColor: '#fff',
          borderRadius: 999,
          padding: '20px 56px',
          fontFamily,
          fontWeight: 800,
          fontSize: 56,
          color: CORAL,
          transform: `scale(${pillPop})`,
        }}
      >
        tangobook.co.kr
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily,
          fontWeight: 700,
          fontSize: 36,
          color: 'rgba(255,255,255,0.92)',
          opacity: interpolate(frame, [38, 48], [0, 1], C),
          wordBreak: 'keep-all',
        }}
      >
        결제 연동 없이
      </div>
    </AbsoluteFill>
  );
};

// ── 씬 배열 ────────────────────────────────────────────────────────────────
// 🔴 예전엔 한 타임라인에 `from` 을 손으로 적었다. 클립 하나를 다시 자를 때마다 뒤 씬 `from` 과
//    오디오 앵커 수십 개가 같이 틀어져, 하루에 다섯 번 전체를 밀었다(+126/−40/−36/+24/+36).
//    → 씬은 **로컬 프레임 0부터**, 소리도 **씬 안에 로컬로**. `from` 은 `layout()` 이 누적한다.
//    → memory `ad-reel-scene-based-authoring-2026-07-28`

const BGM_BASE = 0.35;

/** 씬5(합체) 앵커 — 클립 로컬. sfx 와 **BGM 인터럽트가 같은 상수를 본다**. */
const BLEND = { taps: [21, 49, 76, 104], merge: 121, clear: 139 };
/** 씬4(ㄱ 소리) 앵커 — 점1 · 점2 · ✓ 뒤집기 · 낱말 그림. */
const TAP = { dot1: 19, dot2: 35, check: 50, word: 65 };
/** 씬6(쓰기) — 첫 획 · 다 칠해짐 · 앱이 음절을 읽는 시점. */
const WRITE = { stroke: 0, done: 84, read: 97 };

const SCENES: Scene[] = [
  // ⓪ 썸네일 — 인스타·유튜브가 첫 프레임을 커버로 쓴다. 그래서 없애진 못하고 1초로 줄였다.
  //    🔴 광고는 로고·타이틀로 시작하지 않는다. 이건 커버 확보용 최소 비용이다.
  { key: 'thumb', durationInFrames: 30, Component: () => <Thumbnail /> },
  {
    // ① ★ 훅 — ㄱ 소리. **첫 앱 소리 f43 = 1.43초**.
    //    🔴 예전엔 이 씬이 5번째라 첫 소리가 13.40초였다. 손가락이 누르고 소리가 나는 것이
    //       이 앱에서 제일 짧게 보여줄 수 있는 「사건」이라 맨 앞으로 올렸다.
    //    🔴 보이는 점 두 개만 ㄱ 이고, 세 번째 탭은 그 자리의 띵동이 대신한다.
    //       낱말 그림은 의자·서랍장 = 「가구」 라 word-gagu 가 맞다.
    key: 'c4-tap',
    durationInFrames: 100,
    overlap: 6,
    bgm: 0.55,
    sfx: [
      { at: TAP.dot1, src: 'phonics/audio/letter-g.mp3' },
      { at: TAP.dot2, src: 'phonics/audio/letter-g.mp3' },
      { at: TAP.check, src: 'phonics/audio/correct.mp3' },
      { at: TAP.word, src: 'phonics/audio/word-gagu.mp3' },
    ],
    Component: ({ dur }) => (
      <>
        <Clip src="phonics/clips/c4-tap.mp4" />
        {/* 🔴 예전 「누르면 소리가 나고」는 뒤로 이어지는 말이라 첫 줄로 못 쓴다. */}
        <Subtitle lines={[{ text: '글자를 누르면 소리가 나요', at: 6 }]} dur={dur} />
      </>
    ),
  },
  // 🔴 라이브러리 진입 씬(`n1-enter`, 「동화책도, 파닉스도 한 앱에」)을 뺐다(2026-08-13 사용자:
  //    「파닉스랑 동화책 동시에 이거 빼자. 정신없어」). 파닉스를 보여주겠다고 해놓고 곧바로
  //    동화책 책장을 띄우면 무엇을 파는 광고인지 흐려진다 — 「둘 다 된다」는 랜딩(/intro)이 말한다.
  //    부수 효과로 소리 없는 구간이 3.2초 줄었다. 클립(`clips/n1-enter.mp4`)은 남겨 둔다.
  {
    // ② 파닉스 랜딩 → 「한글 파닉스」 탭. n2→n3 는 같은 앱 화면 흐름이라
    //    경계 변화가 0.2 수준(이미 매끄러움) — 그쪽엔 디졸브를 걸지 않는다.
    //    🔴 단 앞이 게임 클로즈업(c4-tap)이라 여기만 겹친다.
    key: 'n2-phonics',
    durationInFrames: 82,
    overlap: 8,
    Component: ({ dur }) => (
      <>
        <Clip src="phonics/clips/n2-phonics.mp4" />
        <Subtitle
          lines={[
            { text: '한글도, 영어도', at: 6 },
            { text: '파닉스가 있어요', at: 36, accent: true },
          ]}
          dur={dur}
        />
      </>
    ),
  },
  {
    // ③ 왼쪽 단원 리스트 → ㄱ 탭 → 게임 목록 → 첫 게임 탭
    //    끝에서 게임으로 들어가므로 다음 씬(합체 게임)과 이어진다.
    key: 'n3-unit',
    durationInFrames: 145,
    Component: ({ dur }) => (
      <>
        <Clip src="phonics/clips/n3-unit.mp4" />
        <Subtitle
          lines={[
            { text: '자음·모음부터 받침까지', at: 6 },
            { text: '한글 32단원', at: 70, accent: true },
          ]}
          dur={dur}
        />
      </>
    ),
  },
  {
    // ④ ㄱ+ㅏ → 가 ★ 클라이맥스 — 탭 4번 → 합체 → 읽기가 한 클립에 있다.
    //    🔴 탭 넷 뒤에 합체가 바로 와야 「ㄱ ㅏ ㄱ ㅏ」에 결말이 생긴다.
    //    🔴 이어읽기(`ㄱ ㅏ 가`)를 쓰면 탭에서 들은 「그 아」가 한 번 더 반복된다 →
    //       합체 프레임엔 「가」 **단독**, 그 뒤에 완료 징글.
    key: 'c5-blend',
    // 🔴 181 → 168. 클립 원본은 181f 지만 `clear.mp3` 가 로컬 163 에 끝나고 그 뒤는
    //    **화면이 얼어 있다**(원해상도 실측: 로컬 145~172 가 변화 없음). 소리도 그림도 끝난
    //    18프레임을 들고 있을 이유가 없어 13f 를 덜어냈다. 소리가 끝나고 5프레임만 남기고,
    //    나머지는 다음 씬 디졸브가 덮는다. clear 앵커(139)는 그대로 씬 안이라 온전히 울린다.
    durationInFrames: 168,
    overlap: 8,
    // 🔴 패턴 인터럽트 — 합체 직전 BGM 을 완전히 걷었다가 합체와 함께 되돌린다.
    //    앵커가 BLEND 를 보므로 클립을 다시 자르면 음악도 같이 따라온다.
    bgmAt: (l) =>
      l < BLEND.merge
        ? interpolate(l, [BLEND.merge - 12, BLEND.merge - 4], [0.55, 0], C)
        : interpolate(l, [BLEND.merge, BLEND.merge + 18], [0, 0.55], C),
    sfx: [
      { at: BLEND.taps[0], src: 'phonics/audio/letter-g.mp3' },
      { at: BLEND.taps[1], src: 'phonics/audio/vowel-a.mp3' },
      { at: BLEND.taps[2], src: 'phonics/audio/letter-g.mp3' },
      { at: BLEND.taps[3], src: 'phonics/audio/vowel-a.mp3' },
      { at: BLEND.merge, src: 'phonics/audio/syl-ga.mp3' },
      { at: BLEND.clear, src: 'phonics/audio/clear.mp3' },
    ],
    Component: ({ dur }) => (
      <>
        <Clip src="phonics/clips/c5-blend.mp4" />
        <BlendOverlay dur={dur} />
        <Subtitle lines={[{ text: '글자 둘이 만나 소리 하나', at: 4 }]} dur={dur} />
      </>
    ),
  },
  {
    // ⑤ 쓰기 — 🔴 **옆 칸 `ㅑ` 는 "안 쓴 것"이 아니라 처음부터 주어진 것이다.** 이 활동은 자음 한
    //    칸만 쓰게 하고, 다 쓰면 앱이 스스로 그 음절을 읽는다(네트워크 실측: `ㄱ.mp3` → `ㅑ.mp3`
    //    → `consonant-write-ko-ㄱ ㅑ 갸`). 그러니 여기서 「갸」를 읽히는 건 화면과 일치한다.
    key: 'c5-write',
    durationInFrames: 105,
    overlap: 8,
    bgm: 0.55,
    sfx: [
      // 🔴 칠하는 동안만. 클립은 **점프컷**이다 — 다 칠한 뒤 앱이 통과를 알리기까지 63프레임이
      //    「초록 ㄱ · 0%」 로 멈춰 있어(진행바가 pointerup 에만 갱신된다) 그 구간을 들어냈다.
      //    앞뒤 프레임이 같아 이음매가 안 보인다.
      {
        at: WRITE.stroke,
        src: 'phonics/audio/draw.mp3',
        volume: 0.8,
        dur: WRITE.done - WRITE.stroke,
      },
      { at: WRITE.done, src: 'phonics/audio/correct.mp3' },
      { at: WRITE.read, src: 'phonics/audio/syl-gya.mp3' },
    ],
    Component: ({ dur }) => (
      <>
        <Clip src="phonics/clips/c5-write.mp4" />
        <Subtitle lines={[{ text: '손으로 직접 써 보고', at: 6 }]} dur={dur} />
      </>
    ),
  },
  {
    // ⑥ 짝찾기 — 상단 카운터 0/4→1/4 f12 · 1/4→2/4 f54(숫자 크롭 실측).
    //    🔴 3/4 는 f74 = 클립 끝 2프레임이라 띵동이 다음 씬으로 새어 안 건다.
    // 🔴 클립 원본 f113~115 에 **검은 오버레이가 3프레임** 번쩍인다 — 정답 뒤 뜨는 `SceneReveal` 인데
    //    파닉스 낱말엔 붙은 동화 장면이 없어 빈 검은 카드로 뜬다. 그 앞(104)에서 끊는다.
    key: 'c6-match',
    durationInFrames: 104,
    overlap: 8,
    bgm: 0.55,
    sfx: [
      { at: 36, src: 'phonics/audio/correct.mp3' },
      { at: 85, src: 'phonics/audio/correct.mp3' },
    ],
    Component: ({ dur }) => (
      <>
        <Clip src="phonics/clips/c6-match.mp4" />
        <Subtitle lines={[{ text: '그림과 낱말을 이어 보고', at: 6 }]} dur={dur} />
      </>
    ),
  },
  {
    // ⑦ 낱말 그리기 — 초록이 걷혀 고기가 드러나는 f44 가 정답, 그 직후 「🎉 고기」 라벨.
    key: 'c7-dots',
    durationInFrames: 116,
    overlap: 8,
    // 🔴 앱 소리가 있는 씬은 전부 0.55 다. 여기만 빠져 있어 마지막 게임에서 BGM 이 1.0 으로
    //    부풀었고(f873~882 램프), 하필 그 위에서 word-gogi 가 울려 「고기」가 음악에 묻혔다.
    bgm: 0.55,
    sfx: [
      { at: 70, src: 'phonics/audio/correct.mp3' },
      { at: 108, src: 'phonics/audio/word-gogi.mp3' },
    ],
    Component: ({ dur }) => (
      <>
        <Clip src="phonics/clips/c7-dots.mp4" />
        <Subtitle lines={[{ text: '게임으로 익혀요', at: 6 }]} dur={dur} />
      </>
    ),
  },
  {
    // 실촬 → 합성 화면이라 가장 큰 하드컷(변화 50.1)이었다. 디졸브로 잇는다.
    key: 'blocks',
    durationInFrames: 90,
    overlap: 8,
    Component: ({ dur }) => <CurriculumBlocks dur={dur} />,
  },
  // 커리큘럼 블록과 4프레임 겹치는 디졸브
  { key: 'cta', durationInFrames: 90, overlap: 4, Component: () => <Cta /> },
];

const { placed, total } = layout(SCENES);
export const PHX_DURATION = total;

// 🔴 bgm.mp3 는 곡이 f899(29.99초)에 끝난다 — 그대로 두면 뒤가 통째로 무음이다.
//    음이 죽기 전에 내리고, 같은 곡 앞부분(꼬리 트랙)을 겹쳐 이어 붙인다.
//    🔴 이 860/878 은 **곡 길이에 묶인 값**이라 씬을 밀어도 같이 밀면 안 된다.
const BGM_TAIL_FROM = 860;
const BGM_TAIL_LEN = Math.max(0, total - BGM_TAIL_FROM);

const bgmVolume = (f: number) =>
  BGM_BASE * bgmLevelAt(placed, f) * interpolate(f, [BGM_TAIL_FROM, 878], [1, 0], C);
const bgmTailVolume = (l: number) =>
  BGM_BASE *
  bgmLevelAt(placed, l + BGM_TAIL_FROM) *
  interpolate(l, [0, 18], [0, 1], C) *
  interpolate(l, [BGM_TAIL_LEN - 14, BGM_TAIL_LEN - 2], [1, 0], C);

export const AdReelPhonics: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <Audio src={staticFile('phonics/audio/bgm.mp3')} volume={bgmVolume} />
    {BGM_TAIL_LEN > 30 && (
      <Sequence from={BGM_TAIL_FROM} durationInFrames={BGM_TAIL_LEN}>
        <Audio src={staticFile('phonics/audio/bgm.mp3')} volume={bgmTailVolume} />
      </Sequence>
    )}

    {placed.map((s) => (
      <Sequence key={s.key} from={s.from} durationInFrames={s.durationInFrames}>
        <SceneFade overlap={s.overlap ?? 0}>
          <s.Component dur={s.durationInFrames} />
        </SceneFade>
      </Sequence>
    ))}

    {/*
      🔴 소리는 씬 **밖**에서 절대 프레임으로 건다 — 씬 Sequence 안에 넣으면 Remotion 이
         씬 경계에서 잘라버린다. 클립은 전부 씬 길이에 딱 맞게 트리밍돼 있어서(footage 여유 0)
         씬을 늘려 자리를 만들 수도 없다.
         실측(2026-08-13): 씬 끝자락에 걸린 두 소리가 통째로 잘려 나갔다.
           · f761 syl-gya(갸)   자리 8f / 필요 15f → 47% 잘림, 진폭 0.78 에서 절단
           · f981 word-gogi(고기) 자리 8f / 필요 31f → 74% 잘림, 「기」는 아예 안 울림
         절대 프레임으로 빼면 소리가 컷을 타고 넘어가고(L-cut), 하드컷도 같이 부드러워진다.
         `layout()` 의 "앵커는 씬 안에" 가드는 그대로 유효하다 — 시작점은 화면과 맞아야 한다.
    */}
    {absoluteSfx(placed).map((f, i) => (
      <Sequence key={`sfx-${i}`} from={f.abs} durationInFrames={f.dur ?? 9999}>
        <Audio src={staticFile(f.src)} volume={f.volume ?? 1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
