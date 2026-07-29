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

// 한글 파닉스 광고 릴스 — docs/marketing/drafts/ad-reel-phonics-2026-07-28-plan.md.
// 9:16 · 1080×1920 · 30fps · 1046프레임(34.87초). 맨 앞 썸네일 60f · 끝 CTA 90f.
// 화면은 전부 실촬 클립(public/phonics/clips)이고 여기서 얹는 것은 자막·오디오·CTA 뿐이다.
// 🔴 순서 = 실제 사용자 여정 — 라이브러리 ☰ → 파닉스 → 한글 파닉스 → ㄱ 단원 → 첫 게임 →
//    소리 → **ㄱ+ㅏ→가(탭·합체·읽기 한 씬)** → 쓰기 → 짝찾기 → 낱말 그리기.
// 🔴 탭과 합체를 떼어놓으면 「ㄱ ㅏ ㄱ ㅏ」에 결말이 없다 — 한 클립(c5-blend)으로 붙였다.
// 🔴 도입부(0~304)는 커서가 실제로 누르는 곳까지 보여준다 — 누르면 커서가 즉시 사라지므로
//    엉뚱한 곳을 가리키지 않는다. 앱 소리가 없어 BGM 만 100 으로 간다.
// 🔴 오디오 앵커는 전부 클립 픽셀 실측이다. 클립을 다시 자르면 여기 숫자도 다시 재야 한다.
// 기존 AdReel / AdReelV2 / components/reels 는 라이브 릴스와 얽혀 있어 건드리지 않는다.

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

export const PHX_FPS = 30;
export const PHX_WIDTH = 1080;
export const PHX_HEIGHT = 1920;
export const PHX_DURATION = 1046;

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
        지금 베타기간 회원가입만 하면 1년 무료
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
    <AbsoluteFill
      style={{
        backgroundColor: CORAL,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: interpolate(raw, [0, 4], [0, 1], C),
      }}
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
          // 3줄이라 96 이면 「회원가입만 하면」이 1080 폭을 넘는다.
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
        {'지금 베타기간\n회원가입만 하면\n1년 무료'}
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

// ── BGM 볼륨(기준 0.35 = 100) ──────────────────────────────────────────────
// 🔴 레벨 함수는 본 트랙과 꼬리 트랙이 **같이** 쓴다 — 꼬리만 안 깎으면 합체 직전 무음이 안 생긴다.
const BGM_BASE = 0.35;
const bgmLevel = (f: number) => {
  if (f < 364) return 1; // 썸네일 + 내비게이션 — 앱 소리가 없다
  // 패턴 인터럽트 — 합체(f498) 직전엔 BGM 을 내린다.
  if (f < 522) return interpolate(f, [510, 518], [0.55, 0], C);
  // 합체에서 0.6초 램프로 되돌린다.
  if (f < 774) return interpolate(f, [522, 540], [0, 0.55], C);
  return 1;
};

// 🔴 bgm.mp3 는 곡이 f899(29.99초)에 끝난다 — 32.6초 릴스라 그대로 두면 뒤가 통째로 무음이다.
//    음이 죽기 전에 내리고, 같은 곡 앞부분(꼬리 트랙)을 겹쳐 이어 붙인다.
//    🔴 이 860/878 은 **곡 길이에 묶인 값**이라 씬을 밀어도 같이 밀면 안 된다.
const BGM_TAIL_FROM = 860;
const BGM_TAIL_LEN = PHX_DURATION - BGM_TAIL_FROM;

const bgmVolume = (f: number) =>
  BGM_BASE * bgmLevel(f) * interpolate(f, [BGM_TAIL_FROM, 878], [1, 0], C);

// 꼬리도 같은 레벨을 타야 하고, 페이드아웃은 **릴스 끝**에 맞춘다.
const bgmTailVolume = (l: number) =>
  BGM_BASE *
  bgmLevel(l + BGM_TAIL_FROM) *
  interpolate(l, [0, 18], [0, 1], C) *
  interpolate(l, [BGM_TAIL_LEN - 14, BGM_TAIL_LEN - 2], [1, 0], C);

const Sfx: React.FC<{ at: number; src: string; volume?: number; dur?: number }> = ({
  at,
  src,
  volume = 1,
  dur,
}) => (
  <Sequence from={at} durationInFrames={dur ?? PHX_DURATION - at}>
    <Audio src={staticFile(`phonics/audio/${src}`)} volume={volume} />
  </Sequence>
);

export const AdReelPhonics: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <Audio src={staticFile('phonics/audio/bgm.mp3')} volume={bgmVolume} />
    <Sequence from={BGM_TAIL_FROM} durationInFrames={BGM_TAIL_LEN}>
      <Audio src={staticFile('phonics/audio/bgm.mp3')} volume={bgmTailVolume} />
    </Sequence>

    {/* ⓪ 썸네일 — 인스타가 기본 커버로 첫 프레임을 쓰므로 여기서 무엇에 관한 영상인지 못박는다.
        1.2초로 짧게: 길면 훅이 늦어진다. */}
    <Sequence from={0} durationInFrames={60}>
      <Thumbnail />
    </Sequence>

    {/* ① 라이브러리 → ☰ → 사이드바 → 파닉스 탭 */}
    <Sequence from={60} durationInFrames={96}>
      <Clip src="phonics/clips/n1-enter.mp4" />
      <Subtitle lines={[{ text: '동화책도, 파닉스도 한 앱에', at: 6 }]} dur={96} />
    </Sequence>

    {/* ② 파닉스 랜딩 → 한글 파닉스 탭 */}
    <Sequence from={156} durationInFrames={78}>
      <Clip src="phonics/clips/n2-phonics.mp4" />
      <Subtitle
        lines={[
          { text: '한글도, 영어도', at: 6 },
          { text: '파닉스가 있어요', at: 36, accent: true },
        ]}
        dur={78}
      />
    </Sequence>

    {/* ③ 왼쪽 단원 리스트 → ㄱ 탭 → 게임 목록 → 첫 게임 탭 */}
    <Sequence from={234} durationInFrames={130}>
      <Clip src="phonics/clips/n3-unit.mp4" />
      <Subtitle
        lines={[
          { text: '자음·모음부터 받침까지', at: 6 },
          { text: '한글 32단원', at: 60, accent: true },
        ]}
        dur={130}
      />
    </Sequence>

    {/* ④ ㄱ 소리 */}
    <Sequence from={364} durationInFrames={84}>
      <Clip src="phonics/clips/c4-tap.mp4" />
      <Subtitle lines={[{ text: '누르면 소리가 나고', at: 6 }]} dur={84} />
    </Sequence>

    {/* ⑤ ㄱ+ㅏ → 가 ★ — 탭 4번 → 합체 → 이어읽기가 한 클립에 있다 */}
    <Sequence from={448} durationInFrames={160}>
      <Clip src="phonics/clips/c5-blend.mp4" />
      <BlendOverlay dur={160} />
      <Subtitle lines={[{ text: '글자 둘이 만나 소리 하나', at: 4 }]} dur={160} />
    </Sequence>

    {/* ⑥ 쓰기 */}
    <Sequence from={608} durationInFrames={90}>
      <Clip src="phonics/clips/c5-write.mp4" />
      <Subtitle lines={[{ text: '손으로 직접 써 보고', at: 6 }]} dur={90} />
    </Sequence>

    {/* ⑦ 짝찾기 */}
    <Sequence from={698} durationInFrames={76}>
      <Clip src="phonics/clips/c6-match.mp4" />
      <Subtitle lines={[{ text: '그림과 낱말을 이어 보고', at: 6 }]} dur={76} />
    </Sequence>

    {/* ⑧ 낱말 그리기 */}
    <Sequence from={774} durationInFrames={96}>
      <Clip src="phonics/clips/c7-dots.mp4" />
      <Subtitle lines={[{ text: '게임으로 익혀요', at: 6 }]} dur={96} />
    </Sequence>

    <Sequence from={870} durationInFrames={90}>
      <CurriculumBlocks dur={90} />
    </Sequence>

    {/* 커리큘럼 블록과 4프레임 겹치는 디졸브 */}
    <Sequence from={956} durationInFrames={90}>
      <Cta />
    </Sequence>

    {/* 오디오 — 앱이 실제로 내는 소리를 그대로 쓴다.
        🔴 소리는 화면에서 그 일이 일어나는 프레임에 건다(전부 픽셀 실측). */}

    {/* 씬4 ㄱ 소리(c4-tap 로컬, 프레임 차분 실측): 점1 f5 · 점2 f21 · ✓ 뒤집기 f38 · 낱말 그림 f62.
        🔴 보이는 점 두 개만 ㄱ 이고, 세 번째 탭은 그 자리의 띵동이 대신한다.
        낱말 그림은 의자·서랍장 = 「가구」 라 word-gagu 가 맞다. */}
    <Sfx at={369} src="letter-g.mp3" />
    <Sfx at={385} src="letter-g.mp3" />
    <Sfx at={402} src="correct.mp3" />
    <Sfx at={426} src="word-gagu.mp3" />

    {/* 씬5 ㄱ+ㅏ→가 — 코랄 링(=지금 누를 글자)이 옮겨가는 프레임이 탭이다.
        로컬 f4 ㄱ · f21 ㅏ · f39 ㄱ · f55 ㅏ, **f74 에 두 글자가 붙는다**.
        🔴 탭 넷 뒤에 이어읽기(ㄱ→ㅏ→가)가 바로 와야 「ㄱ ㅏ ㄱ ㅏ」에 결말이 생긴다. */}
    <Sfx at={452} src="letter-g.mp3" />
    <Sfx at={469} src="vowel-a.mp3" />
    <Sfx at={487} src="letter-g.mp3" />
    <Sfx at={503} src="vowel-a.mp3" />
    {/* 🔴 이어읽기(blend-ga = `ㄱ ㅏ 가`)를 쓰면 탭에서 이미 들은 「그 아」가 한 번 더 반복된다.
        소리는 **그 아 그 아 → 가** 로 끝나야 한다 → 합체 프레임에 「가」 단독. */}
    <Sfx at={522} src="syl-ga.mp3" />
    {/* 「가」(0.52초)가 끝나면 앱의 완료 징글. 이게 없으면 합체가 소리로 마무리되지 않는다. */}
    <Sfx at={540} src="clear.mp3" />

    {/* 씬6 쓰기 — 첫 획 로컬 f11, ㄱ 이 다 칠해지는 f38. draw.mp3(2초)는 칠하는 27f 동안만.
        🔴 **옆 칸 `ㅑ` 는 "안 쓴 것"이 아니라 처음부터 주어진 것이다.** 이 활동은 자음 한 칸만
        쓰게 하고, 다 쓰면 앱이 스스로 그 음절을 읽는다(네트워크 실측: `ㄱ.mp3` → `ㅑ.mp3` →
        `consonant-write-ko-ㄱ ㅑ 갸`). 그러니 여기서 「갸」를 읽히는 건 화면과 일치한다. */}
    <Sfx at={619} src="draw.mp3" volume={0.8} dur={27} />
    <Sfx at={646} src="correct.mp3" />
    <Sfx at={659} src="syl-gya.mp3" />

    {/* 씬7 짝찾기 — 상단 카운터 0/4→1/4 로컬 f12 · 1/4→2/4 f54 (숫자 크롭 실측).
        🔴 3/4 는 로컬 f74 = 클립 끝 2프레임이라 띵동이 다음 씬으로 새어 안 건다. */}
    <Sfx at={710} src="correct.mp3" />
    <Sfx at={752} src="correct.mp3" />

    {/* 씬8 그리기 — 초록이 걷혀 고기가 드러나는 로컬 f44 가 정답, 그 직후 「🎉 고기」 라벨. */}
    <Sfx at={818} src="correct.mp3" />
    <Sfx at={831} src="word-gogi.mp3" />
  </AbsoluteFill>
);
